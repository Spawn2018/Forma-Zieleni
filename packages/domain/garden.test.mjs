import test from 'node:test';
import assert from 'node:assert/strict';
import { createLead, qualifyLead } from './src/lead.ts';
import { createOpportunity } from './src/opportunity.ts';
import { createOffer } from './src/offer.ts';
import { createContract } from './src/contract.ts';
import { createProject, deliverProject } from './src/project.ts';
import {
  assertGardenHasNoLiveInvent,
  assertOpaqueGardenId,
  createGarden,
  projectGardenForPortal,
} from './src/garden.ts';

const at = '2026-09-23T20:00:00.000Z';
const capture = {
  name: 'Anna Kowalska',
  phone: '+48 600 000 000',
  email: 'anna@example.invalid',
  locality: 'Kraków',
  siteAnalysisRequested: true,
};

function deliveredProject(clientSubject = null) {
  const lead = qualifyLead(createLead('ld8k2n4p6q8r0s2t', 'www', capture, at), false, '2026-09-23T20:05:00.000Z');
  const opportunity = createOpportunity('p9k2n4p6q8r0s2t4', lead, '2026-09-23T20:10:00.000Z');
  const offer = createOffer('f9k2n4p6q8r0s2t4', opportunity, '2026-09-23T20:15:00.000Z');
  const contract = createContract('c9k2n4p6q8r0s2t4', offer, '2026-09-23T20:20:00.000Z');
  const planned = createProject('j9k2n4p6q8r0s2t4', contract, '2026-09-23T20:25:00.000Z', clientSubject);
  return deliverProject(planned, '2026-09-23T20:30:00.000Z');
}

test('opaque garden identifiers reject sequential or prefixed guessable values', () => {
  assert.equal(assertOpaqueGardenId('g9k2n4p6q8r0s2t4'), 'g9k2n4p6q8r0s2t4');
  for (const id of ['1', 'garden1', 'GDN99', 'short']) {
    assert.throws(() => assertOpaqueGardenId(id), /GARDEN_ID_GUESSABLE/);
  }
});

test('garden links only to a delivered project and inherits client isolation', () => {
  const project = deliveredProject('portal-ola');
  const garden = createGarden('g9k2n4p6q8r0s2t4', project, '2026-09-23T20:35:00.000Z');
  assert.equal(garden.projectId, project.id);
  assert.equal(garden.clientSubject, 'portal-ola');
  assert.equal(Object.hasOwn(garden, 'twinDatabase'), false);
  assert.equal(Object.hasOwn(garden, 'liveGarden'), false);
  assert.equal(Object.hasOwn(garden, 'sensorFeed'), false);
  assert.equal(Object.hasOwn(garden, 'plants'), false);
});

test('planned projects cannot open a garden record', () => {
  const lead = qualifyLead(createLead('ld8k2n4p6q8r0s2t', 'www', capture, at), false, '2026-09-23T20:05:00.000Z');
  const opportunity = createOpportunity('p9k2n4p6q8r0s2t4', lead, '2026-09-23T20:10:00.000Z');
  const offer = createOffer('f9k2n4p6q8r0s2t4', opportunity, '2026-09-23T20:15:00.000Z');
  const contract = createContract('c9k2n4p6q8r0s2t4', offer, '2026-09-23T20:20:00.000Z');
  const planned = createProject('j9k2n4p6q8r0s2t4', contract, '2026-09-23T20:25:00.000Z');
  assert.throws(() => createGarden('g9k2n4p6q8r0s2t4', planned, at), /PROJECT_NOT_DELIVERED/);
});

test('portal garden projection is BOLA-isolated and omits live invent fields', () => {
  const garden = createGarden('g9k2n4p6q8r0s2t4', deliveredProject('portal-ola'), '2026-09-23T20:35:00.000Z');
  const mine = projectGardenForPortal(garden, 'portal-ola');
  assert.ok(mine);
  assert.equal(mine.id, garden.id);
  assert.equal(mine.projectId, garden.projectId);
  assert.equal(Object.hasOwn(mine, 'clientSubject'), false);
  assert.equal(Object.hasOwn(mine, 'liveGarden'), false);
  assert.equal(projectGardenForPortal(garden, 'portal-other'), null);
  assert.equal(
    projectGardenForPortal(createGarden('g8k2n4p6q8r0s2t4', deliveredProject(), at), 'portal-ola'),
    null,
  );
});

test('live twin, live garden, and sensor invent stay forbidden', () => {
  assert.throws(() => assertGardenHasNoLiveInvent({ twinDatabase: true }), /GARDENOS_TWIN_FORBIDDEN/);
  assert.throws(() => assertGardenHasNoLiveInvent({ liveTwinUi: true }), /GARDENOS_TWIN_FORBIDDEN/);
  assert.throws(() => assertGardenHasNoLiveInvent({ liveGarden: true }), /GARDENOS_LIVE_INVENT_FORBIDDEN/);
  assert.throws(() => assertGardenHasNoLiveInvent({ sensorFeed: true }), /GARDENOS_LIVE_INVENT_FORBIDDEN/);
});

test('deliverProject only accepts planned projects', () => {
  const delivered = deliveredProject();
  assert.equal(delivered.status, 'delivered');
  assert.throws(() => deliverProject(delivered, at), /PROJECT_NOT_DELIVERABLE/);
});
