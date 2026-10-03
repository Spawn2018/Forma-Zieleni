import { assertOpaqueProjectId } from '../../domain/src/project.ts';
import {
  DECISION_LOG_KINDS,
  MILESTONE_STATUSES,
  assertOpaqueMilestoneId,
  type DecisionLogKind,
  type MilestoneStatus,
} from '../../domain/src/project-milestone.ts';

export type FieldError = { field: string; reason: string };

export type ProjectMilestoneStatusRequest = { status: MilestoneStatus };

export type ProjectMilestoneDueRequest = { dueAt: string | null };

export type ProjectMilestoneCreateRequest = {
  projectId: string;
  title: string;
  status?: MilestoneStatus;
  dueAt?: string | null;
};

export type DecisionLogSummaryRequest = { summary: string };

export type DecisionLogCreateRequest = {
  projectId: string;
  kind: DecisionLogKind;
  summary: string;
  relatedMilestoneId?: string;
};

export function validateProjectMilestoneCreateRequest(
  value: unknown,
): { ok: true; value: ProjectMilestoneCreateRequest } | { ok: false; errors: FieldError[] } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, errors: [{ field: '', reason: 'BODY_REQUIRED' }] };
  }
  const body = value as Record<string, unknown>;
  for (const key of ['payment', 'provider', 'signing', 'price', 'amountPln']) {
    if (Object.hasOwn(body, key)) {
      return { ok: false, errors: [{ field: key, reason: 'FORBIDDEN_FIELD' }] };
    }
  }
  const allowed = new Set(['projectId', 'title', 'status', 'dueAt']);
  const extra = Object.keys(body).filter(key => !allowed.has(key));
  if (extra.length) return { ok: false, errors: extra.map(field => ({ field, reason: 'UNKNOWN_FIELD' })) };
  if (typeof body.projectId !== 'string') {
    return { ok: false, errors: [{ field: 'projectId', reason: 'STRING_REQUIRED' }] };
  }
  if (typeof body.title !== 'string') {
    return { ok: false, errors: [{ field: 'title', reason: 'STRING_REQUIRED' }] };
  }
  let status: MilestoneStatus | undefined;
  if (Object.hasOwn(body, 'status')) {
    if (typeof body.status !== 'string' || !(MILESTONE_STATUSES as readonly string[]).includes(body.status)) {
      return { ok: false, errors: [{ field: 'status', reason: 'MILESTONE_STATUS_INVALID' }] };
    }
    status = body.status as MilestoneStatus;
  }
  let dueAt: string | null | undefined;
  if (Object.hasOwn(body, 'dueAt')) {
    if (body.dueAt === null) {
      dueAt = null;
    } else if (typeof body.dueAt !== 'string') {
      return { ok: false, errors: [{ field: 'dueAt', reason: 'STRING_OR_NULL_REQUIRED' }] };
    } else {
      dueAt = body.dueAt;
    }
  }
  try {
    return {
      ok: true,
      value: {
        projectId: assertOpaqueProjectId(body.projectId),
        title: body.title,
        ...(status ? { status } : {}),
        ...(dueAt !== undefined ? { dueAt } : {}),
      },
    };
  } catch {
    return { ok: false, errors: [{ field: 'projectId', reason: 'PROJECT_ID_INVALID' }] };
  }
}

export function validateProjectMilestoneStatusRequest(
  value: unknown,
): { ok: true; value: ProjectMilestoneStatusRequest } | { ok: false; errors: FieldError[] } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, errors: [{ field: '', reason: 'BODY_REQUIRED' }] };
  }
  const body = value as Record<string, unknown>;
  for (const key of ['payment', 'provider', 'signing', 'price', 'amountPln']) {
    if (Object.hasOwn(body, key)) {
      return { ok: false, errors: [{ field: key, reason: 'FORBIDDEN_FIELD' }] };
    }
  }
  const extra = Object.keys(body).filter(key => key !== 'status');
  if (extra.length) return { ok: false, errors: extra.map(field => ({ field, reason: 'UNKNOWN_FIELD' })) };
  if (typeof body.status !== 'string' || !(MILESTONE_STATUSES as readonly string[]).includes(body.status)) {
    return { ok: false, errors: [{ field: 'status', reason: 'MILESTONE_STATUS_INVALID' }] };
  }
  return { ok: true, value: { status: body.status as MilestoneStatus } };
}

export function validateProjectMilestoneDueRequest(
  value: unknown,
): { ok: true; value: ProjectMilestoneDueRequest } | { ok: false; errors: FieldError[] } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, errors: [{ field: '', reason: 'BODY_REQUIRED' }] };
  }
  const body = value as Record<string, unknown>;
  for (const key of ['payment', 'provider', 'signing', 'price', 'amountPln']) {
    if (Object.hasOwn(body, key)) {
      return { ok: false, errors: [{ field: key, reason: 'FORBIDDEN_FIELD' }] };
    }
  }
  const extra = Object.keys(body).filter(key => key !== 'dueAt');
  if (extra.length) return { ok: false, errors: extra.map(field => ({ field, reason: 'UNKNOWN_FIELD' })) };
  if (!Object.hasOwn(body, 'dueAt')) {
    return { ok: false, errors: [{ field: 'dueAt', reason: 'STRING_OR_NULL_REQUIRED' }] };
  }
  if (body.dueAt === null) return { ok: true, value: { dueAt: null } };
  if (typeof body.dueAt !== 'string') {
    return { ok: false, errors: [{ field: 'dueAt', reason: 'STRING_OR_NULL_REQUIRED' }] };
  }
  return { ok: true, value: { dueAt: body.dueAt } };
}

export type ProjectMilestoneTitleRequest = { title: string };

export function validateProjectMilestoneTitleRequest(
  value: unknown,
): { ok: true; value: ProjectMilestoneTitleRequest } | { ok: false; errors: FieldError[] } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, errors: [{ field: '', reason: 'BODY_REQUIRED' }] };
  }
  const body = value as Record<string, unknown>;
  for (const key of ['payment', 'provider', 'signing', 'price', 'amountPln', 'status', 'dueAt']) {
    if (Object.hasOwn(body, key)) {
      return { ok: false, errors: [{ field: key, reason: 'FORBIDDEN_FIELD' }] };
    }
  }
  const extra = Object.keys(body).filter(key => key !== 'title');
  if (extra.length) return { ok: false, errors: extra.map(field => ({ field, reason: 'UNKNOWN_FIELD' })) };
  if (typeof body.title !== 'string') {
    return { ok: false, errors: [{ field: 'title', reason: 'STRING_REQUIRED' }] };
  }
  return { ok: true, value: { title: body.title } };
}

export function validateDecisionLogCreateRequest(
  value: unknown,
): { ok: true; value: DecisionLogCreateRequest } | { ok: false; errors: FieldError[] } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, errors: [{ field: '', reason: 'BODY_REQUIRED' }] };
  }
  const body = value as Record<string, unknown>;
  for (const key of ['payment', 'provider', 'signing', 'price', 'email', 'phone', 'recordedByActorId']) {
    if (Object.hasOwn(body, key)) {
      return { ok: false, errors: [{ field: key, reason: 'FORBIDDEN_FIELD' }] };
    }
  }
  const allowed = new Set(['projectId', 'kind', 'summary', 'relatedMilestoneId']);
  const extra = Object.keys(body).filter(key => !allowed.has(key));
  if (extra.length) return { ok: false, errors: extra.map(field => ({ field, reason: 'UNKNOWN_FIELD' })) };
  if (typeof body.projectId !== 'string') {
    return { ok: false, errors: [{ field: 'projectId', reason: 'STRING_REQUIRED' }] };
  }
  if (typeof body.kind !== 'string' || !(DECISION_LOG_KINDS as readonly string[]).includes(body.kind)) {
    return { ok: false, errors: [{ field: 'kind', reason: 'DECISION_LOG_KIND_INVALID' }] };
  }
  if (typeof body.summary !== 'string') {
    return { ok: false, errors: [{ field: 'summary', reason: 'STRING_REQUIRED' }] };
  }
  let relatedMilestoneId: string | undefined;
  if (Object.hasOwn(body, 'relatedMilestoneId')) {
    if (typeof body.relatedMilestoneId !== 'string') {
      return { ok: false, errors: [{ field: 'relatedMilestoneId', reason: 'STRING_REQUIRED' }] };
    }
    const trimmed = body.relatedMilestoneId.trim();
    if (!trimmed) {
      return { ok: false, errors: [{ field: 'relatedMilestoneId', reason: 'MILESTONE_ID_INVALID' }] };
    }
    try {
      relatedMilestoneId = assertOpaqueMilestoneId(trimmed);
    } catch {
      return { ok: false, errors: [{ field: 'relatedMilestoneId', reason: 'MILESTONE_ID_INVALID' }] };
    }
  }
  try {
    return {
      ok: true,
      value: {
        projectId: assertOpaqueProjectId(body.projectId),
        kind: body.kind as DecisionLogKind,
        summary: body.summary,
        ...(relatedMilestoneId ? { relatedMilestoneId } : {}),
      },
    };
  } catch {
    return { ok: false, errors: [{ field: 'projectId', reason: 'PROJECT_ID_INVALID' }] };
  }
}

export function validateDecisionLogSummaryRequest(
  value: unknown,
): { ok: true; value: DecisionLogSummaryRequest } | { ok: false; errors: FieldError[] } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, errors: [{ field: '', reason: 'BODY_REQUIRED' }] };
  }
  const body = value as Record<string, unknown>;
  for (const key of ['payment', 'provider', 'signing', 'price', 'email', 'phone', 'recordedByActorId', 'kind']) {
    if (Object.hasOwn(body, key)) {
      return { ok: false, errors: [{ field: key, reason: 'FORBIDDEN_FIELD' }] };
    }
  }
  const extra = Object.keys(body).filter(key => key !== 'summary');
  if (extra.length) return { ok: false, errors: extra.map(field => ({ field, reason: 'UNKNOWN_FIELD' })) };
  if (typeof body.summary !== 'string') {
    return { ok: false, errors: [{ field: 'summary', reason: 'STRING_REQUIRED' }] };
  }
  return { ok: true, value: { summary: body.summary } };
}
