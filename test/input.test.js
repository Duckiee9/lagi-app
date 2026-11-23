import test from 'node:test';
import assert from 'node:assert/strict';
import * as in_ from '../src/lib/input.js';
import { paginasi, paramId } from '../src/lib/api.js';

test('email dinormalkan dan divalidasi', () => {
  assert.equal(in_.email('  Sari@LAGI.test '), 'sari@lagi.test');
  assert.throws(() => in_.email('bukan-email'));
});

test('kata sandi minimal 15 karakter', () => {
  assert.throws(() => in_.kataSandi('pendek'), /minimal 15/);
  assert.equal(in_.kataSandi('sandi-yang-cukup-panjang'), 'sandi-yang-cukup-panjang');
  assert.throws(() => in_.kataSandi('x'.repeat(129)));
});

test('telepon Indonesia', () => {
  assert.equal(in_.telepon('0812-3456-7890'), '081234567890');
  assert.equal(in_.telepon('+628123456789'), '+628123456789');
  assert.throws(() => in_.telepon('12345'));
});

test('rupiah harus bulat dalam rentang', () => {
  assert.equal(in_.rupiah('90000', 'Harga'), 90000);
  assert.throws(() => in_.rupiah(1.5, 'Harga'));
  assert.throws(() => in_.rupiah(-1, 'Harga'));
  assert.throws(() => in_.rupiah('abc', 'Harga'));
});

test('teks merapikan spasi dan membatasi panjang', () => {
  assert.equal(in_.teks('  a   b  ', 'Nama'), 'a b');
  assert.throws(() => in_.teks('', 'Nama'));
  assert.throws(() => in_.teks('x'.repeat(201), 'Nama'));
  assert.throws(() => in_.teks(42, 'Nama'));
});

test('paramId menolak bukan angka dan nol di depan', () => {
  assert.equal(paramId('12'), '12');
  for (const x of ['0', '01', '1; DROP', '-1', '1'.repeat(19)]) assert.throws(() => paramId(x));
});

test('paginasi dibatasi', () => {
  assert.deepEqual(paginasi({ page: '3', limit: '100' }), { page: 3, limit: 24, offset: 48 });
  assert.deepEqual(paginasi({ page: '-2', limit: 'x' }), { page: 1, limit: 8, offset: 0 });
});
