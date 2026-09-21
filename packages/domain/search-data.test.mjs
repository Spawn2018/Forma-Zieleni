import test from 'node:test';
import assert from 'node:assert/strict';
import { RETENTION_NOTE, SEARCH_ENTITIES, createSearchStore, rememberObservation } from './src/search-data.ts';

test('a search observation is idempotent and cannot carry a form body', () => {
  const store = createSearchStore();
  const first = rememberObservation(store, {
    entity: 'SearchQueryObservation',
    idempotencyKey: 'gsc:query:2026-09-22',
    origin: 'google-search-console',
    sourceId: 'property-synthetic',
    observedAt: '2026-09-22T00:00:00.000Z',
    queryText: 'ogrod prywatny',
  });
  const again = rememberObservation(store, {
    entity: 'SearchQueryObservation',
    idempotencyKey: 'gsc:query:2026-09-22',
    origin: 'google-search-console',
    sourceId: 'property-synthetic',
    observedAt: '2026-09-22T00:00:00.000Z',
    queryText: 'other',
  });
  assert.equal(again, first);
  assert.equal(store.rows.length, 1);
  assert.equal(first.retention, 'UNKNOWN');
  assert.match(RETENTION_NOTE, /UNKNOWN/);
  assert.equal(SEARCH_ENTITIES.includes('AICitationObservation'), true);
  const citation = rememberObservation(store, {
    entity: 'AICitationObservation',
    idempotencyKey: 'citation:empty:0001',
    origin: 'manual-import',
    sourceId: 'none',
    observedAt: '2026-09-22T00:00:00.000Z',
  });
  assert.equal(citation.queryText, null);
  assert.throws(() => rememberObservation(store, {
    entity: 'SearchPageObservation',
    idempotencyKey: 'page:with-form',
    origin: 'google-search-console',
    sourceId: 'property-synthetic',
    observedAt: '2026-09-22T00:00:00.000Z',
    formBody: { message: 'hello' },
  }), /FORM_BODY_REJECTED/);
});
