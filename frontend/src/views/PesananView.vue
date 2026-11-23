<script setup>
import { ref, watch } from "vue";
import { RouterLink } from "vue-router";
import Ikon from "../components/Ikon.vue";
import Paginasi from "../components/Paginasi.vue";
import StatusKosong from "../components/StatusKosong.vue";
import StatusMuat from "../components/StatusMuat.vue";
import VisualBarang from "../components/VisualBarang.vue";
import { api } from "../lib/api.js";
import { KELAS_STATUS, STATUS_PESANAN, rp, tgl } from "../lib/format.js";
import { adalahPenjual } from "../lib/session.js";
import { useMuat } from "../composables/useMuat.js";

const tab = ref("semua");
const page = ref(1);
const daftar = ref([]);
const meta = ref(null);
const TAB = [["semua", "Semua"], ["berjalan", "Berjalan"], ["selesai", "Selesai"], ["batal", "Dibatalkan"]];

const { memuat, galat, jalankan } = useMuat(async () => {
  const r = await api("/pesanan", { query: { status: tab.value, page: page.value, limit: 8 } });
  daftar.value = r.data;
  meta.value = r.meta;
});
watch([tab, page], jalankan, { immediate: true });
const pilihTab = (t) => {
  page.value = 1;
  tab.value = t;
};
const pad = (n) => String(n).padStart(4, "0");
</script>

<template>
  <div class="container">
    <div class="page-head">
      <div>
        <p class="eyebrow">Pesanan</p>
        <h1 style="font-size: clamp(2rem, 4vw, 3rem); margin-top: 8px">{{ adalahPenjual() ? "Pesanan masuk" : "Pesanan saya" }}</h1>
        <p class="muted">{{ adalahPenjual() ? "Terima, siapkan, dan pantau pesanan dari pembeli." : "Pantau status pesanan dan konfirmasi kondisi barang saat diterima." }}</p>
      </div>
      <RouterLink v-if="!adalahPenjual()" class="btn btn-2 btn-sm" to="/permintaan-saya"><Ikon nama="gift" />Permintaan saya</RouterLink>
      <RouterLink v-else class="btn btn-2 btn-sm" to="/toko/permintaan"><Ikon nama="gift" />Permintaan masuk</RouterLink>
    </div>

    <div class="tabbar" role="group" aria-label="Filter status">
      <button v-for="t in TAB" :key="t[0]" type="button" class="chip" :aria-pressed="tab === t[0]" @click="pilihTab(t[0])">{{ t[1] }}</button>
    </div>

    <StatusMuat :memuat="memuat" :galat="galat" @ulang="jalankan">
      <StatusKosong v-if="!daftar.length" ikon="bag" judul="Belum ada pesanan di sini" pesan="Pesanan akan muncul sesuai status.">
        <RouterLink v-if="!adalahPenjual()" class="btn" to="/jelajah">Jelajahi barang</RouterLink>
      </StatusKosong>
      <template v-else>
        <div class="orders">
          <article v-for="o in daftar" :key="o.id" class="order">
            <div class="order-top"><span :class="KELAS_STATUS[o.status]">{{ STATUS_PESANAN[o.status] }}</span><span class="note-small">#{{ pad(o.id) }}</span></div>
            <div class="thumb-s"><VisualBarang :barang="{ id: o.barangId, jenis: o.jenis, kategori: o.kategori, jenisNama: o.namaBarang, nama: o.namaBarang, adaFoto: o.adaFoto }" /></div>
            <h2 style="font-size: 1.05rem">{{ o.namaBarang }}</h2>
            <p class="meta note-small"><Ikon nama="user" />{{ adalahPenjual() ? "Pembeli" : "Penjual" }}: {{ o.pihak }}</p>
            <div class="val"><span class="note-small">{{ o.metodeSerah === "kurir" ? "Kurir" : "Ketemuan" }} · {{ tgl(o.dibuatPada) }}</span><b>{{ rp(o.harga) }}</b></div>
            <RouterLink class="btn btn-2 btn-sm btn-wide" :to="`/pesanan/${o.id}`">{{ adalahPenjual() ? "Kelola pesanan" : "Lihat detail" }}<Ikon nama="arrow" /></RouterLink>
          </article>
        </div>
        <Paginasi :meta="meta" @ubah="(p) => (page = p)" />
      </template>
    </StatusMuat>
  </div>
</template>
