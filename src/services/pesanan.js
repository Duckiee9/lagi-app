import { transaksi } from '../db/transaksi.js';
import { galat, meta as buatMeta, paginasi } from '../lib/api.js';
import * as in_ from '../lib/input.js';
import * as barangRepo from '../repositories/barang.js';
import * as repo from '../repositories/pesanan.js';
import * as barangSvc from './barang.js';

// aksi -> { pelaku, dari: [status], ke }
export const TRANSISI = {
  konfirmasi: { penjual: { dari: ['menunggu-konfirmasi'], ke: 'dikonfirmasi' } },
  tolak: { penjual: { dari: ['menunggu-konfirmasi'], ke: 'ditolak' } },
  siap: { penjual: { dari: ['dikonfirmasi'], ke: 'siap' } },
  batal: {
    penjual: { dari: ['dikonfirmasi', 'siap'], ke: 'dibatalkan' },
    pembeli: { dari: ['menunggu-konfirmasi', 'dikonfirmasi'], ke: 'dibatalkan' },
  },
  selesai: { pembeli: { dari: ['siap'], ke: 'selesai' } },
};

export const bolehAksi = (peran, status) =>
  Object.entries(TRANSISI).filter(([, t]) => t[peran]?.dari.includes(status)).map(([a]) => a);

export async function daftar(user, query) {
  const hal = paginasi(query);
  const { jumlah, baris } = await repo.daftar(user, query.status, hal);
  return { data: baris, meta: buatMeta(jumlah, hal) };
}

function pastikanPihak(p, user) {
  const milik = p && (user.peran === 'penjual' ? p.toko_id === user.tokoId : p.pembeli_id === user.id);
  if (!milik) throw galat.tidakAda('Pesanan tidak ditemukan.', 'ORDER_NOT_FOUND');
}

export async function ambil(id, user) {
  const p = await repo.ambil(id);
  if (!p) throw galat.tidakAda('Pesanan tidak ditemukan.', 'ORDER_NOT_FOUND');
  pastikanPihak(p, user);
  const [riwayat, barang] = await Promise.all([repo.riwayat(id), barangSvc.ambil(p.barang_id, user)]);
  return {
    ...repo.header(p, user.peran),
    kesesuaian: p.kesesuaian, catatanKesesuaian: p.catatan_kesesuaian,
    dibatalkanOleh: p.dibatalkan_oleh, alasanPembatalan: p.alasan_pembatalan,
    pembeli: { namaLengkap: p.nama_pembeli },
    toko: { id: p.toko_id, namaToko: p.nama_toko, kota: p.kota },
    riwayat, bolehAksi: bolehAksi(user.peran, p.status), barang,
  };
}

export async function buat(user, b) {
  const barangId = String(b.barangId ?? '');
  if (!/^[1-9]\d{0,17}$/.test(barangId)) throw galat.validasi('barangId tidak valid.');
  const metodeSerah = in_.pilihan(b.metodeSerah, 'Metode serah', ['ketemuan', 'kurir']);
  const id = await transaksi(async (db) => {
    const br = await barangRepo.detail(barangId, db, true);
    if (!br) throw galat.tidakAda('Barang tidak ditemukan.', 'ITEM_NOT_FOUND');
    if (br.jenisTransaksi !== 'jual') throw galat.konflik('Barang gratis diminta lewat Give It Forward.', 'INVALID_STATE');
    if (br.status !== 'aktif') throw galat.konflik('Barang ini tidak tersedia lagi.', 'OFFER_UNAVAILABLE');
    if (br.statusVerifikasi !== 'terverifikasi') throw galat.konflik('Toko belum terverifikasi.', 'OFFER_UNAVAILABLE');
    const baru = await repo.buat(db, {
      barangId, tokoId: br.tokoId, pembeliId: user.id, harga: br.hargaJual, hargaBaru: br.hargaBaru,
      metodeSerah, status: 'menunggu-konfirmasi',
    });
    await barangRepo.ubahStatus(db, barangId, 'dipesan');
    await repo.catat(db, baru, 'menunggu-konfirmasi', user.id);
    return baru;
  });
  return ambil(id, user);
}

export async function aksi(user, id, b) {
  const nama = in_.pilihan(b.aksi, 'Aksi', Object.keys(TRANSISI));
  const aturan = TRANSISI[nama][user.peran];
  if (!aturan) throw galat.terlarang(`Aksi "${nama}" tidak bisa dilakukan oleh ${user.peran}.`);

  const tambahan = {};
  if (nama === 'batal' || nama === 'tolak') {
    tambahan.oleh = user.peran;
    tambahan.alasan = in_.teks(b.alasan, 'Alasan', { min: 5, maks: 300 });
  }
  if (nama === 'selesai') {
    tambahan.kesesuaian = in_.pilihan(b.kesesuaian, 'Kesesuaian', ['sesuai', 'berbeda']);
    if (tambahan.kesesuaian === 'berbeda') tambahan.catatan = in_.teks(b.catatan, 'Catatan perbedaan', { min: 5, maks: 500 });
    else if (b.catatan) tambahan.catatan = in_.teks(b.catatan, 'Catatan', { maks: 500 });
  }

  await transaksi(async (db) => {
    const p = await repo.ambil(id, db, true);
    if (!p) throw galat.tidakAda('Pesanan tidak ditemukan.', 'ORDER_NOT_FOUND');
    pastikanPihak(p, user);
    if (!aturan.dari.includes(p.status)) {
      throw galat.konflik(`Aksi "${nama}" tidak bisa dilakukan saat status "${p.status}".`, 'INVALID_STATE');
    }
    await repo.ubahStatus(db, id, aturan.ke, tambahan);
    await repo.catat(db, id, aturan.ke, user.id);
    const gratis = p.jenis_transaksi === 'gratis';
    if (aturan.ke === 'selesai') await barangRepo.ubahStatus(db, p.barang_id, gratis ? 'diberikan' : 'terjual');
    if (aturan.ke === 'dibatalkan' || aturan.ke === 'ditolak') await barangRepo.ubahStatus(db, p.barang_id, 'aktif');
  });
  return ambil(id, user);
}
