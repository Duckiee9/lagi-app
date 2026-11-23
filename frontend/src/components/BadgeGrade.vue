<script setup>
import { KELAS_GRADE } from "../lib/format.js";
defineProps({ grade: { type: String, default: "" } });
</script>

<template>
  <span v-if="!grade" class="pill">Belum dinilai</span>
  <span v-else class="pill" :class="KELAS_GRADE[grade]"><span class="dot"></span>{{ grade }}</span>
</template>
