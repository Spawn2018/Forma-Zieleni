const KINDS = ['Service', 'Article', 'ProjectCaseStudy'] as const;
const DRAFT_FIELDS = ['title', 'description', 'alt', 'heading', 'faq', 'link', 'case-study'] as const;

export type PublishedContentKind = (typeof KINDS)[number];
export type AiDraftField = (typeof DRAFT_FIELDS)[number];

export type PublishedContentNode = {
  id: string;
  kind: PublishedContentKind;
  path: string;
  links: readonly string[];
};

export type ContentRecommendation = {
  code: 'ORPHAN' | 'BROKEN_LINK' | 'WEAK_CONNECTION' | 'TITLE_ALIGNMENT' | 'AI_DRAFT';
  documentId: string;
  detail: string;
  evidence: string;
  status: 'EVIDENCE' | 'AI-SUGGESTED';
  publishes: false;
  paidService: false;
};

type IndexedNode = PublishedContentNode & { outbound: ReadonlySet<string> };

export function recommendFromPublishedGraph(nodes: readonly PublishedContentNode[]): {
  recommendations: ContentRecommendation[];
  publishes: false;
} {
  const indexed = indexPublished(nodes);
  const inbound = inboundCounts(indexed);
  const recommendations: ContentRecommendation[] = [];
  for (const node of indexed) {
    recommendations.push(...brokenLinks(node));
    if (nodes.length >= 2 && inbound.get(node.path) === 0) {
      recommendations.push(evidence(node.id, 'ORPHAN', `No published Service, Article, or ProjectCaseStudy links to ${node.path}.`, `published-graph:inbound:0:${node.path}`));
    }
    if (nodes.length >= 3 && inbound.get(node.path) === 1 && node.outbound.size === 0) {
      recommendations.push(evidence(node.id, 'WEAK_CONNECTION', `${node.path} has one inbound published link and no outbound published link.`, `published-graph:inbound:1:outbound:0:${node.path}`));
    }
  }
  return { recommendations, publishes: false };
}

export function recommendTitleAlignment(input: {
  documentId: string;
  query: string;
  impressions: number;
  ctr: number;
}): ContentRecommendation {
  const documentId = input.documentId.trim();
  const query = input.query.trim();
  if (!documentId || !query) throw new Error('OBSERVATION_REQUIRED');
  if (!Number.isFinite(input.impressions) || input.impressions <= 0) throw new Error('IMPRESSIONS_REQUIRED');
  if (!Number.isFinite(input.ctr) || input.ctr < 0 || input.ctr > 1) throw new Error('CTR_RANGE');
  return evidence(
    documentId,
    'TITLE_ALIGNMENT',
    `Query "${query}" has ${input.impressions} impressions and CTR ${input.ctr}. Review title alignment.`,
    `observation:${query}:${input.impressions}:${input.ctr}`,
  );
}

export function suggestAiDraft(input: {
  documentId: string;
  field: AiDraftField;
  text: string;
  evidence: string;
}): ContentRecommendation {
  const documentId = input.documentId.trim();
  const text = input.text.trim();
  const observed = input.evidence.trim();
  if (!documentId) throw new Error('CONTENT_ID_REQUIRED');
  if (!observed) throw new Error('EVIDENCE_REQUIRED');
  if (!text) throw new Error('DRAFT_TEXT_REQUIRED');
  switch (input.field) {
    case 'alt':
      if (!altStaysInsideEvidence(text, observed)) throw new Error('ALT_INVENTED');
      break;
    case 'title':
    case 'description':
    case 'heading':
    case 'faq':
    case 'link':
    case 'case-study':
      break;
    default: {
      const unknown: never = input.field;
      throw new Error(`DRAFT_FIELD:${unknown}`);
    }
  }
  return {
    code: 'AI_DRAFT',
    documentId,
    detail: text,
    evidence: observed,
    status: 'AI-SUGGESTED',
    publishes: false,
    paidService: false,
  };
}

export function publishContentRecommendation(): never {
  throw new Error('CONTENT_INTELLIGENCE_DOES_NOT_PUBLISH');
}

export function insertKeywordLink(): never {
  throw new Error('CONTENT_INTELLIGENCE_DOES_NOT_INSERT_LINKS');
}

function indexPublished(nodes: readonly PublishedContentNode[]): IndexedNode[] {
  const ids = new Set<string>();
  const paths = new Set<string>();
  const indexed: IndexedNode[] = [];
  for (const node of nodes) {
    assertNode(node);
    if (ids.has(node.id)) throw new Error('CONTENT_ID_DUPLICATE');
    if (paths.has(node.path)) throw new Error('CONTENT_PATH_DUPLICATE');
    ids.add(node.id);
    paths.add(node.path);
  }
  for (const node of nodes) {
    const outbound = new Set<string>();
    for (const link of node.links) {
      if (!isInternalPath(link) || link === node.path || !paths.has(link)) continue;
      outbound.add(link);
    }
    indexed.push({ id: node.id, kind: node.kind, path: node.path, links: node.links, outbound });
  }
  return indexed;
}

function brokenLinks(node: IndexedNode): ContentRecommendation[] {
  const found: ContentRecommendation[] = [];
  for (const link of node.links) {
    if (!isInternalPath(link)) continue;
    if (node.outbound.has(link) || link === node.path) continue;
    found.push(evidence(node.id, 'BROKEN_LINK', `${node.path} links to ${link}, which is not a published Service, Article, or ProjectCaseStudy.`, `published-graph:${node.id}->${link}`));
  }
  return found;
}

function inboundCounts(nodes: readonly IndexedNode[]): Map<string, number> {
  const inbound = new Map<string, number>();
  for (const node of nodes) inbound.set(node.path, 0);
  for (const node of nodes) {
    for (const target of node.outbound) inbound.set(target, (inbound.get(target) ?? 0) + 1);
  }
  return inbound;
}

function evidence(
  documentId: string,
  code: 'ORPHAN' | 'BROKEN_LINK' | 'WEAK_CONNECTION' | 'TITLE_ALIGNMENT',
  detail: string,
  observed: string,
): ContentRecommendation {
  return {
    code,
    documentId,
    detail,
    evidence: observed,
    status: 'EVIDENCE',
    publishes: false,
    paidService: false,
  };
}

function assertNode(node: PublishedContentNode): void {
  if (!node.id.trim()) throw new Error('CONTENT_ID_REQUIRED');
  if (!isKind(node.kind)) throw new Error('CONTENT_KIND');
  if (!isInternalPath(node.path)) throw new Error('CONTENT_PATH');
}

function isKind(value: string): value is PublishedContentKind {
  return (KINDS as readonly string[]).includes(value);
}

function isInternalPath(value: string): boolean {
  return value.startsWith('/') && !value.startsWith('//');
}

function altStaysInsideEvidence(text: string, observed: string): boolean {
  const allowed = new Set(words(observed));
  const used = words(text);
  return used.length > 0 && used.every((word) => allowed.has(word));
}

function words(value: string): string[] {
  return value.toLocaleLowerCase('pl-PL').split(/[^\p{L}\p{N}]+/u).filter((word) => word.length > 0);
}
