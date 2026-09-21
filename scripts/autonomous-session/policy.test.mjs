import test from 'node:test';
import assert from 'node:assert/strict';
import { classify, limits, validateSlices } from './policy.ts';

const slice = (capability, classification = 'AUTO') => ({ id: 'audit', capability, classification, dependsOn: [] });

test('compiled capabilities enforce classification floors and explicit restrictions', () => {
  for (const [capability, label, expected] of [
    ['repo-audit', 'AUTO', 'AUTO'], ['canon-audit', 'AUTO', 'REVIEW'],
    ['choose-audit', 'AUTO', 'OWNER-DECISION'], ['repo-audit', 'REVIEW', 'REVIEW'],
    ['repo-audit', 'OWNER-DECISION', 'OWNER-DECISION'], ['repo-audit', 'OWNER-ONLY', 'OWNER-ONLY'],
    ['repo-audit', 'DANGEROUS', 'DANGEROUS'], ['unknown', 'AUTO', 'OWNER-ONLY'],
    ['constructor', 'AUTO', 'OWNER-ONLY'], ['toString', 'AUTO', 'OWNER-ONLY'],
    ['repo-audit', 'forged', 'OWNER-ONLY'], ['git push', 'AUTO', 'DANGEROUS'],
    ['production-deploy', 'REVIEW', 'DANGEROUS'], ['shell', 'OWNER-ONLY', 'DANGEROUS'],
  ]) assert.equal(classify(slice(capability, label)), expected, `${capability}/${label}`);
});

test('plans accept ordered dependencies and reject malformed or injected work', () => {
  const first = slice('repo-audit');
  const second = { ...slice('canon-audit'), id: 'review', dependsOn: ['audit'] };
  assert.deepEqual(validateSlices([first, second]), [first, second]);
  for (const value of [null, [], [first, first], [second, first],
    [{ ...first, dependsOn: ['audit'] }], [{ ...first, command: 'anything' }],
    [{ ...first, id: '../escape' }], [{ ...first, capability: 1 }],
    Array.from({ length: 33 }, (_, i) => ({ ...first, id: `audit-${i}` }))]) {
    assert.throws(() => validateSlices(value), /INVALID_PLAN/);
  }
});

test('iteration, retry and deadline bounds fail closed', () => {
  limits(1, 0, null);
  limits(100, 3, '2026-09-20T12:00:00Z');
  for (const args of [[0, 0, null], [101, 0, null], [1.5, 0, null],
    [1, -1, null], [1, 4, null], [1, 0.5, null], [1, 0, 'tomorrow'],
    [1, 0, '2026-09-20T12:00:00'], [1, 0, '2026-99-99T12:00:00Z']]) {
    assert.throws(() => limits(...args), /INVALID_LIMITS/);
  }
});
