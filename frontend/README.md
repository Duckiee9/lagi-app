# LAGI. Frontend

Vue 3 + Vite + Vue Router. Semua data berasal dari API di `../src` (kontrak: `../docs/API.md`).

```bash
npm install
npm run dev      # http://127.0.0.1:5173, /api diteruskan ke http://127.0.0.1:3000
npm run build    # hasil di dist/, otomatis disajikan Express bila ada
```

Jalankan backend lebih dulu (`npm start` di folder induk). Tampilan terang saja.
Struktur: `src/views` (halaman), `src/views/penjual` (area penjual), `src/components`, `src/lib` (api, sesi, format, ilustrasi), `src/router`.
