<script setup>
import { computed } from "vue";
import { RouterLink } from "vue-router";
import Ikon from "./Ikon.vue";
import BadgeGrade from "./BadgeGrade.vue";
import VisualBarang from "./VisualBarang.vue";
import { persenHemat, rp } from "../lib/format.js";
import { vMuncul } from "../lib/muncul.js";

const props = defineProps({ barang: { type: Object, required: true } });
const b = computed(() => props.barang);
const mati = computed(() => b.value.status !== "aktif");
const labelStatus = computed(() => ({ dipesan: "Sedang dipesan", draf: "Draf", terjual: "Terjual", diberikan: "Diberikan" })[b.value.status] || "");
const gratis = computed(() => b.value.jenisTransaksi === "gratis");
</script>

<template>
  <!-- Pembungkus yang dianimasikan; hover tetap ditangani CSS pada .kartu supaya transform-nya tidak bentrok. -->
  <div v-muncul class="kartu-wrap">
    <article class="kartu" :class="{ mati }">
      <RouterLink class="kartu-vis" :to="`/barang/${b.id}`" tabindex="-1" aria-hidden="true">
        <VisualBarang :barang="b" />
        <BadgeGrade :grade="b.grade" />
        <span v-if="gratis" class="pill tag">Give It Forward</span>
        <span v-else-if="mati" class="pill tag">{{ labelStatus }}</span>
        <span v-if="!b.adaFoto" class="art-label">Ilustrasi</span>
      </RouterLink>
      <div class="kartu-body">
        <div class="kartu-top"><span>{{ b.jenisNama }}</span><span>{{ b.kota }}</span></div>
        <h3><RouterLink :to="`/barang/${b.id}`">{{ b.nama }}</RouterLink></h3>
        <p class="meta"><Ikon nama="store" />{{ b.namaToko }}</p>
        <div class="harga">
          <b v-if="gratis" class="gratis">Gratis</b>
          <b v-else>{{ rp(b.hargaJual) }}</b>
          <s>{{ rp(b.hargaBaru) }}<span class="sr-only"> harga barang baru</span></s>
        </div>
        <p class="hemat">
          {{ gratis ? `Menyelamatkan barang senilai ${rp(b.hargaBaru)}` : `Hemat ${persenHemat(b.hargaJual, b.hargaBaru)}% dari harga baru` }}
        </p>
      </div>
    </article>
  </div>
</template>
