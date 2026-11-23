<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import Ikon from "../components/Ikon.vue";
import KartuBarang from "../components/KartuBarang.vue";
import Paginasi from "../components/Paginasi.vue";
import StatusKosong from "../components/StatusKosong.vue";
import { api } from "../lib/api.js";
import { adalahPenjual, sesi } from "../lib/session.js";
import { useKategori } from "../composables/useKategori.js";

// jenisTetap = "gratis" untuk halaman Give It Forward.
const props = defineProps({ jenisTetap: { type: String, default: "" } });
const route = useRoute();
const router = useRouter();
const { data: kat } = useKategori();

const daftar = ref([]);
const meta = ref(null);
const memuat = ref(true);
const galat = ref("");
const q = ref(String(route.query.q || ""));
let timer = null;

const filter = computed(() => ({
  q: String(route.query.q || ""),
  kategori: String(route.query.kategori || ""),
  grade: String(route.query.grade || ""),
  jenis: props.jenisTetap || String(route.query.jenis || ""),
  urut: String(route.query.urut || "baru"),
  page: Number(route.query.page) || 1,
}));

async function muat() {
  memuat.value = true;
  galat.value = "";
  try {
    const f = filter.value;
    const r = await api("/barang", { query: { q: f.q, kategori: f.kategori, grade: f.grade, jenis: f.jenis, urut: f.urut, page: f.page, limit: 8 } });
    daftar.value = r.data;
    meta.value = r.meta;
  } catch (e) {
    galat.value = e.message;
  } finally {
    memuat.value = false;
  }
}
watch(filter, muat, { immediate: true });

function ubah(perubahan) {
  const query = { ...route.query, ...perubahan };
  for (const k of Object.keys(query)) if (query[k] === "" || query[k] === undefined || query[k] === null) delete query[k];
  if (!("page" in perubahan)) delete query.page;
  router.replace({ query });
}
watch(q, (v) => {
  clearTimeout(timer);
  timer = setTimeout(() => ubah({ q: v.trim() }), 300);
});
onBeforeUnmount(() => clearTimeout(timer));
const reset = () => {
  q.value = "";
  router.replace({ query: {} });
};
const gratisHalaman = computed(() => props.jenisTetap === "gratis");
</script>

<template>
  <section class="container">
    <div class="page-head">
      <div>
        <p v-if="gratisHalaman" class="eyebrow"><Ikon nama="gift" />Give It Forward</p>
        <p v-else class="eyebrow">Jelajah</p>
        <h1 style="font-size: clamp(2rem, 4vw, 3rem); margin-top: 8px">
          {{ gratisHalaman ? "Barang gratis dari orang yang pernah memakainya" : "Barang preloved dengan kondisi jelas" }}
        </h1>
        <p class="muted">
          {{ gratisHalaman ? "Ajukan permintaan dengan alasan singkat. Pemberi memilih satu penerima. Penerima biasanya menanggung ongkir atau mengambil sendiri." : "Baca kartu kondisinya dulu, baru putuskan." }}
        </p>
      </div>
      <template v-if="gratisHalaman">
        <RouterLink v-if="adalahPenjual()" class="btn btn-tag" :to="{ path: '/toko/barang/baru', query: { jenis: 'gratis' } }"><Ikon nama="gift" />Beri barang gratis</RouterLink>
        <RouterLink v-else-if="!sesi.pengguna" class="btn btn-2" to="/daftar-penjual">Saya ingin memberi</RouterLink>
      </template>
    </div>

    <div class="toolbar">
      <div class="toolbar-row">
        <div class="search">
          <label class="sr-only" for="q">Cari barang</label>
          <Ikon nama="search" />
          <input id="q" v-model="q" type="search" placeholder="Cari nama barang atau toko" />
        </div>
        <div>
          <label class="sr-only" for="f-grade">Kondisi</label>
          <select id="f-grade" :value="filter.grade" @change="ubah({ grade: $event.target.value })">
            <option value="">Semua kondisi</option>
            <option v-for="g in kat?.grade || []" :key="g.nilai" :value="g.nilai">{{ g.nilai }}</option>
          </select>
        </div>
        <div v-if="!gratisHalaman">
          <label class="sr-only" for="f-jenis">Jenis</label>
          <select id="f-jenis" :value="filter.jenis" @change="ubah({ jenis: $event.target.value })">
            <option value="">Dijual dan gratis</option>
            <option value="jual">Dijual</option>
            <option value="gratis">Gratis</option>
          </select>
        </div>
        <div>
          <label class="sr-only" for="f-urut">Urutkan</label>
          <select id="f-urut" :value="filter.urut" @change="ubah({ urut: $event.target.value })">
            <option value="baru">Terbaru</option>
            <option value="murah">Harga terendah</option>
            <option value="mahal">Harga tertinggi</option>
            <option value="hemat">Hemat terbanyak</option>
          </select>
        </div>
      </div>
      <div class="chips" role="group" aria-label="Kategori">
        <button type="button" class="chip" :aria-pressed="!filter.kategori" @click="ubah({ kategori: '' })">Semua</button>
        <button v-for="k in kat?.kategori || []" :key="k.kode" type="button" class="chip" :aria-pressed="filter.kategori === k.kode" @click="ubah({ kategori: k.kode })">{{ k.label }}</button>
      </div>
    </div>

    <div aria-live="polite">
      <div v-if="memuat" class="loading" role="status">Memuat barang…</div>
      <StatusKosong v-else-if="galat" ikon="alert" judul="Barang tidak dapat dimuat" :pesan="galat">
        <button class="btn btn-2" type="button" @click="muat">Coba lagi</button>
      </StatusKosong>
      <template v-else>
        <div class="result-line"><span>{{ meta?.jumlah ?? 0 }} barang ditemukan</span></div>
        <StatusKosong v-if="!daftar.length" ikon="search" judul="Belum ada barang yang cocok" pesan="Coba kata kunci lain atau hapus filter.">
          <button class="btn btn-2" type="button" @click="reset">Tampilkan semua</button>
        </StatusKosong>
        <template v-else>
          <div class="catalog"><KartuBarang v-for="b in daftar" :key="b.id" :barang="b" /></div>
          <Paginasi :meta="meta" @ubah="(p) => ubah({ page: p })" />
        </template>
      </template>
    </div>
  </section>
</template>
