import {
  createContentStore,
  createDraft,
  publishRevision,
  publicProjection,
} from './content-publish.ts';
import type { ContentFields, ContentStore, ContentType } from './content-publish.ts';

export type ContentDocumentSnapshot = {
  id: string;
  type: ContentType;
  fields: ContentFields;
  published: boolean;
  actorId: string;
  at: string;
};

export type ContentRestoreBundle = {
  kind: 'fz-cms-content-restore';
  version: 1;
  documents: ContentDocumentSnapshot[];
};

export function snapshotContentStore(store: ContentStore, at: string): ContentRestoreBundle {
  const documents: ContentDocumentSnapshot[] = [];
  for (const document of store.documents.values()) {
    const revisionId = document.publicRevisionId ?? document.latestRevisionId;
    const revision = store.revisions.get(revisionId);
    if (!revision) continue;
    documents.push({
      id: document.id,
      type: document.type,
      fields: { ...revision.fields },
      published: document.publicRevisionId != null,
      actorId: revision.actorId,
      at,
    });
  }
  return { kind: 'fz-cms-content-restore', version: 1, documents };
}

export function restoreContentStore(bundle: ContentRestoreBundle): ContentStore {
  if (bundle.kind !== 'fz-cms-content-restore' || bundle.version !== 1) {
    throw new Error('RESTORE_BUNDLE_INVALID');
  }
  const store = createContentStore();
  for (const row of bundle.documents) {
    const revisionId = `restored${row.id}`.slice(0, 32).padEnd(16, '0');
    createDraft(store, {
      id: row.id,
      revisionId,
      type: row.type,
      fields: row.fields,
      actorId: row.actorId,
      at: row.at,
    });
    if (row.published) {
      publishRevision(store, {
        documentId: row.id,
        revisionId,
        actorId: row.actorId,
        at: row.at,
      });
    }
  }
  return store;
}

export function readRestoredCaseStudy(store: ContentStore, documentId: string): {
  title: string;
  type: ContentType;
} {
  const document = store.documents.get(documentId);
  if (!document) throw new Error('CASE_STUDY_MISSING');
  if (document.type !== 'ProjectCaseStudy') throw new Error('CASE_STUDY_TYPE');
  const projection = publicProjection(store, documentId);
  if (!projection?.title) throw new Error('CASE_STUDY_NOT_PUBLIC');
  return { title: projection.title, type: document.type };
}
