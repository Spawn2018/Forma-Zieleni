import {
  assertNoClientSuppliedAuthority,
  bindContentRole,
} from './content-auth.ts';
import type { ContentCapability, ContentRole } from './content-auth.ts';
import {
  createDraft,
  createContentStore,
  publishRevision,
  publicProjection,
} from './content-publish.ts';
import type { ContentStore, ContentType } from './content-publish.ts';

/** Editorial types CMS-ADMIN must create without editing source files. */
export const ADMIN_EDITORIAL_TYPES = ['Service', 'ProjectCaseStudy'] as const;

export type AdminEditorialType = (typeof ADMIN_EDITORIAL_TYPES)[number];

export type ContentAdminSession = {
  actorId: string;
  role: ContentRole;
  capabilities: readonly ContentCapability[];
};

export type AdminCreateInput = {
  type: AdminEditorialType;
  documentId: string;
  revisionId: string;
  title: string;
  summary?: string;
  at: string;
  publish?: boolean;
};

export type AdminCreateResult = {
  type: AdminEditorialType;
  documentId: string;
  revisionId: string;
  published: boolean;
  publicTitle: string | null;
};

function requireEdit(session: ContentAdminSession): void {
  if (!session.capabilities.includes('content:edit')) throw new Error('CONTENT_EDIT_FORBIDDEN');
}

function requirePublish(session: ContentAdminSession): void {
  if (!session.capabilities.includes('content:publish')) throw new Error('CONTENT_PUBLISH_FORBIDDEN');
}

export function openContentAdminSession(actorId: string, role: ContentRole): ContentAdminSession {
  const bound = bindContentRole(actorId, role);
  return { actorId: bound.actorId, role, capabilities: bound.capabilities };
}

export function assertAdminRequestHasNoClientAuthority(body: Readonly<Record<string, unknown>>): void {
  assertNoClientSuppliedAuthority(body);
}

export function createEditorialDocument(
  store: ContentStore,
  session: ContentAdminSession,
  input: AdminCreateInput,
): AdminCreateResult {
  requireEdit(session);
  if (!ADMIN_EDITORIAL_TYPES.includes(input.type)) throw new Error('ADMIN_TYPE_DENIED');
  const type: ContentType = input.type;
  createDraft(store, {
    id: input.documentId,
    revisionId: input.revisionId,
    type,
    fields: { title: input.title, summary: input.summary },
    actorId: session.actorId,
    at: input.at,
  });
  let published = false;
  if (input.publish) {
    requirePublish(session);
    publishRevision(store, {
      documentId: input.documentId,
      revisionId: input.revisionId,
      actorId: session.actorId,
      at: input.at,
    });
    published = true;
  }
  const projection = publicProjection(store, input.documentId);
  return {
    type: input.type,
    documentId: input.documentId,
    revisionId: input.revisionId,
    published,
    publicTitle: projection?.title ?? null,
  };
}

export function editorialHappyPath(store = createContentStore()): {
  store: ContentStore;
  service: AdminCreateResult;
  study: AdminCreateResult;
} {
  const session = openContentAdminSession('owneradminsession01', 'publisher');
  const at = '2026-09-22T02:00:00.000Z';
  const service = createEditorialDocument(store, session, {
    type: 'Service',
    documentId: 'serviceprojektogrodu',
    revisionId: 'revisionservice00001',
    title: 'Projekt ogrodu',
    summary: 'Synthetic service for CMS-ADMIN',
    at,
    publish: true,
  });
  const study = createEditorialDocument(store, session, {
    type: 'ProjectCaseStudy',
    documentId: 'studylabordydomowy',
    revisionId: 'revisionstudy0000001',
    title: 'Ogród laboratoryjny',
    summary: 'Synthetic case study for CMS-ADMIN',
    at,
    publish: true,
  });
  return { store, service, study };
}
