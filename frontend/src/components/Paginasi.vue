<script setup>
defineProps({ meta: { type: Object, default: null } });
defineEmits(["ubah"]);
</script>

<template>
  <nav v-if="meta && meta.totalPages > 1" class="pager" aria-label="Halaman">
    <button class="btn btn-2 btn-sm" type="button" :disabled="meta.page <= 1" @click="$emit('ubah', meta.page - 1)">Sebelumnya</button>
    <span>Halaman {{ meta.page }} dari {{ meta.totalPages }}</span>
    <button class="btn btn-2 btn-sm" type="button" :disabled="meta.page >= meta.totalPages" @click="$emit('ubah', meta.page + 1)">Berikutnya</button>
  </nav>
</template>
