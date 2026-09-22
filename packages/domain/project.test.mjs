import test from 'node:test';
import assert from 'node:assert/strict';
import { createLead, qualifyLead } from './src/lead.ts';
import { createOpportunity } from './src/opportunity.ts';
import { createOffer } from './src/offer.ts';
import { createContract } from './src/contract.ts';
import { assertOpaqueProjectId, createProject } from './src/project.ts';

const at = '2026-09-22T12:00:00.000Z';
const capture = {
  name: 'Anna Kowalska',
  phone: '+48 600 000 000',
  email: 'anna@example.invalid',
  locality: 'Kraków',
  siteAnalysisRequested: true,
};

function draftContract() {
  const lead = qualifyLead(createLead('ld8k2n4p6q8r0s2t', 'www', capture, at), false, '2026-09-22T12:05:00.000Z');
  const opportunity = createOpportunity('p9k2n4p6q8r0s2t4', lead, '2026-09-22T12:10:00.000Z');
  const offer = createOffer('f9k2n4p6q8r0s2t4', opportunity, '2026-09-22T12:15:00.000Z');
  return createContract('c9k2n4p6q8r0s2t4', offer, '2026-09-22T12:20:00.000Z');
}

test('opaque project identifiers reject sequential or prefixed guessable values', () => {
  assert.equal(assertOpaqueProjectId('j9k2n4p6q8r0s2t4'), 'j9k2n4p6q8r0s2t4');
  for (const id of ['1', 'project1', 'PRJ99', 'short']) {
    assert.throws(() => assertOpaqueProjectId(id), /PROJECT_ID_GUESSABLE/);
  }
});

test('project is created only from a draft contract and owns its status', () => {
  const contract = draftContract();
  const project = createProject('j9k2n4p6q8r0s2t4', contract, '2026-09-22T12:25:00.000Z');
  assert.equal(project.contractId, contract.id);
  assert.equal(project.status, 'planned');
  assert.equal(Object.hasOwn(project, 'payment'), false);
  assert.equal(Object.hasOwn(project, 'provider'), false);
  assert.equal(Object.hasOwn(project, 'deposit'), false);
});

test('non-draft contracts cannot open a project', () => {
  const contract = { ...draftContract(), status: 'signed' };
  assert.throws(
    () => createProject('j9k2n4p6q8r0s2t4', /** @type {import('./src/contract.ts').Contract} */ (contract), at),
    /CONTRACT_NOT_READY/,
  );
});
