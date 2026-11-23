<script setup>
import { reactive, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { kirim } from "../lib/api.js";
import { masuk } from "../lib/session.js";

const router = useRouter();
const f = reactive({ namaLengkap: "", email: "", kataSandi: "" });
const galat = ref("");
const proses = ref(false);

async function daftar() {
  galat.value = "";
  proses.value = true;
  try {
    await kirim("/auth/registrasi", { namaLengkap: f.namaLengkap, email: f.email, kataSandi: f.kataSandi });
    await masuk(f.email.trim(), f.kataSandi);
    router.push("/");
  } catch (e) {
    galat.value = e.message;
  } finally {
    proses.value = false;
  }
}
</script>

<template>
  <div class="container">
    <div class="auth">
      <div class="auth-card">
        <div><p class="eyebrow">Daftar</p><h1 style="font-size: 2rem; margin-top: 8px">Buat akun pembeli</h1></div>
        <form novalidate style="display: grid; gap: 14px" @submit.prevent="daftar">
          <div class="field"><label for="r-nama">Nama lengkap</label><input id="r-nama" v-model="f.namaLengkap" type="text" autocomplete="name" required /></div>
          <div class="field"><label for="r-email">Email</label><input id="r-email" v-model="f.email" type="email" autocomplete="email" required /></div>
          <div class="field">
            <label for="r-sandi">Kata sandi</label>
            <input id="r-sandi" v-model="f.kataSandi" type="password" autocomplete="new-password" minlength="15" aria-describedby="r-sandi-h" required />
            <span id="r-sandi-h" class="hint">Minimal 15 karakter. Kalimat sandi yang mudah diingat lebih aman daripada sandi singkat yang rumit.</span>
          </div>
          <p v-if="galat" role="alert" style="color: var(--bad); font-weight: 600">{{ galat }}</p>
          <button class="btn btn-wide" type="submit" :disabled="proses">{{ proses ? "Memproses…" : "Daftar" }}</button>
        </form>
        <p class="muted">Sudah punya akun? <RouterLink to="/masuk">Masuk</RouterLink>. Ingin berjualan? <RouterLink to="/daftar-penjual">Daftar sebagai penjual</RouterLink>.</p>
      </div>
    </div>
  </div>
</template>
