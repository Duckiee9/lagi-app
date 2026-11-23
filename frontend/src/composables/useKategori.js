import { ref } from "vue";
import { ambil } from "../lib/api.js";

// Skema kategori dan grade dimuat sekali lalu dipakai bersama.
const data = ref(null);
let janji = null;

export function muatKategori() {
  if (!janji) {
    janji = ambil("/kategori")
      .then((d) => {
        data.value = d;
        return d;
      })
      .catch((e) => {
        janji = null;
        throw e;
      });
  }
  return janji;
}

export function useKategori() {
  muatKategori().catch(() => {});
  const cari = (kode) => data.value?.kategori.find((k) => k.kode === kode) || null;
  return { data, cari };
}
