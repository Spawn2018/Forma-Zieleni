import test from 'node:test';
import assert from 'node:assert/strict';
import {
  readRestoredCaseStudy,
  restoreContentStore,
  snapshotContentStore,
} from './src/cms-restore.ts';
import { createContentStore, createDraft, publishRevision } from './src/content-publish.ts';

test('content restore returns a published ProjectCaseStudy', () => {
  const store = createContentStore();
  createDraft(store, {
    id: 'studylabordydomowy',
    revisionId: 'revisionstudycms001',
    type: 'ProjectCaseStudy',
    fields: { title: 'Ogród laboratoryjny', summary: 'Synthetic restore subject' },
    actorId: 'owneradminsession01',
    at: '2026-09-22T03:00:00.000Z',
  });
  publishRevision(store, {
    documentId: 'studylabordydomowy',
    revisionId: 'revisionstudycms001',
    actorId: 'owneradminsession01',
    at: '2026-09-22T03:00:00.000Z',
  });
  const bundle = snapshotContentStore(store, '2026-09-22T03:00:00.000Z');
  const restored = restoreContentStore(bundle);
  const study = readRestoredCaseStudy(restored, 'studylabordydomowy');
  assert.equal(study.title, 'Ogród laboratoryjny');
  assert.equal(study.type, 'ProjectCaseStudy');
});
