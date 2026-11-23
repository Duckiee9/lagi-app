import pg from 'pg';
import { config } from '../config/app.js';

// NUMERIC dan BIGINT dibiarkan sebagai string oleh pg; konversi dilakukan di repositori.
export const pool = new pg.Pool({
  connectionString: config.db.url || undefined,
  ssl: config.db.ssl ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (e) => console.error('Galat pool PostgreSQL:', e.message));
