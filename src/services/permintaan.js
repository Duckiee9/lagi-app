import { transaksi } from '../db/transaksi.js';
import { galat } from '../lib/api.js';
import * as in_ from '../lib/input.js';
import * as barangRepo from '../repositories/barang.js';
import * as repo from '../repositories/permintaan.js';
import * as pesananRepo from '../repositories/pesanan.js';
import * as pesananSvc from './pesanan.js';

export const milikSaya = (user) => repo.milikPeminta(user.id);
export const masuk = (user) => repo.masukUntukToko(user.tokoId);

export async function ajukan(user, barangId, b) {
  const alasan = in_.teks(b.alasan, 'Alasan', { min: 10, maks: 300 });
  await transaksi(async (db) => {
    const br = await barangRepo.detail(barangId, db, true);
    if (!br) throw galat.tidakAda('Barang tidak ditemukan.', 'ITEM_NOT_FOUND');
    if (br.jenisTransaksi !== 'gratis') throw galat.konflik('Hanya barang gratis yang bisa diminta.', 'INVALID_STATE');
    if (br.status !== 'aktif') throw galat.konflik('Barang ini tidak tersedia lagi.', 'OFFER_UNAVAILABLE');
    try {
      await repo.sisipkan(db, barangId, user.id, alasan);
    } catch (e) {
      if (e.code === '23505') throw galat.konflik('Anda sudah mengajukan permintaan untuk barang ini.', 'DATA_CONFLICT');
      throw e;
    }
  });
  return { diajukan: true };
}

export async function pilih(user, id) {
  const pesananId = await transaksi(async (db) => {
    const r = await repo.ambil(db, id, true);
    if (!r || r.toko_id !== user.tokoId) throw galat.tidakAda('Permintaan tidak ditemukan.', 'REQUEST_NOT_FOUND');
    if (r.status !== 'menunggu') throw galat.konflik('Permintaan ini sudah diproses.', 'INVALID_STATE');
    const br = await barangRepo.detail(r.barang_id, db, true);
    if (br.status !== 'aktif') throw galat.konflik('Barang ini sedang diproses atau sudah diberikan.', 'OFFER_UNAVAILABLE');
    const baru = await pesananRepo.buat(db, {
      barangId: br.id, tokoId: br.tokoId, pembeliId: r.peminta_id, harga: 0, hargaBaru: br.hargaBaru,
      metodeSerah: 'ketemuan', status: 'dikonfirmasi',
    });
    await pesananRepo.catat(db, baru, 'menunggu-konfirmasi', r.peminta_id);
    await pesananRepo.catat(db, baru, 'dikonfirmasi', user.id);
    await barangRepo.ubahStatus(db, br.id, 'dipesan');
    await repo.ubahStatus(db, id, 'dipilih');
    await repo.tolakLainnya(db, br.id, id);
    return baru;
  });
  return pesananSvc.ambil(pesananId, user);
}

export async function tarik(user, id) {
  await transaksi(async (db) => {
    const r = await repo.ambil(db, id, true);
    if (!r || r.peminta_id !== user.id) throw galat.tidakAda('Permintaan tidak ditemukan.', 'REQUEST_NOT_FOUND');
    if (r.status !== 'menunggu') throw galat.konflik('Hanya permintaan yang masih menunggu yang bisa ditarik.', 'INVALID_STATE');
    await repo.ubahStatus(db, id, 'ditarik');
  });
  return { ditarik: true };
}
