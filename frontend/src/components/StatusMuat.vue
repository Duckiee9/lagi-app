<script setup>
import StatusKosong from "./StatusKosong.vue";

// Menampilkan keadaan muat/galat untuk halaman yang mengambil data.
defineProps({ memuat: Boolean, galat: { type: String, default: "" } });
defineEmits(["ulang"]);
</script>

<template>
  <div v-if="memuat" class="loading" role="status">Memuat…</div>
  <StatusKosong v-else-if="galat" ikon="alert" judul="Tidak dapat menampilkan halaman" :pesan="galat">
    <button class="btn btn-2" type="button" @click="$emit('ulang')">Coba lagi</button>
  </StatusKosong>
  <slot v-else />
</template>
