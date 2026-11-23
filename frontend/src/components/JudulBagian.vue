<script setup>
defineProps({ sub: { type: String, default: "" }, judul: { type: String, required: true }, deskripsi: { type: String, default: "" } });
</script>

<template>
  <div class="sh">
    <p class="eyebrow">{{ sub }}</p>
    <h2>{{ judul }}<slot name="hl" /></h2>
    <svg class="leafd" viewBox="0 0 70 20" aria-hidden="true">
      <path d="M0 14h26M44 14h26" fill="none" stroke="currentColor" stroke-width="1.5" />
      <path d="M35 15c-7-2-7-10 0-13 7 3 7 11 0 13Z" fill="currentColor" />
    </svg>
    <p v-if="deskripsi" class="muted">{{ deskripsi }}</p>
  </div>
</template>
