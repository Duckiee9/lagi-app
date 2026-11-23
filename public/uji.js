let token = null;
const $ = (s) => document.querySelector(s);
const CEPAT = [
  ['GET', '/kategori'], ['GET', '/barang?limit=3'], ['GET', '/barang?jenis=gratis'], ['GET', '/dashboard/platform'],
  ['GET', '/auth/saya'], ['GET', '/pesanan'], ['GET', '/dashboard'], ['GET', '/permintaan/saya'], ['GET', '/barang/milik-saya'],
];

async function kirim(metode, path, body) {
  const res = await fetch('/api' + path, {
    method: metode,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body || undefined,
  });
  const teks = await res.text();
  $('#status-res').textContent = `${res.status} ${res.statusText}`;
  try { $('#hasil').textContent = JSON.stringify(JSON.parse(teks), null, 2); } catch { $('#hasil').textContent = `(${res.headers.get('content-type')}, ${teks.length} byte)`; }
}

$('#f-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: f.get('email'), kataSandi: f.get('kataSandi') }) });
  const j = await res.json();
  token = j.success ? j.data.accessToken : null;
  $('#status-login').textContent = j.success ? `masuk sebagai ${j.data.pengguna.email} (${j.data.pengguna.peran})` : j.error.message;
});
$('#f-req').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  kirim(f.get('metode'), f.get('path'), f.get('body').trim()).catch((x) => { $('#hasil').textContent = String(x); });
});
for (const [m, p] of CEPAT) {
  const b = document.createElement('button');
  b.type = 'button'; b.textContent = `${m} ${p}`;
  b.onclick = () => kirim(m, p).catch((x) => { $('#hasil').textContent = String(x); });
  $('#cepat').append(b);
}
