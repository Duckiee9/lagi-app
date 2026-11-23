import bcrypt from 'bcryptjs';
import { authConfig } from '../config/auth.js';
import { transaksi } from '../db/transaksi.js';
import { HttpError, galat } from '../lib/api.js';
import * as in_ from '../lib/input.js';
import { buatToken } from '../lib/token.js';
import * as repo from '../repositories/pengguna.js';

// Hash tiruan agar waktu respons sama baik email ada maupun tidak (anti user-enumeration).
const HASH_TIRUAN = bcrypt.hashSync('tiruan-agar-waktu-sama', authConfig.bcryptCost);

export const profil = (r) => ({
  id: r.id, namaLengkap: r.nama_lengkap, email: r.email, peran: r.peran,
  tokoId: r.toko_id ?? null, statusVerifikasi: r.status_verifikasi ?? null,
  namaToko: r.nama_toko ?? null, kota: r.kota ?? null, bio: r.bio ?? null, nomorTelepon: r.nomor_telepon ?? null,
});

export async function registrasi(b) {
  const data = { namaLengkap: in_.teks(b.namaLengkap, 'Nama lengkap', { min: 2, maks: 100 }), email: in_.email(b.email) };
  const hash = await bcrypt.hash(in_.kataSandi(b.kataSandi), authConfig.bcryptCost);
  const id = await transaksi(async (db) => {
    if (await repo.cariByEmail(data.email, db)) throw galat.konflik('Email sudah terdaftar.', 'EMAIL_TAKEN');
    return repo.buat(db, { ...data, peran: 'pembeli', hash });
  });
  return profil(await repo.cariById(id));
}

export async function registrasiPenjual(b) {
  const data = {
    namaLengkap: in_.teks(b.namaLengkap, 'Nama lengkap', { min: 2, maks: 100 }),
    email: in_.email(b.email),
    namaToko: in_.teks(b.namaToko, 'Nama toko', { min: 3, maks: 80 }),
    kota: in_.teks(b.kota, 'Kota', { min: 2, maks: 60 }),
    nomorTelepon: in_.telepon(b.nomorTelepon),
    bio: in_.teksBebas(b.bio, 'Bio', 500),
  };
  const hash = await bcrypt.hash(in_.kataSandi(b.kataSandi), authConfig.bcryptCost);
  const id = await transaksi(async (db) => {
    if (await repo.cariByEmail(data.email, db)) throw galat.konflik('Email sudah terdaftar.', 'EMAIL_TAKEN');
    const pid = await repo.buat(db, { namaLengkap: data.namaLengkap, email: data.email, peran: 'penjual', hash });
    await repo.buatToko(db, { penggunaId: pid, ...data });
    return pid;
  });
  return profil(await repo.cariById(id));
}

export async function login(b) {
  const email = in_.email(b.email);
  if (typeof b.kataSandi !== 'string' || !b.kataSandi) throw galat.validasi('Kata sandi wajib diisi.');
  const p = await repo.cariByEmail(email);
  const cocok = await bcrypt.compare(b.kataSandi.slice(0, authConfig.sandiMaks), p?.kata_sandi_hash || HASH_TIRUAN);
  if (!p || !p.aktif || !p.kata_sandi_hash || !cocok) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Email atau kata sandi salah.');
  }
  return { accessToken: buatToken(p), tokenType: 'Bearer', expiresIn: authConfig.ttlDetik, pengguna: profil(p) };
}

export async function saya(id) {
  const p = await repo.cariById(id);
  if (!p) throw galat.butuhLogin();
  return profil(p);
}

export async function logout(id) {
  await repo.naikkanVersiToken(id);
  return { keluar: true };
}

export async function ubahToko(user, b) {
  const data = {
    namaToko: in_.teks(b.namaToko, 'Nama toko', { min: 3, maks: 80 }),
    kota: in_.teks(b.kota, 'Kota', { min: 2, maks: 60 }),
    nomorTelepon: in_.telepon(b.nomorTelepon),
    bio: in_.teksBebas(b.bio, 'Bio', 500),
  };
  await repo.ubahToko(user.id, data);
  return saya(user.id);
}
