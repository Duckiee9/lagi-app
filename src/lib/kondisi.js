import { KATEGORI, PERINGKAT_GRADE, NAMA_GRADE } from '../config/kategori.js';
import { galat } from './api.js';

export function tingkatAngka(kolom, nilai) {
  const [a, b] = kolom.ambang;
  return nilai >= a ? 0 : nilai >= b ? 1 : 2;
}

// Tingkat satu isian; null untuk isian teks.
export function tingkatIsian(kolom, nilai) {
  if (kolom.tipe === 'pilihan') return kolom.pilihan.find((o) => o.nilai === nilai)?.tingkat ?? null;
  if (kolom.tipe === 'angka') return tingkatAngka(kolom, Number(nilai));
  return null;
}

// Validasi dan bersihkan isian kondisi sesuai skema kategori.
export function validasiKondisi(kategori, masukan) {
  const skema = KATEGORI[kategori];
  if (!skema) throw galat.validasi('Kategori tidak dikenal.');
  if (masukan === null || typeof masukan !== 'object' || Array.isArray(masukan)) {
    throw galat.validasi('Kondisi barang harus berupa objek.');
  }
  const hasil = {};
  let maks = 0;
  for (const k of skema.kolom) {
    const mentah = masukan[k.kunci];
    if (mentah === undefined || mentah === null || String(mentah).trim() === '') {
      throw galat.validasi(`${k.label} wajib diisi pada kartu kondisi.`);
    }
    if (k.tipe === 'teks') {
      const t = String(mentah).trim().replace(/\s+/g, ' ');
      if (t.length > 60) throw galat.validasi(`${k.label} maksimal 60 karakter.`);
      hasil[k.kunci] = t;
    } else if (k.tipe === 'angka') {
      const n = Number(mentah);
      if (!Number.isInteger(n) || n < k.min || n > k.max) {
        throw galat.validasi(`${k.label} harus bilangan bulat ${k.min}–${k.max}.`);
      }
      hasil[k.kunci] = String(n);
      maks = Math.max(maks, tingkatAngka(k, n));
    } else {
      const opsi = k.pilihan.find((o) => o.nilai === mentah);
      if (!opsi) throw galat.validasi(`Pilihan "${k.label}" tidak valid.`);
      hasil[k.kunci] = opsi.nilai;
      maks = Math.max(maks, opsi.tingkat);
    }
  }
  return { kondisi: hasil, tingkatMaks: maks };
}

export function gradeDisarankan(tingkatMaks) {
  return tingkatMaks >= 2 ? 'Layak Pakai' : tingkatMaks === 1 ? 'Baik' : 'Seperti Baru';
}

// Grade tidak boleh lebih tinggi dari yang disarankan isian kartu.
export function validasiGrade(grade, tingkatMaks) {
  if (!NAMA_GRADE.includes(grade)) throw galat.validasi('Grade tidak valid.');
  const saran = gradeDisarankan(tingkatMaks);
  if (PERINGKAT_GRADE[grade] < PERINGKAT_GRADE[saran]) {
    throw galat.validasi(`Berdasarkan isian kondisi, grade minimal "${saran}". Grade "${grade}" terlalu tinggi.`);
  }
  return grade;
}

export const cacatWajib = (grade, tingkatMaks) => grade !== 'Seperti Baru' || tingkatMaks >= 1;

// Ubah JSON kondisi tersimpan menjadi daftar tampilan berurutan sesuai skema.
export function tampilKondisi(kategori, kondisi) {
  const skema = KATEGORI[kategori];
  if (!skema) return [];
  return skema.kolom.map((k) => {
    const nilai = kondisi?.[k.kunci] ?? '';
    return { kunci: k.kunci, label: k.label, nilai: String(nilai), tingkat: nilai === '' ? null : tingkatIsian(k, nilai) };
  });
}
