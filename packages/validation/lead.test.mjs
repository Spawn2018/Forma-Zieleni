import test from 'node:test';
import assert from 'node:assert/strict';
import { problem, validateLeadCaptureRequest, validateLeadQualifyRequest } from './src/lead.ts';

test('lead capture validation accepts a complete public request and rejects extras', () => {
  const ok = validateLeadCaptureRequest({
    source: 'www',
    name: 'Anna Kowalska',
    phone: '+48 600 000 000',
    siteAnalysisRequested: true,
    locality: 'Kraków',
  });
  assert.equal(ok.ok, true);
  const rejected = validateLeadCaptureRequest({
    source: 'www',
    name: 'Anna Kowalska',
    phone: '+48 600 000 000',
    siteAnalysisRequested: true,
    budget_min_pln: 10000,
  });
  assert.equal(rejected.ok, false);
  assert.equal(rejected.errors[0].reason, 'UNKNOWN_FIELD');
});

test('public capture rejects internal sources and non-string fields', () => {
  for (const source of ['portal', 'admin']) {
    const rejected = validateLeadCaptureRequest({
      source,
      name: 'Anna Kowalska',
      phone: '+48 600 000 000',
      siteAnalysisRequested: true,
    });
    assert.equal(rejected.ok, false);
    assert.equal(rejected.errors[0].reason, 'LEAD_SOURCE_INVALID');
  }
  const coerced = validateLeadCaptureRequest({
    source: 'www',
    name: { given: 'Anna' },
    phone: 600000000,
    email: ['anna@example.invalid'],
    siteAnalysisRequested: true,
  });
  assert.equal(coerced.ok, false);
  assert.deepEqual(coerced.errors.map(error => error.reason), ['STRING_REQUIRED']);
});

test('problem documents stay free of secrets and include request correlation', () => {
  const body = problem('LEAD_INVALID', 'Lead could not be accepted.', 'req_test_001', [{ field: 'phone', reason: 'LEAD_PHONE_INVALID' }]);
  assert.equal(body.error.requestId, 'req_test_001');
  assert.equal(JSON.stringify(body).includes('password'), false);
});

test('qualify body accepts only a boolean capacity hold', () => {
  assert.equal(validateLeadQualifyRequest({ capacityHold: false }).ok, true);
  assert.equal(validateLeadQualifyRequest({ capacityHold: 'true' }).ok, false);
  assert.equal(validateLeadQualifyRequest(['capacityHold']).ok, false);
  assert.equal(validateLeadCaptureRequest(['www']).ok, false);
});
