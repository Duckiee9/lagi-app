import { pool } from '../db/pool.js';

const PROFIL = `
  SELECT p.id, p.nama_lengkap, p.email, p.peran, p.aktif, p.kata_sandi_hash, p.versi_token,
         t.id AS toko_id, t.status_verifikasi, t.nama_toko, t.kota, t.bio, t.nomor_telepon
    FROM pengguna p LEFT JOIN toko t ON t.pengguna_id = p.id`;

export const cariByEmail = async (email, db = pool) =>
  (await db.query(`${PROFIL} WHERE p.email = $1`, [email])).rows[0] || null;

export const cariById = async (id, db = pool) =>
  (await db.query(`${PROFIL} WHERE p.id = $1`, [id])).rows[0] || null;

export async function buat(db, { namaLengkap, email, peran, hash }) {
  const { rows } = await db.query(
    `INSERT INTO pengguna (nama_lengkap, email, peran, kata_sandi_hash)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [namaLengkap, email, peran, hash],
  );
  return rows[0].id;
}

export const buatToko = (db, { penggunaId, namaToko, kota, bio, nomorTelepon }) =>
  db.query(
    `INSERT INTO toko (pengguna_id, nama_toko, kota, bio, nomor_telepon)
     VALUES ($1, $2, $3, $4, $5)`,
    [penggunaId, namaToko, kota, bio, nomorTelepon],
  );

export const ubahToko = (penggunaId, { namaToko, kota, bio, nomorTelepon }) =>
  pool.query(
    `UPDATE toko SET nama_toko = $2, kota = $3, bio = $4, nomor_telepon = $5 WHERE pengguna_id = $1`,
    [penggunaId, namaToko, kota, bio, nomorTelepon],
  );

export const naikkanVersiToken = (id) =>
  pool.query('UPDATE pengguna SET versi_token = versi_token + 1 WHERE id = $1', [id]);
