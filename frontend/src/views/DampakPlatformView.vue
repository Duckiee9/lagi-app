<script setup>
import { ref } from "vue";
import { RouterLink } from "vue-router";
import Ikon from "../components/Ikon.vue";
import PanelDampak from "../components/PanelDampak.vue";
import StatusMuat from "../components/StatusMuat.vue";
import { ambil } from "../lib/api.js";
import { sesi } from "../lib/session.js";
import { useMuat } from "../composables/useMuat.js";

const data = ref(null);
const { memuat, galat, jalankan } = useMuat(async () => {
  data.value = await ambil("/dashboard/platform");
});
jalankan();
</script>

<template>
  <div class="container">
    <div class="page-head">
      <div>
        <p class="eyebrow"><Ikon nama="chart" />Impact Dashboard</p>
        <h1 style="font-size: clamp(2rem, 4vw, 3rem); margin-top: 8px">Dampak seluruh LAGI.</h1>
        <p class="muted">Barang yang sudah dipakai lagi lewat platform, dihitung dari pesanan yang selesai.</p>
      </div>
      <RouterLink v-if="sesi.pengguna" class="btn btn-2 btn-sm" to="/dashboard">Lihat dashboard akun saya</RouterLink>
      <RouterLink v-else class="btn btn-2 btn-sm" to="/masuk">Masuk untuk melihat akun Anda</RouterLink>
    </div>
    <StatusMuat :memuat="memuat" :galat="galat" @ulang="jalankan">
      <PanelDampak v-if="data" :data="data" />
    </StatusMuat>
  </div>
</template>
