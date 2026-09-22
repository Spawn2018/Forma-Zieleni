import { redactForLog } from './search-connectors.ts';

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const SCRIPTISH = /<\s*\/?\s*script\b|javascript\s*:|on\w+\s*=/i;

export type SanitizedSearchLabel = {
  rawRejected: boolean;
  label: string | null;
};

export type SanitizedSearchUrl = {
  ok: boolean;
  href: string | null;
  reason: string | null;
};

export function sanitizeImportedLabel(value: unknown): SanitizedSearchLabel {
  if (typeof value !== 'string') return { rawRejected: true, label: null };
  const trimmed = value.replace(CONTROL_CHARS, '').trim();
  if (trimmed.length === 0 || trimmed.length > 200) return { rawRejected: true, label: null };
  if (SCRIPTISH.test(trimmed)) return { rawRejected: true, label: null };
  const escaped = trimmed
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  return { rawRejected: false, label: escaped };
}

export function sanitizeSearchUrl(value: unknown): SanitizedSearchUrl {
  if (typeof value !== 'string' || value.trim() === '') {
    return { ok: false, href: null, reason: 'URL_EMPTY' };
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, href: null, reason: 'URL_INVALID' };
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return { ok: false, href: null, reason: 'URL_SCHEME' };
  }
  if (url.username || url.password) {
    return { ok: false, href: null, reason: 'URL_USERINFO' };
  }
  url.hash = '';
  return { ok: true, href: url.toString(), reason: null };
}

export type SearchPreviewPayload = {
  mode: 'public' | 'draft';
  title: string | null;
  draftBody: string | null;
};

/** Public preview must not leak draft body text. */
export function publicSearchPreview(input: {
  title?: string | null;
  draftBody?: string | null;
  published: boolean;
}): SearchPreviewPayload {
  const title = sanitizeImportedLabel(input.title ?? null).label;
  if (!input.published) {
    return { mode: 'draft', title: null, draftBody: null };
  }
  return { mode: 'public', title, draftBody: null };
}

export function redactSearchSecurityLog(payload: unknown): unknown {
  return redactForLog(payload);
}
