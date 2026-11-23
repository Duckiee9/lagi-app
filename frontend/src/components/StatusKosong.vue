<script setup>
import Ikon from "./Ikon.vue";
defineProps({ ikon: { type: String, default: "info" }, judul: { type: String, required: true }, pesan: { type: String, default: "" } });
</script>

<template>
  <div class="empty">
    <span class="tile"><Ikon :nama="ikon" /></span>
    <h3>{{ judul }}</h3>
    <p v-if="pesan">{{ pesan }}</p>
    <slot />
  </div>
</template>
