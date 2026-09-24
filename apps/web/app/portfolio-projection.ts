/**
 * Public WWW portfolio projection (FZ-REQ-WWW-002).
 * Projects only when marked for publication. Concept and illustrative stay
 * distinct from realizations. Awards, prices, and private client fields stay off.
 */

export const PORTFOLIO_PROJECT_CLASSES = [
  'REAL_PROJECT',
  'CONCEPT_PROJECT',
  'ILLUSTRATIVE_PROJECT',
] as const;

export type PortfolioProjectClass = (typeof PORTFOLIO_PROJECT_CLASSES)[number];

/** Synthetic or verified source record before public projection. */
export type PortfolioProjectSource = {
  id: string;
  title: string;
  projectClass: PortfolioProjectClass;
  markedForPublication: boolean;
  /** Explicitly synthetic portfolio items may publish; unmarked private work may not. */
  synthetic?: boolean;
  summary?: string;
  /** Privacy-safe locality (city-level). Never a street address. */
  locality?: string;
};

/** Public response shape. No awards, prices, or private client fields. */
export type PublicPortfolioItem = {
  id: string;
  title: string;
  projectClass: PortfolioProjectClass;
  /** True only for REAL_PROJECT. Concept and illustrative stay non-realizations. */
  realization: boolean;
  synthetic: boolean;
  summary?: string;
  locality?: string;
};

export type PublicPortfolioModel =
  | { state: 'absent' }
  | { state: 'published'; items: readonly PublicPortfolioItem[] };

const OPAQUE_ID = /^[a-z][a-z0-9]{15,63}$/;
const TITLE_LIMIT = 180;
const SUMMARY_LIMIT = 480;
const LOCALITY_LIMIT = 80;
const ALLOWED_CLASS = new Set<string>(PORTFOLIO_PROJECT_CLASSES);

/** Fields that must never appear on a public portfolio response. */
export const PORTFOLIO_PRIVATE_KEYS = [
  'address',
  'customerName',
  'price',
  'pricePln',
  'priceCurrency',
  'quote',
  'phone',
  'email',
  'award',
  'awards',
  'rating',
  'review',
] as const;

const PRIVATE = new Set<string>(PORTFOLIO_PRIVATE_KEYS);

export class PortfolioProjectionError extends Error {
  constructor(code: string) {
    super(code);
    this.name = 'PortfolioProjectionError';
  }
}

/**
 * Project one source into a public portfolio item, or null when unpublished.
 * Throws when the source carries private commercial or client fields.
 */
export function projectPortfolioItem(source: PortfolioProjectSource): PublicPortfolioItem | null {
  if (source.markedForPublication !== true) return null;
  assertNoPrivateFields(source);
  const record = source as Record<string, unknown>;
  if (Object.hasOwn(record, 'realization')) {
    throw new PortfolioProjectionError('PORTFOLIO_REALIZATION_SMUGGLED');
  }
  if (Object.hasOwn(record, 'synthetic') && typeof record.synthetic !== 'boolean') {
    throw new PortfolioProjectionError('PORTFOLIO_SYNTHETIC_INVALID');
  }
  if (!OPAQUE_ID.test(source.id) || /^(?:project|prj|id)\d+$/i.test(source.id)) {
    throw new PortfolioProjectionError('PORTFOLIO_ID_INVALID');
  }
  if (!ALLOWED_CLASS.has(source.projectClass)) {
    throw new PortfolioProjectionError('PORTFOLIO_CLASS_INVALID');
  }
  const title = requiredText(source.title, TITLE_LIMIT, 'PORTFOLIO_TITLE_INVALID');
  const synthetic = source.synthetic === true;
  const item: PublicPortfolioItem = {
    id: source.id,
    title,
    projectClass: source.projectClass,
    realization: source.projectClass === 'REAL_PROJECT',
    synthetic,
  };
  if (source.summary !== undefined) {
    item.summary = requiredText(source.summary, SUMMARY_LIMIT, 'PORTFOLIO_SUMMARY_INVALID');
  }
  if (source.locality !== undefined) {
    item.locality = requiredText(source.locality, LOCALITY_LIMIT, 'PORTFOLIO_LOCALITY_INVALID');
  }
  assertPublicItemClean(item);
  return item;
}

/** Project a list; unpublished sources drop out. Order preserved. */
export function projectPublicPortfolio(
  sources: readonly PortfolioProjectSource[],
): PublicPortfolioModel {
  const items: PublicPortfolioItem[] = [];
  for (const source of sources) {
    const item = projectPortfolioItem(source);
    if (item) items.push(item);
  }
  if (items.length === 0) return { state: 'absent' };
  return { state: 'published', items };
}

function requiredText(value: string, limit: number, code: string): string {
  if (typeof value !== 'string') throw new PortfolioProjectionError(code);
  const text = value.trim().replace(/\s+/g, ' ');
  if (!text || text.length > limit || /[\u0000-\u001f\u007f]/.test(text)) {
    throw new PortfolioProjectionError(code);
  }
  return text;
}

function assertNoPrivateFields(source: PortfolioProjectSource): void {
  const record = source as Record<string, unknown>;
  for (const key of PRIVATE) {
    if (Object.hasOwn(record, key) && record[key] != null) {
      throw new PortfolioProjectionError('PORTFOLIO_PRIVATE_FIELD');
    }
  }
}

function assertPublicItemClean(item: PublicPortfolioItem): void {
  const record = item as Record<string, unknown>;
  for (const key of PRIVATE) {
    if (Object.hasOwn(record, key)) throw new PortfolioProjectionError('PORTFOLIO_PRIVATE_FIELD');
  }
  if (item.realization && item.projectClass !== 'REAL_PROJECT') {
    throw new PortfolioProjectionError('PORTFOLIO_REALIZATION_MISMATCH');
  }
  if (!item.realization && item.projectClass === 'REAL_PROJECT') {
    throw new PortfolioProjectionError('PORTFOLIO_REALIZATION_MISMATCH');
  }
}
