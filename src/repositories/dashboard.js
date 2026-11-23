import { pool } from '../db/pool.js';

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

// cakupan: { kolom: 'o.pembeli_id' | 'o.toko_id' | null, nilai }
export async function ambil(cakupan) {
  const p = cakupan.kolom ? [cakupan.nilai] : [];
  const f = cakupan.kolom ? `AND ${cakupan.kolom} = $1` : '';

  const [ring, st, bln, kat] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS berpindah,
              COUNT(*) FILTER (WHERE o.harga_saat_pesan > 0)::int AS dijual,
              COUNT(*) FILTER (WHERE o.harga_saat_pesan = 0)::int AS digratiskan,
              COALESCE(SUM(o.harga_saat_pesan), 0) AS uang,
              COALESCE(SUM(o.harga_baru_saat_pesan - o.harga_saat_pesan), 0) AS hemat,
              COALESCE(SUM(o.harga_baru_saat_pesan), 0) AS nilai,
              COALESCE(SUM(jb.berat_kg), 0) AS berat,
              COALESCE(SUM(jb.emisi_kg_co2e), 0) AS emisi,
              COUNT(*) FILTER (WHERE o.kesesuaian IS NOT NULL)::int AS dinilai,
              COUNT(*) FILTER (WHERE o.kesesuaian = 'sesuai')::int AS sesuai
         FROM pesanan o JOIN barang b ON b.id = o.barang_id JOIN jenis_barang jb ON jb.id = b.jenis_barang_id
        WHERE o.status = 'selesai' ${f}`, p),
    pool.query(
      `SELECT COUNT(*) FILTER (WHERE o.status = 'menunggu-konfirmasi')::int AS menunggu,
              COUNT(*) FILTER (WHERE o.status = 'dikonfirmasi')::int AS dikonfirmasi,
              COUNT(*) FILTER (WHERE o.status = 'siap')::int AS siap,
              COUNT(*) FILTER (WHERE o.status = 'selesai')::int AS selesai,
              COUNT(*) FILTER (WHERE o.status IN ('dibatalkan', 'ditolak'))::int AS batal
         FROM pesanan o WHERE TRUE ${f}`, p),
    pool.query(
      `SELECT to_char(m, 'YYYY-MM') AS bulan, EXTRACT(MONTH FROM m)::int AS no,
              COUNT(o.id) FILTER (WHERE o.harga_saat_pesan > 0)::int AS dijual,
              COUNT(o.id) FILTER (WHERE o.harga_saat_pesan = 0)::int AS digratiskan
         FROM generate_series(date_trunc('month', CURRENT_DATE) - interval '5 months', date_trunc('month', CURRENT_DATE), interval '1 month') m
         LEFT JOIN pesanan o ON o.status = 'selesai' AND date_trunc('month', o.selesai_pada) = m ${f}
        GROUP BY m ORDER BY m`, p),
    pool.query(
      `SELECT jb.kategori, COUNT(*)::int AS jumlah
         FROM pesanan o JOIN barang b ON b.id = o.barang_id JOIN jenis_barang jb ON jb.id = b.jenis_barang_id
        WHERE o.status = 'selesai' ${f} GROUP BY jb.kategori ORDER BY jumlah DESC, jb.kategori`, p),
  ]);

  const r = ring.rows[0];
  return {
    ring: {
      berpindah: r.berpindah, dijual: r.dijual, digratiskan: r.digratiskan, uang: Number(r.uang),
      hemat: Number(r.hemat), nilai: Number(r.nilai), berat: Number(r.berat), emisi: Number(r.emisi),
      dinilai: r.dinilai, sesuai: r.sesuai,
    },
    status: st.rows[0],
    perBulan: bln.rows.map((x) => ({ bulan: x.bulan, label: BULAN[x.no - 1], dijual: x.dijual, digratiskan: x.digratiskan })),
    perKategori: kat.rows,
  };
}
