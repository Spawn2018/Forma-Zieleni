import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createContentStore,
  createDraft,
  editDraft,
  publicProjection,
  publishRevision,
  releaseDue,
  rollbackRevision,
} from './src/content-publish.ts';

const at = '2026-09-21T12:00:00.000Z';
const later = '2026-09-22T12:00:00.000Z';
const actorId = 'actoreditor000001';

function draft() {
  const store = createContentStore();
  createDraft(store, {
    id: 'pg8k2n4p6q8r0s2t',
    revisionId: 'rv8k2n4p6q8r0s2ta',
    type: 'Service',
    fields: { title: 'Projekt ogrodu', summary: 'Pierwsza wersja publiczna.' },
    actorId,
    at,
  });
  return store;
}

test('a draft stays invisible and a later edit does not change the published snapshot', () => {
  const store = draft();
  assert.equal(publicProjection(store, 'pg8k2n4p6q8r0s2t'), null);
  publishRevision(store, {
    documentId: 'pg8k2n4p6q8r0s2t',
    revisionId: 'rv8k2n4p6q8r0s2ta',
    actorId,
    at,
  });
  editDraft(store, {
    documentId: 'pg8k2n4p6q8r0s2t',
    revisionId: 'rv8k2n4p6q8r0s2tb',
    fields: { title: 'Szkic nieopublikowany' },
    actorId,
  });
  assert.equal(publicProjection(store, 'pg8k2n4p6q8r0s2t')?.title, 'Projekt ogrodu');
  assert.equal(JSON.stringify(store.outbox).includes('Szkic'), false);
});

test('rollback restores an older revision and schedule waits for its time', () => {
  const store = draft();
  publishRevision(store, {
    documentId: 'pg8k2n4p6q8r0s2t',
    revisionId: 'rv8k2n4p6q8r0s2ta',
    actorId,
    at,
  });
  editDraft(store, {
    documentId: 'pg8k2n4p6q8r0s2t',
    revisionId: 'rv8k2n4p6q8r0s2tb',
    fields: { title: 'Druga wersja' },
    actorId,
  });
  publishRevision(store, {
    documentId: 'pg8k2n4p6q8r0s2t',
    revisionId: 'rv8k2n4p6q8r0s2tb',
    actorId,
    at,
    publishAt: later,
  });
  assert.equal(publicProjection(store, 'pg8k2n4p6q8r0s2t')?.title, 'Projekt ogrodu');
  assert.equal(releaseDue(store, at, actorId).length, 0);
  assert.equal(releaseDue(store, later, actorId).length, 1);
  assert.equal(publicProjection(store, 'pg8k2n4p6q8r0s2t')?.title, 'Druga wersja');
  rollbackRevision(store, {
    documentId: 'pg8k2n4p6q8r0s2t',
    revisionId: 'rv8k2n4p6q8r0s2ta',
    actorId,
    at: later,
  });
  assert.equal(publicProjection(store, 'pg8k2n4p6q8r0s2t')?.title, 'Projekt ogrodu');
  assert.equal(store.audit.some(event => event.action === 'content.rolled_back'), true);
  assert.equal(store.outbox.every(event => event.type === 'content.published'), true);
});
