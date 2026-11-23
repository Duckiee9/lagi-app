// Uji asap terhadap server yang sedang berjalan.
// Pakai: DEMO_PASSWORD=... npm run uji:api [-- http://localhost:3000]
const base = (process.argv[2] || 'http://localhost:3000') + '/api';
const sandi = process.env.DEMO_PASSWORD;
let gagal = 0;

async function panggil(metode, path, { token, body } = {}) {
  const r = await fetch(base + path, {
    method: metode,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, json: await r.json().catch(() => null) };
}
const cek = (nama, kondisi, info = '') => { console.log(`${kondisi ? 'OK   ' : 'GAGAL'} ${nama} ${info}`); if (!kondisi) gagal++; };

const h = await panggil('GET', '/health');
cek('health', h.status === 200);
const k = await panggil('GET', '/kategori');
cek('kategori', k.json?.data?.kategori?.length === 4);
const b = await panggil('GET', '/barang?limit=3');
cek('katalog', b.json?.success && b.json.meta?.jumlah > 0, `(${b.json?.meta?.jumlah} barang)`);
cek('detail barang', (await panggil('GET', `/barang/${b.json.data[0].id}`)).json?.data?.kondisi?.length > 0);
cek('dampak platform', (await panggil('GET', '/dashboard/platform')).json?.data?.ringkas?.barangBerpindah > 0);
cek('tanpa token ditolak', (await panggil('GET', '/pesanan')).status === 401);
cek('login salah ditolak', (await panggil('POST', '/auth/login', { body: { email: 'sari@lagi.test', kataSandi: 'salah-salah-salah-salah' } })).status === 401);

if (sandi) {
  const l = await panggil('POST', '/auth/login', { body: { email: 'sari@lagi.test', kataSandi: sandi } });
  cek('login pembeli', l.status === 200, l.json?.error?.message || '');
  const token = l.json?.data?.accessToken;
  if (token) {
    cek('profil', (await panggil('GET', '/auth/saya', { token })).json?.data?.peran === 'pembeli');
    cek('pembeli tak boleh kelola barang', (await panggil('POST', '/barang', { token, body: {} })).status === 403);
    cek('dashboard akun', (await panggil('GET', '/dashboard', { token })).json?.data?.cakupan === 'akun');
    cek('logout', (await panggil('POST', '/auth/logout', { token })).status === 200);
    cek('token dicabut setelah logout', (await panggil('GET', '/auth/saya', { token })).status === 401);
  }
} else console.log('(DEMO_PASSWORD kosong: uji yang butuh login dilewati)');

console.log(gagal ? `\n${gagal} uji gagal.` : '\nSemua uji lolos.');
process.exit(gagal ? 1 : 0);
