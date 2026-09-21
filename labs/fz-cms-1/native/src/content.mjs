const now = () => '2026-09-21T12:00:00.000Z';
const CONTENT_TYPES = new Set(['Page', 'Article', 'Service', 'ProjectCaseStudy', 'SiteSettings']);

export function createStore() {
  return {
    documents: new Map(),
    revisions: new Map(),
    assets: new Map(),
    collections: new Map(),
    events: [],
  };
}

export function createDocument(store, type, fields) {
  if (!CONTENT_TYPES.has(type)) throw new Error('CONTENT_TYPE_DENIED');
  const id = `${type.toLowerCase()}_${store.documents.size + 1}`;
  const revision = {
    id: `${id}_r1`,
    documentId: id,
    type,
    fields,
    status: 'draft',
    actorId: 'actor_lab_editor',
    at: now(),
  };
  store.documents.set(id, { id, type, publicRevisionId: null, latestRevisionId: revision.id });
  store.revisions.set(revision.id, revision);
  return { document: store.documents.get(id), revision };
}

export function updateDraft(store, documentId, fields) {
  const document = store.documents.get(documentId);
  const next = {
    id: `${documentId}_r${[...store.revisions.values()].filter(item => item.documentId === documentId).length + 1}`,
    documentId,
    type: document.type,
    fields,
    status: 'draft',
    actorId: 'actor_lab_editor',
    at: now(),
  };
  document.latestRevisionId = next.id;
  store.revisions.set(next.id, next);
  return next;
}

export function publish(store, documentId, revisionId) {
  const revision = store.revisions.get(revisionId);
  if (!revision || revision.documentId !== documentId) throw new Error('REVISION_NOT_FOUND');
  if (revision.status === 'archived') throw new Error('REVISION_ARCHIVED');
  revision.status = 'published';
  store.documents.get(documentId).publicRevisionId = revisionId;
  store.events.push({ type: 'content.published', documentId, revisionId, at: now() });
  return revision;
}

export function rollback(store, documentId, revisionId) {
  return publish(store, documentId, revisionId);
}

export function publicView(store, documentId) {
  const document = store.documents.get(documentId);
  if (!document?.publicRevisionId) return null;
  return store.revisions.get(document.publicRevisionId);
}

export function addAsset(store, asset) {
  const id = `media_${store.assets.size + 1}`;
  const { id: _ignored, gps, exif, ...safe } = asset;
  const record = {
    ...safe,
    id,
    gpsStripped: true,
    focal: safe.focal ?? { x: 0.5, y: 0.5 },
    alt: safe.alt ?? '',
  };
  store.assets.set(id, record);
  return record;
}

export function addCollection(store, title, itemIds) {
  const id = `gallery_${store.collections.size + 1}`;
  const collection = { id, title, itemIds: [...itemIds], heroAssetId: itemIds[0] ?? null, variant: 'grid' };
  store.collections.set(id, collection);
  return collection;
}

export function reorderCollection(store, id, itemIds) {
  const collection = store.collections.get(id);
  collection.itemIds = [...itemIds];
  return collection;
}

export function exportBundle(store) {
  return {
    documents: [...store.documents.values()],
    revisions: [...store.revisions.values()].map(revision => ({ ...revision, fields: { ...revision.fields } })),
    assets: [...store.assets.values()].map(({ bytes, ...safe }) => safe),
    collections: [...store.collections.values()],
    events: [...store.events],
  };
}

export function publishedProjection(store) {
  return {
    at: now(),
    documents: [...store.documents.values()]
      .map(document => publicView(store, document.id))
      .filter(Boolean)
      .map(revision => ({
        id: revision.documentId,
        type: revision.type,
        revisionId: revision.id,
        fields: { ...revision.fields },
      })),
  };
}

export function servePublished(projection) {
  if (!projection?.documents) throw new Error('PROJECTION_MISSING');
  return projection;
}
