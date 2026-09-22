import { createOffer, type Offer, type OfferStatus } from '@forma-zieleni/domain';
import type { Actor } from './auth.ts';
import { ApiFailure, badRequest } from './errors.ts';
import { newOpaqueId, newOfferId } from './ids.ts';
import { decodeCursor, encodeCursor, requestHash } from './leads.ts';
import type { LeadStore, OfferListQuery, SortField, StoredReply } from './store.ts';

const SORTS = new Set<SortField>(['createdAt', '-createdAt', 'updatedAt', '-updatedAt']);
const STATUSES = new Set<OfferStatus>(['draft']);

export function parseOfferListQuery(input: {
  limit?: string;
  cursor?: string;
  sort?: string;
  status?: string;
}): OfferListQuery {
  const sort = input.sort ?? '-createdAt';
  if (!SORTS.has(sort as SortField)) throw badRequest('SORT_INVALID', 'Sort is not valid.');
  const limitText = input.limit ?? '20';
  if (!/^(?:[1-9]|[1-9][0-9]|100)$/.test(limitText)) throw badRequest('LIMIT_INVALID', 'Limit is not valid.');
  const status = input.status;
  if (status !== undefined && !STATUSES.has(status as OfferStatus)) {
    throw badRequest('STATUS_INVALID', 'Status is not valid.');
  }
  return {
    limit: Number(limitText),
    sort: sort as SortField,
    status: status as OfferStatus | undefined,
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

export async function createOfferFromOpportunity(
  store: LeadStore,
  opportunityId: string,
  actor: Actor,
  idempotencyKey: string,
  at: string,
): Promise<Offer> {
  const hash = requestHash({ scope: 'offer.create', opportunityId });
  return store.transaction(async tx => {
    const replay = await replayOrReserve(tx, 'offer.create', idempotencyKey, hash);
    if (replay) return replay.responseBody as Offer;
    const opportunity = await tx.findOpportunity(opportunityId);
    if (!opportunity) throw new ApiFailure(404, 'OPPORTUNITY_NOT_FOUND', 'Opportunity was not found.');
    const existing = await tx.findOfferByOpportunity(opportunityId);
    if (existing) throw new ApiFailure(409, 'OFFER_EXISTS', 'An offer already exists for this opportunity.');
    let offer: Offer;
    try {
      offer = createOffer(newOfferId(), opportunity, at);
    } catch (error) {
      if (error instanceof Error && error.message === 'OPPORTUNITY_NOT_OPEN') {
        throw new ApiFailure(409, 'OPPORTUNITY_NOT_OPEN', 'Offer requires an open opportunity.');
      }
      throw error;
    }
    await tx.insertOffer(offer);
    await tx.insertOutbox({
      id: newOpaqueId('o'),
      eventType: 'offer.created',
      leadId: opportunity.leadId,
      payload: {
        leadId: opportunity.leadId,
        opportunityId: offer.opportunityId,
        offerId: offer.id,
        status: offer.status,
      },
      at,
    });
    await tx.insertAudit({
      id: newOpaqueId('a'),
      action: 'offer.created',
      actorId: actor.actorId,
      leadId: opportunity.leadId,
      at,
      metadata: {
        status: offer.status,
        opportunityId: offer.opportunityId,
        offerId: offer.id,
      },
    });
    await tx.saveIdempotency(
      'offer.create',
      idempotencyKey,
      { requestHash: hash, responseStatus: 201, responseBody: offer },
      at,
    );
    return offer;
  });
}

export async function readOffer(store: LeadStore, id: string): Promise<Offer | null> {
  return store.transaction(tx => tx.findOffer(id));
}

export async function listVisibleOffers(
  store: LeadStore,
  query: OfferListQuery,
): Promise<{ items: Offer[]; nextCursor: string | null }> {
  const rows = await store.transaction(tx => tx.listOffers({ ...query, limit: query.limit + 1 }));
  const page = rows.slice(0, query.limit);
  const last = page.at(-1);
  const nextCursor = rows.length > query.limit && last
    ? encodeCursor(query.sort, query.sort.includes('updatedAt') ? last.updatedAt : last.createdAt, last.id)
    : null;
  return { items: page, nextCursor };
}
