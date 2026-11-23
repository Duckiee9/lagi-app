<script setup>
import { ref } from "vue";
import { RouterLink } from "vue-router";
import StatusKosong from "../components/StatusKosong.vue";
import StatusMuat from "../components/StatusMuat.vue";
import { ambil, hapus } from "../lib/api.js";
import { tgl } from "../lib/format.js";
import { useMuat } from "../composables/useMuat.js";

const daftar = ref([]);
const galatAksi = ref("");
const { memuat, galat, jalankan } = useMuat(async () => {
  daftar.value = await ambil("/permintaan/saya");
});
jalankan();

const LABEL = { menunggu: ["Menunggu pemberi", "pill ok"], dipilih: ["Anda terpilih", "pill good"], ditolak: ["Tidak terpilih", "pill bad"], ditarik: ["Ditarik", "pill"] };

async function tarik(id) {
  galatAksi.value = "";
  try {
    await hapus(`/permintaan/${id}`);
    await jalankan();
  } catch (e) {
    galatAksi.value = e.message;
  }
}
</script>

<template>
  <div class="container">
    <div class="page-head">
      <div>
        <p class="eyebrow">Give It Forward</p>
        <h1 style="font-size: clamp(2rem, 4vw, 3rem); margin-top: 8px">Permintaan saya</h1>
        <p class="muted">Barang gratis yang Anda minta. Bila terpilih, pesanan muncul di halaman Pesanan.</p>
      </div>
    </div>
    <StatusMuat :memuat="memuat" :galat="galat" @ulang="jalankan">
      <p v-if="galatAksi" role="alert" style="color: var(--bad); font-weight: 600; margin-bottom: 12px">{{ galatAksi }}</p>
      <StatusKosong v-if="!daftar.length" ikon="gift" judul="Belum ada permintaan" pesan="Ajukan permintaan dari halaman barang gratis.">
        <RouterLink class="btn" to="/gratis">Lihat barang gratis</RouterLink>
      </StatusKosong>
      <div v-else class="panel" style="display: grid; gap: 4px">
        <div v-for="r in daftar" :key="r.id" class="req">
          <div style="min-width: 0">
            <b><RouterLink :to="`/barang/${r.barangId}`">{{ r.namaBarang }}</RouterLink></b>
            <q>“{{ r.alasan }}”</q>
            <small class="note-small">Diajukan {{ tgl(r.dibuatPada) }}</small>
          </div>
          <div style="display: flex; gap: 8px; align-items: center">
            <span :class="LABEL[r.status][1]">{{ LABEL[r.status][0] }}</span>
            <button v-if="r.status === 'menunggu'" class="btn btn-quiet btn-sm" type="button" @click="tarik(r.id)">Tarik</button>
          </div>
        </div>
      </div>
    </StatusMuat>
  </div>
</template>
