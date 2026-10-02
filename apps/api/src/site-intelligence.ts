import {
  applySiteIntelligenceRules,
  assertOpaqueProjectId,
  projectSiteIntelligenceForPortal,
  recordSiteIntelligenceFromRules,
  toSiteIntelligenceRecord,
  type PortalSiteIntelligenceProjection,
  type SiteIntelligenceRecord,
} from '@forma-zieleni/domain';
import type { SiteIntelligenceCreateRequest } from '@forma-zieleni/validation';
import type { Actor } from './auth.ts';
import { ApiFailure, badRequest } from './errors.ts';
import { newSiteConstraintId, newSiteIntelligenceId, newSiteOpportunityId } from './ids.ts';
import { decodeCursor, encodeCursor, requestHash } from './leads.ts';
import type { LeadStore, SiteIntelligenceListQuery, SortField, StoredReply } from './store.ts';

const SORTS = new Set<SortField>(['createdAt', '-createdAt', 'updatedAt', '-updatedAt']);

export function parseSiteIntelligenceListQuery(input: {
  limit?: string;
  cursor?: string;
  sort?: string;
  projectId?: string;
}): SiteIntelligenceListQuery {
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

function mapDomainError(error: unknown): never {
  if (!(error instanceof Error)) throw error;
  switch (error.message) {
    case 'SITEINTEL_AI_WRITE_FORBIDDEN':
    case 'SITEINTEL_AI_INVENT_FORBIDDEN':
      throw new ApiFailure(400, 'SITEINTEL_AI_FORBIDDEN', 'AI cannot invent or author site intelligence facts.');
    case 'SITEINTEL_CREDENTIALS_FORBIDDEN':
      throw new ApiFailure(400, 'SITEINTEL_CREDENTIALS_FORBIDDEN', 'Live third-party credentials are not accepted.');
    case 'SITEINTEL_TWIN_FORBIDDEN':
    case 'SITEINTEL_LIVE_THIRD_PARTY_FORBIDDEN':
      throw new ApiFailure(400, 'SITEINTEL_TWIN_FORBIDDEN', 'Twin or live third-party invent is not accepted.');
    case 'SITEINTEL_HTTP_FORBIDDEN':
      throw new ApiFailure(400, 'SITEINTEL_HTTP_FORBIDDEN', 'Domain recorder cannot claim HTTP invent.');
    case 'SITEINTEL_OBSERVATIONS_REQUIRED':
    case 'SITEINTEL_OBSERVATION_NOT_NORMALIZED':
    case 'SITEINTEL_OBSERVATION_NOT_SYNTHETIC':
    case 'SITEINTEL_OBSERVATION_KIND_UNKNOWN':
    case 'SITEINTEL_OBSERVATION_KIND_INVALID':
    case 'SITEINTEL_OBSERVATION_ID_INVALID':
    case 'SITEINTEL_OBSERVATION_ID_DUPLICATE':
    case 'SITEINTEL_FINDINGS_REQUIRED':
    case 'SITEINTEL_CODE_NOT_FROM_OBSERVATIONS':
    case 'SITEINTEL_RULES_REQUIRED':
    case 'SITEINTEL_RULES_MALFORMED':
      throw badRequest('SITEINTEL_INVALID', 'Site intelligence could not be accepted from observations.');
    default:
      throw error;
  }
}

export async function createSiteIntelligenceRecord(
  store: LeadStore,
  input: SiteIntelligenceCreateRequest,
  _actor: Actor,
  idempotencyKey: string,
  at: string,
): Promise<SiteIntelligenceRecord> {
  const hash = requestHash({
    scope: 'siteintel.create',
    projectId: input.projectId,
    observations: input.observations,
  });
  return store.transaction(async tx => {
    const replay = await replayOrReserve(tx, 'siteintel.create', idempotencyKey, hash);
    if (replay) return replay.responseBody as SiteIntelligenceRecord;
    const project = await tx.findProject(input.projectId);
    if (!project) throw new ApiFailure(404, 'PROJECT_NOT_FOUND', 'Project was not found.');
    const existing = await tx.findSiteIntelligenceByProject(input.projectId);
    if (existing) {
      throw new ApiFailure(409, 'SITEINTEL_EXISTS', 'Site intelligence already exists for this project.');
    }
    let rules;
    try {
      rules = applySiteIntelligenceRules(input.observations);
    } catch (error) {
      mapDomainError(error);
    }
    const constraintIds = rules.constraints.map(() => newSiteConstraintId());
    const opportunityIds = rules.opportunities.map(() => newSiteOpportunityId());
    let bundle;
    try {
      bundle = recordSiteIntelligenceFromRules(
        project,
        rules,
        { constraintIds, opportunityIds },
        at,
      );
    } catch (error) {
      mapDomainError(error);
    }
    const record = toSiteIntelligenceRecord(newSiteIntelligenceId(), bundle, at);
    await tx.insertSiteIntelligence(record);
    await tx.saveIdempotency(
      'siteintel.create',
      idempotencyKey,
      { requestHash: hash, responseStatus: 201, responseBody: record },
      at,
    );
    return record;
  });
}

export async function readSiteIntelligence(store: LeadStore, id: string): Promise<SiteIntelligenceRecord | null> {
  return store.transaction(tx => tx.findSiteIntelligence(id));
}

export async function listVisibleSiteIntelligence(
  store: LeadStore,
  query: SiteIntelligenceListQuery,
): Promise<{ items: SiteIntelligenceRecord[]; nextCursor: string | null }> {
  const rows = await store.transaction(tx => tx.listSiteIntelligence({ ...query, limit: query.limit + 1 }));
  const page = rows.slice(0, query.limit);
  const last = page.at(-1);
  const nextCursor = rows.length > query.limit && last
    ? encodeCursor(query.sort, query.sort.includes('updatedAt') ? last.updatedAt : last.createdAt, last.id)
    : null;
  return { items: page, nextCursor };
}

export async function listPortalSiteIntelligence(
  store: LeadStore,
  readerSubject: string,
  query: SiteIntelligenceListQuery,
): Promise<{ items: PortalSiteIntelligenceProjection[]; nextCursor: string | null }> {
  const rows = await store.transaction(tx => tx.listSiteIntelligence({
    ...query,
    clientSubject: readerSubject,
    limit: query.limit + 1,
  }));
  const projected = rows
    .map(record => projectSiteIntelligenceForPortal(record, readerSubject))
    .filter((item): item is PortalSiteIntelligenceProjection => item !== null);
  const page = projected.slice(0, query.limit);
  const next = projected.length > query.limit ? page[page.length - 1] : null;
  return {
    items: page,
    nextCursor: next ? encodeCursor(query.sort, next.createdAt, next.id) : null,
  };
}

export async function readPortalSiteIntelligence(
  store: LeadStore,
  id: string,
  readerSubject: string,
): Promise<PortalSiteIntelligenceProjection | null> {
  const record = await readSiteIntelligence(store, id);
  if (!record) return null;
  return projectSiteIntelligenceForPortal(record, readerSubject);
}
