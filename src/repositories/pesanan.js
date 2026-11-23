import { pool } from '../db/pool.js';

const num = (v) => (v === null || v === undefined ? null : Number(v));

const DASAR = `
  FROM pesanan o
  JOIN barang b ON b.id = o.barang_id
  JOIN jenis_barang jb ON jb.id = b.jenis_barang_id
  JOIN toko t ON t.id = o.toko_id
  JOIN pengguna pb ON pb.id = o.pembeli_id`;

const KOLOM = `
  o.id, o.barang_id, b.nama AS nama_barang, jb.kategori, jb.kode AS jenis,
  b.jenis_transaksi, (b.foto IS NOT NULL) AS ada_foto, o.harga_saat_pesan, o.harga_baru_saat_pesan,
  o.metode_serah, o.status, o.status_pembayaran, o.dibuat_pada,
  t.nama_toko, pb.nama_lengkap AS nama_pembeli`;

export const header = (r, peran) => ({
  id: r.id, barangId: r.barang_id, namaBarang: r.nama_barang, kategori: r.kategori, jenis: r.jenis,
  jenisTransaksi: r.jenis_transaksi, adaFoto: r.ada_foto, harga: num(r.harga_saat_pesan),
  hargaBaru: num(r.harga_baru_saat_pesan), metodeSerah: r.metode_serah, status: r.status,
  statusPembayaran: r.status_pembayaran, pihak: peran === 'penjual' ? r.nama_pembeli : r.nama_toko,
  dibuatPada: r.dibuat_pada,
});

const KELOMPOK = {
  berjalan: "o.status IN ('menunggu-konfirmasi', 'dikonfirmasi', 'siap')",
  selesai: "o.status = 'selesai'",
  batal: "o.status IN ('dibatalkan', 'ditolak')",
};

export async function daftar(user, status, { limit, offset }) {
  const kunci = user.peran === 'penjual' ? 'o.toko_id' : 'o.pembeli_id';
  const pemilik = user.peran === 'penjual' ? user.tokoId : user.id;
  const where = `WHERE ${kunci} = $1${KELOMPOK[status] ? ` AND ${KELOMPOK[status]}` : ''}`;
  const jumlah = (await pool.query(`SELECT COUNT(*)::int AS n ${DASAR} ${where}`, [pemilik])).rows[0].n;
  const { rows } = await pool.query(
    `SELECT ${KOLOM} ${DASAR} ${where} ORDER BY o.id DESC LIMIT ${limit} OFFSET ${offset}`,
    [pemilik],
  );
  return { jumlah, baris: rows.map((r) => header(r, user.peran)) };
}

export async function ambil(id, db = pool, kunci = false) {
  const { rows } = await db.query(
    `SELECT ${KOLOM}, o.toko_id, o.pembeli_id, o.kesesuaian, o.catatan_kesesuaian, o.dibatalkan_oleh,
            o.alasan_pembatalan, t.kota, t.pengguna_id AS penjual_id
       ${DASAR} WHERE o.id = $1 ${kunci ? 'FOR UPDATE OF o' : ''}`,
    [id],
  );
  return rows[0] || null;
}

export async function riwayat(id, db = pool) {
  const { rows } = await db.query('SELECT status, dibuat_pada FROM riwayat_pesanan WHERE pesanan_id = $1 ORDER BY id', [id]);
  return rows.map((r) => ({ status: r.status, waktu: r.dibuat_pada }));
}

export const catat = (db, pesananId, status, penggunaId) =>
  db.query('INSERT INTO riwayat_pesanan (pesanan_id, status, oleh_pengguna_id) VALUES ($1,$2,$3)', [pesananId, status, penggunaId]);

export async function buat(db, d) {
  const { rows } = await db.query(
    `INSERT INTO pesanan (barang_id, toko_id, pembeli_id, harga_saat_pesan, harga_baru_saat_pesan, metode_serah,
                          status, status_pembayaran, dikonfirmasi_pada)
     VALUES ($1,$2,$3,$4,$5,$6,$7::varchar,$8, CASE WHEN $7 = 'dikonfirmasi' THEN CURRENT_TIMESTAMP END) RETURNING id`,
    [d.barangId, d.tokoId, d.pembeliId, d.harga, d.hargaBaru, d.metodeSerah, d.status, d.harga === 0 ? 'gratis' : 'belum-dibayar'],
  );
  return rows[0].id;
}

export const ubahStatus = (db, id, status, tambahan = {}) =>
  db.query(
    `UPDATE pesanan SET status = $2::varchar,
        dikonfirmasi_pada = CASE WHEN $2 = 'dikonfirmasi' THEN CURRENT_TIMESTAMP ELSE dikonfirmasi_pada END,
        siap_pada = CASE WHEN $2 = 'siap' THEN CURRENT_TIMESTAMP ELSE siap_pada END,
        selesai_pada = CASE WHEN $2 = 'selesai' THEN CURRENT_TIMESTAMP ELSE selesai_pada END,
        dibatalkan_pada = CASE WHEN $2 IN ('dibatalkan','ditolak') THEN CURRENT_TIMESTAMP ELSE dibatalkan_pada END,
        dibatalkan_oleh = COALESCE($3, dibatalkan_oleh),
        alasan_pembatalan = COALESCE($4, alasan_pembatalan),
        kesesuaian = COALESCE($5, kesesuaian),
        catatan_kesesuaian = COALESCE($6, catatan_kesesuaian),
        status_pembayaran = CASE WHEN $2 = 'selesai' AND status_pembayaran = 'belum-dibayar' THEN 'dibayar' ELSE status_pembayaran END
      WHERE id = $1`,
    [id, status, tambahan.oleh ?? null, tambahan.alasan ?? null, tambahan.kesesuaian ?? null, tambahan.catatan ?? null],
  );
