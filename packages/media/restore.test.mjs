import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createMediaLibrary, ingestBatch, referenceAsset } from './src/library.mjs';
import { materializeMediaBackup, restoreMediaFromBackup } from './src/restore.mjs';

function png(width, height) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(17);
  ihdr.writeUInt32BE(13, 0);
  ihdr.write('IHDR', 4, 'ascii');
  ihdr.writeUInt32BE(width, 8);
  ihdr.writeUInt32BE(height, 12);
  ihdr[16] = 8;
  return Buffer.concat([signature, ihdr]);
}

test('media restore reads back master bytes by checksum', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'fz-media-src-'));
  const backup = await mkdtemp(path.join(tmpdir(), 'fz-media-bak-'));
  const target = await mkdtemp(path.join(tmpdir(), 'fz-media-dst-'));
  const library = createMediaLibrary();
  const bytes = png(12, 8);
  const results = await ingestBatch(library, [{
    id: 'ma8k2n4p6q8r0001',
    bytes,
    declaredMime: 'image/png',
  }], root);
  assert.equal(results[0].ok, true);
  referenceAsset(library, 'ma8k2n4p6q8r0001', 'studylabordydomowy');
  const bundle = await materializeMediaBackup(library, root, backup);
  assert.equal(bundle.assets.length, 1);
  const restored = await restoreMediaFromBackup(backup, target);
  assert.equal(restored.library.assets.size, 1);
  const asset = restored.library.assets.get('ma8k2n4p6q8r0001');
  const restoredBytes = await readFile(path.join(target, ...asset.relativePath.split('/')));
  assert.equal(restoredBytes.equals(bytes), true);
  assert.equal(asset.checksum, results[0].checksum);
  assert.equal(restored.library.references.get('ma8k2n4p6q8r0001').has('studylabordydomowy'), true);
});
