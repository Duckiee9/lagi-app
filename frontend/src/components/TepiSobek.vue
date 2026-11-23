<script setup>
import { computed } from "vue";
import { jalurSobek } from "../lib/ilustrasi.js";

const props = defineProps({ seed: { type: Number, default: 3 }, balik: { type: Boolean, default: false } });
const d = computed(() => jalurSobek(props.seed));
</script>

<template>
  <svg class="torn" :class="{ flip: balik }" viewBox="0 0 1200 100" preserveAspectRatio="none" aria-hidden="true"><path :d="d" /></svg>
</template>
