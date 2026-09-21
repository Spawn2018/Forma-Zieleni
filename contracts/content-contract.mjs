import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const contract = JSON.parse(
  readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'content-contract.json'), 'utf8'),
);

const SCHEMA_TYPES = new Set(['Organization', 'LocalBusiness', 'Service', 'Article', 'BlogPosting', 'WebPage']);

export function contentContract() {
  return contract;
}

export function seoDefaults(content) {
  const title = requiredText(content.title, 'title');
  const description = text(content.summary) || text(content.title);
  return {
    title,
    description,
    canonical: content.publicUrl ? canonicalUrl(content.publicUrl) : undefined,
    robots: { index: true, follow: true },
    ogTitle: title,
    ogDescription: description,
    ogImage: text(content.heroAssetId) || undefined,
    schemaType: defaultSchema(content.type),
    excludeFromSitemap: false,
  };
}

export function reviewSeo(content) {
  const generated = seoDefaults(content);
  const seo = { ...generated, ...cleanOverrides(content.seo) };
  const errors = [];
  const warnings = [];
  const recommendations = [];

  if (content.seo?.canonical != null) {
    try {
      seo.canonical = canonicalUrl(content.seo.canonical);
    } catch {
      seo.canonical = generated.canonical;
      errors.push({ level: 'ERROR', code: 'canonical-malformed' });
    }
  }
  if (seo.robots?.index === false && content.type !== 'SiteSettings') {
    warnings.push({ level: 'WARNING', code: 'public-noindex' });
  }
  if (!text(seo.description) || text(seo.description).length < 40) {
    recommendations.push({ level: 'RECOMMENDATION', code: 'description-thin' });
  }
  if (seo.schemaType != null && !SCHEMA_TYPES.has(seo.schemaType)) {
    errors.push({ level: 'ERROR', code: 'schema-type-uncontrolled' });
  }
  for (const field of contract.forbiddenPublicFields) {
    if (content[field] != null || content.seo?.[field] != null) {
      errors.push({ level: 'ERROR', code: 'forbidden-public-field', field });
    }
  }
  if (content.businessProjectRef != null && !opaqueRef(content.businessProjectRef)) {
    errors.push({ level: 'ERROR', code: 'business-project-ref-not-opaque' });
  }
  return { seo, errors, warnings, recommendations, publishBlocked: errors.length > 0 };
}

function cleanOverrides(seo = {}) {
  const next = {};
  for (const field of [...contract.seoEditorFields, ...contract.seoSystemFields]) {
    if (seo[field] !== undefined) next[field] = seo[field];
  }
  return next;
}

function defaultSchema(type) {
  if (type === 'Article') return 'Article';
  if (type === 'Service') return 'Service';
  if (type === 'Page' || type === 'ProjectCaseStudy') return 'WebPage';
  return undefined;
}

function canonicalUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new Error('canonical-malformed');
  }
  return url.origin + url.pathname;
}

function opaqueRef(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{8,80}$/.test(value) && !value.includes('http');
}

function requiredText(value, name) {
  const cleaned = text(value);
  if (!cleaned) throw new Error(`missing-${name}`);
  return cleaned;
}

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}
