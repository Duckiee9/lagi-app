import { HttpError, gagal, petakanGalatPg } from '../lib/api.js';

export function tidakDitemukan(_req, res) {
  gagal(res, 404, 'NOT_FOUND', 'Endpoint tidak ditemukan.');
}

// eslint-disable-next-line no-unused-vars
export function penangananGalat(err, _req, res, _next) {
  if (err.type === 'entity.too.large') return gagal(res, 413, 'PAYLOAD_TOO_LARGE', 'Data terlalu besar.');
  if (err.type === 'entity.parse.failed') return gagal(res, 400, 'VALIDATION_ERROR', 'Body bukan JSON yang valid.');
  const e = err instanceof HttpError ? err : petakanGalatPg(err) || err;
  if (e instanceof HttpError) return gagal(res, e.status, e.code, e.message);
  console.error(err);
  gagal(res, 500, 'INTERNAL_ERROR', 'Terjadi kesalahan pada server.');
}
