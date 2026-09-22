import { createContract, type Contract, type ContractStatus } from '@forma-zieleni/domain';
import type { Actor } from './auth.ts';
import { ApiFailure, badRequest } from './errors.ts';
import { newContractId, newOpaqueId } from './ids.ts';
import { decodeCursor, encodeCursor, requestHash } from './leads.ts';
import type { ContractListQuery, LeadStore, SortField, StoredReply } from './store.ts';

const SORTS = new Set<SortField>(['createdAt', '-createdAt', 'updatedAt', '-updatedAt']);
const STATUSES = new Set<ContractStatus>(['draft']);

export function parseContractListQuery(input: {
  limit?: string;
  cursor?: string;
  sort?: string;
  status?: string;
}): ContractListQuery {
  const sort = input.sort ?? '-createdAt';
  if (!SORTS.has(sort as SortField)) throw badRequest('SORT_INVALID', 'Sort is not valid.');
  const limitText = input.limit ?? '20';
  if (!/^(?:[1-9]|[1-9][0-9]|100)$/.test(limitText)) throw badRequest('LIMIT_INVALID', 'Limit is not valid.');
  const status = input.status;
  if (status !== undefined && !STATUSES.has(status as ContractStatus)) {
    throw badRequest('STATUS_INVALID', 'Status is not valid.');
  }
  return {
    limit: Number(limitText),
    sort: sort as SortField,
    status: status as ContractStatus | undefined,
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

export async function createContractFromOffer(
  store: LeadStore,
  offerId: string,
  actor: Actor,
  idempotencyKey: string,
  at: string,
): Promise<Contract> {
  const hash = requestHash({ scope: 'contract.create', offerId });
  return store.transaction(async tx => {
    const replay = await replayOrReserve(tx, 'contract.create', idempotencyKey, hash);
    if (replay) return replay.responseBody as Contract;
    const offer = await tx.findOffer(offerId);
    if (!offer) throw new ApiFailure(404, 'OFFER_NOT_FOUND', 'Offer was not found.');
    const existing = await tx.findContractByOffer(offerId);
    if (existing) throw new ApiFailure(409, 'CONTRACT_EXISTS', 'A contract already exists for this offer.');
    const opportunity = await tx.findOpportunity(offer.opportunityId);
    if (!opportunity) throw new ApiFailure(404, 'OPPORTUNITY_NOT_FOUND', 'Opportunity was not found.');
    let contract: Contract;
    try {
      contract = createContract(newContractId(), offer, at);
    } catch (error) {
      if (error instanceof Error && error.message === 'OFFER_NOT_READY') {
        throw new ApiFailure(409, 'OFFER_NOT_READY', 'Contract requires a draft offer.');
      }
      throw error;
    }
    await tx.insertContract(contract);
    await tx.insertOutbox({
      id: newOpaqueId('o'),
      eventType: 'contract.created',
      leadId: opportunity.leadId,
      payload: {
        leadId: opportunity.leadId,
        opportunityId: offer.opportunityId,
        offerId: contract.offerId,
        contractId: contract.id,
        status: contract.status,
      },
      at,
    });
    await tx.insertAudit({
      id: newOpaqueId('a'),
      action: 'contract.created',
      actorId: actor.actorId,
      leadId: opportunity.leadId,
      at,
      metadata: {
        status: contract.status,
        offerId: contract.offerId,
        contractId: contract.id,
      },
    });
    await tx.saveIdempotency(
      'contract.create',
      idempotencyKey,
      { requestHash: hash, responseStatus: 201, responseBody: contract },
      at,
    );
    return contract;
  });
}

export async function readContract(store: LeadStore, id: string): Promise<Contract | null> {
  return store.transaction(tx => tx.findContract(id));
}

export async function listVisibleContracts(
  store: LeadStore,
  query: ContractListQuery,
): Promise<{ items: Contract[]; nextCursor: string | null }> {
  const rows = await store.transaction(tx => tx.listContracts({ ...query, limit: query.limit + 1 }));
  const page = rows.slice(0, query.limit);
  const last = page.at(-1);
  const nextCursor = rows.length > query.limit && last
    ? encodeCursor(query.sort, query.sort.includes('updatedAt') ? last.updatedAt : last.createdAt, last.id)
    : null;
  return { items: page, nextCursor };
}
