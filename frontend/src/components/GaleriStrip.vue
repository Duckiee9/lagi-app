<script setup>
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import Ikon from "./Ikon.vue";
import VisualBarang from "./VisualBarang.vue";
import { ambil } from "../lib/api.js";
import { rp } from "../lib/format.js";

const barang = ref([]);
const jalur = ref(null);

onMounted(async () => {
  try {
    barang.value = await ambil("/barang", { limit: 10, urut: "baru" });
  } catch {
    barang.value = [];
  }
});

const geser = (arah) => jalur.value?.scrollBy({ left: arah * Math.max(240, jalur.value.clientWidth * 0.7), behavior: "smooth" });
</script>

<template>
  <section v-if="barang.length" class="strip-wrap" aria-label="Galeri barang terbaru">
    <div ref="jalur" class="strip-track">
      <RouterLink v-for="b in barang" :key="b.id" class="strip-tile" :to="`/barang/${b.id}`">
        <VisualBarang :barang="b" />
        <span class="strip-cap"><b>{{ b.nama }}</b>{{ b.jenisTransaksi === "gratis" ? "Gratis" : rp(b.hargaJual) }}</span>
      </RouterLink>
    </div>
    <button class="strip-arrow l" type="button" aria-label="Geser galeri ke kiri" @click="geser(-1)"><Ikon nama="left" /></button>
    <button class="strip-arrow r" type="button" aria-label="Geser galeri ke kanan" @click="geser(1)"><Ikon nama="right" /></button>
  </section>
</template>
