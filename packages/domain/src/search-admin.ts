const EVIDENCE_CLASSES = ['MEASURED', 'ESTIMATED', 'DERIVED', 'HEURISTIC', 'AI-SUGGESTED'] as const;
const ADMIN_PANELS = [
  'search-intelligence',
  'seo',
  'ai-visibility',
  'content-intelligence',
  'crawl-intelligence',
  'conversions',
] as const;
const ATTRIBUTION_MODELS = ['first-touch', 'last-touch', 'assisted', 'unknown'] as const;

export type EvidenceClass = (typeof EVIDENCE_CLASSES)[number];
export type AdminPanelId = (typeof ADMIN_PANELS)[number];
export type AttributionModel = (typeof ATTRIBUTION_MODELS)[number];

export type AdminWindow = { start: string; end: string };
export type AdminFreshness = { collectedAt: string };

export type AdminMetric = {
  panel: AdminPanelId;
  label: string;
  definition: string;
  source: string;
  window: AdminWindow;
  freshness: AdminFreshness;
  evidenceClass: EvidenceClass;
  value: number | string | null;
};

export type AdminPanelView = {
  panel: AdminPanelId;
  metrics: readonly AdminMetric[];
  limitations: readonly string[];
};

export type CitationProviderInput = {
  name: string;
  citationCount: number | null;
  definition: string;
  source: string;
  window: AdminWindow;
  freshness: AdminFreshness;
  evidenceClass: EvidenceClass | null;
};

const FORBIDDEN_EXTERNAL_SCORE = /\b(ai rank|chatgpt rank|geo score|ai authority score|ai seo score)\b/i;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function presentSearchMetric(input: {
  panel: AdminPanelId;
  label: string;
  definition: string;
  source: string;
  window: AdminWindow;
  freshness: AdminFreshness;
  evidenceClass: EvidenceClass;
  value: number | string | null;
}): AdminMetric {
  const panel = assertPanel(input.panel);
  const label = required(input.label, 'LABEL_REQUIRED');
  const definition = required(input.definition, 'DEFINITION_REQUIRED');
  const source = required(input.source, 'SOURCE_REQUIRED');
  const evidenceClass = assertEvidenceClass(input.evidenceClass);
  const window = assertWindow(input.window);
  const freshness = assertFreshness(input.freshness);
  if (input.value === undefined || (typeof input.value === 'number' && !Number.isFinite(input.value))) {
    throw new Error('VALUE_REQUIRED');
  }
  assertScoreLabel(label, definition, evidenceClass);
  if (isAveragePosition(label) && !definition.includes(source)) {
    throw new Error('POSITION_PROVIDER_DEFINITION');
  }
  if (evidenceClass === 'AI-SUGGESTED' && !definition.includes('AI-SUGGESTED')) {
    throw new Error('AI_SUGGESTED_UNMARKED');
  }
  return { panel, label, definition, source, window, freshness, evidenceClass, value: input.value };
}

export function presentAdminPanel(input: {
  panel: AdminPanelId;
  metrics: readonly AdminMetric[];
  limitations?: readonly string[];
}): AdminPanelView {
  const panel = assertPanel(input.panel);
  const metrics = input.metrics.map((metric) => {
    const shown = presentSearchMetric(metric);
    if (shown.panel !== panel) throw new Error('PANEL_MISMATCH');
    return shown;
  });
  return { panel, metrics, limitations: [...(input.limitations ?? [])] };
}

export function presentAiCitations(providers: readonly CitationProviderInput[]): {
  metrics: readonly AdminMetric[];
  limitations: readonly string[];
  percentage: null;
} {
  const metrics: AdminMetric[] = [];
  const limitations: string[] = [];
  for (const provider of providers) {
    const name = required(provider.name, 'PROVIDER_REQUIRED');
    if (provider.citationCount === null) {
      limitations.push(`${name} is listed under measurement limitations.`);
      continue;
    }
    if (!Number.isInteger(provider.citationCount) || provider.citationCount < 0) throw new Error('CITATION_COUNT');
    if (provider.evidenceClass === null) throw new Error('EVIDENCE_CLASS_REQUIRED');
    const definition = required(provider.definition, 'DEFINITION_REQUIRED');
    if (!definition.includes(name)) throw new Error('CITATION_PROVIDER_UNNAMED');
    metrics.push(presentSearchMetric({
      panel: 'ai-visibility',
      label: `Citations from ${name}`,
      definition,
      source: provider.source,
      window: provider.window,
      freshness: provider.freshness,
      evidenceClass: provider.evidenceClass,
      value: provider.citationCount,
    }));
  }
  return { metrics, limitations, percentage: null };
}

export function presentAttribution(input: {
  model: AttributionModel;
  label: string;
  definition: string;
  source: string;
  window: AdminWindow;
  freshness: AdminFreshness;
  evidenceClass: EvidenceClass;
  value: number | string | null;
}): AdminMetric {
  const model = assertModel(input.model);
  if (/\bcaused\b/i.test(input.definition)) throw new Error('CAUSAL_CLAIM');
  return presentSearchMetric({
    panel: 'conversions',
    label: input.label,
    definition: `Associated under the ${model} model. ${input.definition.trim()}`,
    source: input.source,
    window: input.window,
    freshness: input.freshness,
    evidenceClass: input.evidenceClass,
    value: input.value,
  });
}

function assertPanel(panel: AdminPanelId): AdminPanelId {
  switch (panel) {
    case 'search-intelligence':
    case 'seo':
    case 'ai-visibility':
    case 'content-intelligence':
    case 'crawl-intelligence':
    case 'conversions':
      return panel;
    default: {
      const unknown: never = panel;
      throw new Error(`PANEL:${unknown}`);
    }
  }
}

function assertEvidenceClass(value: EvidenceClass): EvidenceClass {
  switch (value) {
    case 'MEASURED':
    case 'ESTIMATED':
    case 'DERIVED':
    case 'HEURISTIC':
    case 'AI-SUGGESTED':
      return value;
    default: {
      const unknown: never = value;
      throw new Error(`EVIDENCE_CLASS:${unknown}`);
    }
  }
}

function assertModel(model: AttributionModel): AttributionModel {
  switch (model) {
    case 'first-touch':
    case 'last-touch':
    case 'assisted':
    case 'unknown':
      return model;
    default: {
      const unknown: never = model;
      throw new Error(`ATTRIBUTION_MODEL:${unknown}`);
    }
  }
}

function assertWindow(window: AdminWindow): AdminWindow {
  if (!window || !DAY.test(window.start) || !DAY.test(window.end)) throw new Error('WINDOW_REQUIRED');
  if (window.start > window.end) throw new Error('WINDOW_REQUIRED');
  return { start: window.start, end: window.end };
}

function assertFreshness(freshness: AdminFreshness): AdminFreshness {
  if (!freshness || Number.isNaN(Date.parse(freshness.collectedAt))) throw new Error('FRESHNESS_REQUIRED');
  return { collectedAt: freshness.collectedAt };
}

function assertScoreLabel(label: string, definition: string, evidenceClass: EvidenceClass): void {
  if (!FORBIDDEN_EXTERNAL_SCORE.test(label)) return;
  if (evidenceClass === 'HEURISTIC' && definition.includes('INTERNAL SIGNAL / HEURISTIC')) return;
  throw new Error('FORBIDDEN_EXTERNAL_SCORE');
}

function isAveragePosition(label: string): boolean {
  return label.trim().toLowerCase() === 'average position';
}

function required(value: string, code: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(code);
  return trimmed;
}
