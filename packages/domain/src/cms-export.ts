import {
  createContentStore,
  createDraft,
  publishRevision,
  publicProjection,
} from './content-publish.ts';
import type { ContentStore, ContentType } from './content-publish.ts';

export const FORBIDDEN_EXPORT_FIELDS = [
  'customerName',
  'streetAddress',
  'gps',
  'price',
  'rating',
  'review',
] as const;

export type CmsExportDocument = {
  id: string;
  type: ContentType;
  slug: string;
  title: string;
  summary: string | null;
  published: boolean;
  seo: {
    title: string;
    description: string | null;
    canonical: string | null;
  };
  relations: { mediaAssetIds: string[] };
};

export type CmsExportMedia = {
  id: string;
  checksum: string;
  mime: string;
  relativePath: string;
  regeneration: {
    derivatives: ReadonlyArray<'webp' | 'avif' | 'jpeg'>;
    stripGps: true;
  };
};

export type CmsExportBundle = {
  kind: 'fz-cms-export';
  version: 1;
  exportedAt: string;
  documents: CmsExportDocument[];
  media: CmsExportMedia[];
  remapNotes: string;
};

function slugify(title: string, id: string): string {
  const base = title
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .slice(0, 60);
  return base.length >= 3 ? base : `doc-${id.slice(0, 12)}`;
}

function stripForbidden(input: Readonly<Record<string, unknown>>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if ((FORBIDDEN_EXPORT_FIELDS as readonly string[]).includes(key)) continue;
    if (key.toLowerCase().includes('gps')) continue;
    out[key] = value;
  }
  return out;
}

export function assertExportOmitsPrivateGps(bundle: CmsExportBundle): void {
  const text = JSON.stringify(bundle);
  if (/"gps"\s*:/i.test(text) || /"exif"\s*:/i.test(text) || /"customerName"\s*:/i.test(text)) {
    throw new Error('GPS_LEAKED');
  }
}

export function exportCmsBundle(input: {
  store: ContentStore;
  media?: Array<{
    id: string;
    checksum: string;
    mime: string;
    relativePath: string;
    gps?: unknown;
    customerName?: unknown;
  }>;
  exportedAt: string;
}): CmsExportBundle {
  const documents: CmsExportDocument[] = [];
  for (const document of input.store.documents.values()) {
    const revisionId = document.publicRevisionId ?? document.latestRevisionId;
    const revision = input.store.revisions.get(revisionId);
    if (!revision) continue;
    const fields = stripForbidden(revision.fields as unknown as Record<string, unknown>);
    const title = String(fields.title ?? '');
    documents.push({
      id: document.id,
      type: document.type,
      slug: slugify(title, document.id),
      title,
      summary: typeof fields.summary === 'string' ? fields.summary : null,
      published: document.publicRevisionId != null,
      seo: {
        title,
        description: typeof fields.summary === 'string' ? fields.summary : null,
        canonical: null,
      },
      relations: { mediaAssetIds: [] },
    });
  }

  const media: CmsExportMedia[] = [];
  for (const asset of input.media ?? []) {
    const cleaned = stripForbidden(asset as unknown as Record<string, unknown>);
    media.push({
      id: String(cleaned.id),
      checksum: String(cleaned.checksum),
      mime: String(cleaned.mime),
      relativePath: String(cleaned.relativePath),
      regeneration: {
        derivatives: ['webp', 'avif', 'jpeg'],
        stripGps: true,
      },
    });
  }

  const bundle: CmsExportBundle = {
    kind: 'fz-cms-export',
    version: 1,
    exportedAt: input.exportedAt,
    documents,
    media,
    remapNotes:
      'Re-import remaps document and media ids onto a fresh store. Masters are referenced by checksum; regenerate derivatives with stripGps=true. Private GPS/customer fields are never exported.',
  };
  assertExportOmitsPrivateGps(bundle);
  return bundle;
}

export function importCmsBundle(bundle: CmsExportBundle): {
  store: ContentStore;
  mediaIds: string[];
} {
  if (bundle.kind !== 'fz-cms-export' || bundle.version !== 1) throw new Error('EXPORT_INVALID');
  assertExportOmitsPrivateGps(bundle);
  const store = createContentStore();
  for (const doc of bundle.documents) {
    const revisionId = `rev${doc.id}`.slice(0, 32).padEnd(16, 'x');
    createDraft(store, {
      id: doc.id,
      revisionId,
      type: doc.type,
      fields: { title: doc.title, summary: doc.summary ?? undefined },
      actorId: 'importactorsession01',
      at: bundle.exportedAt,
    });
    if (doc.published) {
      publishRevision(store, {
        documentId: doc.id,
        revisionId,
        actorId: 'importactorsession01',
        at: bundle.exportedAt,
      });
    }
  }
  return { store, mediaIds: bundle.media.map((m) => m.id) };
}

export function exportedPublicTitles(store: ContentStore): string[] {
  const titles: string[] = [];
  for (const id of store.documents.keys()) {
    const projection = publicProjection(store, id);
    if (projection?.title) titles.push(projection.title);
  }
  return titles;
}
