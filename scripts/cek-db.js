// Memeriksa koneksi dan kelengkapan skema.
import { pool } from './_koneksi.js';

const TABEL = ['pengguna', 'toko', 'jenis_barang', 'barang', 'cacat_barang', 'pesanan', 'riwayat_pesanan', 'permintaan_gratis'];
try {
  for (const t of TABEL) {
    const { rows } = await pool.query(`SELECT COUNT(*)::int AS n FROM ${t}`);
    console.log(`${t.padEnd(18)} ${rows[0].n}`);
  }
  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM pengguna WHERE kata_sandi_hash IS NULL');
  if (rows[0].n) console.log(`\nPeringatan: ${rows[0].n} akun belum punya kata sandi. Jalankan: npm run db:sandi-demo`);
  console.log('\nDatabase OK.');
} catch (e) {
  console.error('Database bermasalah:', e.message);
  process.exitCode = 1;
}
await pool.end();
