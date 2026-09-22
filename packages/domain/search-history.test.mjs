import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HISTORY_WINDOW_DAYS,
  compareYearOverYear,
  createSnapshotStore,
  rememberSnapshot,
  viewHistoryWindow,
} from './src/search-history.ts';

function snap(id, start, end, count, windowDays = 28) {
  return {
    snapshotId: id,
    propertyId: 'property-synthetic',
    windowDays,
    periodStart: start,
    periodEnd: end,
    collectedAt: `${end}T12:00:00.000Z`,
    observationCount: count,
  };
}

test('history windows are fixed and aggregate stored snapshots', () => {
  assert.deepEqual(HISTORY_WINDOW_DAYS, [7, 28, 90, 180, 365]);
  const store = createSnapshotStore();
  rememberSnapshot(store, snap('a', '2026-08-26', '2026-09-01', 3, 28));
  rememberSnapshot(store, snap('b', '2026-09-02', '2026-09-08', 5, 28));
  const view = viewHistoryWindow(store, {
    propertyId: 'property-synthetic',
    windowDays: 28,
    asOf: '2026-09-22',
  });
  assert.equal(view.snapshots.length, 2);
  assert.equal(view.observationTotal, 8);
  assert.equal(view.periodStart, '2026-08-26');
  assert.equal(view.periodEnd, '2026-09-22');
});

test('year-over-year compares only when both sides have snapshots', () => {
  const store = createSnapshotStore();
  rememberSnapshot(store, snap('current', '2026-09-16', '2026-09-22', 4, 7));
  const missingPrior = compareYearOverYear(store, {
    propertyId: 'property-synthetic',
    windowDays: 7,
    asOf: '2026-09-22',
  });
  assert.equal(missingPrior.comparable, false);
  assert.equal(missingPrior.current?.observationTotal, 4);
  assert.equal(missingPrior.prior, null);

  rememberSnapshot(store, snap('prior', '2025-09-16', '2025-09-22', 2, 7));
  const both = compareYearOverYear(store, {
    propertyId: 'property-synthetic',
    windowDays: 7,
    asOf: '2026-09-22',
  });
  assert.equal(both.comparable, true);
  assert.equal(both.prior?.observationTotal, 2);
});
