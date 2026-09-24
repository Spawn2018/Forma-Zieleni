import { assertOpaqueProjectId, type Project } from './project.ts';

/** Project milestones and decision/change-order log. No payment or signing. */

export const MILESTONE_STATUSES = ['planned', 'active', 'done'] as const;

export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

export const DECISION_LOG_KINDS = ['decision', 'change_order'] as const;

export type DecisionLogKind = (typeof DECISION_LOG_KINDS)[number];

/**
 * Milestone owned by Core API for a commercial Project.
 * Payment, signing provider, and portal UI stay outside this slice.
 */
export type ProjectMilestone = {
  id: string;
  projectId: string;
  title: string;
  status: MilestoneStatus;
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Decision or change-order log entry owned by Core API.
 * Staff actor ids only; no customer PII and no signing/payment fields.
 */
export type ProjectDecisionLogEntry = {
  id: string;
  projectId: string;
  kind: DecisionLogKind;
  summary: string;
  recordedByActorId: string;
  relatedMilestoneId: string | null;
  createdAt: string;
};

export type CreateProjectMilestoneInput = {
  title: string;
  status?: MilestoneStatus;
  dueAt?: string | null;
};

export type CreateDecisionLogEntryInput = {
  kind: DecisionLogKind;
  summary: string;
  recordedByActorId: string;
  relatedMilestoneId?: string | null;
};

const OPAQUE_ID = /^[a-z][a-z0-9]{15,63}$/;
const INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
const FORBIDDEN_KEYS = new Set([
  'payment',
  'provider',
  'signing',
  'signature',
  'qes',
  'deposit',
  'price',
  'amount',
  'amountPln',
  'blik',
  'card',
  'email',
  'phone',
  'name',
  'customer',
  'client',
  'webhook',
  'secret',
]);

export function assertOpaqueMilestoneId(id: string): string {
  if (!OPAQUE_ID.test(id) || /^(?:milestone|ms|id)\d+$/i.test(id)) {
    throw new Error('MILESTONE_ID_GUESSABLE');
  }
  return id;
}

export function assertOpaqueDecisionLogId(id: string): string {
  if (!OPAQUE_ID.test(id) || /^(?:decision|change|log|entry|id)\d+$/i.test(id)) {
    throw new Error('DECISION_LOG_ID_GUESSABLE');
  }
  return id;
}

export function assertOpaqueMilestoneActorId(id: string): string {
  if (!OPAQUE_ID.test(id) || /^(?:actor|user|staff|id)\d+$/i.test(id)) {
    throw new Error('MILESTONE_ACTOR_ID_GUESSABLE');
  }
  return id;
}

function assertNoForbiddenSurface(input: object): void {
  for (const key of Object.keys(input)) {
    if (FORBIDDEN_KEYS.has(key)) throw new Error('MILESTONE_SURFACE_FORBIDDEN');
  }
}

function assertInstant(value: string, code: string): string {
  if (typeof value !== 'string' || !INSTANT.test(value)) throw new Error(code);
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) throw new Error(code);
  const match = value.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,3}))?Z$/);
  if (!match) throw new Error(code);
  const fraction = (match[2] ?? '').padEnd(3, '0') || '000';
  const normalized = `${match[1]}.${fraction}Z`;
  if (new Date(ms).toISOString() !== normalized) throw new Error(code);
  return value;
}

function assertTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed || trimmed.length > 200) throw new Error('MILESTONE_TITLE_INVALID');
  return trimmed;
}

function assertSummary(summary: string): string {
  const trimmed = summary.trim();
  if (!trimmed || trimmed.length > 2000) throw new Error('DECISION_LOG_SUMMARY_INVALID');
  return trimmed;
}

export function createProjectMilestone(
  id: string,
  project: Project,
  input: CreateProjectMilestoneInput,
  at: string,
  surface: Record<string, unknown> = {},
): ProjectMilestone {
  assertNoForbiddenSurface({ id, ...input, ...surface });
  const status = input.status ?? 'planned';
  if (!MILESTONE_STATUSES.includes(status)) throw new Error('MILESTONE_STATUS_INVALID');
  const created = assertInstant(at, 'MILESTONE_AT_INVALID');
  let dueAt: string | null = null;
  if (input.dueAt !== undefined && input.dueAt !== null) {
    dueAt = assertInstant(input.dueAt, 'MILESTONE_DUE_INVALID');
  }
  return {
    id: assertOpaqueMilestoneId(id),
    projectId: assertOpaqueProjectId(project.id),
    title: assertTitle(input.title),
    status,
    dueAt,
    createdAt: created,
    updatedAt: created,
  };
}

export function createDecisionLogEntry(
  id: string,
  project: Project,
  input: CreateDecisionLogEntryInput,
  at: string,
  relatedMilestone: ProjectMilestone | null = null,
  surface: Record<string, unknown> = {},
): ProjectDecisionLogEntry {
  assertNoForbiddenSurface({ id, ...input, ...surface });
  if (!DECISION_LOG_KINDS.includes(input.kind)) throw new Error('DECISION_LOG_KIND_INVALID');
  const created = assertInstant(at, 'DECISION_LOG_AT_INVALID');
  const relatedMilestoneId = input.relatedMilestoneId === undefined
    ? null
    : input.relatedMilestoneId;
  if (relatedMilestoneId !== null) {
    if (!relatedMilestone) throw new Error('DECISION_LOG_MILESTONE_REQUIRED');
    if (relatedMilestone.projectId !== project.id) throw new Error('DECISION_LOG_MILESTONE_MISMATCH');
    assertOpaqueMilestoneId(relatedMilestoneId);
    if (relatedMilestone.id !== relatedMilestoneId) throw new Error('DECISION_LOG_MILESTONE_MISMATCH');
  }
  return {
    id: assertOpaqueDecisionLogId(id),
    projectId: assertOpaqueProjectId(project.id),
    kind: input.kind,
    summary: assertSummary(input.summary),
    recordedByActorId: assertOpaqueMilestoneActorId(input.recordedByActorId),
    relatedMilestoneId,
    createdAt: created,
  };
}
