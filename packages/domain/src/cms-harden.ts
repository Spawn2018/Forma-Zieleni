import { redactForLog } from './search-connectors.ts';

const CMS_SECRET_KEYS = /^(cookie|set-cookie|draft|draftbody|unpublished)$/i;

export type OutboundReview =
  | { ok: true; href: string }
  | { ok: false; href: null; reason: 'URL_INVALID' | 'URL_SCHEME' | 'URL_USERINFO' | 'SSRF_TARGET' };

/** Literal host check only. DNS resolution is not performed. */
export function reviewOutboundUrl(value: string): OutboundReview {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, href: null, reason: 'URL_INVALID' };
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return { ok: false, href: null, reason: 'URL_SCHEME' };
  if (url.username || url.password) return { ok: false, href: null, reason: 'URL_USERINFO' };
  if (blockedHost(url.hostname)) return { ok: false, href: null, reason: 'SSRF_TARGET' };
  url.hash = '';
  return { ok: true, href: url.toString() };
}

export function publicContentHtml(publishedTitle: string, unpublishedToken: string): string {
  const title = publishedTitle.trim();
  const token = unpublishedToken.trim();
  if (!title) throw new Error('TITLE_REQUIRED');
  if (token.length < 8) throw new Error('UNPUBLISHED_TOKEN_REQUIRED');
  if (title.includes(token)) throw new Error('UNPUBLISHED_IN_TITLE');
  const html = `<h1>${escapeHtml(title)}</h1>`;
  if (html.includes(token) || /<script\b/i.test(html.slice(4, -5))) throw new Error('UNPUBLISHED_LEAK');
  return html;
}

export function redactCmsLog(value: unknown, unpublishedTokens: readonly string[] = []): unknown {
  const tokens = unpublishedTokens.map((token) => token.trim()).filter((token) => token.length >= 8);
  return scrubTokens(redactForLog(redactCmsKeys(value)), tokens);
}

function redactCmsKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactCmsKeys);
  if (!value || typeof value !== 'object') return value;
  const out: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    out[key] = CMS_SECRET_KEYS.test(key) ? '[REDACTED]' : redactCmsKeys(nested);
  }
  return out;
}

function scrubTokens(value: unknown, tokens: readonly string[]): unknown {
  if (typeof value === 'string') {
    return tokens.reduce((text, token) => text.split(token).join('[REDACTED]'), value);
  }
  if (Array.isArray(value)) return value.map((item) => scrubTokens(item, tokens));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      out[key] = scrubTokens(nested, tokens);
    }
    return out;
  }
  return value;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function blockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host === 'metadata.google.internal') {
    return true;
  }
  if (host.includes(':')) return blockedV6(host);
  return blockedV4(host);
}

function blockedV4(host: string): boolean {
  const parts = host.split('.');
  if (parts.length !== 4) return false;
  const octets = parts.map((part) => (part === '' || !/^\d{1,3}$/.test(part) ? Number.NaN : Number(part)));
  if (octets.some((octet) => !Number.isInteger(octet) || octet > 255)) return false;
  const a = octets[0] ?? 0;
  const b = octets[1] ?? 0;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

function blockedV6(host: string): boolean {
  if (host === '::1' || host === '::') return true;
  return host.startsWith('fe80:') || host.startsWith('fc') || host.startsWith('fd');
}
