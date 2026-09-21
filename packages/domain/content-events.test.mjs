import test from 'node:test';
import assert from 'node:assert/strict';
import { applyBusinessProjectCompleted } from './src/content-events.ts';
import { createContentStore, createDraft, publicProjection } from './src/content-publish.ts';

test('completing a business project does not publish content or write an outbox row', () => {
  const store = createContentStore();
  createDraft(store, {
    id: 'pg8k2n4p6q8r0s2t',
    revisionId: 'rv8k2n4p6q8r0s2ta',
    type: 'ProjectCaseStudy',
    fields: { title: 'Szkic realizacji' },
    actorId: 'actoreditor000001',
    at: '2026-09-21T12:00:00.000Z',
  });
  const effect = applyBusinessProjectCompleted(store);
  assert.equal(effect.published, false);
  assert.equal(effect.outboxLength, 0);
  assert.equal(store.outbox.length, 0);
  assert.equal(publicProjection(store, 'pg8k2n4p6q8r0s2t'), null);
});
