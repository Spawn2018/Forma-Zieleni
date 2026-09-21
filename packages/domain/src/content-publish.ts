const OPAQUE_ID = /^[a-z][a-z0-9]{15,63}$/;
const TYPES = new Set(['Page', 'Article', 'Service', 'ProjectCaseStudy']);

export type ContentType = 'Page' | 'Article' | 'Service' | 'ProjectCaseStudy';
export type ContentFields = { title: string; summary?: string };

type Revision = {
  id: string;
  documentId: string;
  fields: ContentFields;
  status: 'draft' | 'scheduled' | 'published';
  publishAt: string | null;
  actorId: string;
};

type Document = {
  id: string;
  type: ContentType;
  publicRevisionId: string | null;
  latestRevisionId: string;
};

export type ContentAudit = {
  action: 'content.published' | 'content.scheduled' | 'content.rolled_back';
  actorId: string;
  documentId: string;
  revisionId: string;
  at: string;
};

export type ContentOutbox = {
  type: 'content.published';
  documentId: string;
  revisionId: string;
  at: string;
};

export type ContentStore = {
  documents: Map<string, Document>;
  revisions: Map<string, Revision>;
  audit: ContentAudit[];
  outbox: ContentOutbox[];
};

export function createContentStore(): ContentStore {
  return { documents: new Map(), revisions: new Map(), audit: [], outbox: [] };
}

export function createDraft(
  store: ContentStore,
  input: { id: string; revisionId: string; type: ContentType; fields: ContentFields; actorId: string; at: string },
): Document {
  assertId(input.id);
  assertId(input.revisionId);
  if (!TYPES.has(input.type)) throw new Error('CONTENT_TYPE_DENIED');
  assertFields(input.fields);
  const revision: Revision = {
    id: input.revisionId,
    documentId: input.id,
    fields: cloneFields(input.fields),
    status: 'draft',
    publishAt: null,
    actorId: input.actorId,
  };
  store.revisions.set(revision.id, revision);
  const document: Document = {
    id: input.id,
    type: input.type,
    publicRevisionId: null,
    latestRevisionId: revision.id,
  };
  store.documents.set(document.id, document);
  return document;
}

export function editDraft(
  store: ContentStore,
  input: { documentId: string; revisionId: string; fields: ContentFields; actorId: string },
): Revision {
  const document = requiredDocument(store, input.documentId);
  assertId(input.revisionId);
  assertFields(input.fields);
  const revision: Revision = {
    id: input.revisionId,
    documentId: document.id,
    fields: cloneFields(input.fields),
    status: 'draft',
    publishAt: null,
    actorId: input.actorId,
  };
  store.revisions.set(revision.id, revision);
  document.latestRevisionId = revision.id;
  return revision;
}

export function publishRevision(
  store: ContentStore,
  input: { documentId: string; revisionId: string; actorId: string; at: string; publishAt?: string },
): Revision {
  const revision = requiredRevision(store, input.documentId, input.revisionId);
  if (input.publishAt && input.publishAt > input.at) {
    revision.status = 'scheduled';
    revision.publishAt = input.publishAt;
    store.audit.push({
      action: 'content.scheduled',
      actorId: input.actorId,
      documentId: input.documentId,
      revisionId: revision.id,
      at: input.at,
    });
    return revision;
  }
  return makePublic(store, revision, input.actorId, input.at, 'content.published');
}

export function releaseDue(store: ContentStore, at: string, actorId: string): ContentOutbox[] {
  const emitted: ContentOutbox[] = [];
  for (const revision of store.revisions.values()) {
    if (revision.status !== 'scheduled' || !revision.publishAt || revision.publishAt > at) continue;
    const event = makePublic(store, revision, actorId, at, 'content.published').id;
    const outbox = store.outbox.find(item => item.revisionId === event && item.at === at);
    if (outbox) emitted.push(outbox);
  }
  return emitted;
}

export function rollbackRevision(
  store: ContentStore,
  input: { documentId: string; revisionId: string; actorId: string; at: string },
): Revision {
  const revision = requiredRevision(store, input.documentId, input.revisionId);
  return makePublic(store, revision, input.actorId, input.at, 'content.rolled_back');
}

export function publicProjection(store: ContentStore, documentId: string): ContentFields | null {
  const document = store.documents.get(documentId);
  if (!document?.publicRevisionId) return null;
  const revision = store.revisions.get(document.publicRevisionId);
  return revision ? cloneFields(revision.fields) : null;
}

function makePublic(
  store: ContentStore,
  revision: Revision,
  actorId: string,
  at: string,
  action: ContentAudit['action'],
): Revision {
  const document = requiredDocument(store, revision.documentId);
  revision.status = 'published';
  revision.publishAt = null;
  document.publicRevisionId = revision.id;
  store.audit.push({ action, actorId, documentId: document.id, revisionId: revision.id, at });
  store.outbox.push({ type: 'content.published', documentId: document.id, revisionId: revision.id, at });
  return revision;
}

function requiredDocument(store: ContentStore, documentId: string): Document {
  const document = store.documents.get(documentId);
  if (!document) throw new Error('CONTENT_NOT_FOUND');
  return document;
}

function requiredRevision(store: ContentStore, documentId: string, revisionId: string): Revision {
  const revision = store.revisions.get(revisionId);
  if (!revision || revision.documentId !== documentId) throw new Error('REVISION_NOT_FOUND');
  return revision;
}

function assertId(id: string): void {
  if (!OPAQUE_ID.test(id)) throw new Error('CONTENT_ID_INVALID');
}

function assertFields(fields: ContentFields): void {
  if (!fields.title.trim() || fields.title.length > 180) throw new Error('CONTENT_TITLE_INVALID');
}

function cloneFields(fields: ContentFields): ContentFields {
  return { title: fields.title, summary: fields.summary };
}
