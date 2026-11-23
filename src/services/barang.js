import { KATEGORI, GRADE, NAMA_GRADE } from '../config/kategori.js';
import { transaksi } from '../db/transaksi.js';
import { galat, meta as buatMeta, paginasi } from '../lib/api.js';
import * as in_ from '../lib/input.js';
import * as K from '../lib/kondisi.js';
import * as foto from '../lib/foto.js';
import * as repo from '../repositories/barang.js';
import * as permintaan from '../repositories/permintaan.js';
import { pool } from '../db/pool.js';

const MAKS_CACAT = 5;

export async function kategori() {
  const jenis = await repo.semuaJenis();
  return {
    kategori: Object.entries(KATEGORI).map(([kode, k]) => ({
      kode, label: k.label,
      jenis: jenis.filter((j) => j.kategori === kode).map(({ kode: kd, nama, beratKg, emisiKgCo2e }) => ({ kode: kd, nama, beratKg, emisiKgCo2e })),
      kolom: k.kolom,
    })),
    grade: GRADE,
  };
}

export async function daftar(query) {
  const hal = paginasi(query);
  const f = {
    q: typeof query.q === 'string' ? query.q.trim().slice(0, 60) : '',
    kategori: KATEGORI[query.kategori] ? query.kategori : '',
    grade: NAMA_GRADE.includes(query.grade) ? query.grade : '',
    jenis: ['jual', 'gratis'].includes(query.jenis) ? query.jenis : '',
    urut: query.urut,
  };
  const { jumlah, baris } = await repo.katalog(f, hal);
  return { data: baris, meta: buatMeta(jumlah, hal) };
}

async function bentukDetail(b, user, db = pool) {
  const [cacat, toko, skor] = await Promise.all([repo.cacatDari(b.id, db), repo.infoToko(b.tokoId, db), repo.skorToko(b.tokoId, db)]);
  const milikSaya = !!user && user.peran === 'penjual' && user.tokoId === b.tokoId;
  let permintaanId = null;
  let pesananId = null;
  if (user?.peran === 'pembeli') {
    permintaanId = await permintaan.milikSaya(b.id, user.id, db);
    const { rows } = await db.query(
      `SELECT id FROM pesanan WHERE barang_id = $1 AND pembeli_id = $2 AND status IN ('menunggu-konfirmasi','dikonfirmasi','siap') LIMIT 1`,
      [b.id, user.id],
    );
    pesananId = rows[0]?.id ?? null;
  }
  const { pemilikId, jenisBarangId, statusVerifikasi, beratKg, emisiKgCo2e, kondisi, ...umum } = b;
  return {
    ...umum,
    kondisi: K.tampilKondisi(b.kategori, kondisi),
    cacat,
    toko: { ...toko, skor },
    dampak: { beratKg, emisiKgCo2e, hemat: b.hargaBaru - b.hargaJual },
    saya: { milikSaya, permintaanId, pesananId },
  };
}

export async function ambil(id, user) {
  const b = await repo.detail(id);
  if (!b) throw galat.tidakAda('Barang tidak ditemukan.', 'ITEM_NOT_FOUND');
  const pemilik = user?.peran === 'penjual' && user.tokoId === b.tokoId;
  if (!pemilik && b.status === 'draf') throw galat.tidakAda('Barang tidak ditemukan.', 'ITEM_NOT_FOUND');
  return bentukDetail(b, user);
}

export async function milikSaya(user, status) {
  return repo.milikToko(user.tokoId, ['draf', 'aktif', 'dipesan', 'terjual', 'diberikan'].includes(status) ? status : null);
}

export async function milikSayaDetail(user, id) {
  const b = await repo.detail(id);
  if (!b || b.tokoId !== user.tokoId) throw galat.tidakAda('Barang tidak ditemukan.', 'ITEM_NOT_FOUND');
  const d = await bentukDetail(b, user);
  return { ...d, kondisiMap: b.kondisi };
}

// Foto hanya untuk barang yang tampil publik, atau pemiliknya sendiri.
export async function ambilFoto(id, cacatId, user) {
  const r = cacatId ? await repo.fotoCacat(id, cacatId) : await repo.fotoUtama(id);
  const boleh = r && (r.status !== 'draf' || (user?.peran === 'penjual' && String(r.pengguna_id) === String(user.id)));
  if (!boleh || !r.foto) throw galat.tidakAda('Foto tidak ditemukan.', 'PHOTO_NOT_FOUND');
  return { mime: r.foto_mime, data: r.foto };
}

async function siapkan(user, b) {
  const status = b.status ?? 'aktif';
  if (!['aktif', 'draf'].includes(status)) throw galat.validasi('Status harus "aktif" atau "draf".');
  const nama = in_.teks(b.nama, 'Nama barang', { min: 3, maks: 120 });
  if (typeof b.kategori !== 'string' || !KATEGORI[b.kategori]) throw galat.validasi('Kategori tidak valid.');
  const jenis = await repo.jenisByKode(String(b.jenis ?? ''));
  if (!jenis || jenis.kategori !== b.kategori) throw galat.validasi('Jenis barang tidak sesuai kategori.');
  const jenisTransaksi = in_.pilihan(b.jenisTransaksi ?? 'jual', 'Jenis transaksi', ['jual', 'gratis']);

  const hargaBaru = in_.rupiah(b.hargaBaru ?? 0, 'Harga barang baru', { min: 1 });
  let hargaJual = 0;
  if (jenisTransaksi === 'jual') {
    hargaJual = in_.rupiah(b.hargaJual, 'Harga jual', { min: 1 });
    if (hargaJual > hargaBaru) throw galat.validasi('Harga jual tidak boleh melebihi harga barang baru.');
  } else if (b.hargaJual !== undefined && Number(b.hargaJual) !== 0) {
    throw galat.validasi('Barang gratis harus berharga 0.');
  }

  const { kondisi, tingkatMaks } = K.validasiKondisi(b.kategori, in_.objek(b.kondisi ?? {}, 'Kondisi'));
  const grade = K.validasiGrade(b.grade, tingkatMaks);

  const cacatMasuk = Array.isArray(b.cacat) ? b.cacat : [];
  if (cacatMasuk.length > MAKS_CACAT) throw galat.validasi(`Maksimal ${MAKS_CACAT} bagian cacat.`);
  const cacat = cacatMasuk.map((c, i) => ({
    id: c.id ? String(c.id) : null,
    label: in_.teks(c.label, `Cacat ke-${i + 1}`, { min: 2, maks: 80 }),
    foto: c.foto ? foto.urai(c.foto, `Foto cacat ke-${i + 1}`) : null,
  }));
  if (K.cacatWajib(grade, tingkatMaks) && cacat.length === 0) {
    throw galat.validasi('Sebutkan minimal satu bagian yang bercacat, karena kondisi bukan "Seperti Baru" atau ada catatan pada kartu.');
  }

  let fotoMode = 'tetap';
  let fotoUtama = null;
  if (b.foto === null) fotoMode = 'hapus';
  else if (typeof b.foto === 'string') { fotoMode = 'ganti'; fotoUtama = foto.urai(b.foto, 'Foto utama'); }

  return {
    data: {
      tokoId: user.tokoId, jenisBarangId: jenis.id, nama,
      deskripsi: in_.teksBebas(b.deskripsi, 'Deskripsi', 1000), jenisTransaksi, hargaJual, hargaBaru,
      grade, kondisi, catatan: in_.teksBebas(b.catatan, 'Catatan kondisi', 500), status, foto: fotoUtama,
    },
    cacat, fotoMode,
  };
}

export async function buat(user, b) {
  const s = await siapkan(user, b);
  const id = await transaksi(async (db) => {
    const baru = await repo.sisipkan(db, s.data);
    for (const [i, c] of s.cacat.entries()) await repo.sisipkanCacat(db, baru, i, c.label, c.foto);
    return baru;
  });
  return milikSayaDetail(user, id);
}

export async function ubah(user, id, b) {
  const s = await siapkan(user, b);
  await transaksi(async (db) => {
    const lama = await repo.detail(id, db, true);
    if (!lama || lama.tokoId !== user.tokoId) throw galat.tidakAda('Barang tidak ditemukan.', 'ITEM_NOT_FOUND');
    if (!['aktif', 'draf'].includes(lama.status)) throw galat.konflik('Barang yang sedang dipesan atau sudah berpindah tangan tidak bisa diubah.', 'INVALID_STATE');
    await repo.perbarui(db, id, s.data, s.fotoMode);

    const idLama = await repo.cacatLama(db, id);
    const dikirim = new Set(s.cacat.filter((c) => c.id).map((c) => c.id));
    for (const c of s.cacat) if (c.id && !idLama.includes(c.id)) throw galat.validasi('Bagian cacat tidak dikenali.');
    await repo.hapusCacat(db, id, idLama.filter((x) => !dikirim.has(x)));
    for (const [i, c] of s.cacat.entries()) {
      if (c.id) await repo.perbaruiCacat(db, c.id, id, i, c.label, c.foto);
      else await repo.sisipkanCacat(db, id, i, c.label, c.foto);
    }
  });
  return milikSayaDetail(user, id);
}

export async function tayang(user, id, aktif) {
  if (typeof aktif !== 'boolean') throw galat.validasi('Kirim { "tayang": true } atau { "tayang": false }.');
  await transaksi(async (db) => {
    const b = await repo.detail(id, db, true);
    if (!b || b.tokoId !== user.tokoId) throw galat.tidakAda('Barang tidak ditemukan.', 'ITEM_NOT_FOUND');
    const dari = aktif ? 'draf' : 'aktif';
    if (b.status !== dari) throw galat.konflik(`Hanya barang berstatus "${dari}" yang bisa ${aktif ? 'ditayangkan' : 'dijadikan draf'}.`, 'INVALID_STATE');
    await repo.ubahStatus(db, id, aktif ? 'aktif' : 'draf');
  });
  return milikSayaDetail(user, id);
}

export async function hapus(user, id) {
  await transaksi(async (db) => {
    const b = await repo.detail(id, db, true);
    if (!b || b.tokoId !== user.tokoId) throw galat.tidakAda('Barang tidak ditemukan.', 'ITEM_NOT_FOUND');
    if (await repo.punyaPesanan(db, id)) throw galat.konflik('Barang sudah punya pesanan dan tidak bisa dihapus. Jadikan draf saja.', 'INVALID_STATE');
    await repo.hapus(db, id);
  });
  return { dihapus: true };
}
