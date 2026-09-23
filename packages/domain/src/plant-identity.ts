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
/** Binomial or hybrid form (e.g. Taxus baccata, Mentha × piperita). */
const SCIENTIFIC_NAME = /^[A-Z][a-z]+(?:\s+(?:×|x))?(?:\s+[a-z-]+){1,4}$/;

export function assertOpaquePlantId(id: string): string {
  if (!OPAQUE_ID.test(id) || /^(?:plant|plt|id)\d+$/i.test(id)) {
    throw new Error('PLANT_ID_GUESSABLE');
  }
  return id;
}

function assertCitation(citation: { sourceId: string; accession?: string | null }): TaxonomicCitation {
  const allowed = new Set(botanicalSourcePolicy().map(source => source.id));
  if (!allowed.has(citation.sourceId)) throw new Error('ATLAS_CITATION_UNKNOWN');
  let accession = citation.accession ?? null;
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
  citations: readonly { sourceId: string; accession?: string | null }[],
  at: string,
): PlantIdentity {
  const name = scientificName.trim().replace(/\s+/g, ' ');
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
  assertPlantIdentityHasNoCultivationClaim({
    careGuide: Object.hasOwn(plant, 'careGuide'),
    hardinessGuarantee: Object.hasOwn(plant, 'hardinessGuarantee'),
    wateringSchedule: Object.hasOwn(plant, 'wateringSchedule'),
    cultivationProof: Object.hasOwn(plant, 'cultivationProof'),
  });
  const refreshed = createPlantIdentity(plant.id, plant.scientificName, plant.citations, plant.createdAt);
  return {
    ...refreshed,
    status: 'approved',
    createdAt: plant.createdAt,
    updatedAt: at,
  };
}

export type PublicPlantCitation = {
  sourceId: string;
  url: string;
  note: string;
  accession: string | null;
};

/** Public-safe plant fields. Drafts stay off the response. No cultivation claims. */
export type PublicPlantProjection = {
  id: string;
  scientificName: string;
  citations: readonly PublicPlantCitation[];
};

export function projectPlantForPublic(plant: PlantIdentity): PublicPlantProjection | null {
  if (plant.status !== 'approved') return null;
  assertAtlasDoesNotAuthorizeAdvice(plant.scientificName);
  assertPlantIdentityHasNoCultivationClaim({
    careGuide: Object.hasOwn(plant, 'careGuide'),
    hardinessGuarantee: Object.hasOwn(plant, 'hardinessGuarantee'),
    wateringSchedule: Object.hasOwn(plant, 'wateringSchedule'),
    cultivationProof: Object.hasOwn(plant, 'cultivationProof'),
  });
  const authorities = new Map(botanicalSourcePolicy().map(source => [source.id, source]));
  const citations: PublicPlantCitation[] = [];
  for (const citation of plant.citations) {
    const source = authorities.get(citation.sourceId);
    if (!source) throw new Error('ATLAS_CITATION_UNKNOWN');
    citations.push({
      sourceId: source.id,
      url: source.url,
      note: source.note,
      accession: citation.accession,
    });
  }
  return {
    id: plant.id,
    scientificName: plant.scientificName,
    citations,
  };
}

export function listPublicPlants(plants: readonly PlantIdentity[]): PublicPlantProjection[] {
  const listed: PublicPlantProjection[] = [];
  for (const plant of plants) {
    const projection = projectPlantForPublic(plant);
    if (projection) listed.push(projection);
  }
  return listed;
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
