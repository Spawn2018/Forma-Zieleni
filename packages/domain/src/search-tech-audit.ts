const ISSUE = {
  noindex: 'NOINDEX',
  canonical: 'BROKEN_CANONICAL',
  alt: 'MISSING_ALT',
  robots: 'ROBOTS_HEALTH',
  sitemap: 'SITEMAP_HEALTH',
} as const;

export type TechIssueCode = (typeof ISSUE)[keyof typeof ISSUE];

export type TechIssue = {
  code: TechIssueCode;
  path: string;
  detail: string;
};

export type TechnicalAudit = {
  issues: TechIssue[];
  publishes: false;
};

type PageInput = {
  path: string;
  indexableIntent: boolean;
  robots: string;
  canonical: string | null;
  images: readonly { alt: string }[];
};

export function auditTechnicalPages(input: {
  pages: readonly PageInput[];
  robotsTxt: string;
  env: 'production' | 'non-production';
  sitemapLocs: readonly string[];
  origin: string;
}): TechnicalAudit {
  const issues: TechIssue[] = [];
  for (const page of input.pages) {
    if (page.indexableIntent && /noindex/i.test(page.robots)) {
      issues.push({ code: ISSUE.noindex, path: page.path, detail: 'An indexable page sends noindex.' });
    }
    if (brokenCanonical(page, input.origin)) {
      issues.push({ code: ISSUE.canonical, path: page.path, detail: 'Canonical is missing or does not match the page URL.' });
    }
    page.images.forEach((image, index) => {
      if (image.alt.trim() === '') {
        issues.push({ code: ISSUE.alt, path: page.path, detail: `Image ${index + 1} has no alt text.` });
      }
    });
  }
  if (robotsUnhealthy(input.env, input.robotsTxt)) {
    issues.push({
      code: ISSUE.robots,
      path: '/robots.txt',
      detail: input.env === 'production' ? 'Production robots disallows the whole site.' : 'Non-production robots would allow indexing.',
    });
  }
  const noindexPaths = new Set(input.pages.filter((page) => /noindex/i.test(page.robots)).map((page) => page.path));
  for (const loc of input.sitemapLocs) {
    if (sitemapProblem(loc, input.origin, noindexPaths)) {
      issues.push({ code: ISSUE.sitemap, path: '/sitemap.xml', detail: 'Sitemap lists a URL outside the origin or a noindex page.' });
    }
  }
  return { issues, publishes: false };
}

export function applyAuditRecommendation(): never {
  throw new Error('AUDIT_DOES_NOT_PUBLISH');
}

function brokenCanonical(page: PageInput, origin: string): boolean {
  if (!page.indexableIntent) return false;
  if (!page.canonical) return true;
  let url: URL;
  try {
    url = new URL(page.canonical);
  } catch {
    return true;
  }
  let base: URL;
  try {
    base = new URL(origin);
  } catch {
    return true;
  }
  return url.origin !== base.origin || url.pathname !== page.path;
}

function robotsUnhealthy(env: 'production' | 'non-production', robotsTxt: string): boolean {
  const blanket = wildcardDisallowsRoot(robotsTxt);
  if (env === 'production') return blanket;
  return !blanket;
}

function wildcardDisallowsRoot(robotsTxt: string): boolean {
  const groups: { agents: string[]; disallows: string[] }[] = [];
  let agents: string[] = [];
  let disallows: string[] = [];
  let inDirectives = false;
  const flush = () => {
    if (agents.length > 0) groups.push({ agents: [...agents], disallows: [...disallows] });
    agents = [];
    disallows = [];
    inDirectives = false;
  };
  for (const raw of robotsTxt.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim();
    if (!line) continue;
    const match = /^([a-z-]+)\s*:\s*(.*)$/i.exec(line);
    if (!match) continue;
    const key = match[1].toLowerCase();
    const value = match[2].trim();
    if (key === 'user-agent') {
      if (inDirectives) flush();
      agents.push(value);
      continue;
    }
    inDirectives = true;
    if (key === 'disallow') disallows.push(value);
  }
  flush();
  return groups.some((group) => group.agents.includes('*') && group.disallows.includes('/'));
}

function sitemapProblem(loc: string, origin: string, noindexPaths: ReadonlySet<string>): boolean {
  let url: URL;
  let base: URL;
  try {
    url = new URL(loc);
    base = new URL(origin);
  } catch {
    return true;
  }
  if (url.origin !== base.origin) return true;
  return noindexPaths.has(url.pathname);
}
