import { createHash } from 'node:crypto';
import {
  assertOpaqueMilestoneId,
  assertOpaqueDecisionLogId,
  assertOpaqueProjectId,
  createDecisionLogEntry,
  createProjectMilestone,
  type ProjectDecisionLogEntry,
  type ProjectMilestone,
} from '@forma-zieleni/domain';
import type { Actor } from './auth.ts';
import { ApiFailure, badRequest } from './errors.ts';
import { newDecisionLogId, newMilestoneId } from './ids.ts';
import { decodeCursor, encodeCursor, requestHash } from './leads.ts';
import type { DecisionLogListQuery, LeadStore, MilestoneListQuery, SortField, StoredReply } from './store.ts';

const SORTS = new Set<SortField>(['createdAt', '-createdAt', 'updatedAt', '-updatedAt']);
const DECISION_SORTS = new Set<SortField>(['createdAt', '-createdAt']);

export function parseMilestoneListQuery(input: {
  limit?: string;
  cursor?: string;
  sort?: string;
  projectId?: string;
}): MilestoneListQuery {
  const sort = input.sort ?? '-createdAt';
  if (!SORTS.has(sort as SortField)) throw badRequest('SORT_INVALID', 'Sort is not valid.');
  const limitText = input.limit ?? '20';
  if (!/^(?:[1-9]|[1-9][0-9]|100)$/.test(limitText)) throw badRequest('LIMIT_INVALID', 'Limit is not valid.');
  let projectId: string | undefined;
  if (input.projectId !== undefined && input.projectId !== '') {
    try {
      projectId = assertOpaqueProjectId(input.projectId);
    } catch {
      throw badRequest('PROJECT_ID_INVALID', 'Project id is not valid.');
    }
  }
  return {
    limit: Number(limitText),
    sort: sort as SortField,
    projectId,
    cursor: input.cursor ? decodeCursor(sort as SortField, input.cursor) : undefined,
  };
}

export function parseDecisionLogListQuery(input: {
  limit?: string;
  cursor?: string;
  sort?: string;
  projectId?: string;
}): DecisionLogListQuery {
  const sort = input.sort ?? '-createdAt';
  if (!DECISION_SORTS.has(sort as SortField)) throw badRequest('SORT_INVALID', 'Sort is not valid.');
  const limitText = input.limit ?? '20';
  if (!/^(?:[1-9]|[1-9][0-9]|100)$/.test(limitText)) throw badRequest('LIMIT_INVALID', 'Limit is not valid.');
  let projectId: string | undefined;
  if (input.projectId !== undefined && input.projectId !== '') {
    try {
      projectId = assertOpaqueProjectId(input.projectId);
    } catch {
      throw badRequest('PROJECT_ID_INVALID', 'Project id is not valid.');
    }
  }
  return {
    limit: Number(limitText),
    sort: sort as SortField,
    projectId,
    cursor: input.cursor ? decodeCursor(sort as SortField, input.cursor) : undefined,
  };
}

async function replayOrReserve(
  tx: Parameters<Parameters<LeadStore['transaction']>[0]>[0],
  scope: string,
  key: string,
  hash: string,
): Promise<StoredReply | null> {
  const existing = await tx.findIdempotency(scope, key);
  if (!existing) return null;
  if (existing.requestHash !== hash) {
    throw new ApiFailure(409, 'IDEMPOTENCY_CONFLICT', 'Idempotency key was already used with a different request.');
  }
  return existing;
}

/** Stable opaque staff actor id derived from session actorId. No customer PII. */
function opaqueActorId(actor: Actor): string {
  const digest = createHash('sha256').update(actor.actorId).digest('hex').slice(0, 15);
  return `a${digest}`;
}

export async function createMilestoneRecord(
  store: LeadStore,
  input: {
    projectId: string;
    title: string;
    status?: ProjectMilestone['status'];
    dueAt?: string | null;
  },
  _actor: Actor,
  idempotencyKey: string,
  at: string,
): Promise<ProjectMilestone> {
  const hash = requestHash({
    scope: 'milestone.create',
    projectId: input.projectId,
    title: input.title,
    status: input.status ?? null,
    dueAt: input.dueAt ?? null,
  });
  return store.transaction(async tx => {
    const replay = await replayOrReserve(tx, 'milestone.create', idempotencyKey, hash);
    if (replay) return replay.responseBody as ProjectMilestone;
    const project = await tx.findProject(input.projectId);
    if (!project) throw new ApiFailure(404, 'PROJECT_NOT_FOUND', 'Project was not found.');
    let milestone: ProjectMilestone;
    try {
      milestone = createProjectMilestone(
        newMilestoneId(),
        project,
        {
          title: input.title,
          ...(input.status ? { status: input.status } : {}),
          ...(input.dueAt !== undefined ? { dueAt: input.dueAt } : {}),
        },
        at,
      );
    } catch (error) {
      if (error instanceof Error && error.message === 'MILESTONE_TITLE_INVALID') {
        throw badRequest('MILESTONE_TITLE_INVALID', 'Milestone title is not valid.');
      }
      if (error instanceof Error && error.message === 'MILESTONE_STATUS_INVALID') {
        throw badRequest('MILESTONE_STATUS_INVALID', 'Milestone status is not valid.');
      }
      if (error instanceof Error && error.message === 'MILESTONE_DUE_INVALID') {
        throw badRequest('MILESTONE_DUE_INVALID', 'Milestone due date is not valid.');
      }
      if (error instanceof Error && error.message === 'MILESTONE_SURFACE_FORBIDDEN') {
        throw badRequest('MILESTONE_SURFACE_FORBIDDEN', 'Forbidden milestone fields.');
      }
      throw error;
    }
    await tx.insertMilestone(milestone);
    await tx.saveIdempotency(
      'milestone.create',
      idempotencyKey,
      { requestHash: hash, responseStatus: 201, responseBody: milestone },
      at,
    );
    return milestone;
  });
}

export async function createDecisionLogRecord(
  store: LeadStore,
  input: {
    projectId: string;
    kind: ProjectDecisionLogEntry['kind'];
    summary: string;
    relatedMilestoneId?: string;
  },
  actor: Actor,
  idempotencyKey: string,
  at: string,
): Promise<ProjectDecisionLogEntry> {
  const hash = requestHash({
    scope: 'decision-log.create',
    projectId: input.projectId,
    kind: input.kind,
    summary: input.summary,
    relatedMilestoneId: input.relatedMilestoneId ?? null,
  });
  return store.transaction(async tx => {
    const replay = await replayOrReserve(tx, 'decision-log.create', idempotencyKey, hash);
    if (replay) return replay.responseBody as ProjectDecisionLogEntry;
    const project = await tx.findProject(input.projectId);
    if (!project) throw new ApiFailure(404, 'PROJECT_NOT_FOUND', 'Project was not found.');
    let related = null;
    if (input.relatedMilestoneId) {
      related = await tx.findMilestone(input.relatedMilestoneId);
      if (!related) throw new ApiFailure(404, 'MILESTONE_NOT_FOUND', 'Milestone was not found.');
    }
    let entry: ProjectDecisionLogEntry;
    try {
      entry = createDecisionLogEntry(
        newDecisionLogId(),
        project,
        {
          kind: input.kind,
          summary: input.summary,
          recordedByActorId: opaqueActorId(actor),
          ...(input.relatedMilestoneId ? { relatedMilestoneId: input.relatedMilestoneId } : {}),
        },
        at,
        related,
      );
    } catch (error) {
      if (error instanceof Error && error.message === 'DECISION_LOG_SUMMARY_INVALID') {
        throw badRequest('DECISION_LOG_SUMMARY_INVALID', 'Decision log summary is not valid.');
      }
      if (error instanceof Error && error.message === 'DECISION_LOG_KIND_INVALID') {
        throw badRequest('DECISION_LOG_KIND_INVALID', 'Decision log kind is not valid.');
      }
      if (error instanceof Error && error.message === 'DECISION_LOG_MILESTONE_MISMATCH') {
        throw badRequest('DECISION_LOG_MILESTONE_MISMATCH', 'Milestone does not belong to the project.');
      }
      if (error instanceof Error && error.message === 'MILESTONE_SURFACE_FORBIDDEN') {
        throw badRequest('MILESTONE_SURFACE_FORBIDDEN', 'Forbidden decision-log fields.');
      }
      throw error;
    }
    await tx.insertDecisionLogEntry(entry);
    await tx.saveIdempotency(
      'decision-log.create',
      idempotencyKey,
      { requestHash: hash, responseStatus: 201, responseBody: entry },
      at,
    );
    return entry;
  });
}

export async function readMilestone(store: LeadStore, id: string): Promise<ProjectMilestone | null> {
  return store.transaction(tx => tx.findMilestone(id));
}

export async function listVisibleMilestones(
  store: LeadStore,
  query: MilestoneListQuery,
): Promise<{ items: ProjectMilestone[]; nextCursor: string | null }> {
  const rows = await store.transaction(tx => tx.listMilestones({ ...query, limit: query.limit + 1 }));
  const page = rows.slice(0, query.limit);
  const last = page.at(-1);
  const nextCursor = rows.length > query.limit && last
    ? encodeCursor(query.sort, query.sort.includes('updatedAt') ? last.updatedAt : last.createdAt, last.id)
    : null;
  return { items: page, nextCursor };
}

export async function readDecisionLogEntry(store: LeadStore, id: string): Promise<ProjectDecisionLogEntry | null> {
  return store.transaction(tx => tx.findDecisionLogEntry(id));
}

export async function listVisibleDecisionLog(
  store: LeadStore,
  query: DecisionLogListQuery,
): Promise<{ items: ProjectDecisionLogEntry[]; nextCursor: string | null }> {
  const rows = await store.transaction(tx => tx.listDecisionLogEntries({ ...query, limit: query.limit + 1 }));
  const page = rows.slice(0, query.limit);
  const last = page.at(-1);
  const nextCursor = rows.length > query.limit && last
    ? encodeCursor(query.sort, last.createdAt, last.id)
    : null;
  return { items: page, nextCursor };
}

export function pathMilestoneId(value: string): string {
  try {
    return assertOpaqueMilestoneId(decodeURIComponent(value));
  } catch {
    throw badRequest('MILESTONE_ID_INVALID', 'Milestone id is not valid.');
  }
}

export function pathDecisionLogId(value: string): string {
  try {
    return assertOpaqueDecisionLogId(decodeURIComponent(value));
  } catch {
    throw badRequest('DECISION_LOG_ID_INVALID', 'Decision log id is not valid.');
  }
}
