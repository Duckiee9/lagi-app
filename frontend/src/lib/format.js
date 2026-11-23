export const rp = (n) => (Number(n) === 0 ? "Gratis" : "Rp" + Math.round(Number(n)).toLocaleString("id-ID"));
export const rp0 = (n) => "Rp" + Math.round(Number(n) || 0).toLocaleString("id-ID");
export const num = (n, d = 0) => Number(n).toLocaleString("id-ID", { maximumFractionDigits: d });
export const tgl = (t) => new Date(t).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
export const waktu = (t) => new Date(t).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
export const inisial = (s) => (s || "?").trim().slice(0, 1).toUpperCase();
export const kodeBarang = (id) => "LAGI-" + String(id).padStart(4, "0");
export const hemat = (jual, baru) => Math.max(0, Number(baru) - Number(jual));
export const persenHemat = (jual, baru) => (Number(baru) ? Math.round((hemat(jual, baru) / Number(baru)) * 100) : 0);

export const STATUS_PESANAN = {
  "menunggu-konfirmasi": "Menunggu konfirmasi",
  dikonfirmasi: "Diterima penjual",
  siap: "Siap diambil atau dikirim",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
  ditolak: "Ditolak penjual",
};
export const KELAS_STATUS = {
  "menunggu-konfirmasi": "pill ok",
  dikonfirmasi: "pill",
  siap: "pill tag",
  selesai: "pill good",
  dibatalkan: "pill bad",
  ditolak: "pill bad",
};
export const STATUS_BARANG = {
  draf: ["Draf", "pill"],
  aktif: ["Tayang", "pill good"],
  dipesan: ["Sedang dipesan", "pill ok"],
  terjual: ["Terjual", "pill"],
  diberikan: ["Diberikan", "pill"],
};
export const KELAS_GRADE = { "Seperti Baru": "good", Baik: "ok", "Layak Pakai": "bad" };
