// Mengisi kata sandi semua akun seed. Seed sengaja tidak menyimpan hash.
// Pakai: DEMO_PASSWORD="kata-sandi-15-karakter+" npm run db:sandi-demo
import bcrypt from 'bcryptjs';
import { authConfig } from '../src/config/auth.js';
import { pool } from './_koneksi.js';

const sandi = process.env.DEMO_PASSWORD || '';
if (sandi.length < authConfig.sandiMin) {
  console.error(`DEMO_PASSWORD wajib diisi (minimal ${authConfig.sandiMin} karakter), misalnya di .env.`);
  process.exit(1);
}
const hash = await bcrypt.hash(sandi, authConfig.bcryptCost);
const { rows } = await pool.query(
  'UPDATE pengguna SET kata_sandi_hash = $1, versi_token = versi_token + 1 RETURNING email, peran',
  [hash],
);
console.log(`Kata sandi diatur untuk ${rows.length} akun:`);
for (const r of rows) console.log(`  ${r.peran.padEnd(8)} ${r.email}`);
await pool.end();
