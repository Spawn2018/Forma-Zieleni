import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createMediaLibrary, ingestBatch } from './src/library.mjs';
import { addToCollection, createCollection, createCollectionStore, reorderCollection, setBeforeAfter, setHero, updatePlacement } from './src/collections.mjs';

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

test('one master can be placed in two collections, reordered, and paired', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'fz-collections-'));
  const library = createMediaLibrary();
  const files = [
    { id: 'ma8k2n4p6q8r0001', bytes: png(12, 8), declaredMime: 'image/png' },
    { id: 'ma8k2n4p6q8r0002', bytes: png(16, 8), declaredMime: 'image/png' },
  ];
  await ingestBatch(library, files, root);
  const store = createCollectionStore(library);
  createCollection(store, 'co8k2n4p6q8r0001');
  createCollection(store, 'co8k2n4p6q8r0002');
  addToCollection(store, 'co8k2n4p6q8r0001', files[0].id, { alt: 'Cis przed', caption: 'Przed' });
  addToCollection(store, 'co8k2n4p6q8r0001', files[1].id, { alt: 'Cis po', caption: 'Po', focal: { x: 0.4, y: 0.6 } });
  addToCollection(store, 'co8k2n4p6q8r0002', files[0].id, { alt: 'Ten sam kadr' });
  assert.equal(library.assets.size, 2);
  assert.equal(library.references.get(files[0].id).size, 2);
  reorderCollection(store, 'co8k2n4p6q8r0001', [files[1].id, files[0].id]);
  assert.deepEqual(store.collections.get('co8k2n4p6q8r0001').items.map(item => item.assetId), [files[1].id, files[0].id]);
  setHero(store, 'co8k2n4p6q8r0001', files[1].id);
  setBeforeAfter(store, 'co8k2n4p6q8r0001', files[0].id, files[1].id);
  updatePlacement(store, 'co8k2n4p6q8r0001', files[0].id, { safeRegion: { x: 0.2, y: 0.3 } });
  const first = store.collections.get('co8k2n4p6q8r0001');
  assert.equal(first.heroId, files[1].id);
  assert.deepEqual(first.beforeAfter, { beforeId: files[0].id, afterId: files[1].id });
  assert.equal(first.items.find(item => item.assetId === files[0].id).safeRegion.x, 0.2);
  assert.throws(() => setBeforeAfter(store, 'co8k2n4p6q8r0001', files[0].id, files[0].id), /PAIR_IDENTICAL/);
  assert.throws(() => reorderCollection(store, 'co8k2n4p6q8r0001', [files[1].id]), /REORDER_MISMATCH/);
});
