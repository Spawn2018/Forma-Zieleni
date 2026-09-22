import assert from 'node:assert/strict';
import test from 'node:test';
import { notePerformance } from './src/search-performance.ts';

test('field CWV and lab media notes stay in different fields', () => {
  const notes = notePerformance({
    field: { lcpMs: 1800, cls: null },
    lab: { assetId: 'ma8k2n4p6q8r0001', displayWidth: 700, height: 450 },
  });
  assert.equal(notes.field?.source, 'field');
  assert.equal(notes.lab?.source, 'lab');
  assert.equal(notes.field && 'lcpCandidate' in notes.field, false);
  assert.equal(notes.lab && 'lcpMs' in notes.lab, false);
  assert.equal(notes.lab?.lcpCandidate, '/media/ma8k2n4p6q8r0001/w800.webp');
  assert.equal(notes.lab?.width, 800);
  assert.equal(notes.lab?.height, 450);
  assert.equal(notes.lab?.loading, 'eager');
  assert.equal(JSON.stringify(notes).includes('master'), false);
});

test('a missing field measurement stays absent and a master path is refused', () => {
  const empty = notePerformance({});
  assert.equal(empty.field, null);
  assert.equal(empty.lab, null);
  assert.notEqual(empty.field, 0);
  assert.throws(
    () => notePerformance({ lab: { assetId: 'short', displayWidth: 400, height: 300 } }),
    /ASSET_ID_INVALID/,
  );
  assert.throws(
    () => notePerformance({ lab: { assetId: 'ma8k2n4p6q8r0001', displayWidth: 400, height: 0 } }),
    /CLS_DIMENSIONS_REQUIRED/,
  );
  assert.throws(() => notePerformance({ field: { lcpMs: Number.NaN } }), /FIELD_METRIC_INVALID/);
});
