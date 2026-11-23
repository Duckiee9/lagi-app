import { ref } from "vue";

// Jalankan fungsi async dan lacak keadaan muat/galat.
export function useMuat(fn) {
  const memuat = ref(true);
  const galat = ref("");
  const jalankan = async (...args) => {
    memuat.value = true;
    galat.value = "";
    try {
      return await fn(...args);
    } catch (e) {
      galat.value = e.message || "Terjadi kesalahan.";
      return undefined;
    } finally {
      memuat.value = false;
    }
  };
  return { memuat, galat, jalankan };
}
