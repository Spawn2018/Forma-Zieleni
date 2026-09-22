import { createOpportunity, type Opportunity, type OpportunityStatus } from '@forma-zieleni/domain';
import type { Actor } from './auth.ts';
import { ApiFailure, badRequest } from './errors.ts';
import { newOpaqueId, newOpportunityId } from './ids.ts';
import { decodeCursor, encodeCursor, requestHash } from './leads.ts';
import type { LeadStore, OpportunityListQuery, SortField, StoredReply } from './store.ts';

const SORTS = new Set<SortField>(['createdAt', '-createdAt', 'updatedAt', '-updatedAt']);
const STATUSES = new Set<OpportunityStatus>(['open']);

export function parseOpportunityListQuery(input: {
  limit?: string;
  cursor?: string;
  sort?: string;
  status?: string;
}): OpportunityListQuery {
  const sort = input.sort ?? '-createdAt';
  if (!SORTS.has(sort as SortField)) throw badRequest('SORT_INVALID', 'Sort is not valid.');
  const limitText = input.limit ?? '20';
  if (!/^(?:[1-9]|[1-9][0-9]|100)$/.test(limitText)) throw badRequest('LIMIT_INVALID', 'Limit is not valid.');
  const status = input.status;
  if (status !== undefined && !STATUSES.has(status as OpportunityStatus)) {
    throw badRequest('STATUS_INVALID', 'Status is not valid.');
  }
  return {
    limit: Number(limitText),
    sort: sort as SortField,
    status: status as OpportunityStatus | undefined,
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

export async function createOpportunityFromLead(
  store: LeadStore,
  leadId: string,
  actor: Actor,
  idempotencyKey: string,
  at: string,
): Promise<Opportunity> {
  const hash = requestHash({ scope: 'opportunity.create', leadId });
  return store.transaction(async tx => {
    const replay = await replayOrReserve(tx, 'opportunity.create', idempotencyKey, hash);
    if (replay) return replay.responseBody as Opportunity;
    const lead = await tx.findLead(leadId);
    if (!lead) throw new ApiFailure(404, 'LEAD_NOT_FOUND', 'Lead was not found.');
    const existing = await tx.findOpportunityByLead(leadId);
    if (existing) throw new ApiFailure(409, 'OPPORTUNITY_EXISTS', 'An opportunity already exists for this lead.');
    let opportunity: Opportunity;
    try {
      opportunity = createOpportunity(newOpportunityId(), lead, at);
    } catch (error) {
      if (error instanceof Error && error.message === 'LEAD_NOT_QUALIFIED') {
        throw new ApiFailure(409, 'LEAD_NOT_QUALIFIED', 'Opportunity requires a qualified lead.');
      }
      throw error;
    }
    await tx.insertOpportunity(opportunity);
    await tx.insertOutbox({
      id: newOpaqueId('o'),
      eventType: 'opportunity.created',
      leadId: opportunity.leadId,
      payload: { leadId: opportunity.leadId, opportunityId: opportunity.id, status: opportunity.status },
      at,
    });
    await tx.insertAudit({
      id: newOpaqueId('a'),
      action: 'opportunity.created',
      actorId: actor.actorId,
      leadId: opportunity.leadId,
      at,
      metadata: { status: opportunity.status, opportunityId: opportunity.id },
    });
    await tx.saveIdempotency(
      'opportunity.create',
      idempotencyKey,
      { requestHash: hash, responseStatus: 201, responseBody: opportunity },
      at,
    );
    return opportunity;
  });
}

export async function readOpportunity(store: LeadStore, id: string): Promise<Opportunity | null> {
  return store.transaction(tx => tx.findOpportunity(id));
}

export async function listVisibleOpportunities(
  store: LeadStore,
  query: OpportunityListQuery,
): Promise<{ items: Opportunity[]; nextCursor: string | null }> {
  const rows = await store.transaction(tx => tx.listOpportunities({ ...query, limit: query.limit + 1 }));
  const page = rows.slice(0, query.limit);
  const last = page.at(-1);
  const nextCursor = rows.length > query.limit && last
    ? encodeCursor(query.sort, query.sort.includes('updatedAt') ? last.updatedAt : last.createdAt, last.id)
    : null;
  return { items: page, nextCursor };
}
