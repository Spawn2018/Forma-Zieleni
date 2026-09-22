import { botanicalSourcePolicy } from './growth.ts';

/**
 * Plant Atlas provenance boundary (FZ-REQ-ATLAS-002).
 * Botanical sources are taxonomic authorities only. They are not horticultural
 * proof, care advice, or product truth. No atlas runtime UI lives here.
 */
export type AtlasProvenanceBoundary = {
  requirementId: 'FZ-REQ-ATLAS-002';
  runtimeUi: false;
  horticulturalProof: false;
  sources: readonly {
    id: string;
    role: 'taxonomic-authority';
    url: string;
    note: string;
  }[];
};

export function atlasProvenanceBoundary(): AtlasProvenanceBoundary {
  const sources = botanicalSourcePolicy().map(source => {
    if (source.role !== 'taxonomic-authority') {
      throw new Error('ATLAS_SOURCE_NOT_TAXONOMIC');
    }
    return {
      id: source.id,
      role: 'taxonomic-authority' as const,
      url: source.url,
      note: source.note,
    };
  });
  return {
    requirementId: 'FZ-REQ-ATLAS-002',
    runtimeUi: false,
    horticulturalProof: false,
    sources,
  };
}

export function assertAtlasDoesNotAuthorizeAdvice(claim: string): void {
  const lowered = claim.toLowerCase();
  for (const forbidden of ['podlewaj', 'nawóź', 'nawoz', 'sadź w', 'zimotrwałość gwarantowana', 'care guide']) {
    if (lowered.includes(forbidden)) throw new Error('ATLAS_ADVICE_FORBIDDEN');
  }
}
