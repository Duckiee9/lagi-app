import rateLimit from 'express-rate-limit';
import { gagal } from '../lib/api.js';

export const batasAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => gagal(res, 429, 'AUTH_RATE_LIMIT', 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.'),
});
