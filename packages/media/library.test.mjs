import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createMediaLibrary, deleteAsset, ingestBatch, referenceAsset } from './src/library.mjs';

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

test('a thirty-file batch isolates one failure and blocks delete while referenced', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'fz-library-'));
  const library = createMediaLibrary();
  const files = Array.from({ length: 30 }, (_, index) => ({
    id: `ma8k2n4p6q8r${String(index).padStart(4, '0')}`,
    bytes: png(8 + index, 4),
    declaredMime: 'image/png',
  }));
  files.push({ id: 'masvg00000000001', bytes: Buffer.from('<svg></svg>'), declaredMime: 'image/svg+xml' });
  const progress = [];
  const results = await ingestBatch(library, files, root, event => progress.push(event));
  assert.equal(results.filter(result => result.ok).length, 30);
  assert.equal(results.at(-1).ok, false);
  assert.equal(results.at(-1).code, 'MIME_DENIED');
  assert.equal(progress.at(-1).completed, 31);
  assert.equal(library.assets.size, 30);
  const duplicate = await ingestBatch(library, [files[0]], root);
  assert.equal(duplicate[0].duplicate, true);
  assert.equal(library.assets.size, 30);
  referenceAsset(library, files[0].id, 'pg8k2n4p6q8r0s2t');
  assert.throws(() => deleteAsset(library, files[0].id), /ASSET_REFERENCED/);
  deleteAsset(library, files[1].id);
  assert.equal(library.assets.has(files[1].id), false);
});
