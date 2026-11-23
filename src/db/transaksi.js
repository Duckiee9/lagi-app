import { pool } from './pool.js';

// Jalankan fn(client) dalam satu transaksi. Kunci baris (FOR UPDATE) menunggu paling lama 3 detik.
export async function transaksi(fn, { bacaSaja = false } = {}) {
  const client = await pool.connect();
  try {
    await client.query(bacaSaja ? 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY' : 'BEGIN');
    await client.query("SET LOCAL lock_timeout = '3s'");
    const hasil = await fn(client);
    await client.query('COMMIT');
    return hasil;
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
