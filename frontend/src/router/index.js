import { createRouter, createWebHistory } from "vue-router";
import { muatSesi, penjualTerverifikasi, sesi } from "../lib/session.js";

// meta: masuk (wajib login), peran (pembeli | penjual), verifikasi (penjual wajib terverifikasi)
const rute = [
  { path: "/", name: "beranda", component: () => import("../views/BerandaView.vue") },
  { path: "/jelajah", name: "jelajah", component: () => import("../views/KatalogView.vue") },
  { path: "/gratis", name: "gratis", component: () => import("../views/KatalogView.vue"), props: { jenisTetap: "gratis" } },
  { path: "/barang/:id", name: "barang", component: () => import("../views/DetailBarangView.vue"), props: true },
  { path: "/masuk", name: "masuk", component: () => import("../views/LoginView.vue") },
  { path: "/daftar", name: "daftar", component: () => import("../views/RegistrasiView.vue") },
  { path: "/daftar-penjual", name: "daftar-penjual", component: () => import("../views/RegistrasiPenjualView.vue") },
  { path: "/pesanan", name: "pesanan", component: () => import("../views/PesananView.vue"), meta: { masuk: true, verifikasi: true } },
  { path: "/pesanan/:id", name: "pesanan-detail", component: () => import("../views/DetailPesananView.vue"), props: true, meta: { masuk: true, verifikasi: true } },
  { path: "/permintaan-saya", name: "permintaan-saya", component: () => import("../views/PermintaanSayaView.vue"), meta: { masuk: true, peran: "pembeli" } },
  { path: "/dashboard", name: "dashboard", component: () => import("../views/DashboardView.vue"), meta: { masuk: true, verifikasi: true } },
  { path: "/dampak", name: "dampak", component: () => import("../views/DampakPlatformView.vue") },
  { path: "/toko/barang", name: "toko-barang", component: () => import("../views/penjual/BarangSayaView.vue"), meta: { masuk: true, peran: "penjual", verifikasi: true } },
  { path: "/toko/barang/baru", name: "toko-barang-baru", component: () => import("../views/penjual/FormBarangView.vue"), meta: { masuk: true, peran: "penjual", verifikasi: true } },
  { path: "/toko/barang/:id/ubah", name: "toko-barang-ubah", component: () => import("../views/penjual/FormBarangView.vue"), props: true, meta: { masuk: true, peran: "penjual", verifikasi: true } },
  { path: "/toko/permintaan", name: "toko-permintaan", component: () => import("../views/penjual/PermintaanMasukView.vue"), meta: { masuk: true, peran: "penjual", verifikasi: true } },
  { path: "/toko/profil", name: "toko-profil", component: () => import("../views/penjual/ProfilTokoView.vue"), meta: { masuk: true, peran: "penjual" } },
  { path: "/:pathMatch(.*)*", name: "404", component: () => import("../views/TidakDitemukanView.vue") },
];

const router = createRouter({
  history: createWebHistory(),
  routes: rute,
  scrollBehavior: (_to, _from, saved) => saved || { top: 0 },
});

router.beforeEach(async (to) => {
  await muatSesi();
  const m = to.meta;
  const tamu = ["masuk", "daftar", "daftar-penjual"].includes(to.name);
  if (tamu && sesi.pengguna) return { path: "/" };
  if (m.masuk && !sesi.pengguna) return { name: "masuk", query: { next: to.fullPath } };
  if (m.peran && sesi.pengguna?.peran !== m.peran) return { path: "/" };
  // Penjual yang belum terverifikasi hanya boleh membuka Profil toko.
  if (sesi.pengguna?.peran === "penjual" && m.verifikasi && !penjualTerverifikasi()) return { name: "toko-profil" };
  return true;
});

export default router;
