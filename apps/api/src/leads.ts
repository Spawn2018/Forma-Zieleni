import { createHash } from 'node:crypto';
import { createLead, qualifyLead, type Lead, type LeadCapture, type PublicLeadSource } from '@forma-zieleni/domain';
import { ApiFailure, badRequest } from './errors.ts';
import { newLeadId, newOpaqueId } from './ids.ts';
import type { Actor } from './auth.ts';
import type { LeadStore, SortField, StoredReply } from './store.ts';

const SORTS = new Set<SortField>(['createdAt', '-createdAt', 'updatedAt', '-updatedAt']);
const STATUSES = new Set(['received', 'site_analysis', 'qualified', 'consultation_ready', 'unqualified']);

export function requestHash(parts: unknown): string {
  return createHash('sha256').update(stable(parts)).digest('hex');
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

export function encodeCursor(sort: SortField, at: string, id: string): string {
  return Buffer.from(JSON.stringify({ v: 1, sort, at, id }), 'utf8').toString('base64url');
}

export function decodeCursor(sort: SortField, cursor: string): { at: string; id: string } {
  if (cursor.length < 8 || cursor.length > 256) throw badRequest('CURSOR_INVALID', 'Cursor is not valid.');
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as { v?: unknown; sort?: unknown; at?: unknown; id?: unknown };
    if (parsed.v !== 1 || parsed.sort !== sort || typeof parsed.at !== 'string' || typeof parsed.id !== 'string') {
      throw badRequest('CURSOR_INVALID', 'Cursor is not valid.');
    }
    if (Number.isNaN(Date.parse(parsed.at))) throw badRequest('CURSOR_INVALID', 'Cursor is not valid.');
    return { at: parsed.at, id: parsed.id };
  } catch (error) {
    if (error instanceof ApiFailure) throw error;
    throw badRequest('CURSOR_INVALID', 'Cursor is not valid.');
  }
}

export function parseListQuery(input: { limit?: string; cursor?: string; sort?: string; status?: string }): {
  limit: number;
  sort: SortField;
  status?: Lead['status'];
  cursor?: { at: string; id: string };
} {
  const sort = input.sort ?? '-createdAt';
  if (!SORTS.has(sort as SortField)) throw badRequest('SORT_INVALID', 'Sort is not valid.');
  const limitText = input.limit ?? '20';
  if (!/^(?:[1-9]|[1-9][0-9]|100)$/.test(limitText)) throw badRequest('LIMIT_INVALID', 'Limit is not valid.');
  const status = input.status;
  if (status !== undefined && !STATUSES.has(status)) throw badRequest('STATUS_INVALID', 'Status is not valid.');
  return {
    limit: Number(limitText),
    sort: sort as SortField,
    status: status as Lead['status'] | undefined,
    cursor: input.cursor ? decodeCursor(sort as SortField, input.cursor) : undefined,
  };
}

async function replayOrReserve(tx: Parameters<Parameters<LeadStore['transaction']>[0]>[0], scope: string, key: string, hash: string): Promise<StoredReply | null> {
  const existing = await tx.findIdempotency(scope, key);
  if (!existing) return null;
  if (existing.requestHash !== hash) throw new ApiFailure(409, 'IDEMPOTENCY_CONFLICT', 'Idempotency key was already used with a different request.');
  return existing;
}

export async function captureLead(store: LeadStore, input: LeadCapture & { source: PublicLeadSource }, idempotencyKey: string, at: string): Promise<Lead> {
  const hash = requestHash({ scope: 'lead.create', body: input });
  return store.transaction(async tx => {
    const replay = await replayOrReserve(tx, 'lead.create', idempotencyKey, hash);
    if (replay) return replay.responseBody as Lead;
    const lead = createLead(newLeadId(), input.source, input, at);
    await tx.insertLead(lead);
    await tx.insertOutbox({
      id: newOpaqueId('o'),
      eventType: 'lead.captured',
      leadId: lead.id,
      payload: { leadId: lead.id, status: lead.status, source: lead.source },
      at,
    });
    await tx.insertAudit({
      id: newOpaqueId('a'),
      action: 'lead.captured',
      actorId: null,
      leadId: lead.id,
      at,
      metadata: { status: lead.status, source: lead.source },
    });
    await tx.saveIdempotency('lead.create', idempotencyKey, { requestHash: hash, responseStatus: 201, responseBody: lead }, at);
    return lead;
  });
}

export async function readLead(store: LeadStore, id: string): Promise<Lead | null> {
  return store.transaction(tx => tx.findLead(id));
}

export async function listVisibleLeads(store: LeadStore, query: ReturnType<typeof parseListQuery>): Promise<{ items: Lead[]; nextCursor: string | null }> {
  const rows = await store.transaction(tx => tx.listLeads({ ...query, limit: query.limit + 1 }));
  const page = rows.slice(0, query.limit);
  const last = page.at(-1);
  const nextCursor = rows.length > query.limit && last
    ? encodeCursor(query.sort, query.sort.includes('updatedAt') ? last.updatedAt : last.createdAt, last.id)
    : null;
  return { items: page, nextCursor };
}

export async function qualifyExistingLead(store: LeadStore, leadId: string, capacityHold: boolean, actor: Actor, idempotencyKey: string, at: string): Promise<Lead> {
  const hash = requestHash({ scope: 'lead.qualify', leadId, capacityHold });
  return store.transaction(async tx => {
    const replay = await replayOrReserve(tx, 'lead.qualify', idempotencyKey, hash);
    if (replay) return replay.responseBody as Lead;
    const current = await tx.findLead(leadId);
    if (!current) throw new ApiFailure(404, 'LEAD_NOT_FOUND', 'Lead was not found.');
    const lead = qualifyLead(current, capacityHold, at);
    await tx.saveLead(lead);
    await tx.insertOutbox({
      id: newOpaqueId('o'),
      eventType: 'lead.qualified',
      leadId: lead.id,
      payload: { leadId: lead.id, status: lead.status, source: lead.source },
      at,
    });
    await tx.insertAudit({
      id: newOpaqueId('a'),
      action: 'lead.qualified',
      actorId: actor.actorId,
      leadId: lead.id,
      at,
      metadata: { status: lead.status, result: lead.qualification.result, capacityHold },
    });
    await tx.saveIdempotency('lead.qualify', idempotencyKey, { requestHash: hash, responseStatus: 200, responseBody: lead }, at);
    return lead;
  });
}
