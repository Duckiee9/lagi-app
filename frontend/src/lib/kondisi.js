// Logika kartu kondisi di sisi klien. Server tetap memvalidasi ulang.
export function tingkatIsian(kolom, nilai) {
  if (nilai === "" || nilai === undefined || nilai === null) return null;
  if (kolom.tipe === "pilihan") return kolom.pilihan.find((o) => o.nilai === nilai)?.tingkat ?? null;
  if (kolom.tipe === "angka") {
    const n = Number(nilai);
    if (!Number.isFinite(n)) return null;
    return n >= kolom.ambang[0] ? 0 : n >= kolom.ambang[1] ? 1 : 2;
  }
  return null;
}

export const kondisiLengkap = (kolom, kondisi) => kolom.every((k) => String(kondisi[k.kunci] ?? "").trim() !== "");

export function tingkatMaks(kolom, kondisi) {
  return kolom.reduce((m, k) => Math.max(m, tingkatIsian(k, kondisi[k.kunci]) ?? 0), 0);
}

export const gradeDisarankan = (maks) => (maks >= 2 ? "Layak Pakai" : maks === 1 ? "Baik" : "Seperti Baru");
export const URUTAN_GRADE = ["Seperti Baru", "Baik", "Layak Pakai"];
export const gradeTerlaluTinggi = (grade, saran) => URUTAN_GRADE.indexOf(grade) < URUTAN_GRADE.indexOf(saran);
export const cacatWajib = (grade, maks) => grade !== "Seperti Baru" || maks >= 1;
