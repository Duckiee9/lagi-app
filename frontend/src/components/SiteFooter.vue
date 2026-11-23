<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { RouterLink, useRoute } from "vue-router";
import GaleriStrip from "./GaleriStrip.vue";
import TepiSobek from "./TepiSobek.vue";
import Ikon from "./Ikon.vue";
import { KONTAK, TAHUN } from "../lib/situs.js";
import { sesi } from "../lib/session.js";
import { useKategori } from "../composables/useKategori.js";

const route = useRoute();
const { data } = useKategori();
const tampil = ref(false);
const geser = () => (tampil.value = window.scrollY > 500);
onMounted(() => window.addEventListener("scroll", geser, { passive: true }));
onBeforeUnmount(() => window.removeEventListener("scroll", geser));
const keAtas = () => window.scrollTo({ top: 0, behavior: "smooth" });
</script>

<template>
  <GaleriStrip v-if="route.name === 'beranda'" />
  <footer class="site-footer">
    <TepiSobek :seed="7" balik />
    <div class="container">
      <div class="foot-grid">
        <div>
          <h2>Hubungi kami</h2>
          <p v-if="KONTAK.alamat">{{ KONTAK.alamat }}</p>
          <p v-else>Tim LAGI. Marketplace preloved untuk barang yang layak dipakai lagi.</p>
          <p v-if="KONTAK.email" style="margin-top: 14px"><Ikon nama="pin" />{{ KONTAK.email }}</p>
          <p v-if="KONTAK.telepon"><Ikon nama="user" />{{ KONTAK.telepon }}</p>
        </div>
        <div>
          <h2>Tautan berguna</h2>
          <RouterLink to="/">Beranda</RouterLink>
          <RouterLink to="/jelajah">Jelajah</RouterLink>
          <RouterLink to="/gratis">Give It Forward</RouterLink>
          <RouterLink to="/dampak">Impact Dashboard</RouterLink>
        </div>
        <div>
          <h2>Kategori</h2>
          <RouterLink v-for="k in data?.kategori || []" :key="k.kode" :to="{ path: '/jelajah', query: { kategori: k.kode } }">{{ k.label }}</RouterLink>
        </div>
        <div>
          <h2>Akun</h2>
          <template v-if="sesi.pengguna">
            <RouterLink to="/pesanan">Pesanan</RouterLink>
            <RouterLink to="/dashboard">Dashboard</RouterLink>
          </template>
          <template v-else>
            <RouterLink to="/masuk">Masuk</RouterLink>
            <RouterLink to="/daftar">Daftar sebagai pembeli</RouterLink>
            <RouterLink to="/daftar-penjual">Mulai berjualan</RouterLink>
          </template>
        </div>
      </div>
      <div class="foot-bottom"><p>© {{ TAHUN }} LAGI. Sustainable Re-commerce Marketplace.</p></div>
    </div>
  </footer>
  <button class="totop" :class="{ show: tampil }" type="button" aria-label="Kembali ke atas" @click="keAtas"><Ikon nama="up" /></button>
</template>
