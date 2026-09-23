import { botanicalSourcePolicy } from './growth.ts';
import { assertAtlasDoesNotAuthorizeAdvice } from './atlas-boundary.ts';

/**
 * Plant identity (FZ-REQ-ATLAS-003).
 * Core API domain record distinct from taxonomic-source proof and from
 * cultivation claims. Citations name authorities; they are not horticultural
 * evidence.
 */
export const PLANT_IDENTITY_STATUSES = ['draft', 'approved'] as const;

export type PlantIdentityStatus = (typeof PLANT_IDENTITY_STATUSES)[number];

export type TaxonomicCitation = {
  sourceId: string;
  /** Optional opaque accession or name key from the authority. Not care advice. */
  accession: string | null;
};

export type PlantIdentity = {
  id: string;
  scientificName: string;
  status: PlantIdentityStatus;
  citations: readonly TaxonomicCitation[];
  createdAt: string;
  updatedAt: string;
};

const OPAQUE_ID = /^[a-z][a-z0-9]{15,63}$/;
const SCIENTIFIC_NAME = /^[A-Z][a-z]+(?:\s+[a-z-]+){0,4}$/;

export function assertOpaquePlantId(id: string): string {
  if (!OPAQUE_ID.test(id) || /^(?:plant|plt|id)\d+$/i.test(id)) {
    throw new Error('PLANT_ID_GUESSABLE');
  }
  return id;
}

function assertCitation(citation: TaxonomicCitation): TaxonomicCitation {
  const allowed = new Set(botanicalSourcePolicy().map(source => source.id));
  if (!allowed.has(citation.sourceId)) throw new Error('ATLAS_CITATION_UNKNOWN');
  let accession = citation.accession;
  if (accession !== null) {
    const trimmed = accession.trim();
    if (!trimmed || trimmed.length > 128) throw new Error('ATLAS_ACCESSION_INVALID');
    assertAtlasDoesNotAuthorizeAdvice(trimmed);
    accession = trimmed;
  }
  return { sourceId: citation.sourceId, accession };
}

export function createPlantIdentity(
  id: string,
  scientificName: string,
  citations: readonly TaxonomicCitation[],
  at: string,
): PlantIdentity {
  const name = scientificName.trim();
  if (!name || name.length > 200 || !SCIENTIFIC_NAME.test(name)) {
    throw new Error('PLANT_NAME_INVALID');
  }
  assertAtlasDoesNotAuthorizeAdvice(name);
  if (!citations.length) throw new Error('ATLAS_CITATION_REQUIRED');
  const normalized = citations.map(assertCitation);
  return {
    id: assertOpaquePlantId(id),
    scientificName: name,
    status: 'draft',
    citations: normalized,
    createdAt: at,
    updatedAt: at,
  };
}

export function approvePlantIdentity(plant: PlantIdentity, at: string): PlantIdentity {
  if (plant.status !== 'draft') throw new Error('PLANT_NOT_APPROVABLE');
  if (!plant.citations.length) throw new Error('ATLAS_CITATION_REQUIRED');
  return {
    ...plant,
    status: 'approved',
    updatedAt: at,
  };
}

/** Cultivation / care claims must never be stored as plant product truth. */
export function assertPlantIdentityHasNoCultivationClaim(claim: {
  careGuide?: boolean;
  hardinessGuarantee?: boolean;
  wateringSchedule?: boolean;
  cultivationProof?: boolean;
}): void {
  if (
    claim.careGuide
    || claim.hardinessGuarantee
    || claim.wateringSchedule
    || claim.cultivationProof
  ) {
    throw new Error('ATLAS_CULTIVATION_FORBIDDEN');
  }
}
