import assert from 'node:assert/strict';
import test from 'node:test';
import { createLead, qualifyLead } from './src/lead.ts';
import { createOpportunity } from './src/opportunity.ts';
import { createOffer } from './src/offer.ts';
import { createContract } from './src/contract.ts';
import { createProject } from './src/project.ts';
import {
  createDecisionLogEntry,
  createProjectMilestone,
} from './src/project-milestone.ts';

const AT = '2026-09-24T18:00:00.000Z';
const ACTOR = 'astaffactor00001';
const capture = {
  name: 'Anna Kowalska',
  phone: '+48 600 000 000',
  email: 'anna@example.invalid',
  locality: 'Kraków',
  siteAnalysisRequested: true,
};

function plannedProject() {
  const lead = qualifyLead(createLead('ld8k2n4p6q8r0s2t', 'www', capture, AT), false, '2026-09-24T18:05:00.000Z');
  const opportunity = createOpportunity('p9k2n4p6q8r0s2t4', lead, '2026-09-24T18:10:00.000Z');
  const offer = createOffer('f9k2n4p6q8r0s2t4', opportunity, '2026-09-24T18:15:00.000Z');
  const contract = createContract('c9k2n4p6q8r0s2t4', offer, '2026-09-24T18:20:00.000Z');
  return createProject('j9k2n4p6q8r0s2t4', contract, '2026-09-24T18:25:00.000Z');
}

test('createProjectMilestone records opaque project-bound milestones without payment/signing', () => {
  const project = plannedProject();
  const milestone = createProjectMilestone(
    'm9k2n4p6q8r0s2t4',
    project,
    { title: 'Koncepcja', dueAt: '2026-10-15T12:00:00.000Z' },
    AT,
  );
  assert.equal(milestone.projectId, project.id);
  assert.equal(milestone.title, 'Koncepcja');
  assert.equal(milestone.status, 'planned');
  assert.equal(milestone.dueAt, '2026-10-15T12:00:00.000Z');
  assert.equal(Object.hasOwn(milestone, 'payment'), false);
  assert.equal(Object.hasOwn(milestone, 'provider'), false);
  assert.equal(Object.hasOwn(milestone, 'signing'), false);
  assert.throws(
    () => createProjectMilestone('ms1', project, { title: 'X' }, AT),
    /MILESTONE_ID_GUESSABLE/,
  );
  assert.throws(
    () => createProjectMilestone('m9k2n4p6q8r0s2t5', project, { title: '' }, AT),
    /MILESTONE_TITLE_INVALID/,
  );
});

test('createProjectMilestone refuses smuggled payment/signing surface keys', () => {
  const project = plannedProject();
  assert.throws(
    () => createProjectMilestone(
      'm9k2n4p6q8r0s2t6',
      project,
      { title: 'X' },
      AT,
      { payment: true },
    ),
    /MILESTONE_SURFACE_FORBIDDEN/,
  );
});

test('createDecisionLogEntry records decision and change_order without client PII', () => {
  const project = plannedProject();
  const milestone = createProjectMilestone('m9k2n4p6q8r0s2t7', project, { title: 'Projekt' }, AT);
  const decision = createDecisionLogEntry(
    'd9k2n4p6q8r0s2t4',
    project,
    {
      kind: 'decision',
      summary: 'Zatwierdzono układ ścieżek',
      recordedByActorId: ACTOR,
      relatedMilestoneId: milestone.id,
    },
    AT,
    milestone,
  );
  assert.equal(decision.kind, 'decision');
  assert.equal(decision.relatedMilestoneId, milestone.id);
  assert.equal(decision.recordedByActorId, ACTOR);
  assert.equal(Object.hasOwn(decision, 'email'), false);
  assert.equal(Object.hasOwn(decision, 'phone'), false);

  const change = createDecisionLogEntry(
    'd9k2n4p6q8r0s2t5',
    project,
    {
      kind: 'change_order',
      summary: 'Dodano strefę grillową poza pierwotnym scope',
      recordedByActorId: ACTOR,
    },
    AT,
  );
  assert.equal(change.kind, 'change_order');
  assert.equal(change.relatedMilestoneId, null);

  assert.throws(
    () => createDecisionLogEntry(
      'd9k2n4p6q8r0s2t6',
      project,
      {
        kind: 'decision',
        summary: 'X',
        recordedByActorId: ACTOR,
        relatedMilestoneId: milestone.id,
      },
      AT,
      null,
    ),
    /DECISION_LOG_MILESTONE_REQUIRED/,
  );
  assert.throws(
    () => createDecisionLogEntry(
      'log1',
      project,
      { kind: 'decision', summary: 'X', recordedByActorId: ACTOR },
      AT,
    ),
    /DECISION_LOG_ID_GUESSABLE/,
  );
});
