import { bungkus, paramId, sukses } from '../lib/api.js';
import * as auth from '../services/auth.js';
import * as barang from '../services/barang.js';
import * as dashboard from '../services/dashboard.js';
import * as permintaan from '../services/permintaan.js';
import * as pesanan from '../services/pesanan.js';

const body = (req) => (req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {});

export const Auth = {
  registrasi: bungkus(async (req, res) => sukses(res, await auth.registrasi(body(req)), 201)),
  registrasiPenjual: bungkus(async (req, res) => sukses(res, await auth.registrasiPenjual(body(req)), 201)),
  login: bungkus(async (req, res) => sukses(res, await auth.login(body(req)))),
  saya: bungkus(async (req, res) => sukses(res, await auth.saya(req.user.id))),
  logout: bungkus(async (req, res) => sukses(res, await auth.logout(req.user.id))),
  ubahToko: bungkus(async (req, res) => sukses(res, await auth.ubahToko(req.user, body(req)))),
};

export const Barang = {
  kategori: bungkus(async (_req, res) => sukses(res, await barang.kategori())),
  daftar: bungkus(async (req, res) => {
    const { data, meta } = await barang.daftar(req.query);
    sukses(res, data, 200, meta);
  }),
  ambil: bungkus(async (req, res) => sukses(res, await barang.ambil(paramId(req.params.id), req.user))),
  foto: bungkus(async (req, res) => {
    const cacatId = req.params.cacatId ? paramId(req.params.cacatId) : null;
    const f = await barang.ambilFoto(paramId(req.params.id), cacatId, req.user);
    res.set({ 'Content-Type': f.mime, 'Cache-Control': 'public, max-age=300', 'X-Content-Type-Options': 'nosniff' });
    res.send(f.data);
  }),
  milikSaya: bungkus(async (req, res) => sukses(res, await barang.milikSaya(req.user, req.query.status))),
  milikSayaDetail: bungkus(async (req, res) => sukses(res, await barang.milikSayaDetail(req.user, paramId(req.params.id)))),
  buat: bungkus(async (req, res) => sukses(res, await barang.buat(req.user, body(req)), 201)),
  ubah: bungkus(async (req, res) => sukses(res, await barang.ubah(req.user, paramId(req.params.id), body(req)))),
  tayang: bungkus(async (req, res) => sukses(res, await barang.tayang(req.user, paramId(req.params.id), body(req).tayang))),
  hapus: bungkus(async (req, res) => sukses(res, await barang.hapus(req.user, paramId(req.params.id)))),
  ajukan: bungkus(async (req, res) => sukses(res, await permintaan.ajukan(req.user, paramId(req.params.id), body(req)), 201)),
};

export const Permintaan = {
  saya: bungkus(async (req, res) => sukses(res, await permintaan.milikSaya(req.user))),
  masuk: bungkus(async (req, res) => sukses(res, await permintaan.masuk(req.user))),
  pilih: bungkus(async (req, res) => sukses(res, await permintaan.pilih(req.user, paramId(req.params.id)), 201)),
  tarik: bungkus(async (req, res) => sukses(res, await permintaan.tarik(req.user, paramId(req.params.id)))),
};

export const Pesanan = {
  daftar: bungkus(async (req, res) => {
    const { data, meta } = await pesanan.daftar(req.user, req.query);
    sukses(res, data, 200, meta);
  }),
  ambil: bungkus(async (req, res) => sukses(res, await pesanan.ambil(paramId(req.params.id), req.user))),
  buat: bungkus(async (req, res) => sukses(res, await pesanan.buat(req.user, body(req)), 201)),
  aksi: bungkus(async (req, res) => sukses(res, await pesanan.aksi(req.user, paramId(req.params.id), body(req)))),
};

export const Dashboard = {
  akun: bungkus(async (req, res) => sukses(res, await dashboard.akun(req.user))),
  platform: bungkus(async (_req, res) => sukses(res, await dashboard.platform())),
};
