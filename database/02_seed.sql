-- LAGI. — data contoh untuk pengembangan. Jalankan setelah 01_schema.sql.
-- Kata sandi akun contoh diisi oleh: npm run db:sandi-demo (hash bcrypt dibuat di Node).
BEGIN;

INSERT INTO pengguna (nama_lengkap, email, peran) VALUES
  ('Sari Wulandari',  'sari@lagi.test',   'pembeli'),
  ('Andi Firmansyah', 'andi@lagi.test',   'pembeli'),
  ('Rina Marlina',    'rina@lagi.test',   'pembeli'),
  ('Rangga Pratama',  'toko@lagi.test',   'penjual'),
  ('Dewi Anggraini',  'gadget@lagi.test', 'penjual'),
  ('Yoga Saputra',    'rumah@lagi.test',  'penjual'),
  ('Maya Anggraeni',  'maya@lagi.test',   'penjual'),
  ('Bagas Nugroho',   'baru@lagi.test',   'penjual');

INSERT INTO toko (pengguna_id, nama_toko, kota, bio, nomor_telepon, status_verifikasi)
SELECT u.id, v.nama, v.kota, v.bio, v.telp, v.st
FROM (VALUES
  ('toko@lagi.test',   'Thrift Kita',   'Bandung',         'Pakaian dan buku pilihan. Semua sudah dicuci dan dicek ulang sebelum dikirim.', '081200000001', 'terverifikasi'),
  ('gadget@lagi.test', 'Gadget Kedua',  'Jakarta Selatan', 'Elektronik bekas yang sudah diuji. Kondisi ditulis apa adanya.',               '081200000002', 'terverifikasi'),
  ('rumah@lagi.test',  'Rumah Kedua',   'Yogyakarta',      'Perabot kecil, alat olahraga, dan barang rumah tangga.',                       '081200000003', 'terverifikasi'),
  ('maya@lagi.test',   'Maya Berbagi',  'Surabaya',        'Pindahan rumah, barang yang masih layak saya berikan gratis.',                 '081200000004', 'terverifikasi'),
  ('baru@lagi.test',   'Lapak Baru',    'Malang',          'Toko baru, menunggu verifikasi.',                                              '081200000005', 'menunggu')
) AS v(email, nama, kota, bio, telp, st)
JOIN pengguna u ON u.email = v.email;

-- Faktor dampak contoh (bukan hasil studi daur hidup).
INSERT INTO jenis_barang (kategori, kode, nama, berat_kg, emisi_kg_co2e) VALUES
  ('fashion',    'atasan',  'Atasan',           0.25,   6),
  ('fashion',    'jaket',   'Jaket',            0.80,  20),
  ('fashion',    'celana',  'Celana',           0.60,  15),
  ('fashion',    'sepatu',  'Sepatu',           0.90,  14),
  ('fashion',    'tas',     'Tas',              0.70,  12),
  ('elektronik', 'hp',      'Ponsel',           0.20,  60),
  ('elektronik', 'laptop',  'Laptop & komputer',2.00, 250),
  ('elektronik', 'kamera',  'Kamera',           0.60,  40),
  ('elektronik', 'audio',   'Audio',            0.30,  15),
  ('lifestyle',  'rumah',   'Rumah tangga',     1.00,   8),
  ('lifestyle',  'hobi',    'Hobi & olahraga',  0.60,   6),
  ('buku',       'buku',    'Buku',             0.30, 1.5);

-- Barang yang tayang. hari = berapa hari lalu diunggah.
INSERT INTO barang (toko_id, jenis_barang_id, nama, deskripsi, jenis_transaksi, harga_jual, harga_baru,
                    grade, kondisi, catatan, status, dibuat_pada)
SELECT t.id, j.id, v.nama, v.deskripsi, v.jenis, v.harga, v.baru, v.grade, v.kondisi::jsonb, v.catatan, 'aktif',
       CURRENT_TIMESTAMP - make_interval(days => v.hari)
FROM (VALUES
  ('toko@lagi.test','jaket','Jaket Denim Trucker','Jaket denim klasik, bahan tebal, cocok untuk Bandung yang dingin.','jual',185000,1100000,'Baik',
   '{"ukuran":"M","pemakaian":"Sering dipakai","noda":"Tidak ada","jahitan":"Ada yang longgar","bau":"Netral atau wangi"}',
   'Kancing paling atas agak longgar, masih bisa dikancingkan. Warna sedikit pudar di siku.',2),
  ('toko@lagi.test','atasan','Kemeja Flanel Kotak','Salah ukuran saat beli, jadi hanya dipakai beberapa kali.','jual',65000,399000,'Seperti Baru',
   '{"ukuran":"L","pemakaian":"Dipakai 1–5 kali","noda":"Tidak ada","jahitan":"Utuh","bau":"Netral atau wangi"}','',1),
  ('toko@lagi.test','sepatu','Sepatu Lari Pegasus','Dipakai untuk lari 5 km, sekitar 300 km total.','jual',350000,1800000,'Baik',
   '{"ukuran":"42","pemakaian":"Sering dipakai","noda":"Samar","jahitan":"Utuh","bau":"Netral atau wangi"}',
   'Sol luar aus tipis di tumit. Insole sudah diganti baru.',4),
  ('toko@lagi.test','tas','Tas Selempang Kanvas','Muat laptop 14 inci. Tali bisa diatur.','jual',120000,450000,'Baik',
   '{"ukuran":"All size","pemakaian":"Sering dipakai","noda":"Samar","jahitan":"Utuh","bau":"Netral atau wangi"}',
   'Ada noda tinta samar di kantong depan. Semua resleting lancar.',6),
  ('toko@lagi.test','celana','Celana Chino Krem','Bahan masih tebal dan nyaman.','jual',80000,600000,'Layak Pakai',
   '{"ukuran":"32","pemakaian":"Dipakai harian","noda":"Terlihat jelas","jahitan":"Utuh","bau":"Netral atau wangi"}',
   'Noda kopi di lutut kiri belum hilang setelah dicuci dua kali. Harga sudah disesuaikan.',8),
  ('gadget@lagi.test','hp','iPhone 11 128 GB','Sudah di-reset ke pengaturan pabrik. IMEI aman dan bisa dicek.','jual',3900000,9999000,'Baik',
   '{"baterai":"83","layar":"Goresan halus","fungsi":"Semua berfungsi normal","kelengkapan":"Unit + charger atau kabel","servis":"Belum pernah diservis","garansi":"Tidak ada"}',
   'Goresan halus di layar hanya terlihat saat layar mati. Face ID dan kamera normal.',1),
  ('gadget@lagi.test','laptop','Laptop ThinkPad T480','Core i5, RAM 16 GB, SSD 256 GB. Windows 11 aktif.','jual',4250000,15000000,'Baik',
   '{"baterai":"86","layar":"Mulus","fungsi":"Semua berfungsi normal","kelengkapan":"Unit + charger atau kabel","servis":"Pernah diservis resmi","garansi":"Sudah habis"}',
   'Keyboard sudah diganti baru saat servis. Ada lecet kecil di sudut penutup layar.',3),
  ('gadget@lagi.test','kamera','Kamera Mirrorless Mini','Sudah termasuk lensa kit, dua baterai, dan tas kecil.','jual',2700000,6500000,'Baik',
   '{"baterai":"90","layar":"Goresan halus","fungsi":"Semua berfungsi normal","kelengkapan":"Fullset dengan dus","servis":"Belum pernah diservis","garansi":"Sudah habis"}',
   'Goresan halus di layar LCD belakang. Lensa bersih, tidak berjamur.',5),
  ('gadget@lagi.test','audio','Headphone Nirkabel','Dipakai beberapa minggu saja. Bantalan telinga masih empuk.','jual',180000,600000,'Seperti Baru',
   '{"baterai":"95","layar":"Mulus","fungsi":"Semua berfungsi normal","kelengkapan":"Fullset dengan dus","servis":"Belum pernah diservis","garansi":"Sudah habis"}','',2),
  ('rumah@lagi.test','rumah','Lampu Meja Baca Kayu','Bohlam LED hangat ikut diberikan.','jual',75000,250000,'Baik',
   '{"kelengkapan":"Lengkap","tanda":"Lecet atau goresan ringan","fungsi":"Berfungsi normal"}',
   'Ada goresan halus di alas kayu. Kabel dan sakelar normal.',7),
  ('rumah@lagi.test','hobi','Bola Basket Ukuran 7','Sudah diisi angin dan diuji pantulannya.','jual',150000,520000,'Baik',
   '{"kelengkapan":"Lengkap","tanda":"Lecet atau goresan ringan","fungsi":"Berfungsi normal"}',
   'Grip masih baik, ada lecet ringan di sisi yang sering menyentuh aspal.',9),
  ('toko@lagi.test','buku','Tetralogi Buru, 4 Buku','Tidak ada coretan. Semua halaman utuh.','jual',320000,440000,'Baik',
   '{"isi":"4 jilid","halaman":"Menguning tipis","sampul":"Ada lipatan","kelengkapan":"Lengkap"}',
   'Kertas menguning tipis sesuai usia. Sampul jilid kedua ada lipatan di sudut.',10),
  ('toko@lagi.test','buku','Buku Kebiasaan Kecil','Dibaca satu kali. Tanpa stabilo atau coretan.','jual',55000,109000,'Seperti Baru',
   '{"isi":"1 buku","halaman":"Bersih","sampul":"Mulus","kelengkapan":"Lengkap"}','',3),
  ('maya@lagi.test','atasan','Dress Anak Motif Bunga','Anak saya sudah kebesaran. Semoga bisa dipakai adik lain.','gratis',0,180000,'Baik',
   '{"ukuran":"6–7 tahun","pemakaian":"Dipakai 1–5 kali","noda":"Samar","jahitan":"Utuh","bau":"Netral atau wangi"}',
   'Ada noda samar di bagian rok. Penerima menanggung ongkir atau ambil sendiri di Surabaya.',1),
  ('rumah@lagi.test','rumah','Kursi Lipat Plastik, 2 Buah','Cocok untuk acara atau teras.','gratis',0,160000,'Baik',
   '{"kelengkapan":"Lengkap","tanda":"Lecet atau goresan ringan","fungsi":"Berfungsi normal"}',
   'Lecet ringan di kaki kursi. Engsel kuat. Ambil di Yogyakarta.',2),
  ('gadget@lagi.test','audio','Speaker Bluetooth Portabel','Diberikan gratis agar tidak berakhir sebagai sampah elektronik.','gratis',0,700000,'Layak Pakai',
   '{"baterai":"62","layar":"Goresan halus","fungsi":"Ada fungsi bermasalah","kelengkapan":"Unit saja","servis":"Belum pernah diservis","garansi":"Tidak ada"}',
   'Baterai cepat habis, hanya bertahan sekitar 2 jam. Suara normal, tombol volume agak keras.',3),
  ('toko@lagi.test','buku','Buku Pelajaran SMA Kelas 11','Untuk adik kelas yang membutuhkan.','gratis',0,120000,'Baik',
   '{"isi":"3 buku","halaman":"Menguning tipis","sampul":"Mulus","kelengkapan":"Lengkap"}',
   'Ada sedikit stabilo di bab awal.',4)
) AS v(email, kode, nama, deskripsi, jenis, harga, baru, grade, kondisi, catatan, hari)
JOIN pengguna u ON u.email = v.email
JOIN toko t ON t.pengguna_id = u.id
JOIN jenis_barang j ON j.kode = v.kode;

INSERT INTO cacat_barang (barang_id, urutan, label)
SELECT b.id, v.urut, v.label
FROM (VALUES
  ('Jaket Denim Trucker', 0, 'Kancing atas longgar'),
  ('Jaket Denim Trucker', 1, 'Pudar di siku kanan'),
  ('Sepatu Lari Pegasus', 0, 'Sol tumit aus tipis'),
  ('Sepatu Lari Pegasus', 1, 'Noda samar di sisi kiri'),
  ('Tas Selempang Kanvas', 0, 'Noda tinta di kantong depan'),
  ('Celana Chino Krem', 0, 'Noda kopi di lutut kiri'),
  ('iPhone 11 128 GB', 0, 'Goresan halus di layar'),
  ('Laptop ThinkPad T480', 0, 'Lecet di sudut penutup layar'),
  ('Kamera Mirrorless Mini', 0, 'Goresan di layar LCD'),
  ('Lampu Meja Baca Kayu', 0, 'Goresan di alas kayu'),
  ('Bola Basket Ukuran 7', 0, 'Lecet di permukaan bola'),
  ('Tetralogi Buru, 4 Buku', 0, 'Lipatan di sampul jilid 2'),
  ('Dress Anak Motif Bunga', 0, 'Noda samar di rok'),
  ('Kursi Lipat Plastik, 2 Buah', 0, 'Lecet di kaki kursi'),
  ('Speaker Bluetooth Portabel', 0, 'Baterai tinggal 62%'),
  ('Speaker Bluetooth Portabel', 1, 'Tombol volume keras'),
  ('Buku Pelajaran SMA Kelas 11', 0, 'Stabilo di bab awal')
) AS v(nama, urut, label)
JOIN barang b ON b.nama = v.nama;

-- Riwayat: 36 transaksi selesai dalam 6 bulan terakhir untuk grafik dan dampak.
DO $$
DECLARE
  tokos BIGINT[];
  pembelis BIGINT[];
  i INT;
  v_toko BIGINT; v_jenis RECORD; v_barang BIGINT; v_pesanan BIGINT; v_pembeli BIGINT;
  v_gratis BOOLEAN; v_baru NUMERIC; v_harga NUMERIC; v_selesai TIMESTAMPTZ; v_kond JSONB;
  v_berbeda BOOLEAN; v_grade TEXT;
BEGIN
  SELECT array_agg(id ORDER BY id) INTO tokos FROM toko WHERE status_verifikasi = 'terverifikasi';
  SELECT array_agg(id ORDER BY id) INTO pembelis FROM pengguna WHERE peran = 'pembeli';
  FOR i IN 1..36 LOOP
    v_toko := tokos[1 + (i - 1) % array_length(tokos, 1)];
    SELECT * INTO v_jenis FROM jenis_barang ORDER BY id OFFSET ((i - 1) % 12) LIMIT 1;
    v_pembeli := pembelis[1 + (i - 1) % array_length(pembelis, 1)];
    v_gratis := (i % 5 = 0);
    v_berbeda := (i % 9 = 0);
    v_grade := (ARRAY['Seperti Baru', 'Baik', 'Baik', 'Layak Pakai'])[1 + i % 4];
    v_baru := CASE v_jenis.kategori WHEN 'elektronik' THEN 1500000 + i * 40000 WHEN 'fashion' THEN 250000 + i * 9000
                                    WHEN 'buku' THEN 90000 + i * 1000 ELSE 200000 + i * 6000 END;
    v_harga := CASE WHEN v_gratis THEN 0 ELSE round(v_baru * (CASE v_grade WHEN 'Seperti Baru' THEN 0.5 WHEN 'Baik' THEN 0.35 ELSE 0.2 END), -3) END;
    v_selesai := CURRENT_TIMESTAMP - make_interval(days => i * 5, hours => i % 7);
    v_kond := CASE v_jenis.kategori
      WHEN 'fashion' THEN '{"ukuran":"M","pemakaian":"Sering dipakai","noda":"Tidak ada","jahitan":"Utuh","bau":"Netral atau wangi"}'::jsonb
      WHEN 'elektronik' THEN '{"baterai":"88","layar":"Mulus","fungsi":"Semua berfungsi normal","kelengkapan":"Unit saja","servis":"Belum pernah diservis","garansi":"Sudah habis"}'::jsonb
      WHEN 'buku' THEN '{"isi":"1 buku","halaman":"Bersih","sampul":"Mulus","kelengkapan":"Lengkap"}'::jsonb
      ELSE '{"kelengkapan":"Lengkap","tanda":"Lecet atau goresan ringan","fungsi":"Berfungsi normal"}'::jsonb END;
    INSERT INTO barang (toko_id, jenis_barang_id, nama, jenis_transaksi, harga_jual, harga_baru, grade, kondisi,
                        status, dibuat_pada, diubah_pada)
    VALUES (v_toko, v_jenis.id, v_jenis.nama || ' bekas #' || i, CASE WHEN v_gratis THEN 'gratis' ELSE 'jual' END,
            v_harga, v_baru, v_grade, v_kond, CASE WHEN v_gratis THEN 'diberikan' ELSE 'terjual' END,
            v_selesai - interval '8 days', v_selesai)
    RETURNING id INTO v_barang;
    INSERT INTO pesanan (barang_id, toko_id, pembeli_id, harga_saat_pesan, harga_baru_saat_pesan, metode_serah, status,
                         status_pembayaran, kesesuaian, catatan_kesesuaian, dibuat_pada, dikonfirmasi_pada, siap_pada, selesai_pada)
    VALUES (v_barang, v_toko, v_pembeli, v_harga, v_baru, CASE WHEN i % 2 = 0 THEN 'kurir' ELSE 'ketemuan' END, 'selesai',
            CASE WHEN v_gratis THEN 'gratis' ELSE 'dibayar' END,
            CASE WHEN v_berbeda THEN 'berbeda' ELSE 'sesuai' END,
            CASE WHEN v_berbeda THEN 'Ada goresan kecil yang tidak tertulis di kartu.' END,
            v_selesai - interval '4 days', v_selesai - interval '3 days', v_selesai - interval '2 days', v_selesai)
    RETURNING id INTO v_pesanan;
    INSERT INTO riwayat_pesanan (pesanan_id, status, dibuat_pada) VALUES
      (v_pesanan, 'menunggu-konfirmasi', v_selesai - interval '4 days'),
      (v_pesanan, 'dikonfirmasi', v_selesai - interval '3 days'),
      (v_pesanan, 'siap', v_selesai - interval '2 days'),
      (v_pesanan, 'selesai', v_selesai);
  END LOOP;
END $$;

-- Pesanan yang sedang berjalan.
WITH p AS (
  INSERT INTO pesanan (barang_id, toko_id, pembeli_id, harga_saat_pesan, harga_baru_saat_pesan, metode_serah, status, dikonfirmasi_pada, siap_pada)
  SELECT b.id, b.toko_id, u.id, b.harga_jual, b.harga_baru, v.metode, v.status,
         CASE WHEN v.status IN ('dikonfirmasi','siap') THEN CURRENT_TIMESTAMP - interval '1 day' END,
         CASE WHEN v.status = 'siap' THEN CURRENT_TIMESTAMP - interval '2 hours' END
  FROM (VALUES
    ('Buku Kebiasaan Kecil', 'sari@lagi.test', 'kurir', 'menunggu-konfirmasi'),
    ('Kemeja Flanel Kotak',  'andi@lagi.test', 'ketemuan', 'siap')
  ) AS v(nama, email, metode, status)
  JOIN barang b ON b.nama = v.nama
  JOIN pengguna u ON u.email = v.email
  RETURNING id, barang_id, status
), r AS (
  INSERT INTO riwayat_pesanan (pesanan_id, status)
  SELECT id, 'menunggu-konfirmasi' FROM p
  UNION ALL SELECT id, 'dikonfirmasi' FROM p WHERE status IN ('dikonfirmasi','siap')
  UNION ALL SELECT id, 'siap' FROM p WHERE status = 'siap'
)
UPDATE barang SET status = 'dipesan' WHERE id IN (SELECT barang_id FROM p);

INSERT INTO permintaan_gratis (barang_id, peminta_id, alasan)
SELECT b.id, u.id, v.alasan
FROM (VALUES
  ('Kursi Lipat Plastik, 2 Buah', 'sari@lagi.test', 'Untuk kos baru saya, kebetulan belum punya kursi.'),
  ('Dress Anak Motif Bunga',      'rina@lagi.test', 'Untuk keponakan perempuan saya yang baru masuk sekolah.')
) AS v(nama, email, alasan)
JOIN barang b ON b.nama = v.nama
JOIN pengguna u ON u.email = v.email;

COMMIT;
