/** AI visibility observations. No composite AI score. Bing citations absent until a real API/export. */

export const AI_VISIBILITY_PROVIDERS = [
  'bing-ai-performance',
  'openai',
  'anthropic',
  'perplexity',
] as const;

export type AiVisibilityProvider = (typeof AI_VISIBILITY_PROVIDERS)[number];

export type CitationAvailability =
  | 'ABSENT_NO_API'
  | 'ABSENT_NO_EXPORT'
  | 'MEASURED_FROM_EXPORT'
  | 'NO_RELIABLE_MEASUREMENT';

export type AiVisibilityProviderState = {
  provider: AiVisibilityProvider;
  citationAvailability: CitationAvailability;
  citationCount: number | null;
  evidenceClass: 'MEASURED' | 'ESTIMATED' | 'DERIVED' | 'HEURISTIC' | 'AI-SUGGESTED' | null;
  note: string;
};

export type AiVisibilitySnapshot = {
  propertyId: string;
  collectedAt: string;
  providers: AiVisibilityProviderState[];
};

/** Re-confirmed 2026-09-22: Bing AI Performance has UI citations; no API as of 2026-02-19 staff reply. */
export const BING_AI_API_STATUS = {
  uiMeasuredAsOf: '2026-02-10',
  apiAsOfStaffReply: '2026-02-19',
  apiAvailable: false,
  reReadAt: '2026-09-22',
} as const;

const FORBIDDEN_SCORE_KEYS = /^(ai[_-]?score|geo[_-]?score|chatgpt[_-]?rank|ai[_-]?rank|ai[_-]?visibility[_-]?percent|composite[_-]?ai)$/i;

export function defaultProviderStates(): AiVisibilityProviderState[] {
  return [
    {
      provider: 'bing-ai-performance',
      citationAvailability: 'ABSENT_NO_API',
      citationCount: null,
      evidenceClass: null,
      note: 'Bing AI citations are MEASURED in the Webmaster UI but have no API. Absent, not zero.',
    },
    {
      provider: 'openai',
      citationAvailability: 'NO_RELIABLE_MEASUREMENT',
      citationCount: null,
      evidenceClass: null,
      note: 'No webmaster citation API. Do not scrape ChatGPT.',
    },
    {
      provider: 'anthropic',
      citationAvailability: 'NO_RELIABLE_MEASUREMENT',
      citationCount: null,
      evidenceClass: null,
      note: 'No webmaster citation API. Do not scrape Claude.',
    },
    {
      provider: 'perplexity',
      citationAvailability: 'NO_RELIABLE_MEASUREMENT',
      citationCount: null,
      evidenceClass: null,
      note: 'No webmaster citation API. Do not scrape Perplexity.',
    },
  ];
}

export function createAiVisibilitySnapshot(propertyId: string, collectedAt: string): AiVisibilitySnapshot {
  return {
    propertyId,
    collectedAt,
    providers: defaultProviderStates(),
  };
}

export function bingCitationRows(snapshot: AiVisibilitySnapshot): readonly never[] {
  const bing = snapshot.providers.find((p) => p.provider === 'bing-ai-performance');
  if (!bing) return [];
  if (bing.citationAvailability === 'ABSENT_NO_API' || bing.citationAvailability === 'ABSENT_NO_EXPORT') {
    return [];
  }
  if (bing.citationAvailability === 'MEASURED_FROM_EXPORT' && bing.citationCount != null) {
    throw new Error('BING_EXPORT_NOT_WIRED');
  }
  return [];
}

export function assertNoCompositeAiScore(payload: Readonly<Record<string, unknown>>): void {
  for (const key of Object.keys(payload)) {
    if (FORBIDDEN_SCORE_KEYS.test(key)) throw new Error('COMPOSITE_AI_SCORE_REJECTED');
  }
  if ('score' in payload && typeof payload.score === 'number') {
    throw new Error('COMPOSITE_AI_SCORE_REJECTED');
  }
}

export function summarizeAiVisibility(snapshot: AiVisibilitySnapshot): {
  measuredCitationProviders: number;
  absentProviders: number;
  unreliableProviders: number;
  compositeScore: null;
} {
  let measuredCitationProviders = 0;
  let absentProviders = 0;
  let unreliableProviders = 0;
  for (const row of snapshot.providers) {
    switch (row.citationAvailability) {
      case 'MEASURED_FROM_EXPORT':
        measuredCitationProviders += 1;
        break;
      case 'ABSENT_NO_API':
      case 'ABSENT_NO_EXPORT':
        absentProviders += 1;
        break;
      case 'NO_RELIABLE_MEASUREMENT':
        unreliableProviders += 1;
        break;
      default: {
        const _exhaustive: never = row.citationAvailability;
        throw new Error(`UNKNOWN_AVAILABILITY:${_exhaustive}`);
      }
    }
  }
  return {
    measuredCitationProviders,
    absentProviders,
    unreliableProviders,
    compositeScore: null,
  };
}
