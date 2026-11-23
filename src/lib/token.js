import jwt from 'jsonwebtoken';
import { ambilSecret, authConfig } from '../config/auth.js';
import { HttpError } from './api.js';

export function buatToken(pengguna) {
  return jwt.sign(
    { sub: String(pengguna.id), peran: pengguna.peran, v: pengguna.versi_token },
    ambilSecret(),
    { algorithm: authConfig.algoritma, expiresIn: authConfig.ttlDetik, issuer: authConfig.penerbit },
  );
}

export function periksaToken(token) {
  try {
    return jwt.verify(token, ambilSecret(), { algorithms: [authConfig.algoritma], issuer: authConfig.penerbit });
  } catch (e) {
    if (e.name === 'TokenExpiredError') throw new HttpError(401, 'TOKEN_EXPIRED', 'Sesi berakhir. Silakan masuk lagi.');
    throw new HttpError(401, 'TOKEN_INVALID', 'Token tidak valid.');
  }
}
