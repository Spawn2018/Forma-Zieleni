import test from 'node:test';
import assert from 'node:assert/strict';
import { createSearchStore, rememberObservation } from './src/search-data.ts';
import {
  listUnresyncableAfterUpstreamRetention,
  restoreSearchStore,
  snapshotSearchStore,
} from './src/search-recovery.ts';

test('search recovery restores synthetic observations', () => {
  const store = createSearchStore();
  rememberObservation(store, {
    entity: 'SearchQueryObservation',
    idempotencyKey: 'gsc:query:2026-09-01',
    origin: 'google-search-console',
    sourceId: 'property-synthetic',
    observedAt: '2026-09-01T00:00:00.000Z',
    queryText: 'ogrod prywatny',
  });
  rememberObservation(store, {
    entity: 'CrawlObservation',
    idempotencyKey: 'cf:crawl:2026-09-10',
    origin: 'cloudflare-crawler',
    sourceId: 'property-synthetic',
    observedAt: '2026-09-10T00:00:00.000Z',
  });
  const bundle = snapshotSearchStore(store);
  const restored = restoreSearchStore(bundle);
  assert.equal(restored.rows.length, 2);
  assert.equal(restored.byKey.get('gsc:query:2026-09-01')?.queryText, 'ogrod prywatny');
});

test('unresyncable list is written when retention is unknown or past a known window', () => {
  const store = createSearchStore();
  rememberObservation(store, {
    entity: 'SearchPageObservation',
    idempotencyKey: 'bing:page:2025-01-01',
    origin: 'bing-webmaster',
    sourceId: 'property-synthetic',
    observedAt: '2025-01-01T00:00:00.000Z',
  });
  rememberObservation(store, {
    entity: 'SearchPageObservation',
    idempotencyKey: 'bing:page:2026-09-20',
    origin: 'bing-webmaster',
    sourceId: 'property-synthetic',
    observedAt: '2026-09-20T00:00:00.000Z',
  });

  const unknown = listUnresyncableAfterUpstreamRetention(store);
  assert.match(unknown.note, /UNKNOWN/);
  assert.equal(unknown.rows.length, 2);
  assert.equal(unknown.rows.every((r) => r.reason === 'UPSTREAM_RETENTION_UNKNOWN'), true);

  const known = listUnresyncableAfterUpstreamRetention(store, {
    knownRetentionDays: 90,
    asOf: '2026-09-22',
  });
  assert.equal(known.rows.length, 1);
  assert.equal(known.rows[0].idempotencyKey, 'bing:page:2025-01-01');
  assert.equal(known.rows[0].reason, 'PAST_KNOWN_RETENTION_WINDOW');
});
