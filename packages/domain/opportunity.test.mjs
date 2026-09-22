import test from 'node:test';
import assert from 'node:assert/strict';
import { createLead, qualifyLead } from './src/lead.ts';
import { assertOpaqueOpportunityId, createOpportunity } from './src/opportunity.ts';

const at = '2026-09-22T12:00:00.000Z';
const capture = {
  name: 'Anna Kowalska',
  phone: '+48 600 000 000',
  email: 'anna@example.invalid',
  locality: 'Kraków',
  siteAnalysisRequested: true,
};

function qualifiedLead() {
  return qualifyLead(createLead('ld8k2n4p6q8r0s2t', 'www', capture, at), false, '2026-09-22T12:05:00.000Z');
}

test('opaque opportunity identifiers reject sequential or prefixed guessable values', () => {
  assert.equal(assertOpaqueOpportunityId('p9k2n4p6q8r0s2t4'), 'p9k2n4p6q8r0s2t4');
  for (const id of ['1', 'opp1', 'OPPORTUNITY99', 'short']) {
    assert.throws(() => assertOpaqueOpportunityId(id), /OPPORTUNITY_ID_GUESSABLE/);
  }
});

test('opportunity is created only from a qualified lead and owns its status', () => {
  const lead = qualifiedLead();
  const opportunity = createOpportunity('p9k2n4p6q8r0s2t4', lead, '2026-09-22T12:10:00.000Z');
  assert.equal(opportunity.leadId, lead.id);
  assert.equal(opportunity.status, 'open');
  assert.equal(Object.hasOwn(opportunity, 'stage'), false);
  assert.equal(Object.hasOwn(opportunity, 'price'), false);
  assert.equal(Object.hasOwn(opportunity, 'probability'), false);
});

test('unqualified leads cannot open an opportunity', () => {
  const lead = createLead('ld8k2n4p6q8r0s2t', 'www', capture, at);
  assert.throws(() => createOpportunity('p9k2n4p6q8r0s2t4', lead, at), /LEAD_NOT_QUALIFIED/);
});
