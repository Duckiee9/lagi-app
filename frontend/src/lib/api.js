// Pembungkus fetch untuk API LAGI.
// Respons sukses: { success: true, data, meta? }. Gagal: { success: false, error: { code, message } }.
const KUNCI = "lagi.token";
let tokenMemori = null;
let saatTidakSah = () => {};

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function ambilToken() {
  if (tokenMemori) return tokenMemori;
  try {
    tokenMemori = localStorage.getItem(KUNCI);
  } catch {
    /* penyimpanan peramban bisa diblokir */
  }
  return tokenMemori;
}

export function simpanToken(token) {
  tokenMemori = token || null;
  try {
    if (token) localStorage.setItem(KUNCI, token);
    else localStorage.removeItem(KUNCI);
  } catch {
    /* abaikan; token tetap ada di memori */
  }
}

export function pasangPenangkal401(fn) {
  saatTidakSah = fn;
}

const KODE_SESI = new Set(["AUTH_REQUIRED", "TOKEN_INVALID", "TOKEN_EXPIRED", "SESSION_REVOKED"]);

function susunUrl(path, query) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(query || {})) {
    if (v !== undefined && v !== null && v !== "") u.set(k, String(v));
  }
  const s = u.toString();
  return `/api${path}${s ? `?${s}` : ""}`;
}

// Mengembalikan { data, meta }.
export async function api(path, { method = "GET", body, query } = {}) {
  const headers = { Accept: "application/json" };
  const token = ambilToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let res;
  try {
    res = await fetch(susunUrl(path, query), { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Tidak dapat menghubungi server. Periksa koneksi Anda.");
  }

  let isi = null;
  try {
    isi = await res.json();
  } catch {
    /* bukan JSON */
  }
  if (res.ok && isi?.success) return { data: isi.data, meta: isi.meta };

  const e = isi?.error;
  const err = new ApiError(res.status, e?.code || "UNKNOWN", e?.message || "Terjadi kesalahan pada server.");
  if (res.status === 401 && KODE_SESI.has(err.code)) saatTidakSah(err);
  throw err;
}

export const ambil = async (path, query) => (await api(path, { query })).data;
export const kirim = async (path, body, method = "POST") => (await api(path, { method, body: body ?? {} })).data;
export const hapus = async (path) => (await api(path, { method: "DELETE" })).data;

export const urlFoto = (barangId) => `/api/barang/${barangId}/foto`;
export const urlFotoCacat = (barangId, cacatId) => `/api/barang/${barangId}/cacat/${cacatId}/foto`;
