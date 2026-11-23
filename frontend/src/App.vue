<script setup>
import { computed, onBeforeUnmount, onMounted, watch } from "vue";
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router";
import Lenis from "lenis";
import SiteHeader from "./components/SiteHeader.vue";
import SiteFooter from "./components/SiteFooter.vue";
import { adalahPenjual, penjualTerverifikasi, sesi } from "./lib/session.js";

const route = useRoute();
const router = useRouter();

// Token berlaku 15 menit. Bila sesi hilang di halaman yang butuh login, arahkan ke halaman masuk.
watch(
  () => sesi.pengguna,
  (p) => {
    if (!p && route.meta.masuk) router.replace({ name: "masuk", query: { next: route.fullPath } });
  },
);

// Smooth scroll. Dilewati bagi pengguna yang meminta gerak dikurangi.
let lenis = null;
onMounted(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  lenis = new Lenis({ autoRaf: true });
});
onBeforeUnmount(() => lenis?.destroy());

const perluVerifikasi = computed(() => adalahPenjual() && !penjualTerverifikasi());
const ditolak = computed(() => sesi.pengguna?.statusVerifikasi === "ditolak");
</script>

<template>
  <SiteHeader />
  <div v-if="perluVerifikasi" class="banner-verif" role="status">
    <template v-if="ditolak">Verifikasi toko Anda ditolak. Perbarui data toko di <RouterLink to="/toko/profil">Profil toko</RouterLink> atau hubungi admin.</template>
    <template v-else>Toko Anda menunggu verifikasi. Anda dapat menjual setelah admin menyetujui. Lengkapi data di <RouterLink to="/toko/profil">Profil toko</RouterLink>.</template>
  </div>
  <main id="konten" tabindex="-1">
    <RouterView />
  </main>
  <SiteFooter />
</template>
