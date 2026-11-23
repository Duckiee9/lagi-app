-- LAGI. — query inti yang dipakai backend. Jalankan dengan psql untuk memeriksa hasilnya.

-- 1. Katalog publik: barang tayang, bisa dicari dan difilter.
SELECT b.id, b.nama, jb.kategori, jb.nama AS jenis, b.jenis_transaksi, b.harga_jual, b.harga_baru, b.grade,
       t.nama_toko, t.kota, b.status
FROM barang b
JOIN toko t ON t.id = b.toko_id AND t.status_verifikasi = 'terverifikasi'
JOIN jenis_barang jb ON jb.id = b.jenis_barang_id
WHERE b.status IN ('aktif', 'dipesan')
  AND ('' = '' OR b.nama ILIKE '%' || '' || '%')
ORDER BY b.dibuat_pada DESC, b.id DESC
LIMIT 8 OFFSET 0;

-- 2. Skor kesesuaian kartu per toko.
SELECT t.nama_toko, s.jumlah, s.persen
FROM toko t LEFT JOIN v_skor_kesesuaian s ON s.toko_id = t.id
ORDER BY t.id;

-- 3. Impact Dashboard platform: barang berpindah tangan per bulan (6 bulan terakhir).
SELECT to_char(m.bulan, 'YYYY-MM') AS bulan,
       COUNT(p.id) FILTER (WHERE p.harga_saat_pesan > 0)::int AS dijual,
       COUNT(p.id) FILTER (WHERE p.harga_saat_pesan = 0)::int AS digratiskan
FROM generate_series(date_trunc('month', CURRENT_TIMESTAMP) - interval '5 months',
                     date_trunc('month', CURRENT_TIMESTAMP), interval '1 month') AS m(bulan)
LEFT JOIN pesanan p ON p.status = 'selesai' AND date_trunc('month', p.selesai_pada) = m.bulan
GROUP BY m.bulan ORDER BY m.bulan;

-- 4. Total dampak platform (limbah, CO2e, hemat) dari pesanan selesai.
SELECT COUNT(*)::int AS barang,
       ROUND(SUM(jb.berat_kg), 1) AS limbah_kg,
       ROUND(SUM(jb.emisi_kg_co2e), 1) AS co2e_kg,
       SUM(p.harga_baru_saat_pesan - p.harga_saat_pesan) AS hemat
FROM pesanan p
JOIN barang b ON b.id = p.barang_id
JOIN jenis_barang jb ON jb.id = b.jenis_barang_id
WHERE p.status = 'selesai';

-- 5. Ringkasan satu penjual (toko 1): pendapatan hanya dihitung dari pesanan selesai.
SELECT COUNT(*) FILTER (WHERE status = 'selesai')::int AS selesai,
       COUNT(*) FILTER (WHERE status IN ('menunggu-konfirmasi', 'dikonfirmasi', 'siap'))::int AS berjalan,
       COALESCE(SUM(harga_saat_pesan) FILTER (WHERE status = 'selesai'), 0) AS pendapatan
FROM pesanan WHERE toko_id = 1;
