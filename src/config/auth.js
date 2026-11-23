// Konfigurasi autentikasi. JWT_SECRET wajib 64 karakter hex (32 byte).
const secret = process.env.JWT_SECRET || '';

export function ambilSecret() {
  if (!/^[0-9a-fA-F]{64}$/.test(secret)) {
    throw new Error('JWT_SECRET harus 64 karakter hex. Buat dengan: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  }
  return secret;
}

export const authConfig = {
  ttlDetik: 15 * 60,
  algoritma: 'HS256',
  penerbit: 'lagi-api',
  bcryptCost: 12,
  sandiMin: 15,
  sandiMaks: 128,
};
