<script setup>
import { reactive, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { kirim } from "../lib/api.js";
import { masuk } from "../lib/session.js";

const router = useRouter();
const f = reactive({ namaLengkap: "", email: "", kataSandi: "", namaToko: "", kota: "", nomorTelepon: "", bio: "" });
const galat = ref("");
const proses = ref(false);

async function daftar() {
  galat.value = "";
  proses.value = true;
  try {
    await kirim("/auth/registrasi-penjual", { ...f });
    await masuk(f.email.trim(), f.kataSandi);
    router.push("/toko/profil");
  } catch (e) {
    galat.value = e.message;
  } finally {
    proses.value = false;
  }
}
</script>

<template>
  <div class="container">
    <div class="auth" style="max-width: 640px">
      <div class="auth-card">
        <div>
          <p class="eyebrow">Daftar penjual</p>
          <h1 style="font-size: 2rem; margin-top: 8px">Mulai berjualan atau memberi</h1>
          <p class="muted">Toko baru perlu diverifikasi admin sebelum bisa menerbitkan barang.</p>
        </div>
        <form novalidate style="display: grid; gap: 14px" @submit.prevent="daftar">
          <div class="grid-2">
            <div class="field"><label for="p-nama">Nama lengkap</label><input id="p-nama" v-model="f.namaLengkap" type="text" autocomplete="name" required /></div>
            <div class="field"><label for="p-email">Email</label><input id="p-email" v-model="f.email" type="email" autocomplete="email" required /></div>
          </div>
          <div class="field">
            <label for="p-sandi">Kata sandi</label>
            <input id="p-sandi" v-model="f.kataSandi" type="password" autocomplete="new-password" minlength="15" required />
            <span class="hint">Minimal 15 karakter.</span>
          </div>
          <div class="grid-2">
            <div class="field"><label for="p-toko">Nama toko</label><input id="p-toko" v-model="f.namaToko" type="text" required /></div>
            <div class="field"><label for="p-kota">Kota</label><input id="p-kota" v-model="f.kota" type="text" required /></div>
          </div>
          <div class="field"><label for="p-telp">Nomor telepon</label><input id="p-telp" v-model="f.nomorTelepon" type="tel" inputmode="tel" placeholder="081234567890" autocomplete="tel" required /></div>
          <div class="field"><label for="p-bio">Tentang toko (opsional)</label><textarea id="p-bio" v-model="f.bio" maxlength="500" placeholder="Ceritakan singkat barang yang Anda jual atau berikan"></textarea></div>
          <p v-if="galat" role="alert" style="color: var(--bad); font-weight: 600">{{ galat }}</p>
          <button class="btn btn-wide" type="submit" :disabled="proses">{{ proses ? "Memproses…" : "Daftar sebagai penjual" }}</button>
        </form>
        <p class="muted">Sudah punya akun? <RouterLink to="/masuk">Masuk</RouterLink>.</p>
      </div>
    </div>
  </div>
</template>
