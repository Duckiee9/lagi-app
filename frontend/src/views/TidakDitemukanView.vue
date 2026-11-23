<script setup>
import { RouterLink } from "vue-router";
import StatusKosong from "../components/StatusKosong.vue";
</script>

<template>
  <div class="container">
    <div class="auth" style="max-width: 560px">
      <StatusKosong ikon="info" judul="Halaman tidak ditemukan" pesan="Alamat yang Anda buka tidak ada atau sudah dipindahkan.">
        <RouterLink class="btn" to="/jelajah">Ke halaman Jelajah</RouterLink>
      </StatusKosong>
    </div>
  </div>
</template>
