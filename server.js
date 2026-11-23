import { buatApp } from './src/app.js';
import { pool } from './src/db/pool.js';
import { config } from './src/config/app.js';

const app = buatApp();
const server = app.listen(config.port, () => {
  console.log(`LAGI. API berjalan di http://localhost:${config.port}`);
});

async function tutup(sinyal) {
  console.log(`\n${sinyal} diterima, menutup server...`);
  server.close(async () => {
    await pool.end().catch(() => {});
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGINT', () => tutup('SIGINT'));
process.on('SIGTERM', () => tutup('SIGTERM'));
