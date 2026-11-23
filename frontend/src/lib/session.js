import { reactive } from "vue";
import { ambil, ambilToken, api, pasangPenangkal401, simpanToken } from "./api.js";

// Store sesi sederhana tanpa Pinia.
export const sesi = reactive({
  pengguna: null,
  siap: false,
});

export const adalahPembeli = () => sesi.pengguna?.peran === "pembeli";
export const adalahPenjual = () => sesi.pengguna?.peran === "penjual";
export const penjualTerverifikasi = () => adalahPenjual() && sesi.pengguna.statusVerifikasi === "terverifikasi";

export function setPengguna(p) {
  sesi.pengguna = p;
}

pasangPenangkal401(() => {
  simpanToken(null);
  sesi.pengguna = null;
});

let janji = null;
// Pulihkan sesi dari token tersimpan. Aman dipanggil berulang.
export function muatSesi() {
  if (!janji) {
    janji = (async () => {
      if (ambilToken()) {
        try {
          sesi.pengguna = await ambil("/auth/saya");
        } catch {
          simpanToken(null);
          sesi.pengguna = null;
        }
      }
      sesi.siap = true;
    })();
  }
  return janji;
}

export async function masuk(email, kataSandi) {
  const { data } = await api("/auth/login", { method: "POST", body: { email, kataSandi } });
  simpanToken(data.accessToken);
  sesi.pengguna = data.pengguna;
  return data.pengguna;
}

export async function keluar() {
  try {
    await api("/auth/logout", { method: "POST", body: {} });
  } catch {
    /* tetap keluar di sisi klien */
  }
  simpanToken(null);
  sesi.pengguna = null;
}
