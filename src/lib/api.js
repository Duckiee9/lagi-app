export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const galat = {
  validasi: (m) => new HttpError(400, 'VALIDATION_ERROR', m),
  butuhLogin: (m = 'Silakan masuk terlebih dahulu.') => new HttpError(401, 'AUTH_REQUIRED', m),
  terlarang: (m = 'Anda tidak memiliki akses.') => new HttpError(403, 'ROLE_FORBIDDEN', m),
  tidakAda: (m = 'Data tidak ditemukan.', code = 'NOT_FOUND') => new HttpError(404, code, m),
  konflik: (m, code = 'DATA_CONFLICT') => new HttpError(409, code, m),
};

export const sukses = (res, data, status = 200, meta) =>
  res.status(status).json(meta ? { success: true, data, meta } : { success: true, data });

export const gagal = (res, status, code, message) =>
  res.status(status).json({ success: false, error: { code, message } });

// Bungkus handler async agar galatnya sampai ke middleware galat.
export const bungkus = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Petakan galat PostgreSQL ke HttpError yang ramah.
export function petakanGalatPg(e) {
  switch (e?.code) {
    case '23505':
      return galat.konflik('Data bertabrakan dengan data yang sudah ada.', 'DATA_CONFLICT');
    case '23503':
      return galat.konflik('Data masih terhubung dengan data lain.', 'DATA_CONFLICT');
    case '23514':
      return galat.validasi('Data tidak memenuhi aturan.');
    case '22P02':
    case '22003':
      return galat.validasi('Format data tidak valid.');
    case '55P03':
      return new HttpError(409, 'DATA_CONFLICT', 'Data sedang diproses pihak lain. Coba lagi sebentar.');
    default:
      return null;
  }
}

export function idValid(v) {
  return typeof v === 'string' && /^[1-9]\d{0,17}$/.test(v);
}

export function paramId(v, nama = 'ID') {
  if (!idValid(String(v))) throw galat.validasi(`${nama} tidak valid.`);
  return String(v);
}

export function paginasi(query, { limitDefault = 8, limitMaks = 24 } = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(limitMaks, Math.max(1, parseInt(query.limit, 10) || limitDefault));
  return { page, limit, offset: (page - 1) * limit };
}

export const meta = (jumlah, { page, limit }) => ({
  jumlah, page, limit, totalPages: Math.max(1, Math.ceil(jumlah / limit)),
});
