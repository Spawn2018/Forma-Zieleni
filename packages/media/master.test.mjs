import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { sniffImage, storeMaster } from './src/master.mjs';

function png(width, height) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(25);
  ihdr.writeUInt32BE(13, 0);
  ihdr.write('IHDR', 4, 'ascii');
  ihdr.writeUInt32BE(width, 8);
  ihdr.writeUInt32BE(height, 12);
  ihdr[16] = 8;
  return Buffer.concat([signature, ihdr, Buffer.from([0, 0, 0, 0])]);
}

test('a master is checksummed, private, and immutable', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'fz-media-'));
  const bytes = png(8, 4);
  const stored = await storeMaster({ root, bytes, declaredMime: 'image/png' });
  assert.equal(stored.publicUrl, null);
  assert.equal(stored.relativePath.startsWith('masters/'), true);
  assert.equal(stored.relativePath.includes('public'), false);
  assert.equal(stored.width, 8);
  assert.equal(stored.height, 4);
  const again = await storeMaster({ root, bytes });
  assert.equal(again.checksum, stored.checksum);
  const onDisk = await readFile(path.join(root, ...stored.relativePath.split('/')));
  assert.equal(onDisk.equals(Buffer.from(bytes)), true);
});

test('svg, a mismatched type, and a pixel bomb are denied', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'fz-media-'));
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  assert.equal(sniffImage(svg), null);
  await assert.rejects(() => storeMaster({ root, bytes: svg }), /MIME_DENIED/);
  await assert.rejects(() => storeMaster({ root, bytes: png(2, 2), declaredMime: 'image/jpeg' }), /MIME_MISMATCH/);
  await assert.rejects(() => storeMaster({ root, bytes: png(20_000, 20_000) }), /PIXEL_BOMB/);
});
