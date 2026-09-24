/**
 * Public WWW Atlas projection (FZ-REQ-ATLAS-005).
 * Consumes already-public plant DTOs. Does not import domain packages.
 * Drafts must be filtered before this module. Cultivation claims stay off.
 */

export type AtlasPlantCitationSource = {
  sourceId: string;
  url: string;
  note: string;
  accession: string | null;
};

/** Already-approved, public-safe plant fields. */
export type AtlasPlantSource = {
  id: string;
  scientificName: string;
  citations: readonly AtlasPlantCitationSource[];
};

export type PublicAtlasPlant = {
  id: string;
  scientificName: string;
  citations: readonly AtlasPlantCitationSource[];
};

export type AtlasCatalogModel =
  | { state: 'absent' }
  | { state: 'published'; plants: readonly PublicAtlasPlant[] };

const OPAQUE_ID = /^[a-z][a-z0-9]{15,63}$/;
const SCIENTIFIC_NAME = /^[A-Z][a-z]+(?:\s+(?:×|x))?(?:\s+[a-z-]+){1,4}$/;
const CULTIVATION_KEYS = ['careGuide', 'hardinessGuarantee', 'wateringSchedule', 'cultivationProof'] as const;

function assertNoCultivation(plant: AtlasPlantSource): void {
  for (const key of CULTIVATION_KEYS) {
    if (Object.hasOwn(plant, key)) throw new Error('ATLAS_CULTIVATION_FORBIDDEN');
  }
}

function assertCitation(citation: AtlasPlantCitationSource): AtlasPlantCitationSource {
  if (!citation.sourceId || !citation.url || !citation.note) throw new Error('ATLAS_CITATION_INVALID');
  if (!/^https?:\/\//i.test(citation.url)) throw new Error('ATLAS_CITATION_URL_INVALID');
  let accession = citation.accession;
  if (accession !== null) {
    const trimmed = accession.trim();
    if (!trimmed || trimmed.length > 128) throw new Error('ATLAS_ACCESSION_INVALID');
    accession = trimmed;
  }
  return {
    sourceId: citation.sourceId,
    url: citation.url,
    note: citation.note,
    accession,
  };
}

export function projectAtlasPlant(plant: AtlasPlantSource): PublicAtlasPlant | null {
  if (!OPAQUE_ID.test(plant.id) || /^(?:plant|plt|id)\d+$/i.test(plant.id)) {
    throw new Error('PLANT_ID_GUESSABLE');
  }
  const name = plant.scientificName.trim().replace(/\s+/g, ' ');
  if (!name || !SCIENTIFIC_NAME.test(name)) throw new Error('PLANT_NAME_INVALID');
  assertNoCultivation(plant);
  if (!plant.citations.length) return null;
  return {
    id: plant.id,
    scientificName: name,
    citations: plant.citations.map(assertCitation),
  };
}

export function projectAtlasCatalog(plants: readonly AtlasPlantSource[]): AtlasCatalogModel {
  const listed: PublicAtlasPlant[] = [];
  for (const plant of plants) {
    const projection = projectAtlasPlant(plant);
    if (projection) listed.push(projection);
  }
  if (listed.length === 0) return { state: 'absent' };
  return { state: 'published', plants: listed };
}

export function atlasIndexable(model: AtlasCatalogModel): boolean {
  return model.state === 'published';
}
