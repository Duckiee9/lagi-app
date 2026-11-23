// Verifikasi penjual (peran admin belum ada, jadi dilakukan lewat CLI).
// Pakai: npm run toko:verifikasi -- email@toko.test [terverifikasi|ditolak|menunggu]
import { pool } from './_koneksi.js';

const [email, status = 'terverifikasi'] = process.argv.slice(2);
if (!email || !['terverifikasi', 'ditolak', 'menunggu'].includes(status)) {
  console.error('Pakai: npm run toko:verifikasi -- <email> [terverifikasi|ditolak|menunggu]');
  process.exit(1);
}
const { rows } = await pool.query(
  `UPDATE toko t SET status_verifikasi = $2 FROM pengguna p
    WHERE p.id = t.pengguna_id AND p.email = lower($1) RETURNING t.nama_toko, t.status_verifikasi`,
  [email, status],
);
console.log(rows[0] ? `${rows[0].nama_toko}: ${rows[0].status_verifikasi}` : 'Penjual dengan email itu tidak ditemukan.');
await pool.end();
process.exit(rows[0] ? 0 : 1);
