import test from 'node:test';
import assert from 'node:assert/strict';
import { cacatWajib, gradeDisarankan, tampilKondisi, validasiGrade, validasiKondisi } from '../src/lib/kondisi.js';

const bagus = { ukuran: 'M', pemakaian: 'Dipakai 1–5 kali', noda: 'Tidak ada', jahitan: 'Utuh', bau: 'Netral atau wangi' };

test('kondisi tanpa catatan menyarankan Seperti Baru', () => {
  const r = validasiKondisi('fashion', bagus);
  assert.equal(r.tingkatMaks, 0);
  assert.equal(gradeDisarankan(r.tingkatMaks), 'Seperti Baru');
  assert.equal(cacatWajib('Seperti Baru', 0), false);
});

test('satu catatan membuat grade minimal Baik dan cacat wajib', () => {
  const r = validasiKondisi('fashion', { ...bagus, noda: 'Samar' });
  assert.equal(gradeDisarankan(r.tingkatMaks), 'Baik');
  assert.throws(() => validasiGrade('Seperti Baru', r.tingkatMaks), /terlalu tinggi/);
  assert.equal(validasiGrade('Baik', r.tingkatMaks), 'Baik');
  assert.equal(validasiGrade('Layak Pakai', r.tingkatMaks), 'Layak Pakai');
  assert.equal(cacatWajib('Baik', r.tingkatMaks), true);
});

test('cacat berarti memaksa Layak Pakai', () => {
  const r = validasiKondisi('fashion', { ...bagus, noda: 'Terlihat jelas' });
  assert.equal(gradeDisarankan(r.tingkatMaks), 'Layak Pakai');
  assert.throws(() => validasiGrade('Baik', r.tingkatMaks));
});

test('baterai: ambang 90 dan 80', () => {
  const el = { baterai: '95', layar: 'Mulus', fungsi: 'Semua berfungsi normal', kelengkapan: 'Fullset dengan dus', servis: 'Belum pernah diservis', garansi: 'Tidak ada' };
  assert.equal(validasiKondisi('elektronik', el).tingkatMaks, 0);
  assert.equal(validasiKondisi('elektronik', { ...el, baterai: '85' }).tingkatMaks, 1);
  assert.equal(validasiKondisi('elektronik', { ...el, baterai: '70' }).tingkatMaks, 2);
  assert.equal(validasiKondisi('elektronik', { ...el, baterai: 90 }).tingkatMaks, 0);
});

test('menolak isian kosong, opsi asing, dan angka di luar rentang', () => {
  assert.throws(() => validasiKondisi('fashion', { ...bagus, ukuran: '' }), /wajib diisi/);
  assert.throws(() => validasiKondisi('fashion', { ...bagus, noda: 'Parah' }), /tidak valid/);
  assert.throws(() => validasiKondisi('elektronik', { baterai: '120' }), /1–100/);
  assert.throws(() => validasiKondisi('mobil', {}), /Kategori/);
  assert.throws(() => validasiKondisi('fashion', [bagus]), /objek/);
});

test('kunci asing diabaikan, hanya skema yang disimpan', () => {
  const r = validasiKondisi('fashion', { ...bagus, nakal: '<script>' });
  assert.equal('nakal' in r.kondisi, false);
});

test('tampilKondisi berurutan sesuai skema dengan tingkat', () => {
  const t = tampilKondisi('fashion', { ...bagus, noda: 'Samar' });
  assert.deepEqual(t.map((x) => x.kunci), ['ukuran', 'pemakaian', 'noda', 'jahitan', 'bau']);
  assert.equal(t[0].tingkat, null);
  assert.equal(t.find((x) => x.kunci === 'noda').tingkat, 1);
});
