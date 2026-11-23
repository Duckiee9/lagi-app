<script setup>
import { computed } from "vue";
import Ikon from "./Ikon.vue";
import { urlFotoCacat } from "../lib/api.js";
import { kodeBarang, tgl } from "../lib/format.js";
import { useKategori } from "../composables/useKategori.js";

// Honest Condition Card. Menerima detail barang dari API, atau draf dari form (pratinjau).
const props = defineProps({
  barang: { type: Object, required: true },
  ringkas: { type: Boolean, default: false },
  tampilan: { type: String, default: "" }, // data URL gambar untuk bagian atas kartu (opsional)
});

const { cari } = useKategori();
const kat = computed(() => cari(props.barang.kategori));
const baris = computed(() => (props.ringkas ? props.barang.kondisi.slice(0, 4) : props.barang.kondisi));
const label = ["Baik", "Ada catatan", "Cacat berarti"];
const nilaiTampil = (r) => {
  if (r.nilai === "" || r.nilai == null) return "Belum diisi";
  const k = kat.value?.kolom.find((x) => x.kunci === r.kunci);
  return k?.tipe === "angka" ? `${r.nilai}%` : r.nilai;
};
const skor = computed(() => props.barang.toko?.skor ?? null);
const fotoCacat = (c) => c.fotoLokal || (c.adaFoto && c.id && props.barang.id ? urlFotoCacat(props.barang.id, c.id) : "");
</script>

<template>
  <section class="hcc" aria-label="Honest Condition Card">
    <div class="hcc-head">
      <div class="ttl">Honest Condition Card<b>{{ barang.jenisNama }} · {{ kat?.label || "" }}</b></div>
      <span class="hcc-grade">{{ barang.grade || "Belum dipilih" }}</span>
    </div>
    <div v-if="$slots.visual" class="hcc-vis"><slot name="visual" /></div>
    <hr class="hcc-perf" />
    <div class="hcc-body">
      <dl style="margin: 0">
        <div v-for="r in baris" :key="r.kunci" class="hcc-row">
          <dt>{{ r.label }}</dt>
          <dd>{{ nilaiTampil(r) }}</dd>
          <span v-if="r.tingkat !== null && r.tingkat !== undefined" class="sev" :class="`s${r.tingkat}`" role="img" :aria-label="label[r.tingkat]" :title="label[r.tingkat]"></span>
          <span v-else class="sev s-1" aria-hidden="true"></span>
        </div>
      </dl>
      <template v-if="!ringkas">
        <div v-if="barang.catatan" class="hcc-notes"><b>Catatan penjual</b>{{ barang.catatan }}</div>
        <div v-if="barang.cacat?.length" class="defects">
          <figure v-for="(c, i) in barang.cacat" :key="c.id || i" class="defect" style="margin: 0">
            <img v-if="fotoCacat(c)" :src="fotoCacat(c)" :alt="`Foto cacat: ${c.label}`" loading="lazy" />
            <div v-else class="dv"><Ikon nama="camera" /></div>
            <span>{{ c.label }}{{ fotoCacat(c) ? "" : " (tanpa foto)" }}</span>
          </figure>
        </div>
      </template>
    </div>
    <div v-if="!ringkas" class="hcc-foot">
      <span>{{ barang.id ? kodeBarang(barang.id) : "Pratinjau" }}</span>
      <span v-if="barang.dibuatPada">Diisi penjual {{ tgl(barang.dibuatPada) }}</span>
      <span v-if="skor"><b>{{ skor.persen }}%</b> pembeli menyatakan sesuai ({{ skor.jumlah }} pesanan)</span>
      <span v-else>Belum ada konfirmasi pembeli</span>
    </div>
  </section>
</template>
