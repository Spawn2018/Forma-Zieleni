import {
  createProjectFile,
  projectFileForPortal,
  type PortalProjectFileProjection,
  type ProjectFile,
} from '@forma-zieleni/domain';
import type { Actor } from './auth.ts';
import { ApiFailure, badRequest } from './errors.ts';
import { newProjectFileId } from './ids.ts';
import { decodeCursor, encodeCursor, requestHash } from './leads.ts';
import type { LeadStore, ProjectFileListQuery, SortField, StoredReply } from './store.ts';

const SORTS = new Set<SortField>(['createdAt', '-createdAt', 'updatedAt', '-updatedAt']);

export function parseProjectFileListQuery(input: {
  limit?: string;
  cursor?: string;
  sort?: string;
  projectId?: string;
}): ProjectFileListQuery {
  const sort = input.sort ?? '-createdAt';
  if (!SORTS.has(sort as SortField)) throw badRequest('SORT_INVALID', 'Sort is not valid.');
  const limitText = input.limit ?? '20';
  if (!/^(?:[1-9]|[1-9][0-9]|100)$/.test(limitText)) throw badRequest('LIMIT_INVALID', 'Limit is not valid.');
  return {
    limit: Number(limitText),
    sort: sort as SortField,
    projectId: input.projectId,
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

export async function createProjectFileRecord(
  store: LeadStore,
  input: {
    projectId: string;
    name: string;
    mimeType: string;
    sizeBytes: number;
    clientSubject?: string;
  },
  _actor: Actor,
  idempotencyKey: string,
  at: string,
): Promise<ProjectFile> {
  const clientSubject = input.clientSubject ?? null;
  const hash = requestHash({
    scope: 'project-file.create',
    projectId: input.projectId,
    name: input.name,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    clientSubject,
  });
  return store.transaction(async tx => {
    const replay = await replayOrReserve(tx, 'project-file.create', idempotencyKey, hash);
    if (replay) return replay.responseBody as ProjectFile;
    const project = await tx.findProject(input.projectId);
    if (!project) throw new ApiFailure(404, 'PROJECT_NOT_FOUND', 'Project was not found.');
    let file: ProjectFile;
    try {
      file = createProjectFile(
        newProjectFileId(),
        project,
        {
          name: input.name,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
          ...(input.clientSubject !== undefined ? { clientSubject: input.clientSubject } : {}),
        },
        at,
      );
    } catch (error) {
      if (error instanceof Error && error.message === 'PROJECT_FILE_NAME_INVALID') {
        throw badRequest('PROJECT_FILE_NAME_INVALID', 'File name is not valid.');
      }
      if (error instanceof Error && error.message === 'PROJECT_FILE_MIME_INVALID') {
        throw badRequest('PROJECT_FILE_MIME_INVALID', 'File mime type is not valid.');
      }
      if (error instanceof Error && error.message === 'PROJECT_FILE_SIZE_INVALID') {
        throw badRequest('PROJECT_FILE_SIZE_INVALID', 'File size is not valid.');
      }
      if (error instanceof Error && error.message === 'CLIENT_SUBJECT_INVALID') {
        throw badRequest('CLIENT_SUBJECT_INVALID', 'Client subject is not valid.');
      }
      throw error;
    }
    await tx.insertProjectFile(file);
    await tx.saveIdempotency(
      'project-file.create',
      idempotencyKey,
      { requestHash: hash, responseStatus: 201, responseBody: file },
      at,
    );
    return file;
  });
}

export async function readProjectFile(store: LeadStore, id: string): Promise<ProjectFile | null> {
  return store.transaction(tx => tx.findProjectFile(id));
}

export async function listPortalProjectFiles(
  store: LeadStore,
  readerSubject: string,
  query: ProjectFileListQuery,
): Promise<{ items: PortalProjectFileProjection[]; nextCursor: string | null }> {
  const rows = await store.transaction(tx => tx.listProjectFiles({ ...query, limit: 100 }));
  const projected = rows
    .map(file => projectFileForPortal(file, readerSubject))
    .filter((item): item is PortalProjectFileProjection => item !== null)
    .slice(0, query.limit + 1);
  const page = projected.slice(0, query.limit);
  const next = projected.length > query.limit ? page[page.length - 1] : null;
  return {
    items: page,
    nextCursor: next ? encodeCursor(query.sort, next.createdAt, next.id) : null,
  };
}

export async function readPortalProjectFile(
  store: LeadStore,
  id: string,
  readerSubject: string,
): Promise<PortalProjectFileProjection | null> {
  const file = await readProjectFile(store, id);
  if (!file) return null;
  return projectFileForPortal(file, readerSubject);
}
