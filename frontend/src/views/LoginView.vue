<script setup>
import { reactive, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { masuk } from "../lib/session.js";

const route = useRoute();
const router = useRouter();
const f = reactive({ email: "", kataSandi: "" });
const galat = ref("");
const proses = ref(false);

async function kirimForm() {
  galat.value = "";
  if (!f.email.trim() || !f.kataSandi) {
    galat.value = "Email dan kata sandi wajib diisi.";
    return;
  }
  proses.value = true;
  try {
    const p = await masuk(f.email.trim(), f.kataSandi);
    const next = String(route.query.next || "");
    router.push(next.startsWith("/") && !next.startsWith("//") ? next : p.peran === "penjual" ? "/toko/barang" : "/");
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
        <div><p class="eyebrow">Masuk</p><h1 style="font-size: 2rem; margin-top: 8px">Selamat datang kembali</h1></div>
        <form novalidate style="display: grid; gap: 14px" @submit.prevent="kirimForm">
          <div class="field"><label for="m-email">Email</label><input id="m-email" v-model="f.email" type="email" autocomplete="email" required /></div>
          <div class="field"><label for="m-sandi">Kata sandi</label><input id="m-sandi" v-model="f.kataSandi" type="password" autocomplete="current-password" required /></div>
          <p v-if="galat" role="alert" style="color: var(--bad); font-weight: 600">{{ galat }}</p>
          <button class="btn btn-wide" type="submit" :disabled="proses">{{ proses ? "Memproses…" : "Masuk" }}</button>
        </form>
        <p class="muted">Belum punya akun? <RouterLink to="/daftar">Daftar sebagai pembeli</RouterLink> atau <RouterLink to="/daftar-penjual">mulai berjualan</RouterLink>.</p>
      </div>
    </div>
  </div>
</template>
