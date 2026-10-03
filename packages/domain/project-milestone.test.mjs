import assert from 'node:assert/strict';
import test from 'node:test';
import { createLead, qualifyLead } from './src/lead.ts';
import { createOpportunity } from './src/opportunity.ts';
import { createOffer } from './src/offer.ts';
import { createContract } from './src/contract.ts';
import { createProject } from './src/project.ts';
import {
  advanceProjectMilestone,
  reviseProjectMilestoneDue,
  reviseProjectMilestoneTitle,
  createDecisionLogEntry,
  createProjectMilestone,
  reviseDecisionLogSummary,
  nextMilestoneStatus,
  projectMilestoneForPortal,
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

function plannedProject(clientSubject = null, id = 'j9k2n4p6q8r0s2t4') {
  const lead = qualifyLead(createLead('ld8k2n4p6q8r0s2t', 'www', capture, AT), false, '2026-09-24T18:05:00.000Z');
  const opportunity = createOpportunity('p9k2n4p6q8r0s2t4', lead, '2026-09-24T18:10:00.000Z');
  const offer = createOffer('f9k2n4p6q8r0s2t4', opportunity, '2026-09-24T18:15:00.000Z');
  const contract = createContract('c9k2n4p6q8r0s2t4', offer, '2026-09-24T18:20:00.000Z');
  return createProject(id, contract, '2026-09-24T18:25:00.000Z', clientSubject);
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

test('portal milestone projection follows the owning project and omits staff fields', () => {
  const owned = plannedProject('portal-ola', 'j8k2n4p6q8r0s2t4');
  const milestone = createProjectMilestone(
    'm8k2n4p6q8r0s2t4',
    owned,
    { title: 'Sadzenie', dueAt: null },
    AT,
  );
  const mine = projectMilestoneForPortal(milestone, owned, 'portal-ola');
  assert.ok(mine);
  assert.equal(mine.title, 'Sadzenie');
  assert.equal(mine.status, 'planned');
  assert.equal(mine.dueAt, null);
  assert.equal(Object.hasOwn(mine, 'updatedAt'), false);
  assert.equal(Object.hasOwn(mine, 'clientSubject'), false);
  assert.equal(Object.hasOwn(mine, 'payment'), false);
  assert.equal(projectMilestoneForPortal(milestone, owned, 'portal-other'), null);
  assert.equal(projectMilestoneForPortal(milestone, plannedProject(), 'portal-ola'), null);
  assert.equal(projectMilestoneForPortal(milestone, null, 'portal-ola'), null);
});

test('milestone status advances one step and refuses a skip or a payment field', () => {
  const project = plannedProject();
  const milestone = createProjectMilestone('m7k2n4p6q8r0s2t4', project, { title: 'Koncepcja' }, AT);
  assert.equal(nextMilestoneStatus('planned'), 'active');
  assert.equal(nextMilestoneStatus('done'), null);
  const active = advanceProjectMilestone(milestone, 'active', '2026-09-24T19:00:00.000Z');
  assert.equal(active.status, 'active');
  assert.equal(active.createdAt, milestone.createdAt);
  assert.equal(active.updatedAt, '2026-09-24T19:00:00.000Z');
  const done = advanceProjectMilestone(active, 'done', '2026-09-24T20:00:00.000Z');
  assert.equal(done.status, 'done');
  assert.throws(() => advanceProjectMilestone(milestone, 'done', '2026-09-24T19:00:00.000Z'), /MILESTONE_TRANSITION_FORBIDDEN/);
  assert.throws(() => advanceProjectMilestone(done, 'active', '2026-09-24T21:00:00.000Z'), /MILESTONE_TRANSITION_FORBIDDEN/);
  assert.throws(
    () => advanceProjectMilestone(milestone, 'active', '2026-09-24T19:00:00.000Z', { payment: true }),
    /MILESTONE_SURFACE_FORBIDDEN/,
  );
  assert.throws(
    () => advanceProjectMilestone(milestone, 'active', '2026-09-24T17:00:00.000Z'),
    /MILESTONE_AT_INVALID/,
  );
});

test('milestone due revision sets or clears the instant and keeps status', () => {
  const project = plannedProject();
  const milestone = createProjectMilestone('m7k2n4p6q8r0s2t4', project, { title: 'Koncepcja' }, AT);
  const dated = reviseProjectMilestoneDue(milestone, '2026-10-03T08:00:00.000Z', '2026-09-24T19:00:00.000Z');
  assert.equal(dated.status, 'planned');
  assert.equal(dated.dueAt, '2026-10-03T08:00:00.000Z');
  assert.equal(dated.createdAt, milestone.createdAt);
  const same = reviseProjectMilestoneDue(dated, '2026-10-03T08:00:00.000Z', '2026-09-24T20:00:00.000Z');
  assert.equal(same, dated);
  const cleared = reviseProjectMilestoneDue(dated, null, '2026-09-24T20:00:00.000Z');
  assert.equal(cleared.dueAt, null);
  assert.equal(cleared.status, 'planned');
  assert.throws(
    () => reviseProjectMilestoneDue(milestone, 'jutro', '2026-09-24T19:00:00.000Z'),
    /MILESTONE_DUE_INVALID/,
  );
  assert.throws(
    () => reviseProjectMilestoneDue(milestone, '2026-10-03T08:00:00.000Z', '2026-09-24T19:00:00.000Z', { payment: true }),
    /MILESTONE_SURFACE_FORBIDDEN/,
  );
});

test('milestone title revision keeps status and due instant', () => {
  const project = plannedProject('client-a');
  const milestone = createProjectMilestone(
    'm7k2n4p6q8r0s2t5',
    project,
    { title: 'Koncepcja', dueAt: '2026-10-03T08:00:00.000Z' },
    AT,
  );
  const revised = reviseProjectMilestoneTitle(milestone, '  Koncepcja ogrodu  ', '2026-09-24T19:00:00.000Z');
  assert.equal(revised.title, 'Koncepcja ogrodu');
  assert.equal(revised.status, 'planned');
  assert.equal(revised.dueAt, milestone.dueAt);
  assert.equal(revised.createdAt, milestone.createdAt);
  assert.equal(reviseProjectMilestoneTitle(revised, 'Koncepcja ogrodu', '2026-09-24T20:00:00.000Z'), revised);
  assert.throws(() => reviseProjectMilestoneTitle(milestone, '   ', '2026-09-24T19:00:00.000Z'), /MILESTONE_TITLE_INVALID/);
  assert.throws(
    () => reviseProjectMilestoneTitle(milestone, 'Inny tytuł', '2026-09-24T19:00:00.000Z', { payment: true }),
    /MILESTONE_SURFACE_FORBIDDEN/,
  );
  assert.equal(projectMilestoneForPortal(revised, project, 'client-a')?.title, 'Koncepcja ogrodu');
});

test('decision log summary revision keeps kind and refuses a payment field', () => {
  const project = plannedProject();
  const entry = createDecisionLogEntry(
    'd9k2n4p6q8r0s2t8',
    project,
    { kind: 'decision', summary: 'Zatwierdzono układ', recordedByActorId: ACTOR },
    AT,
  );
  const revised = reviseDecisionLogSummary(entry, '  Zatwierdzono układ ścieżek  ');
  assert.equal(revised.summary, 'Zatwierdzono układ ścieżek');
  assert.equal(revised.kind, 'decision');
  assert.equal(revised.createdAt, entry.createdAt);
  assert.equal(revised.recordedByActorId, entry.recordedByActorId);
  const same = reviseDecisionLogSummary(revised, 'Zatwierdzono układ ścieżek');
  assert.equal(same, revised);
  assert.throws(() => reviseDecisionLogSummary(entry, '   '), /DECISION_LOG_SUMMARY_INVALID/);
  assert.throws(() => reviseDecisionLogSummary(entry, 'Nowa treść', { email: 'a@b.c' }), /MILESTONE_SURFACE_FORBIDDEN/);
});
