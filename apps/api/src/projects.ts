import { createProject, projectProjectForPortal, type PortalProjectProjection, type Project, type ProjectStatus } from '@forma-zieleni/domain';
import type { Actor } from './auth.ts';
import { ApiFailure, badRequest } from './errors.ts';
import { newOpaqueId, newProjectId } from './ids.ts';
import { decodeCursor, encodeCursor, requestHash } from './leads.ts';
import type { LeadStore, ProjectListQuery, SortField, StoredReply } from './store.ts';

const SORTS = new Set<SortField>(['createdAt', '-createdAt', 'updatedAt', '-updatedAt']);
const STATUSES = new Set<ProjectStatus>(['planned', 'delivered']);

export function parseProjectListQuery(input: {
  limit?: string;
  cursor?: string;
  sort?: string;
  status?: string;
}): ProjectListQuery {
  const sort = input.sort ?? '-createdAt';
  if (!SORTS.has(sort as SortField)) throw badRequest('SORT_INVALID', 'Sort is not valid.');
  const limitText = input.limit ?? '20';
  if (!/^(?:[1-9]|[1-9][0-9]|100)$/.test(limitText)) throw badRequest('LIMIT_INVALID', 'Limit is not valid.');
  const status = input.status;
  if (status !== undefined && !STATUSES.has(status as ProjectStatus)) {
    throw badRequest('STATUS_INVALID', 'Status is not valid.');
  }
  return {
    limit: Number(limitText),
    sort: sort as SortField,
    status: status as ProjectStatus | undefined,
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

export async function createProjectFromContract(
  store: LeadStore,
  contractId: string,
  actor: Actor,
  idempotencyKey: string,
  at: string,
  clientSubject: string | null = null,
): Promise<Project> {
  const hash = requestHash({ scope: 'project.create', contractId, clientSubject });
  return store.transaction(async tx => {
    const replay = await replayOrReserve(tx, 'project.create', idempotencyKey, hash);
    if (replay) return replay.responseBody as Project;
    const contract = await tx.findContract(contractId);
    if (!contract) throw new ApiFailure(404, 'CONTRACT_NOT_FOUND', 'Contract was not found.');
    const existing = await tx.findProjectByContract(contractId);
    if (existing) throw new ApiFailure(409, 'PROJECT_EXISTS', 'A project already exists for this contract.');
    const offer = await tx.findOffer(contract.offerId);
    if (!offer) throw new ApiFailure(404, 'OFFER_NOT_FOUND', 'Offer was not found.');
    const opportunity = await tx.findOpportunity(offer.opportunityId);
    if (!opportunity) throw new ApiFailure(404, 'OPPORTUNITY_NOT_FOUND', 'Opportunity was not found.');
    let project: Project;
    try {
      project = createProject(newProjectId(), contract, at, clientSubject);
    } catch (error) {
      if (error instanceof Error && error.message === 'CONTRACT_NOT_READY') {
        throw new ApiFailure(409, 'CONTRACT_NOT_READY', 'Project requires a draft contract.');
      }
      throw error;
    }
    await tx.insertProject(project);
    await tx.insertOutbox({
      id: newOpaqueId('o'),
      eventType: 'project.created',
      leadId: opportunity.leadId,
      payload: {
        leadId: opportunity.leadId,
        opportunityId: offer.opportunityId,
        offerId: contract.offerId,
        contractId: project.contractId,
        projectId: project.id,
        status: project.status,
      },
      at,
    });
    await tx.insertAudit({
      id: newOpaqueId('a'),
      action: 'project.created',
      actorId: actor.actorId,
      leadId: opportunity.leadId,
      at,
      metadata: {
        status: project.status,
        contractId: project.contractId,
        projectId: project.id,
      },
    });
    await tx.saveIdempotency(
      'project.create',
      idempotencyKey,
      { requestHash: hash, responseStatus: 201, responseBody: project },
      at,
    );
    return project;
  });
}

export async function readProject(store: LeadStore, id: string): Promise<Project | null> {
  return store.transaction(tx => tx.findProject(id));
}

export async function listVisibleProjects(
  store: LeadStore,
  query: ProjectListQuery,
): Promise<{ items: Project[]; nextCursor: string | null }> {
  const rows = await store.transaction(tx => tx.listProjects({ ...query, limit: query.limit + 1 }));
  const page = rows.slice(0, query.limit);
  const last = page.at(-1);
  const nextCursor = rows.length > query.limit && last
    ? encodeCursor(query.sort, query.sort.includes('updatedAt') ? last.updatedAt : last.createdAt, last.id)
    : null;
  return { items: page, nextCursor };
}

export async function listPortalProjects(
  store: LeadStore,
  readerSubject: string,
  query: ProjectListQuery,
): Promise<{ items: PortalProjectProjection[]; nextCursor: string | null }> {
  const rows = await store.transaction(tx => tx.listProjects({ ...query, limit: 100 }));
  const projected = rows
    .map(project => projectProjectForPortal(project, readerSubject))
    .filter((item): item is PortalProjectProjection => item !== null)
    .slice(0, query.limit + 1);
  const page = projected.slice(0, query.limit);
  const next = projected.length > query.limit ? page[page.length - 1] : null;
  return {
    items: page,
    nextCursor: next ? encodeCursor(query.sort, next.createdAt, next.id) : null,
  };
}

export async function readPortalProject(
  store: LeadStore,
  id: string,
  readerSubject: string,
): Promise<PortalProjectProjection | null> {
  const project = await readProject(store, id);
  if (!project) return null;
  return projectProjectForPortal(project, readerSubject);
}
