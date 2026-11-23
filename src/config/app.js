import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// Muat .env secara sederhana bila ada (tanpa dependensi tambahan).
try {
  process.loadEnvFile?.(path.join(ROOT, '.env'));
} catch {
  /* .env tidak wajib; variabel bisa datang dari lingkungan */
}

const env = process.env;

export const config = {
  port: Number(env.PORT) || 3000,
  produksi: env.NODE_ENV === 'production',
  corsOrigin: (env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean),
  db: {
    url: env.DATABASE_URL || '',
    ssl: env.DB_SSL === 'true',
  },
};
