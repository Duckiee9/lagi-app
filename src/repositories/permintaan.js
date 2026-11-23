import { pool } from '../db/pool.js';

export async function milikPeminta(penggunaId) {
  const { rows } = await pool.query(
    `SELECT pg.id, pg.barang_id, b.nama AS nama_barang, pg.alasan, pg.status, pg.dibuat_pada
       FROM permintaan_gratis pg JOIN barang b ON b.id = pg.barang_id
      WHERE pg.peminta_id = $1 ORDER BY pg.id DESC`,
    [penggunaId],
  );
  return rows.map((r) => ({ id: r.id, barangId: r.barang_id, namaBarang: r.nama_barang, alasan: r.alasan, status: r.status, dibuatPada: r.dibuat_pada }));
}

export async function masukUntukToko(tokoId) {
  const { rows } = await pool.query(
    `SELECT pg.id, pg.barang_id, b.nama AS nama_barang, p.nama_lengkap, pg.alasan, pg.dibuat_pada
       FROM permintaan_gratis pg
       JOIN barang b ON b.id = pg.barang_id
       JOIN pengguna p ON p.id = pg.peminta_id
      WHERE b.toko_id = $1 AND pg.status = 'menunggu' AND b.status = 'aktif'
      ORDER BY pg.id`,
    [tokoId],
  );
  return rows.map((r) => ({ id: r.id, barangId: r.barang_id, namaBarang: r.nama_barang, peminta: { namaLengkap: r.nama_lengkap }, alasan: r.alasan, dibuatPada: r.dibuat_pada }));
}

export const sisipkan = (db, barangId, pemintaId, alasan) =>
  db.query('INSERT INTO permintaan_gratis (barang_id, peminta_id, alasan) VALUES ($1,$2,$3)', [barangId, pemintaId, alasan]);

export async function ambil(db, id, kunci = false) {
  const { rows } = await db.query(
    `SELECT pg.id, pg.barang_id, pg.peminta_id, pg.status, b.toko_id, b.status AS status_barang,
            b.jenis_transaksi, b.harga_baru
       FROM permintaan_gratis pg JOIN barang b ON b.id = pg.barang_id
      WHERE pg.id = $1 ${kunci ? 'FOR UPDATE OF pg' : ''}`,
    [id],
  );
  return rows[0] || null;
}

export const ubahStatus = (db, id, status) =>
  db.query('UPDATE permintaan_gratis SET status = $2 WHERE id = $1', [id, status]);

export const tolakLainnya = (db, barangId, kecualiId) =>
  db.query(
    `UPDATE permintaan_gratis SET status = 'ditolak' WHERE barang_id = $1 AND id <> $2 AND status = 'menunggu'`,
    [barangId, kecualiId],
  );

export async function milikSaya(barangId, penggunaId, db = pool) {
  const { rows } = await db.query(
    `SELECT id FROM permintaan_gratis WHERE barang_id = $1 AND peminta_id = $2 AND status = 'menunggu'`,
    [barangId, penggunaId],
  );
  return rows[0]?.id ?? null;
}
