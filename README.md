# LAGI. Sustainable Re-commerce Marketplace

Marketplace barang preloved (fashion, elektronik, lifestyle, buku) berbasis web. Strukturnya mengikuti proyek SisaBaik: Express + PostgreSQL di backend, Vue 3 + Vite di frontend.

Fitur utama:

- **Honest Condition Card**: kondisi barang diisi terstruktur per kategori, tiap isian punya tingkat (baik, catatan, cacat). Grade tidak boleh lebih tinggi dari yang disarankan isian, dan bagian bercacat wajib disebut.
- **Skor kesesuaian**: pembeli menyatakan barang *sesuai* atau *berbeda* dari kartunya saat menyelesaikan pesanan. Persentasenya tampil di profil toko.
- **Give It Forward**: barang gratis diminta lewat alasan singkat, pemberi memilih satu penerima.
- **Impact Dashboard**: berat barang dan emisi CO2e yang terhindar, nilai yang diselamatkan, tren 6 bulan, untuk akun dan seluruh platform.
- **Catatan transaksi**: harga dicatat saat pesan (snapshot), riwayat status tiap pesanan, satu barang hanya satu pesanan berjalan.

## Struktur

```
database/    01_schema.sql, 02_seed.sql, 03_queries.sql, 04_integrity_tests.sql
src/         config, db, lib (validator), middleware, repositories, services, controllers, routes
frontend/    Vue 3 + Vite (lihat frontend/README.md)
scripts/     atur-sandi-demo, verifikasi-toko, cek-db, uji-api
public/      halaman uji API di /uji
test/        uji unit (node:test)
docs/API.md  kontrak API
```

Alur lapisan: `routes → controllers → services → repositories → PostgreSQL`. Aturan bisnis (alur status, validasi kartu kondisi) ada di `services` dan `lib`; kunci baris `FOR UPDATE` dan indeks unik parsial di database menjaga konsistensi saat dua pengguna bertindak bersamaan.

## Menjalankan

Butuh Node 20+ dan PostgreSQL 14+.

```bash
createdb lagi
psql -d lagi -f database/01_schema.sql
psql -d lagi -f database/02_seed.sql        # data contoh (opsional tapi disarankan)

cp .env.example .env                        # isi DATABASE_URL, JWT_SECRET, DEMO_PASSWORD
npm install
npm run db:sandi-demo                       # mengisi kata sandi akun contoh
npm run db:cek
npm start                                   # API di http://localhost:3000

cd frontend && npm install && npm run dev   # http://127.0.0.1:5173
```

`JWT_SECRET` harus 64 karakter hex: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Kata sandi minimal 15 karakter, jadi `DEMO_PASSWORD` juga harus selurus itu.

Akun contoh (kata sandi = `DEMO_PASSWORD`): pembeli `sari@lagi.test`; penjual `toko@`, `gadget@`, `rumah@`, `maya@` dengan domain `lagi.test`.

Penjual baru berstatus `menunggu` sampai diverifikasi: `npm run toko:verifikasi -- email@penjual.test`.

Produksi: `cd frontend && npm run build`, lalu `NODE_ENV=production npm start`. Express menyajikan `frontend/dist`.

## Pengujian

```bash
npm run uji          # uji unit validator (tanpa database)
npm run uji:api      # uji asap ke server yang berjalan (DEMO_PASSWORD untuk uji login)
psql -d lagi -f database/04_integrity_tests.sql   # 18 uji integritas, semuanya dalam ROLLBACK
```

Halaman `http://localhost:3000/uji` untuk mencoba endpoint dengan tangan.

## Catatan

- Faktor berat dan emisi di tabel `jenis_barang` hanyalah angka contoh. Ganti dengan sumber resmi sebelum dipakai untuk klaim dampak.
- Pembayaran disimulasikan: status `dibayar` dicatat saat pesanan selesai. Belum ada payment gateway, kurir, chat, atau peran admin (verifikasi toko lewat CLI).
- Foto disimpan sebagai BYTEA (maks 2 MiB). Untuk skala besar, pindahkan ke object storage.
- Token akses berlaku 15 menit tanpa refresh token. `POST /auth/logout` mencabut semua token pengguna.
