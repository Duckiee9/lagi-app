import test from 'node:test';
import assert from 'node:assert/strict';
import { FOTO_MAKS, urai } from '../src/lib/foto.js';

const url = (mime, bytes) => `data:${mime};base64,${Buffer.from(bytes).toString('base64')}`;
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0];

test('menerima PNG, JPEG, WebP yang isinya cocok', () => {
  assert.equal(urai(url('image/png', PNG)).mime, 'image/png');
  assert.equal(urai(url('image/jpeg', [0xff, 0xd8, 0xff, 0xe0, 0])).mime, 'image/jpeg');
  const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP')]);
  assert.equal(urai(url('image/webp', webp)).data.length, 12);
});

test('menolak isi yang tidak sesuai label MIME', () => {
  assert.throws(() => urai(url('image/png', [0xff, 0xd8, 0xff, 0xe0])), /tidak sesuai/);
  assert.throws(() => urai(url('image/png', Buffer.from('<svg onload=alert(1)>'))), /tidak sesuai/);
});

test('menolak format lain, bukan string, dan terlalu besar', () => {
  assert.throws(() => urai('data:image/svg+xml;base64,PHN2Zz4='));
  assert.throws(() => urai('http://x/y.png'));
  assert.throws(() => urai(null));
  assert.throws(() => urai(url('image/png', Buffer.concat([Buffer.from(PNG), Buffer.alloc(FOTO_MAKS)]))), /2 MiB/);
});
