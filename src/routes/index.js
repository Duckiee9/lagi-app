import { Router } from 'express';
import { Auth, Barang, Dashboard, Permintaan, Pesanan } from '../controllers/index.js';
import { loginOpsional, wajibLogin, wajibPenjualTerverifikasi, wajibPeran } from '../middleware/auth.js';
import { batasAuth } from '../middleware/rate.js';

const r = Router();
const pembeli = wajibPeran('pembeli');
const penjual = wajibPenjualTerverifikasi;

r.get('/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));

// Auth
r.post('/auth/registrasi', batasAuth, Auth.registrasi);
r.post('/auth/registrasi-penjual', batasAuth, Auth.registrasiPenjual);
r.post('/auth/login', batasAuth, Auth.login);
r.get('/auth/saya', wajibLogin, Auth.saya);
r.post('/auth/logout', wajibLogin, Auth.logout);
r.put('/toko/saya', wajibLogin, wajibPeran('penjual'), Auth.ubahToko);

// Katalog dan barang (urutan: path tetap sebelum /:id)
r.get('/kategori', Barang.kategori);
r.get('/barang', Barang.daftar);
r.get('/barang/milik-saya', wajibLogin, penjual, Barang.milikSaya);
r.get('/barang/milik-saya/:id', wajibLogin, penjual, Barang.milikSayaDetail);
r.post('/barang', wajibLogin, penjual, Barang.buat);
r.get('/barang/:id', loginOpsional, Barang.ambil);
r.get('/barang/:id/foto', loginOpsional, Barang.foto);
r.get('/barang/:id/cacat/:cacatId/foto', loginOpsional, Barang.foto);
r.put('/barang/:id', wajibLogin, penjual, Barang.ubah);
r.post('/barang/:id/tayang', wajibLogin, penjual, Barang.tayang);
r.delete('/barang/:id', wajibLogin, penjual, Barang.hapus);
r.post('/barang/:id/permintaan', wajibLogin, pembeli, Barang.ajukan);

// Give It Forward
r.get('/permintaan/saya', wajibLogin, pembeli, Permintaan.saya);
r.get('/permintaan/masuk', wajibLogin, penjual, Permintaan.masuk);
r.post('/permintaan/:id/pilih', wajibLogin, penjual, Permintaan.pilih);
r.delete('/permintaan/:id', wajibLogin, pembeli, Permintaan.tarik);

// Pesanan (penjual yang belum terverifikasi tidak punya pesanan)
r.get('/pesanan', wajibLogin, Pesanan.daftar);
r.get('/pesanan/:id', wajibLogin, Pesanan.ambil);
r.post('/pesanan', wajibLogin, pembeli, Pesanan.buat);
r.post('/pesanan/:id/aksi', wajibLogin, Pesanan.aksi);

// Dashboard
r.get('/dashboard/platform', Dashboard.platform);
r.get('/dashboard', wajibLogin, Dashboard.akun);

export default r;
