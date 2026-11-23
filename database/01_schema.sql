-- LAGI. — skema PostgreSQL 14+.
-- Jalankan: psql -d lagi -f database/01_schema.sql
BEGIN;

DROP VIEW IF EXISTS v_skor_kesesuaian;
DROP TABLE IF EXISTS riwayat_pesanan, permintaan_gratis, pesanan, cacat_barang,
                     barang, jenis_barang, toko, pengguna CASCADE;

CREATE TABLE pengguna (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nama_lengkap VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE CHECK (email = lower(email)),
  peran VARCHAR(20) NOT NULL CHECK (peran IN ('pembeli', 'penjual')),
  aktif BOOLEAN NOT NULL DEFAULT TRUE,
  kata_sandi_hash TEXT,
  versi_token INTEGER NOT NULL DEFAULT 0 CHECK (versi_token >= 0),
  dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE toko (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pengguna_id BIGINT NOT NULL UNIQUE
    REFERENCES pengguna(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  nama_toko VARCHAR(80) NOT NULL,
  kota VARCHAR(60) NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  nomor_telepon VARCHAR(20) NOT NULL,
  status_verifikasi VARCHAR(20) NOT NULL DEFAULT 'menunggu'
    CHECK (status_verifikasi IN ('menunggu', 'terverifikasi', 'ditolak')),
  dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Faktor dampak per jenis barang. Angka contoh, ganti dengan sumber resmi (LCA).
CREATE TABLE jenis_barang (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kategori VARCHAR(20) NOT NULL
    CHECK (kategori IN ('fashion', 'elektronik', 'lifestyle', 'buku')),
  kode VARCHAR(20) NOT NULL UNIQUE,
  nama VARCHAR(40) NOT NULL,
  berat_kg NUMERIC(6,2) NOT NULL CHECK (berat_kg > 0),
  emisi_kg_co2e NUMERIC(7,1) NOT NULL CHECK (emisi_kg_co2e >= 0)
);

CREATE TABLE barang (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  toko_id BIGINT NOT NULL
    REFERENCES toko(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  jenis_barang_id BIGINT NOT NULL
    REFERENCES jenis_barang(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  nama VARCHAR(120) NOT NULL CHECK (char_length(btrim(nama)) >= 3),
  deskripsi TEXT NOT NULL DEFAULT '',
  jenis_transaksi VARCHAR(10) NOT NULL
    CHECK (jenis_transaksi IN ('jual', 'gratis')),
  harga_jual NUMERIC(12,0) NOT NULL CHECK (harga_jual >= 0),
  harga_baru NUMERIC(12,0) NOT NULL CHECK (harga_baru > 0),
  grade VARCHAR(20) NOT NULL
    CHECK (grade IN ('Seperti Baru', 'Baik', 'Layak Pakai')),
  kondisi JSONB NOT NULL CHECK (jsonb_typeof(kondisi) = 'object'),
  catatan TEXT NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'aktif'
    CHECK (status IN ('draf', 'aktif', 'dipesan', 'terjual', 'diberikan')),
  foto_mime VARCHAR(20),
  foto BYTEA,
  dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  diubah_pada TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_barang_id_toko UNIQUE (id, toko_id),
  CONSTRAINT ck_barang_harga CHECK (
    (jenis_transaksi = 'gratis' AND harga_jual = 0)
    OR (jenis_transaksi = 'jual' AND harga_jual > 0 AND harga_jual <= harga_baru)
  ),
  CONSTRAINT ck_barang_foto CHECK ((foto IS NULL) = (foto_mime IS NULL)),
  CONSTRAINT ck_barang_status_akhir CHECK (
    status <> 'diberikan' OR jenis_transaksi = 'gratis'
  ),
  CONSTRAINT ck_barang_status_terjual CHECK (
    status <> 'terjual' OR jenis_transaksi = 'jual'
  )
);

-- Bagian yang bercacat pada Honest Condition Card. Foto bersifat opsional.
CREATE TABLE cacat_barang (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  barang_id BIGINT NOT NULL
    REFERENCES barang(id) ON UPDATE CASCADE ON DELETE CASCADE,
  urutan SMALLINT NOT NULL DEFAULT 0 CHECK (urutan >= 0),
  label VARCHAR(80) NOT NULL CHECK (char_length(btrim(label)) >= 2),
  foto_mime VARCHAR(20),
  foto BYTEA,
  CONSTRAINT ck_cacat_foto CHECK ((foto IS NULL) = (foto_mime IS NULL))
);

CREATE TABLE pesanan (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  barang_id BIGINT NOT NULL,
  toko_id BIGINT NOT NULL,
  pembeli_id BIGINT NOT NULL
    REFERENCES pengguna(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  -- Snapshot harga: riwayat tidak berubah bila barang diedit.
  harga_saat_pesan NUMERIC(12,0) NOT NULL CHECK (harga_saat_pesan >= 0),
  harga_baru_saat_pesan NUMERIC(12,0) NOT NULL CHECK (harga_baru_saat_pesan > 0),
  metode_serah VARCHAR(10) NOT NULL CHECK (metode_serah IN ('ketemuan', 'kurir')),
  status VARCHAR(20) NOT NULL DEFAULT 'menunggu-konfirmasi'
    CHECK (status IN ('menunggu-konfirmasi', 'dikonfirmasi', 'siap',
                      'selesai', 'dibatalkan', 'ditolak')),
  status_pembayaran VARCHAR(20) NOT NULL DEFAULT 'belum-dibayar'
    CHECK (status_pembayaran IN ('belum-dibayar', 'dibayar', 'gratis')),
  kesesuaian VARCHAR(10) CHECK (kesesuaian IN ('sesuai', 'berbeda')),
  catatan_kesesuaian VARCHAR(500),
  dibatalkan_oleh VARCHAR(10) CHECK (dibatalkan_oleh IN ('pembeli', 'penjual')),
  alasan_pembatalan VARCHAR(300),
  dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  dikonfirmasi_pada TIMESTAMPTZ,
  siap_pada TIMESTAMPTZ,
  selesai_pada TIMESTAMPTZ,
  dibatalkan_pada TIMESTAMPTZ,
  FOREIGN KEY (barang_id, toko_id)
    REFERENCES barang(id, toko_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT ck_pesanan_gratis CHECK (
    (harga_saat_pesan = 0 AND status_pembayaran = 'gratis')
    OR (harga_saat_pesan > 0 AND status_pembayaran IN ('belum-dibayar', 'dibayar'))
  ),
  CONSTRAINT ck_pesanan_harga CHECK (harga_saat_pesan <= harga_baru_saat_pesan),
  CONSTRAINT ck_pesanan_selesai CHECK (
    status <> 'selesai' OR (
      kesesuaian IS NOT NULL AND selesai_pada IS NOT NULL
      AND status_pembayaran IN ('dibayar', 'gratis')
    )
  ),
  CONSTRAINT ck_pesanan_berbeda CHECK (
    kesesuaian IS DISTINCT FROM 'berbeda'
    OR char_length(btrim(COALESCE(catatan_kesesuaian, ''))) >= 5
  ),
  CONSTRAINT ck_pesanan_batal CHECK (
    status NOT IN ('dibatalkan', 'ditolak')
    OR (dibatalkan_pada IS NOT NULL AND dibatalkan_oleh IS NOT NULL)
  )
);

-- Satu barang hanya boleh punya satu pesanan yang masih berjalan.
CREATE UNIQUE INDEX uq_pesanan_barang_berjalan ON pesanan(barang_id)
  WHERE status IN ('menunggu-konfirmasi', 'dikonfirmasi', 'siap');

CREATE TABLE riwayat_pesanan (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pesanan_id BIGINT NOT NULL
    REFERENCES pesanan(id) ON UPDATE CASCADE ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,
  oleh_pengguna_id BIGINT REFERENCES pengguna(id) ON DELETE SET NULL,
  dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Give It Forward: calon penerima mengajukan permintaan, pemberi memilih satu.
CREATE TABLE permintaan_gratis (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  barang_id BIGINT NOT NULL
    REFERENCES barang(id) ON UPDATE CASCADE ON DELETE CASCADE,
  peminta_id BIGINT NOT NULL
    REFERENCES pengguna(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  alasan VARCHAR(300) NOT NULL CHECK (char_length(btrim(alasan)) >= 10),
  status VARCHAR(10) NOT NULL DEFAULT 'menunggu'
    CHECK (status IN ('menunggu', 'dipilih', 'ditolak', 'ditarik')),
  dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX uq_permintaan_menunggu ON permintaan_gratis(barang_id, peminta_id)
  WHERE status = 'menunggu';

-- Skor kesesuaian: persentase pembeli yang menyatakan kondisi sesuai kartu.
CREATE VIEW v_skor_kesesuaian AS
SELECT toko_id,
       COUNT(*)::int AS jumlah,
       COUNT(*) FILTER (WHERE kesesuaian = 'sesuai')::int AS sesuai,
       ROUND(100.0 * COUNT(*) FILTER (WHERE kesesuaian = 'sesuai') / COUNT(*))::int AS persen
FROM pesanan
WHERE status = 'selesai' AND kesesuaian IS NOT NULL
GROUP BY toko_id;

CREATE INDEX idx_toko_status ON toko(status_verifikasi);
CREATE INDEX idx_barang_toko ON barang(toko_id);
CREATE INDEX idx_barang_katalog ON barang(status, jenis_transaksi, dibuat_pada DESC);
CREATE INDEX idx_barang_jenis ON barang(jenis_barang_id);
CREATE INDEX idx_pesanan_pembeli ON pesanan(pembeli_id, id DESC);
CREATE INDEX idx_pesanan_toko ON pesanan(toko_id, id DESC);
CREATE INDEX idx_riwayat_pesanan ON riwayat_pesanan(pesanan_id, id);
CREATE INDEX idx_permintaan_barang ON permintaan_gratis(barang_id, status);
CREATE INDEX idx_permintaan_peminta ON permintaan_gratis(peminta_id);

COMMIT;
