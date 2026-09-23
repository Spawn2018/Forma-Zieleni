import test from 'node:test';
import assert from 'node:assert/strict';
import {
  approvePlantIdentity,
  assertOpaquePlantId,
  assertPlantIdentityHasNoCultivationClaim,
  createPlantIdentity,
  listPublicPlants,
  projectPlantForPublic,
} from './src/plant-identity.ts';

const at = '2026-09-23T22:00:00.000Z';
const citation = { sourceId: 'kew-powo', accession: 'urn:lsid:ipni.org:names:123' };

test('opaque plant identifiers reject sequential or prefixed guessable values', () => {
  assert.equal(assertOpaquePlantId('p9k2n4p6q8r0s2t4'), 'p9k2n4p6q8r0s2t4');
  for (const id of ['1', 'plant1', 'PLT99', 'short']) {
    assert.throws(() => assertOpaquePlantId(id), /PLANT_ID_GUESSABLE/);
  }
});

test('plant identity is distinct from taxonomic proof and starts draft', () => {
  const plant = createPlantIdentity('p9k2n4p6q8r0s2t4', 'Taxus baccata', [citation], at);
  assert.equal(plant.scientificName, 'Taxus baccata');
  assert.equal(plant.status, 'draft');
  assert.equal(plant.citations[0].sourceId, 'kew-powo');
  assert.equal(Object.hasOwn(plant, 'careGuide'), false);
  assert.equal(Object.hasOwn(plant, 'hardiness'), false);
  assert.equal(Object.hasOwn(plant, 'watering'), false);
  assert.equal(Object.hasOwn(plant, 'cultivationProof'), false);
});

test('hybrid scientific names and omitted accession are accepted', () => {
  const hybrid = createPlantIdentity(
    'p9k2n4p6q8r0s2t4',
    'Mentha × piperita',
    [{ sourceId: 'world-flora-online' }],
    at,
  );
  assert.equal(hybrid.scientificName, 'Mentha × piperita');
  assert.equal(hybrid.citations[0].accession, null);
});

test('citations must name known taxonomic authorities and cannot carry advice', () => {
  assert.throws(
    () => createPlantIdentity('p9k2n4p6q8r0s2t4', 'Taxus baccata', [], at),
    /ATLAS_CITATION_REQUIRED/,
  );
  assert.throws(
    () => createPlantIdentity('p9k2n4p6q8r0s2t4', 'Taxus baccata', [{ sourceId: 'made-up', accession: null }], at),
    /ATLAS_CITATION_UNKNOWN/,
  );
  assert.throws(
    () => createPlantIdentity(
      'p9k2n4p6q8r0s2t4',
      'Taxus baccata',
      [{ sourceId: 'kew-powo', accession: 'Podlewaj cis co tydzień' }],
      at,
    ),
    /ATLAS_ADVICE_FORBIDDEN/,
  );
});

test('approval requires a draft identity with citations', () => {
  const draft = createPlantIdentity('p9k2n4p6q8r0s2t4', 'Taxus baccata', [citation], at);
  const approved = approvePlantIdentity(draft, '2026-09-23T22:05:00.000Z');
  assert.equal(approved.status, 'approved');
  assert.throws(() => approvePlantIdentity(approved, at), /PLANT_NOT_APPROVABLE/);
});

test('cultivation claims stay forbidden on plant identity', () => {
  assert.doesNotThrow(() => assertPlantIdentityHasNoCultivationClaim({}));
  assert.throws(() => assertPlantIdentityHasNoCultivationClaim({ careGuide: true }), /ATLAS_CULTIVATION_FORBIDDEN/);
  assert.throws(() => assertPlantIdentityHasNoCultivationClaim({ hardinessGuarantee: true }), /ATLAS_CULTIVATION_FORBIDDEN/);
  assert.throws(() => assertPlantIdentityHasNoCultivationClaim({ wateringSchedule: true }), /ATLAS_CULTIVATION_FORBIDDEN/);
  assert.throws(() => assertPlantIdentityHasNoCultivationClaim({ cultivationProof: true }), /ATLAS_CULTIVATION_FORBIDDEN/);
});

test('scientific names reject advice-shaped or empty values', () => {
  assert.throws(() => createPlantIdentity('p9k2n4p6q8r0s2t4', '', [citation], at), /PLANT_NAME_INVALID/);
  assert.throws(
    () => createPlantIdentity('p9k2n4p6q8r0s2t4', 'podlewaj cis', [citation], at),
    /PLANT_NAME_INVALID/,
  );
});

test('public projection lists only approved identities with taxonomic citations', () => {
  const draft = createPlantIdentity('p9k2n4p6q8r0s2t4', 'Taxus baccata', [citation], at);
  const approved = approvePlantIdentity(
    createPlantIdentity('p8k2n4p6q8r0s2t4', 'Buxus sempervirens', [{ sourceId: 'world-flora-online', accession: null }], at),
    '2026-09-23T22:10:00.000Z',
  );
  assert.equal(projectPlantForPublic(draft), null);
  const publicPlant = projectPlantForPublic(approved);
  assert.ok(publicPlant);
  assert.equal(publicPlant.scientificName, 'Buxus sempervirens');
  assert.equal(publicPlant.citations[0].sourceId, 'world-flora-online');
  assert.match(publicPlant.citations[0].note.toLowerCase(), /not a care|not horticultural/);
  assert.equal(Object.hasOwn(publicPlant, 'careGuide'), false);
  assert.equal(Object.hasOwn(publicPlant, 'status'), false);
  const listed = listPublicPlants([draft, approved]);
  assert.equal(listed.length, 1);
  assert.equal(listed[0].id, approved.id);
});
