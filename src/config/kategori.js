// Skema Honest Condition Card per kategori.
// Setiap isian: kunci, label, tipe (teks | pilihan | angka). Tingkat: 0 baik, 1 ada catatan, 2 cacat berarti.
const p = (...pasangan) => pasangan.map(([nilai, tingkat]) => ({ nilai, tingkat }));

export const KATEGORI = {
  fashion: {
    label: 'Fashion',
    kolom: [
      { kunci: 'ukuran', label: 'Ukuran', tipe: 'teks', placeholder: 'Contoh: M, 42, All size' },
      { kunci: 'pemakaian', label: 'Tingkat pemakaian', tipe: 'pilihan', pilihan: p(['Belum pernah dipakai', 0], ['Dipakai 1–5 kali', 0], ['Sering dipakai', 1], ['Dipakai harian', 1]) },
      { kunci: 'noda', label: 'Noda', tipe: 'pilihan', pilihan: p(['Tidak ada', 0], ['Samar', 1], ['Terlihat jelas', 2]) },
      { kunci: 'jahitan', label: 'Jahitan, kancing, resleting', tipe: 'pilihan', pilihan: p(['Utuh', 0], ['Ada yang longgar', 1], ['Perlu diperbaiki', 2]) },
      { kunci: 'bau', label: 'Bau', tipe: 'pilihan', pilihan: p(['Netral atau wangi', 0], ['Apek tipis', 1], ['Perlu dicuci ulang', 1]) },
    ],
  },
  elektronik: {
    label: 'Elektronik',
    kolom: [
      { kunci: 'baterai', label: 'Kesehatan baterai (%)', tipe: 'angka', placeholder: 'Contoh: 86', min: 1, max: 100, ambang: [90, 80] },
      { kunci: 'layar', label: 'Layar dan bodi', tipe: 'pilihan', pilihan: p(['Mulus', 0], ['Goresan halus', 1], ['Retak atau penyok', 2]) },
      { kunci: 'fungsi', label: 'Fungsi', tipe: 'pilihan', pilihan: p(['Semua berfungsi normal', 0], ['Ada fungsi bermasalah', 2]) },
      { kunci: 'kelengkapan', label: 'Kelengkapan', tipe: 'pilihan', pilihan: p(['Fullset dengan dus', 0], ['Unit + charger atau kabel', 0], ['Unit saja', 1]) },
      { kunci: 'servis', label: 'Riwayat servis', tipe: 'pilihan', pilihan: p(['Belum pernah diservis', 0], ['Pernah diservis resmi', 0], ['Pernah diservis non-resmi', 1]) },
      { kunci: 'garansi', label: 'Garansi', tipe: 'pilihan', pilihan: p(['Masih aktif', 0], ['Sudah habis', 0], ['Tidak ada', 0]) },
    ],
  },
  lifestyle: {
    label: 'Lifestyle',
    kolom: [
      { kunci: 'kelengkapan', label: 'Kelengkapan', tipe: 'pilihan', pilihan: p(['Lengkap', 0], ['Ada bagian yang hilang', 2]) },
      { kunci: 'tanda', label: 'Tanda pemakaian', tipe: 'pilihan', pilihan: p(['Hampir tidak ada', 0], ['Lecet atau goresan ringan', 1], ['Lecet jelas', 2]) },
      { kunci: 'fungsi', label: 'Fungsi', tipe: 'pilihan', pilihan: p(['Berfungsi normal', 0], ['Berfungsi dengan catatan', 1], ['Tidak berfungsi sempurna', 2]) },
    ],
  },
  buku: {
    label: 'Buku',
    kolom: [
      { kunci: 'isi', label: 'Isi paket', tipe: 'teks', placeholder: 'Contoh: 1 buku, 4 jilid' },
      { kunci: 'halaman', label: 'Halaman', tipe: 'pilihan', pilihan: p(['Bersih', 0], ['Menguning tipis', 1], ['Ada coretan atau lipatan', 2]) },
      { kunci: 'sampul', label: 'Sampul', tipe: 'pilihan', pilihan: p(['Mulus', 0], ['Ada lipatan', 1], ['Sobek', 2]) },
      { kunci: 'kelengkapan', label: 'Kelengkapan halaman', tipe: 'pilihan', pilihan: p(['Lengkap', 0], ['Ada halaman lepas', 2]) },
    ],
  },
};

export const GRADE = [
  { nilai: 'Seperti Baru', keterangan: 'Nyaris tanpa tanda pemakaian.' },
  { nilai: 'Baik', keterangan: 'Ada tanda pemakaian ringan, semua fungsi aman.' },
  { nilai: 'Layak Pakai', keterangan: 'Ada cacat yang terlihat, harga menyesuaikan.' },
];

export const PERINGKAT_GRADE = { 'Seperti Baru': 0, Baik: 1, 'Layak Pakai': 2 };
export const NAMA_GRADE = Object.keys(PERINGKAT_GRADE);
