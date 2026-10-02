import {
  createCapacityWindow,
  decidePromisedDate,
  type CapacityDecision,
  type CapacityKind,
  type CapacityWindow,
} from '@forma-zieleni/domain';
import type { Actor } from './auth.ts';
import { ApiFailure, badRequest } from './errors.ts';
import { newCapacityWindowId } from './ids.ts';
import { decodeCursor, encodeCursor, requestHash } from './leads.ts';
import type { CapacityListQuery, LeadStore, SortField, StoredReply } from './store.ts';

const SORTS = new Set<SortField>(['createdAt', '-createdAt', 'updatedAt', '-updatedAt']);
const DECISION_CAP = 200;

export function parseCapacityListQuery(input: {
  limit?: string;
  cursor?: string;
  sort?: string;
  kind?: string;
  actorId?: string;
}): CapacityListQuery {
  const sort = input.sort ?? '-createdAt';
  if (!SORTS.has(sort as SortField)) throw badRequest('SORT_INVALID', 'Sort is not valid.');
  const limitText = input.limit ?? '20';
  if (!/^(?:[1-9]|[1-9][0-9]|100)$/.test(limitText)) throw badRequest('LIMIT_INVALID', 'Limit is not valid.');
  let kind: CapacityKind | undefined;
  if (input.kind !== undefined && input.kind !== '') {
    if (input.kind !== 'consultation' && input.kind !== 'start') {
      throw badRequest('CAPACITY_KIND_INVALID', 'Capacity kind is not valid.');
    }
    kind = input.kind;
  }
  let actorId: string | undefined;
  if (input.actorId !== undefined && input.actorId !== '') {
    if (!/^[a-z][a-z0-9]{15,63}$/.test(input.actorId)) {
      throw badRequest('CAPACITY_ACTOR_ID_INVALID', 'Capacity actor id is not valid.');
    }
    actorId = input.actorId;
  }
  return {
    limit: Number(limitText),
    sort: sort as SortField,
    kind,
    actorId,
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

function asCapacityError(error: unknown): never {
  if (error instanceof Error) {
    const known: Record<string, [string, string]> = {
      CAPACITY_KIND_INVALID: ['CAPACITY_KIND_INVALID', 'Capacity kind is not valid.'],
      CAPACITY_START_INVALID: ['CAPACITY_START_INVALID', 'Capacity start is not valid.'],
      CAPACITY_END_INVALID: ['CAPACITY_END_INVALID', 'Capacity end is not valid.'],
      CAPACITY_AT_INVALID: ['CAPACITY_AT_INVALID', 'Capacity timestamp is not valid.'],
      CAPACITY_RANGE_INVALID: ['CAPACITY_RANGE_INVALID', 'Capacity range is not valid.'],
      CAPACITY_WINDOW_ID_GUESSABLE: ['CAPACITY_WINDOW_ID_INVALID', 'Capacity window id is not valid.'],
      CAPACITY_ACTOR_ID_GUESSABLE: ['CAPACITY_ACTOR_ID_INVALID', 'Capacity actor id is not valid.'],
      CAPACITY_CALENDAR_SURFACE_FORBIDDEN: ['CAPACITY_CALENDAR_SURFACE_FORBIDDEN', 'Capacity cannot carry a calendar or customer surface.'],
      CAPACITY_PROMISE_INVALID: ['CAPACITY_PROMISE_INVALID', 'Promised instant is not valid.'],
    };
    const mapped = known[error.message];
    if (mapped) throw badRequest(mapped[0], mapped[1]);
  }
  throw error;
}

export async function createCapacityWindowRecord(
  store: LeadStore,
  input: { actorId: string; kind: CapacityKind; startsAt: string; endsAt: string },
  _actor: Actor,
  idempotencyKey: string,
  at: string,
): Promise<CapacityWindow> {
  const hash = requestHash({ scope: 'capacity.create', ...input });
  return store.transaction(async tx => {
    const replay = await replayOrReserve(tx, 'capacity.create', idempotencyKey, hash);
    if (replay) return replay.responseBody as CapacityWindow;
    let window: CapacityWindow;
    try {
      window = createCapacityWindow(newCapacityWindowId(), input.actorId, input.kind, input.startsAt, input.endsAt, at);
    } catch (error) {
      asCapacityError(error);
    }
    await tx.insertCapacityWindow(window);
    await tx.saveIdempotency(
      'capacity.create',
      idempotencyKey,
      { requestHash: hash, responseStatus: 201, responseBody: window },
      at,
    );
    return window;
  });
}

export async function readCapacityWindow(store: LeadStore, id: string): Promise<CapacityWindow | null> {
  return store.transaction(tx => tx.findCapacityWindow(id));
}

export async function listVisibleCapacityWindows(
  store: LeadStore,
  query: CapacityListQuery,
): Promise<{ items: CapacityWindow[]; nextCursor: string | null }> {
  const rows = await store.transaction(tx => tx.listCapacityWindows({ ...query, limit: query.limit + 1 }));
  const page = rows.slice(0, query.limit);
  const last = page.at(-1);
  const nextCursor = rows.length > query.limit && last
    ? encodeCursor(query.sort, query.sort.includes('updatedAt') ? last.updatedAt : last.createdAt, last.id)
    : null;
  return { items: page, nextCursor };
}

export async function decideCapacityPromise(
  store: LeadStore,
  input: { kind: CapacityKind; promisedAt: string; actorId?: string },
): Promise<CapacityDecision> {
  const windows = await store.transaction(tx => tx.listCapacityWindows({
    limit: DECISION_CAP + 1,
    sort: 'createdAt',
  }));
  if (windows.length > DECISION_CAP) {
    throw new ApiFailure(409, 'CAPACITY_DECISION_TOO_BROAD', 'Too many capacity windows to decide in one request.');
  }
  try {
    return decidePromisedDate(windows, input.kind, input.promisedAt, input.actorId);
  } catch (error) {
    asCapacityError(error);
  }
}
