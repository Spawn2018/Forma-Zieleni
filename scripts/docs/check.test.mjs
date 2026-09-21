import test from 'node:test';
import assert from 'node:assert/strict';
import { checkDocumentation } from './check.mjs';
import { documentationSignal } from './learning.mjs';

test('documentation pointers, events, and the plan contract stay consistent', () => {
  assert.deepEqual(checkDocumentation(), []);
});

test('a documentation signal stays an observation and uses a known category', () => {
  const record = documentationSignal('DOC_STALE', 'The runbook described a deploy that is not allowed.');
  assert.equal(record.status, 'OBSERVED');
  assert.equal(record.patternKey, 'doc-stale');
  assert.throws(() => documentationSignal('DOC_NOT_A_SIGNAL', 'This category is not allowed.'), /DOC_SIGNAL_UNKNOWN/);
});
