import { galat } from './api.js';

export const FOTO_MAKS = 2 * 1024 * 1024;
const JENIS = { 'image/jpeg': 'jpeg', 'image/png': 'png', 'image/webp': 'webp' };

function cocokMagic(mime, b) {
  if (mime === 'image/jpeg') return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  if (mime === 'image/png') return b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mime === 'image/webp') return b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP';
  return false;
}

// Terima data URL base64; kembalikan { mime, data: Buffer }. Isi file diperiksa lewat magic bytes.
export function urai(dataUrl, nama = 'Foto') {
  if (typeof dataUrl !== 'string') throw galat.validasi(`${nama} tidak valid.`);
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+=*)$/.exec(dataUrl);
  if (!m) throw galat.validasi(`${nama} harus berformat JPEG, PNG, atau WebP (data URL base64).`);
  const data = Buffer.from(m[2], 'base64');
  if (data.length === 0) throw galat.validasi(`${nama} kosong.`);
  if (data.length > FOTO_MAKS) throw galat.validasi(`${nama} maksimal 2 MiB.`);
  if (!cocokMagic(m[1], data)) throw galat.validasi(`Isi ${nama.toLowerCase()} tidak sesuai formatnya.`);
  return { mime: m[1], data };
}

export const adaJenis = (mime) => mime in JENIS;
