import { galat } from './api.js';
import { authConfig } from '../config/auth.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function teks(v, nama, { min = 1, maks = 200, boleh_kosong = false } = {}) {
  if (v === undefined || v === null || v === '') {
    if (boleh_kosong) return '';
    throw galat.validasi(`${nama} wajib diisi.`);
  }
  if (typeof v !== 'string') throw galat.validasi(`${nama} harus berupa teks.`);
  const t = v.trim().replace(/\s+/g, ' ');
  if (t.length < min) throw galat.validasi(`${nama} minimal ${min} karakter.`);
  if (t.length > maks) throw galat.validasi(`${nama} maksimal ${maks} karakter.`);
  return t;
}

// Teks bebas (deskripsi/catatan): mempertahankan baris baru.
export function teksBebas(v, nama, maks = 1000) {
  if (v === undefined || v === null) return '';
  if (typeof v !== 'string') throw galat.validasi(`${nama} harus berupa teks.`);
  const t = v.trim();
  if (t.length > maks) throw galat.validasi(`${nama} maksimal ${maks} karakter.`);
  return t;
}

export function email(v) {
  const t = teks(v, 'Email', { maks: 254 }).toLowerCase();
  if (!EMAIL.test(t)) throw galat.validasi('Format email tidak valid.');
  return t;
}

export function kataSandi(v) {
  if (typeof v !== 'string') throw galat.validasi('Kata sandi wajib diisi.');
  if (v.length < authConfig.sandiMin) throw galat.validasi(`Kata sandi minimal ${authConfig.sandiMin} karakter.`);
  if (v.length > authConfig.sandiMaks) throw galat.validasi(`Kata sandi maksimal ${authConfig.sandiMaks} karakter.`);
  return v;
}

export function telepon(v) {
  const t = teks(v, 'Nomor telepon', { maks: 20 }).replace(/[\s-]/g, '');
  if (!/^(\+62|0)8\d{7,12}$/.test(t)) throw galat.validasi('Nomor telepon tidak valid (contoh: 081234567890).');
  return t;
}

export function rupiah(v, nama, { min = 0, maks = 1_000_000_000 } = {}) {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  if (typeof n !== 'number' || !Number.isInteger(n)) throw galat.validasi(`${nama} harus berupa angka bulat rupiah.`);
  if (n < min || n > maks) throw galat.validasi(`${nama} harus antara ${min} dan ${maks}.`);
  return n;
}

export function pilihan(v, nama, daftar) {
  if (!daftar.includes(v)) throw galat.validasi(`${nama} harus salah satu dari: ${daftar.join(', ')}.`);
  return v;
}

export function objek(v, nama) {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) throw galat.validasi(`${nama} harus berupa objek.`);
  return v;
}
