# API LAGI.

Base URL: `/api`. Semua body dan respons JSON, kecuali foto (biner).

## Konvensi

- Sukses: `{ "success": true, "data": ... }`. Daftar: `{ "success": true, "data": [...], "meta": { "jumlah", "page", "limit", "totalPages" } }`.
- Gagal: `{ "success": false, "error": { "code": "KODE", "message": "Pesan" } }`.
- ID selalu **string**. Uang berupa angka rupiah utuh (number). Waktu ISO 8601.
- Autentikasi: header `Authorization: Bearer <accessToken>`. Token berlaku 15 menit. Peran: `pembeli`, `penjual`.
- Penjual yang statusnya belum `terverifikasi` hanya boleh memakai `/api/auth/*`, `/api/toko/saya`, dan GET publik.
- Paginasi: `?page=1&limit=8` (limit maksimum 24).
- Foto dikirim sebagai data URL (`data:image/jpeg|png|webp;base64,...`), maksimal 2 MiB per foto. Satu foto utama per barang dan maksimal 5 bagian cacat (masing-masing boleh berfoto).

## Auth

| Metode | Path | Body | Hasil |
|---|---|---|---|
| POST | `/auth/registrasi` | `namaLengkap, email, kataSandi` (min 15 karakter) | 201 `pengguna` |
| POST | `/auth/registrasi-penjual` | `namaLengkap, email, kataSandi, namaToko, kota, nomorTelepon, bio?` | 201 `pengguna` (status `menunggu`) |
| POST | `/auth/login` | `email, kataSandi` | `{ accessToken, tokenType, expiresIn, pengguna }` |
| GET | `/auth/saya` | | `pengguna` |
| POST | `/auth/logout` | | `{ keluar: true }` (mencabut token) |
| PUT | `/toko/saya` | `namaToko, kota, bio, nomorTelepon` (penjual) | `pengguna` |

`pengguna`: `{ id, namaLengkap, email, peran, tokoId, statusVerifikasi, namaToko, kota, bio, nomorTelepon }`. Kolom toko bernilai `null` untuk pembeli. `statusVerifikasi`: `menunggu | terverifikasi | ditolak`.

## Kategori (publik)

`GET /kategori` → `{ kategori: [...], grade: [...] }`

```json
{
  "kategori": [{
    "kode": "fashion", "label": "Fashion",
    "jenis": [{ "kode": "jaket", "nama": "Jaket", "beratKg": 0.8, "emisiKgCo2e": 20 }],
    "kolom": [
      { "kunci": "ukuran", "label": "Ukuran", "tipe": "teks", "placeholder": "Contoh: M, 42" },
      { "kunci": "noda", "label": "Noda", "tipe": "pilihan", "pilihan": [{ "nilai": "Tidak ada", "tingkat": 0 }, { "nilai": "Samar", "tingkat": 1 }] },
      { "kunci": "baterai", "label": "Kesehatan baterai (%)", "tipe": "angka", "min": 1, "max": 100, "ambang": [90, 80] }
    ]
  }],
  "grade": [{ "nilai": "Seperti Baru", "keterangan": "Nyaris tanpa tanda pemakaian." }]
}
```

`tingkat`: 0 baik, 1 ada catatan, 2 cacat berarti. Untuk `angka`, nilai >= `ambang[0]` bertingkat 0, >= `ambang[1]` bertingkat 1, selain itu 2. Kolom `teks` tidak bertingkat (`null`).
Grade minimal yang disarankan dari isian: ada tingkat 2 → `Layak Pakai`; ada tingkat 1 → `Baik`; selain itu `Seperti Baru`. Server menolak grade yang lebih tinggi dari saran ini.

## Barang

`ringkas` (daftar): `{ id, nama, kategori, jenis, jenisNama, jenisTransaksi, hargaJual, hargaBaru, grade, status, tokoId, namaToko, kota, adaFoto, dibuatPada }`. `jenisTransaksi`: `jual | gratis`. `status`: `draf | aktif | dipesan | terjual | diberikan`.

| Metode | Path | Keterangan |
|---|---|---|
| GET | `/barang` | Publik. Query: `q, kategori, grade, jenis (jual\|gratis), urut (baru\|murah\|mahal\|hemat), page, limit`. Hanya status `aktif` dan `dipesan`. |
| GET | `/barang/:id` | Publik (login opsional). Draf hanya terlihat pemiliknya. |
| GET | `/barang/:id/foto` | Foto utama (biner), 404 bila tidak ada. |
| GET | `/barang/:id/cacat/:cacatId/foto` | Foto cacat (biner). |
| GET | `/barang/milik-saya` | Penjual. Query: `status?`. Item ringkas + `jumlahPermintaan`. |
| GET | `/barang/milik-saya/:id` | Penjual. Detail untuk form ubah, berisi `kondisiMap`. |
| POST | `/barang` | Penjual. Membuat barang. 201 detail. |
| PUT | `/barang/:id` | Penjual. Hanya status `aktif` atau `draf`. |
| POST | `/barang/:id/tayang` | Penjual. Body `{ tayang: true\|false }` (aktif ↔ draf). |
| DELETE | `/barang/:id` | Penjual. 409 bila sudah punya pesanan. |
| POST | `/barang/:id/permintaan` | Pembeli. Body `{ alasan }` (10-300 karakter). Hanya barang gratis. 201. |

Detail `GET /barang/:id`:

```json
{
  "id": "3", "nama": "Jaket Denim Trucker", "kategori": "fashion", "jenis": "jaket", "jenisNama": "Jaket",
  "jenisTransaksi": "jual", "hargaJual": 185000, "hargaBaru": 1100000, "grade": "Baik", "status": "aktif",
  "tokoId": "1", "namaToko": "Thrift Kita", "kota": "Bandung", "adaFoto": false, "dibuatPada": "...",
  "deskripsi": "...", "catatan": "...",
  "kondisi": [{ "kunci": "ukuran", "label": "Ukuran", "nilai": "M", "tingkat": null }],
  "cacat": [{ "id": "5", "label": "Kancing atas longgar", "adaFoto": false }],
  "toko": { "id": "1", "namaToko": "Thrift Kita", "kota": "Bandung", "statusVerifikasi": "terverifikasi", "skor": { "persen": 89, "jumlah": 9 } },
  "dampak": { "beratKg": 0.8, "emisiKgCo2e": 20, "hemat": 915000 },
  "saya": { "milikSaya": false, "permintaanId": null, "pesananId": null }
}
```

`toko.skor` bernilai `null` bila belum ada konfirmasi pembeli. `saya` selalu ada; bernilai default bila tidak login.

Body `POST /barang` dan `PUT /barang/:id`:

```json
{
  "nama": "Kaos Band Vintage", "kategori": "fashion", "jenis": "atasan", "jenisTransaksi": "jual",
  "hargaJual": 90000, "hargaBaru": 250000, "deskripsi": "", "grade": "Baik",
  "kondisi": { "ukuran": "L", "pemakaian": "Sering dipakai", "noda": "Tidak ada", "jahitan": "Utuh", "bau": "Netral atau wangi" },
  "catatan": "", "cacat": [{ "label": "Pudar di kerah", "foto": "data:image/jpeg;base64,..." }],
  "foto": null, "status": "aktif"
}
```

- `jenisTransaksi: "gratis"` → `hargaJual` wajib 0 atau dihilangkan.
- `kondisi`: semua `kunci` milik kategori wajib terisi (nilai string). Kolom `pilihan` harus salah satu nilai yang diizinkan.
- `cacat` wajib minimal satu bila grade bukan `Seperti Baru` atau ada isian bertingkat >= 1. Pada `PUT`, entri dengan `id` mempertahankan foto lamanya; entri tanpa `id` adalah baru; entri yang tidak dikirim dihapus.
- `foto` pada `PUT`: dihilangkan = tetap, `null` = hapus, string = ganti.
- `status`: `aktif` atau `draf`. Draf tetap divalidasi penuh karena kartu kondisi dan harga wajib ada di basis data.
- Hanya penjual dengan toko terverifikasi yang boleh mengelola barang.

## Give It Forward

| Metode | Path | Keterangan |
|---|---|---|
| GET | `/permintaan/saya` | Pembeli. `[{ id, barangId, namaBarang, alasan, status, dibuatPada }]`. Status: `menunggu \| dipilih \| ditolak \| ditarik`. |
| GET | `/permintaan/masuk` | Penjual. Permintaan `menunggu` untuk barangnya: `[{ id, barangId, namaBarang, peminta: { namaLengkap }, alasan, dibuatPada }]`. |
| POST | `/permintaan/:id/pilih` | Penjual. Memilih penerima, menolak permintaan lain, membuat pesanan gratis berstatus `dikonfirmasi`. 201 detail pesanan. |
| DELETE | `/permintaan/:id` | Pembeli. Menarik permintaan `menunggu`. |

## Pesanan

Status: `menunggu-konfirmasi → dikonfirmasi → siap → selesai`; cabang: `dibatalkan`, `ditolak`.
Pembayaran: `belum-dibayar | dibayar | gratis`. Pembayaran simulasi dan dicatat `dibayar` saat pesanan selesai.

`header` (daftar): `{ id, barangId, namaBarang, kategori, jenis, jenisTransaksi, adaFoto, harga, hargaBaru, metodeSerah, status, statusPembayaran, pihak, dibuatPada }`. `pihak` adalah nama toko (untuk pembeli) atau nama pembeli (untuk penjual).

| Metode | Path | Keterangan |
|---|---|---|
| GET | `/pesanan` | Query `status` (`semua \| berjalan \| selesai \| batal`), `page`, `limit`. Pembeli melihat pesanannya, penjual melihat pesanan tokonya. |
| GET | `/pesanan/:id` | Detail: `header` + `{ kesesuaian, catatanKesesuaian, dibatalkanOleh, alasanPembatalan, pembeli: { namaLengkap }, toko: { id, namaToko, kota }, riwayat: [{ status, waktu }], bolehAksi: [...], barang: <detail barang> }`. |
| POST | `/pesanan` | Pembeli. Body `{ barangId, metodeSerah: "ketemuan"\|"kurir" }`. Hanya barang `jual` berstatus `aktif`. 201 detail. |
| POST | `/pesanan/:id/aksi` | Body `{ aksi, alasan?, kesesuaian?, catatan? }`. 200 detail. |

Aksi dan pelaku:

| Aksi | Pelaku | Dari status | Ke status |
|---|---|---|---|
| `konfirmasi` | penjual | menunggu-konfirmasi | dikonfirmasi |
| `tolak` | penjual | menunggu-konfirmasi | ditolak |
| `siap` | penjual | dikonfirmasi | siap |
| `batal` | penjual | dikonfirmasi, siap | dibatalkan |
| `batal` | pembeli | menunggu-konfirmasi, dikonfirmasi | dibatalkan |
| `selesai` | pembeli | siap | selesai (wajib `kesesuaian`; `berbeda` wajib `catatan` >= 5 karakter) |

Pembatalan dan penolakan mengembalikan barang ke `aktif`. Pesanan selesai mengubah barang menjadi `terjual` atau `diberikan`.

## Impact Dashboard

| Metode | Path | Keterangan |
|---|---|---|
| GET | `/dashboard` | Login. Cakupan akun (pembeli: pesanannya; penjual: pesanan tokonya). |
| GET | `/dashboard/platform` | Publik. Hanya agregat dampak platform. |

```json
{
  "cakupan": "akun",
  "ringkas": { "barangBerpindah": 9, "dijual": 8, "digratiskan": 1, "uang": 2996000, "hemat": 5200000, "skorKesesuaian": { "persen": 89, "jumlah": 9 } },
  "dampak": { "beratKg": 6.2, "emisiKgCo2e": 330.5, "nilaiDiselamatkan": 8200000 },
  "status": { "menunggu": 1, "dikonfirmasi": 0, "siap": 1, "selesai": 9, "batal": 0 },
  "perBulan": [{ "bulan": "2026-06", "label": "Jun", "dijual": 4, "digratiskan": 2 }],
  "perKategori": [{ "kategori": "fashion", "jumlah": 5 }]
}
```

`uang` = pendapatan (penjual), total dibelanjakan (pembeli), , dihitung dari pesanan `selesai`. `hemat` = harga barang baru dikurangi harga bayar, `null` untuk penjual. `skorKesesuaian` bernilai `null` bila belum ada data. `perBulan` selalu 6 bulan terakhir. Contoh JSON di atas menunjukkan format akun. Endpoint publik hanya mengirim `cakupan`, `ringkas.barangBerpindah`, `ringkas.digratiskan`, estimasi berat dan emisi pada `dampak`, `perKategori`, serta `perBulan` dengan `bulan`, `label`, dan `total`. Faktor berat dan emisi berasal dari tabel `jenis_barang` dan hanya contoh.

## Kode galat umum

`VALIDATION_ERROR` 400, `AUTH_REQUIRED` / `TOKEN_INVALID` / `TOKEN_EXPIRED` / `SESSION_REVOKED` 401, `ROLE_FORBIDDEN` / `PROVIDER_NOT_VERIFIED` 403, `*_NOT_FOUND` 404, `INVALID_STATE` / `OFFER_UNAVAILABLE` / `DATA_CONFLICT` 409, `AUTH_RATE_LIMIT` 429.
