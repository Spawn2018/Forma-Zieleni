import test from 'node:test';
import assert from 'node:assert/strict';
import { validateOpportunityCreateRequest } from './src/opportunity.ts';

test('opportunity create accepts only an opaque lead id', () => {
  const ok = validateOpportunityCreateRequest({ leadId: 'ld8k2n4p6q8r0s2t' });
  assert.equal(ok.ok, true);
  if (ok.ok) assert.equal(ok.value.leadId, 'ld8k2n4p6q8r0s2t');
});

test('opportunity create rejects client status and unknown fields', () => {
  const withStatus = validateOpportunityCreateRequest({ leadId: 'ld8k2n4p6q8r0s2t', status: 'open' });
  assert.equal(withStatus.ok, false);
  const withStage = validateOpportunityCreateRequest({ leadId: 'ld8k2n4p6q8r0s2t', stage: 'won' });
  assert.equal(withStage.ok, false);
  const badId = validateOpportunityCreateRequest({ leadId: 'lead1' });
  assert.equal(badId.ok, false);
});
