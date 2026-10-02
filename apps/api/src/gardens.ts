import {
  assertOpaqueProjectId,
  createGarden,
  projectGardenForPortal,
  type Garden,
  type PortalGardenProjection,
} from '@forma-zieleni/domain';
import type { Actor } from './auth.ts';
import { ApiFailure, badRequest } from './errors.ts';
import { newGardenId } from './ids.ts';
import { decodeCursor, encodeCursor, requestHash } from './leads.ts';
import type { GardenListQuery, LeadStore, SortField, StoredReply } from './store.ts';

const SORTS = new Set<SortField>(['createdAt', '-createdAt', 'updatedAt', '-updatedAt']);

export function parseGardenListQuery(input: {
  limit?: string;
  cursor?: string;
  sort?: string;
  projectId?: string;
}): GardenListQuery {
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

export async function createGardenRecord(
  store: LeadStore,
  projectId: string,
  _actor: Actor,
  idempotencyKey: string,
  at: string,
): Promise<Garden> {
  const hash = requestHash({ scope: 'garden.create', projectId });
  return store.transaction(async tx => {
    const replay = await replayOrReserve(tx, 'garden.create', idempotencyKey, hash);
    if (replay) return replay.responseBody as Garden;
    const project = await tx.findProject(projectId);
    if (!project) throw new ApiFailure(404, 'PROJECT_NOT_FOUND', 'Project was not found.');
    const existing = await tx.findGardenByProject(projectId);
    if (existing) throw new ApiFailure(409, 'GARDEN_EXISTS', 'A garden already exists for this project.');
    let garden: Garden;
    try {
      garden = createGarden(newGardenId(), project, at);
    } catch (error) {
      if (error instanceof Error && error.message === 'PROJECT_NOT_DELIVERED') {
        throw new ApiFailure(409, 'PROJECT_NOT_DELIVERED', 'Garden requires a delivered project.');
      }
      if (error instanceof Error && error.message === 'GARDEN_BEFORE_DELIVERY') {
        throw new ApiFailure(409, 'GARDEN_BEFORE_DELIVERY', 'Garden cannot precede project delivery.');
      }
      if (error instanceof Error && error.message === 'GARDEN_ID_GUESSABLE') {
        throw badRequest('GARDEN_ID_INVALID', 'Garden id is not valid.');
      }
      throw error;
    }
    await tx.insertGarden(garden);
    await tx.saveIdempotency(
      'garden.create',
      idempotencyKey,
      { requestHash: hash, responseStatus: 201, responseBody: garden },
      at,
    );
    return garden;
  });
}

export async function readGarden(store: LeadStore, id: string): Promise<Garden | null> {
  return store.transaction(tx => tx.findGarden(id));
}

export async function listVisibleGardens(
  store: LeadStore,
  query: GardenListQuery,
): Promise<{ items: Garden[]; nextCursor: string | null }> {
  const rows = await store.transaction(tx => tx.listGardens({ ...query, limit: query.limit + 1 }));
  const page = rows.slice(0, query.limit);
  const last = page.at(-1);
  const nextCursor = rows.length > query.limit && last
    ? encodeCursor(query.sort, query.sort.includes('updatedAt') ? last.updatedAt : last.createdAt, last.id)
    : null;
  return { items: page, nextCursor };
}

export async function listPortalGardens(
  store: LeadStore,
  readerSubject: string,
  query: GardenListQuery,
): Promise<{ items: PortalGardenProjection[]; nextCursor: string | null }> {
  const rows = await store.transaction(tx => tx.listGardens({
    ...query,
    clientSubject: readerSubject,
    limit: query.limit + 1,
  }));
  const projected = rows
    .map(garden => projectGardenForPortal(garden, readerSubject))
    .filter((item): item is PortalGardenProjection => item !== null);
  const page = projected.slice(0, query.limit);
  const next = projected.length > query.limit ? page[page.length - 1] : null;
  return {
    items: page,
    nextCursor: next ? encodeCursor(query.sort, next.createdAt, next.id) : null,
  };
}

export async function readPortalGarden(
  store: LeadStore,
  id: string,
  readerSubject: string,
): Promise<PortalGardenProjection | null> {
  const garden = await readGarden(store, id);
  if (!garden) return null;
  return projectGardenForPortal(garden, readerSubject);
}
