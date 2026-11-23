<script setup>
import { ref } from "vue";
import { RouterLink } from "vue-router";
import Ikon from "../components/Ikon.vue";
import PanelDampak from "../components/PanelDampak.vue";
import StatusMuat from "../components/StatusMuat.vue";
import { ambil } from "../lib/api.js";
import { adalahPenjual } from "../lib/session.js";
import { useMuat } from "../composables/useMuat.js";

const data = ref(null);
const { memuat, galat, jalankan } = useMuat(async () => {
  data.value = await ambil("/dashboard");
});
jalankan();
</script>

<template>
  <div class="container">
    <div class="page-head">
      <div>
        <p class="eyebrow"><Ikon nama="chart" />Impact Dashboard</p>
        <h1 style="font-size: clamp(2rem, 4vw, 3rem); margin-top: 8px">{{ adalahPenjual() ? "Dampak toko Anda" : "Dampak belanja Anda" }}</h1>
        <p class="muted">Pantau aktivitas jual beli dan barang yang dipakai lagi.</p>
      </div>
      <RouterLink class="btn btn-2 btn-sm" to="/dampak">Lihat seluruh LAGI.</RouterLink>
    </div>
    <StatusMuat :memuat="memuat" :galat="galat" @ulang="jalankan">
      <PanelDampak v-if="data" :data="data" />
    </StatusMuat>
  </div>
</template>
