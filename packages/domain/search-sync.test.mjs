import test from 'node:test';
import assert from 'node:assert/strict';
import { createSearchStore } from './src/search-data.ts';
import { createFixtureConnectors } from './src/search-connectors.ts';
import {
  backoffDelayMs,
  createSearchSyncJob,
  runSearchSyncJob,
  SYNC_BACKOFF_BASE_MS,
  SYNC_BACKOFF_MAX_MS,
} from './src/search-sync.ts';

test('sync job persists fixture rows and advances checkpoints', () => {
  const store = createSearchStore();
  const job = createSearchSyncJob('property-synthetic');
  const result = runSearchSyncJob(job, {
    connectors: createFixtureConnectors(),
    store,
    nowMs: 1_000_000,
    nowIso: '2026-09-22T01:00:00.000Z',
  });
  assert.equal(result.totalPersisted, 4);
  assert.equal(store.rows.length, 4);
  assert.equal(result.job.checkpoints['google-search-console'].cursor, 'gsc-cursor-1');
  assert.equal(result.job.checkpoints['bing-webmaster'].cursor, 'bing-cursor-1');
  assert.equal(result.job.lastRunAt, '2026-09-22T01:00:00.000Z');
});

test('one provider outage does not block other connectors', () => {
  const store = createSearchStore();
  const job = createSearchSyncJob('outage');
  const result = runSearchSyncJob(job, {
    connectors: createFixtureConnectors(),
    store,
    nowMs: 2_000_000,
  });
  const gsc = result.outcomes.find((o) => o.connectorId === 'google-search-console');
  const bing = result.outcomes.find((o) => o.connectorId === 'bing-webmaster');
  assert.equal(gsc.status, 'outage');
  assert.equal(gsc.persisted, 0);
  assert.equal(bing.status, 'ok');
  assert.equal(bing.persisted, 1);
  assert.equal(store.rows.length, 3);
  assert.equal(store.rows.some((r) => r.provenance.origin === 'google-search-console'), false);
});

test('backoff skips a rate-limited connector until the window passes', () => {
  assert.equal(backoffDelayMs(1), SYNC_BACKOFF_BASE_MS);
  assert.equal(backoffDelayMs(2), SYNC_BACKOFF_BASE_MS * 2);
  assert.equal(backoffDelayMs(20), SYNC_BACKOFF_MAX_MS);

  const store = createSearchStore();
  const job = createSearchSyncJob('rate-limited');
  const t0 = 10_000_000;
  const first = runSearchSyncJob(job, {
    connectors: createFixtureConnectors(),
    store,
    nowMs: t0,
  });
  assert.equal(first.outcomes.find((o) => o.connectorId === 'google-search-console').status, 'rate_limited');
  assert.equal(first.job.checkpoints['google-search-console'].backoffUntilMs, t0 + SYNC_BACKOFF_BASE_MS);

  const tooSoon = runSearchSyncJob(first.job, {
    connectors: createFixtureConnectors(),
    store,
    nowMs: t0 + 1_000,
  });
  const gscSoon = tooSoon.outcomes.find((o) => o.connectorId === 'google-search-console');
  assert.equal(gscSoon.status, 'skipped_backoff');
  assert.equal(gscSoon.persisted, 0);

  const afterBackoff = runSearchSyncJob(tooSoon.job, {
    connectors: createFixtureConnectors(),
    store,
    nowMs: t0 + SYNC_BACKOFF_BASE_MS + 1,
  });
  assert.equal(afterBackoff.outcomes.find((o) => o.connectorId === 'google-search-console').status, 'rate_limited');
});

test('re-running sync is idempotent for the same fixture keys', () => {
  const store = createSearchStore();
  let job = createSearchSyncJob('property-synthetic');
  job = runSearchSyncJob(job, { connectors: createFixtureConnectors(), store, nowMs: 3_000_000 }).job;
  for (const id of Object.keys(job.checkpoints)) {
    job.checkpoints[id].cursor = null;
  }
  runSearchSyncJob(job, { connectors: createFixtureConnectors(), store, nowMs: 3_000_001 });
  assert.equal(store.rows.length, 4);
});
