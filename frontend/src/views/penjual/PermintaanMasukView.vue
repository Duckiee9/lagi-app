<script setup>
import { ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import StatusKosong from "../../components/StatusKosong.vue";
import StatusMuat from "../../components/StatusMuat.vue";
import { ambil, kirim } from "../../lib/api.js";
import { tgl } from "../../lib/format.js";
import { useMuat } from "../../composables/useMuat.js";

const router = useRouter();
const daftar = ref([]);
const konfirmasi = ref("");
const galatAksi = ref("");
const { memuat, galat, jalankan } = useMuat(async () => {
  daftar.value = await ambil("/permintaan/masuk");
});
jalankan();

async function pilih(r) {
  galatAksi.value = "";
  try {
    const p = await kirim(`/permintaan/${r.id}/pilih`);
    router.push(`/pesanan/${p.id}`);
  } catch (e) {
    galatAksi.value = e.message;
    konfirmasi.value = "";
    await jalankan();
  }
}
</script>

<template>
  <div class="container">
    <div class="page-head">
      <div>
        <p class="eyebrow">Give It Forward</p>
        <h1 style="font-size: clamp(2rem, 4vw, 3rem); margin-top: 8px">Permintaan masuk</h1>
        <p class="muted">Baca alasan tiap calon penerima, lalu pilih satu. Permintaan lain untuk barang itu otomatis ditolak.</p>
      </div>
    </div>
    <p v-if="galatAksi" role="alert" style="color: var(--bad); font-weight: 600; margin-bottom: 12px">{{ galatAksi }}</p>
    <StatusMuat :memuat="memuat" :galat="galat" @ulang="jalankan">
      <StatusKosong v-if="!daftar.length" ikon="gift" judul="Belum ada permintaan" pesan="Permintaan untuk barang gratis Anda akan muncul di sini.">
        <RouterLink class="btn" to="/toko/barang">Kelola barang</RouterLink>
      </StatusKosong>
      <div v-else class="panel" style="display: grid; gap: 4px">
        <div v-for="r in daftar" :key="r.id" class="req">
          <div style="min-width: 0">
            <b><RouterLink :to="`/barang/${r.barangId}`">{{ r.namaBarang }}</RouterLink></b>
            <span class="note-small"> · {{ r.peminta.namaLengkap }} · {{ tgl(r.dibuatPada) }}</span>
            <q>“{{ r.alasan }}”</q>
          </div>
          <span v-if="konfirmasi === r.id" class="inline-confirm">
            <span class="note-small">Pilih {{ r.peminta.namaLengkap }}?</span>
            <button class="btn btn-tag btn-sm" type="button" @click="pilih(r)">Ya, pilih</button>
            <button class="btn btn-quiet btn-sm" type="button" @click="konfirmasi = ''">Tidak</button>
          </span>
          <button v-else class="btn btn-tag btn-sm" type="button" @click="konfirmasi = r.id">Pilih penerima</button>
        </div>
      </div>
    </StatusMuat>
  </div>
</template>
