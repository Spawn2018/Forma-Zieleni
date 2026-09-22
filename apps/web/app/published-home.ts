import { contentPaths } from '@forma-zieleni/api-client';
import type { PublicHome } from './shell.ts';

const HOME_ID = /^[a-z][a-z0-9]{15,63}$/;
const TITLE_LIMIT = 180;

export class PublishedHomeUnavailable extends Error {
  constructor() {
    super('PUBLISHED_HOME_UNAVAILABLE');
    this.name = 'PublishedHomeUnavailable';
  }
}

export async function readPublishedHome(input: {
  origin: string | undefined;
  documentId: string | undefined;
  fetchImpl: typeof fetch;
  timeoutMs?: number;
}): Promise<PublicHome> {
  if (!input.origin || !input.documentId) return { state: 'unconfigured' };
  if (!HOME_ID.test(input.documentId)) throw new PublishedHomeUnavailable();
  const base = publicOrigin(input.origin);
  const url = new URL(contentPaths.document(input.documentId), base);
  if (url.origin !== base.origin) throw new PublishedHomeUnavailable();
  const response = await input.fetchImpl(url, {
    headers: { accept: 'application/json' },
    redirect: 'error',
    signal: AbortSignal.timeout(input.timeoutMs ?? 2000),
  });
  if (response.status === 404 || response.status === 401 || response.status === 403) return { state: 'absent' };
  if (!response.ok) throw new PublishedHomeUnavailable();
  const type = response.headers.get('content-type') ?? '';
  if (!type.toLowerCase().includes('application/json')) throw new PublishedHomeUnavailable();
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new PublishedHomeUnavailable();
  }
  return publishedTitle(body, input.documentId);
}

function publicOrigin(value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new PublishedHomeUnavailable();
  }
  if (url.username || url.password || (url.protocol !== 'https:' && url.protocol !== 'http:')) {
    throw new PublishedHomeUnavailable();
  }
  return url;
}

function publishedTitle(body: unknown, documentId: string): PublicHome {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new PublishedHomeUnavailable();
  const record = body as Record<string, unknown>;
  if (record.id !== documentId || record.status !== 'published') throw new PublishedHomeUnavailable();
  if (typeof record.title !== 'string') throw new PublishedHomeUnavailable();
  const title = record.title.trim();
  if (!title || title.length > TITLE_LIMIT || /[\u0000-\u001f\u007f]/.test(title)) throw new PublishedHomeUnavailable();
  return { state: 'published', title };
}
