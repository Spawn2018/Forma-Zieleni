import test from 'node:test';
import assert from 'node:assert/strict';
import { checkClosure, mayStartMutation } from './closure.mjs';

test('directive sections, canon gates, and the docs tree are classified', () => {
  const result = checkClosure();
  assert.deepEqual(result.errors, []);
  assert.equal(result.unexplained, 0);
  assert.ok(result.sections > 500);
  assert.equal(result.mapped, result.normative);
  assert.ok(result.files > 50);
});

test('a mismatched recovery head blocks mutation', () => {
  assert.equal(mayStartMutation('df200a6a12a66bb26af04f000fcc43ac27984986', 'df200a6a12a66bb26af04f000fcc43ac27984986').ok, true);
  assert.equal(mayStartMutation('df200a6a12a66bb26af04f000fcc43ac27984986', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa').reason, 'RECOVERY_REQUIRED');
});
