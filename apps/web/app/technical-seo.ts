const TRACKING = /^(?:utm_|fbclid$|gclid$|gbraid$|wbraid$)/;
const KNOWN_PATHS = new Set(['/', '/galeria', '/porownanie', '/robots.txt']);

export type SeoEnv = 'production' | 'non-production';

export type PublicRequest =
  | { status: 301; location: string }
  | { status: 404 }
  | { status: 200; path: string };

export type HeadTag =
  | { title: string }
  | { name: string; content: string }
  | { property: string; content: string }
  | { tagName: 'link'; rel: 'canonical'; href: string };

export function seoEnv(value: string | undefined): SeoEnv {
  return value === 'production' ? 'production' : 'non-production';
}

export function canonicalPath(pathname: string): string {
  if (!pathname.startsWith('/') || pathname.startsWith('//')) throw new Error('PATH_INVALID');
  if (pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

export function cleanedSearch(search: string): string {
  const params = new URLSearchParams(search);
  const kept = [...params.entries()]
    .filter(([key]) => !TRACKING.test(key))
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0));
  const next = new URLSearchParams();
  for (const [key, value] of kept) next.append(key, value);
  const text = next.toString();
  return text ? `?${text}` : '';
}

export function resolvePublicRequest(url: URL, legacy: Readonly<Record<string, string>> = {}): PublicRequest {
  const path = canonicalPath(url.pathname);
  const search = cleanedSearch(url.search);
  const moved = legacy[path];
  if (moved) {
    const target = `${canonicalPath(moved)}${search}`;
    if (!target.startsWith('/') || target.startsWith('//')) throw new Error('REDIRECT_TARGET_INVALID');
    if (`${url.pathname}${url.search}` !== target) return { status: 301, location: target };
  }
  const canonical = `${path}${search}`;
  if (`${url.pathname}${url.search}` !== canonical) return { status: 301, location: canonical };
  if (!KNOWN_PATHS.has(path)) return { status: 404 };
  return { status: 200, path };
}

export function robotsTxt(env: SeoEnv): string {
  if (env === 'production') return 'User-agent: *\nAllow: /\n';
  return 'User-agent: *\nDisallow: /\n';
}

export function publicHead(input: {
  title: string;
  description: string;
  path: string;
  indexable: boolean;
  env: SeoEnv;
  origin: string | undefined;
}): HeadTag[] {
  const title = plainText(input.title, 120);
  const description = plainText(input.description, 180);
  const indexable = input.env === 'production' && input.indexable;
  const tags: HeadTag[] = [
    { title },
    { name: 'description', content: description },
    { name: 'robots', content: indexable ? 'index,follow' : 'noindex,nofollow' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
  ];
  const href = canonicalHref(input.origin, input.path);
  if (href && indexable) tags.push({ tagName: 'link', rel: 'canonical', href });
  return tags;
}

export function renderHead(tags: readonly HeadTag[]): string {
  return tags
    .map((tag) => {
      if ('title' in tag) return `<title>${escapeText(tag.title)}</title>`;
      if ('property' in tag) return `<meta property="${escapeText(tag.property)}" content="${escapeText(tag.content)}" />`;
      if ('tagName' in tag) return `<link rel="canonical" href="${escapeText(tag.href)}" />`;
      return `<meta name="${escapeText(tag.name)}" content="${escapeText(tag.content)}" />`;
    })
    .join('');
}

function canonicalHref(origin: string | undefined, path: string): string | null {
  if (!origin) return null;
  let base: URL;
  try {
    base = new URL(origin);
  } catch {
    return null;
  }
  if (base.username || base.password || (base.protocol !== 'https:' && base.protocol !== 'http:')) return null;
  const url = new URL(canonicalPath(path), base);
  if (url.origin !== base.origin) return null;
  url.search = '';
  url.hash = '';
  return url.href;
}

function plainText(value: string, limit: number): string {
  const text = value.trim();
  if (!text || text.length > limit || /[\u0000-\u001f\u007f]/.test(text)) throw new Error('HEAD_TEXT_INVALID');
  return text;
}

function escapeText(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
}
