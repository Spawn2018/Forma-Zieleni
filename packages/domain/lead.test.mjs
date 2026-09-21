import test from 'node:test';
import assert from 'node:assert/strict';
import { assertOpaqueLeadId, createLead, evaluateQualification, normalizeCapture, qualifyLead } from './src/lead.ts';

const at = '2026-09-21T10:00:00.000Z';
const valid = {
  name: 'Anna Kowalska',
  phone: '+48 600 000 000',
  email: 'anna@example.invalid',
  locality: 'Kraków',
  siteAnalysisRequested: true,
};

test('capture normalizes contact and rejects incomplete or oversized fields', () => {
  assert.equal(normalizeCapture(valid).email, 'anna@example.invalid');
  for (const input of [
    { ...valid, name: ' ' },
    { ...valid, phone: '123' },
    { ...valid, email: 'not-an-email' },
    { ...valid, locality: 'x'.repeat(201) },
  ]) assert.throws(() => normalizeCapture(input));
});

test('opaque lead identifiers reject sequential or prefixed guessable values', () => {
  assert.equal(assertOpaqueLeadId('ld8k2n4p6q8r0s2t'), 'ld8k2n4p6q8r0s2t');
  for (const id of ['1', 'lead1', 'LEAD99', 'short']) assert.throws(() => assertOpaqueLeadId(id), /LEAD_ID_GUESSABLE/);
});

test('qualification requires property context and holds when capacity is closed', () => {
  assert.deepEqual(evaluateQualification(valid, false), {
    result: 'qualified', reasons: ['ready_for_consultation'],
  });
  assert.deepEqual(evaluateQualification({ ...valid, locality: undefined }, false), {
    result: 'needs_review', reasons: ['missing_property_context'],
  });
  assert.deepEqual(evaluateQualification(valid, true), {
    result: 'needs_review', reasons: ['capacity_hold'],
  });
});

test('create and qualify follow the visitor to qualified-lead lifecycle without inventing prices', () => {
  const lead = createLead('ld8k2n4p6q8r0s2t', 'www', valid, at);
  assert.equal(lead.status, 'site_analysis');
  assert.equal(lead.qualification.result, 'pending');
  assert.equal(Object.hasOwn(lead, 'budget_min_pln'), false);
  const qualified = qualifyLead(lead, false, '2026-09-21T10:05:00.000Z');
  assert.equal(qualified.status, 'qualified');
  assert.equal(qualified.qualification.result, 'qualified');
});
