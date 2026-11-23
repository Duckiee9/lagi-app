<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import Ikon from "./Ikon.vue";
import { adalahPembeli, adalahPenjual, keluar, sesi } from "../lib/session.js";
import { inisial } from "../lib/format.js";

const route = useRoute();
const router = useRouter();
const terbuka = ref(false);
const menempel = ref(false);
const melayang = computed(() => route.name === "beranda");

const geser = () => {
  menempel.value = window.scrollY > 40;
};
onMounted(() => {
  geser();
  window.addEventListener("scroll", geser, { passive: true });
});
onBeforeUnmount(() => window.removeEventListener("scroll", geser));
watch(() => route.fullPath, () => (terbuka.value = false));

async function logout() {
  // Pindah dulu agar halaman yang butuh login tidak sempat mengarahkan ke halaman masuk.
  await router.push("/");
  await keluar();
}
</script>

<template>
  <a class="lewati" href="#konten">Lewati ke konten</a>
  <header class="site-header" :class="{ over: melayang, stuck: menempel }">
    <div class="container header-in">
      <RouterLink class="brand" to="/" aria-label="LAGI. kembali ke beranda"><span class="brand-name">Lagi<i>.</i></span></RouterLink>
      <button class="icon-btn menu-btn" type="button" :aria-expanded="terbuka" aria-controls="menu-utama" aria-label="Buka menu" @click="terbuka = !terbuka">
        <Ikon :nama="terbuka ? 'x' : 'menu'" />
      </button>
      <nav id="menu-utama" class="menu" :class="{ open: terbuka }" aria-label="Navigasi utama">
        <RouterLink class="nav" to="/">Beranda</RouterLink>
        <RouterLink class="nav" to="/jelajah">Jelajah</RouterLink>
        <RouterLink class="nav" to="/gratis">Give It Forward</RouterLink>
        <template v-if="adalahPenjual()">
          <RouterLink class="nav" to="/toko/barang">Barang saya</RouterLink>
          <RouterLink class="nav" to="/toko/permintaan">Permintaan masuk</RouterLink>
          <RouterLink class="nav" to="/toko/profil">Profil toko</RouterLink>
        </template>
        <RouterLink v-if="adalahPembeli()" class="nav" to="/permintaan-saya">Permintaan saya</RouterLink>
        <RouterLink v-if="sesi.pengguna" class="nav" to="/pesanan">Pesanan</RouterLink>
        <RouterLink class="nav" :to="sesi.pengguna ? '/dashboard' : '/dampak'">Impact</RouterLink>
        <RouterLink class="icon-btn cari-btn" to="/jelajah" aria-label="Cari barang"><Ikon nama="search" /></RouterLink>
        <template v-if="sesi.pengguna">
          <span class="chip-akun">
            <span class="av" aria-hidden="true">{{ inisial(sesi.pengguna.namaLengkap) }}</span>
            <span>{{ sesi.pengguna.namaLengkap }}<small>{{ sesi.pengguna.peran }}</small></span>
          </span>
          <button class="btn btn-quiet btn-sm" type="button" @click="logout"><Ikon nama="out" />Keluar</button>
        </template>
        <template v-else>
          <RouterLink class="nav" to="/masuk">Masuk</RouterLink>
          <RouterLink class="btn btn-sm" to="/daftar">Daftar</RouterLink>
        </template>
      </nav>
    </div>
  </header>
</template>
