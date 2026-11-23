<script setup>
import { computed } from "vue";
import { svgIlustrasi } from "../lib/ilustrasi.js";
import { urlFoto } from "../lib/api.js";

// Foto barang bila ada; bila tidak, ilustrasi berdasarkan jenis barang.
const props = defineProps({
  barang: { type: Object, required: true },
  polos: { type: Boolean, default: false },
  lokal: { type: String, default: "" }, // data URL untuk pratinjau sebelum disimpan
});

const svg = computed(() =>
  svgIlustrasi({ id: props.barang.id, jenis: props.barang.jenis, kategori: props.barang.kategori, label: props.barang.jenisNama }, props.polos),
);
const sumber = computed(() => props.lokal || (props.barang.adaFoto && props.barang.id ? urlFoto(props.barang.id) : ""));
</script>

<template>
  <img v-if="sumber" :src="sumber" :alt="`Foto ${barang.nama}`" loading="lazy" />
  <span v-else class="ilu" style="display: contents" v-html="svg"></span>
</template>
