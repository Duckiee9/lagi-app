import { pool } from '../db/pool.js';
import { HttpError, galat, bungkus } from '../lib/api.js';
import { periksaToken } from '../lib/token.js';

async function muatPengguna(req) {
  const h = req.headers.authorization || '';
  const m = /^Bearer\s+(\S+)$/i.exec(h);
  if (!m) return null;
  const klaim = periksaToken(m[1]);
  const { rows } = await pool.query(
    `SELECT p.id, p.nama_lengkap, p.email, p.peran, p.aktif, p.versi_token,
            t.id AS toko_id, t.status_verifikasi
       FROM pengguna p LEFT JOIN toko t ON t.pengguna_id = p.id
      WHERE p.id = $1`,
    [klaim.sub],
  );
  const p = rows[0];
  if (!p || !p.aktif || p.versi_token !== klaim.v) {
    throw new HttpError(401, 'SESSION_REVOKED', 'Sesi tidak berlaku lagi. Silakan masuk lagi.');
  }
  return { id: p.id, peran: p.peran, namaLengkap: p.nama_lengkap, email: p.email, tokoId: p.toko_id, statusVerifikasi: p.status_verifikasi };
}

export const wajibLogin = bungkus(async (req, _res, next) => {
  const u = await muatPengguna(req);
  if (!u) throw galat.butuhLogin();
  req.user = u;
  next();
});

// Login opsional: token buruk tetap ditolak, tanpa token dianggap tamu.
export const loginOpsional = bungkus(async (req, _res, next) => {
  req.user = (await muatPengguna(req)) || null;
  next();
});

export const wajibPeran = (peran) => (req, _res, next) =>
  req.user?.peran === peran ? next() : next(galat.terlarang(`Hanya untuk ${peran}.`));

export function wajibPenjualTerverifikasi(req, _res, next) {
  if (req.user?.peran !== 'penjual') return next(galat.terlarang('Hanya untuk penjual.'));
  if (req.user.statusVerifikasi !== 'terverifikasi') {
    return next(new HttpError(403, 'PROVIDER_NOT_VERIFIED', 'Toko Anda belum terverifikasi.'));
  }
  next();
}
