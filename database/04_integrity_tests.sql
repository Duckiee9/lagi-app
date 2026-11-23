-- LAGI. — uji integritas: setiap aturan penting harus benar-benar ditolak database.
-- Jalankan: psql -v ON_ERROR_STOP=1 -f database/04_integrity_tests.sql
-- Semua perubahan dibatalkan di akhir (ROLLBACK).
BEGIN;

CREATE FUNCTION pg_temp.harus_gagal(nama TEXT, perintah TEXT, kode_diharapkan TEXT) RETURNS void AS $f$
BEGIN
  EXECUTE perintah;
  RAISE EXCEPTION 'GAGAL UJI "%": perintah seharusnya ditolak', nama;
EXCEPTION WHEN OTHERS THEN
  IF SQLSTATE = kode_diharapkan THEN
    RAISE NOTICE 'OK   %', nama;
  ELSE
    RAISE EXCEPTION 'GAGAL UJI "%": kode % (% ), diharapkan %', nama, SQLSTATE, SQLERRM, kode_diharapkan;
  END IF;
END $f$ LANGUAGE plpgsql;

SELECT pg_temp.harus_gagal('barang gratis tidak boleh berharga',
  $$INSERT INTO barang (toko_id, jenis_barang_id, nama, jenis_transaksi, harga_jual, harga_baru, grade, kondisi)
    VALUES (1, 1, 'Uji barang gratis', 'gratis', 5000, 10000, 'Baik', '{}')$$, '23514');

SELECT pg_temp.harus_gagal('harga jual tidak boleh melebihi harga baru',
  $$INSERT INTO barang (toko_id, jenis_barang_id, nama, jenis_transaksi, harga_jual, harga_baru, grade, kondisi)
    VALUES (1, 1, 'Uji harga', 'jual', 20000, 10000, 'Baik', '{}')$$, '23514');

SELECT pg_temp.harus_gagal('grade harus salah satu dari tiga',
  $$INSERT INTO barang (toko_id, jenis_barang_id, nama, jenis_transaksi, harga_jual, harga_baru, grade, kondisi)
    VALUES (1, 1, 'Uji grade', 'jual', 5000, 10000, 'Bagus', '{}')$$, '23514');

SELECT pg_temp.harus_gagal('kondisi harus berupa objek JSON',
  $$INSERT INTO barang (toko_id, jenis_barang_id, nama, jenis_transaksi, harga_jual, harga_baru, grade, kondisi)
    VALUES (1, 1, 'Uji kondisi', 'jual', 5000, 10000, 'Baik', '[]')$$, '23514');

SELECT pg_temp.harus_gagal('foto wajib berpasangan dengan mime',
  $$INSERT INTO barang (toko_id, jenis_barang_id, nama, jenis_transaksi, harga_jual, harga_baru, grade, kondisi, foto)
    VALUES (1, 1, 'Uji foto', 'jual', 5000, 10000, 'Baik', '{}', '\x00')$$, '23514');

SELECT pg_temp.harus_gagal('barang jual tidak boleh berstatus diberikan',
  $$UPDATE barang SET status = 'diberikan' WHERE jenis_transaksi = 'jual' AND status = 'aktif'$$, '23514');

SELECT pg_temp.harus_gagal('email harus huruf kecil',
  $$INSERT INTO pengguna (nama_lengkap, email, peran) VALUES ('Uji', 'Uji@Lagi.Test', 'pembeli')$$, '23514');

SELECT pg_temp.harus_gagal('email harus unik',
  $$INSERT INTO pengguna (nama_lengkap, email, peran) VALUES ('Uji', 'sari@lagi.test', 'pembeli')$$, '23505');

SELECT pg_temp.harus_gagal('peran tidak dikenal ditolak',
  $$INSERT INTO pengguna (nama_lengkap, email, peran) VALUES ('Uji', 'x@lagi.test', 'admin')$$, '23514');

-- Satu barang hanya boleh punya satu pesanan berjalan.
SELECT pg_temp.harus_gagal('dua pesanan berjalan untuk satu barang',
  $$INSERT INTO pesanan (barang_id, toko_id, pembeli_id, harga_saat_pesan, harga_baru_saat_pesan, metode_serah)
    SELECT barang_id, toko_id, pembeli_id, harga_saat_pesan, harga_baru_saat_pesan, 'kurir'
    FROM pesanan WHERE status = 'menunggu-konfirmasi' LIMIT 1$$, '23505');

SELECT pg_temp.harus_gagal('pesanan selesai wajib punya kesesuaian',
  $$UPDATE pesanan SET status = 'selesai', selesai_pada = now(), status_pembayaran = 'dibayar'
    WHERE status = 'siap'$$, '23514');

SELECT pg_temp.harus_gagal('laporan berbeda wajib punya catatan',
  $$UPDATE pesanan SET kesesuaian = 'berbeda', catatan_kesesuaian = 'ya' WHERE status = 'siap'$$, '23514');

SELECT pg_temp.harus_gagal('pesanan batal wajib mencatat siapa dan kapan',
  $$UPDATE pesanan SET status = 'dibatalkan' WHERE status = 'menunggu-konfirmasi'$$, '23514');

SELECT pg_temp.harus_gagal('harga gratis wajib berstatus pembayaran gratis',
  $$UPDATE pesanan SET harga_saat_pesan = 0 WHERE status = 'siap'$$, '23514');

SELECT pg_temp.harus_gagal('barang yang punya pesanan tidak boleh dihapus',
  $$DELETE FROM barang WHERE id = (SELECT barang_id FROM pesanan LIMIT 1)$$, '23503');

SELECT pg_temp.harus_gagal('permintaan menunggu ganda ditolak',
  $$INSERT INTO permintaan_gratis (barang_id, peminta_id, alasan)
    SELECT barang_id, peminta_id, alasan FROM permintaan_gratis WHERE status = 'menunggu' LIMIT 1$$, '23505');

SELECT pg_temp.harus_gagal('alasan permintaan terlalu pendek',
  $$INSERT INTO permintaan_gratis (barang_id, peminta_id, alasan)
    SELECT b.id, 1, 'butuh' FROM barang b WHERE jenis_transaksi = 'gratis' AND status = 'aktif' LIMIT 1$$, '23514');

-- Pesanan yang sah harus tetap bisa dibuat.
DO $$
DECLARE n INT;
BEGIN
  INSERT INTO pesanan (barang_id, toko_id, pembeli_id, harga_saat_pesan, harga_baru_saat_pesan, metode_serah)
  SELECT id, toko_id, 1, harga_jual, harga_baru, 'ketemuan'
  FROM barang WHERE status = 'aktif' AND jenis_transaksi = 'jual' LIMIT 1;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN RAISE EXCEPTION 'GAGAL UJI: pesanan sah tidak tersimpan'; END IF;
  RAISE NOTICE 'OK   pesanan sah tetap bisa dibuat';
END $$;

ROLLBACK;
