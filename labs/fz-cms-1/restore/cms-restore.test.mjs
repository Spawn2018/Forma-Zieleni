import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  readRestoredCaseStudy,
  restoreContentStore,
  snapshotContentStore,
} from '../../../packages/domain/src/cms-restore.ts';
import { createDraft, createContentStore, publishRevision } from '../../../packages/domain/src/content-publish.ts';
import { createMediaLibrary, ingestBatch, referenceAsset } from '../../../packages/media/src/library.mjs';
import { materializeMediaBackup, restoreMediaFromBackup } from '../../../packages/media/src/restore.mjs';

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

test('CMS-RESTORE reads back one published case study and its masters', async () => {
  const content = createContentStore();
  createDraft(content, {
    id: 'studylabordydomowy',
    revisionId: 'revisionstudycms002',
    type: 'ProjectCaseStudy',
    fields: { title: 'Ogród laboratoryjny' },
    actorId: 'owneradminsession01',
    at: '2026-09-22T03:10:00.000Z',
  });
  publishRevision(content, {
    documentId: 'studylabordydomowy',
    revisionId: 'revisionstudycms002',
    actorId: 'owneradminsession01',
    at: '2026-09-22T03:10:00.000Z',
  });

  const mediaRoot = await mkdtemp(path.join(tmpdir(), 'fz-cms-restore-src-'));
  const backupRoot = await mkdtemp(path.join(tmpdir(), 'fz-cms-restore-bak-'));
  const restoreRoot = await mkdtemp(path.join(tmpdir(), 'fz-cms-restore-dst-'));
  const library = createMediaLibrary();
  const master = png(16, 10);
  const ingested = await ingestBatch(library, [{
    id: 'ma8k2n4p6q8rstud',
    bytes: master,
    declaredMime: 'image/png',
  }], mediaRoot);
  referenceAsset(library, 'ma8k2n4p6q8rstud', 'studylabordydomowy');

  const contentBundle = snapshotContentStore(content, '2026-09-22T03:10:00.000Z');
  await materializeMediaBackup(library, mediaRoot, backupRoot);

  const restoredContent = restoreContentStore(contentBundle);
  const study = readRestoredCaseStudy(restoredContent, 'studylabordydomowy');
  const restoredMedia = await restoreMediaFromBackup(backupRoot, restoreRoot);
  const asset = restoredMedia.library.assets.get('ma8k2n4p6q8rstud');
  const bytes = await readFile(path.join(restoreRoot, ...asset.relativePath.split('/')));

  assert.equal(study.title, 'Ogród laboratoryjny');
  assert.equal(bytes.equals(master), true);
  assert.equal(asset.checksum, ingested[0].checksum);
  assert.equal(restoredMedia.library.references.get('ma8k2n4p6q8rstud').has('studylabordydomowy'), true);
  assert.equal(path.basename(fileURLToPath(import.meta.url)), 'cms-restore.test.mjs');
});
