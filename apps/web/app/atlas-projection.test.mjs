import assert from 'node:assert/strict';
import test from 'node:test';
import { atlasIndexable, projectAtlasCatalog, projectAtlasPlant } from './atlas-projection.ts';

const citation = {
  sourceId: 'kew-powo',
  url: 'https://powo.science.kew.org/',
  note: 'WCVP names backbone. Not horticultural practice evidence.',
  accession: null,
};

test('empty catalogs stay absent and not indexable', () => {
  assert.deepEqual(projectAtlasCatalog([]), { state: 'absent' });
  assert.equal(atlasIndexable({ state: 'absent' }), false);
});

test('approved plants project scientific names and citation urls without cultivation fields', () => {
  const model = projectAtlasCatalog([
    {
      id: 'plantatlas0000002',
      scientificName: 'Taxus baccata',
      citations: [citation],
    },
  ]);
  assert.equal(model.state, 'published');
  assert.equal(atlasIndexable(model), true);
  assert.equal(model.plants.length, 1);
  assert.equal(model.plants[0].scientificName, 'Taxus baccata');
  assert.equal(model.plants[0].citations[0].sourceId, 'kew-powo');
  assert.match(model.plants[0].citations[0].url, /^https?:\/\//);
  assert.equal(Object.hasOwn(model.plants[0], 'careGuide'), false);
});

test('cultivation fields and guessable ids fail closed', () => {
  assert.throws(
    () => projectAtlasPlant({
      id: 'plant1',
      scientificName: 'Taxus baccata',
      citations: [citation],
    }),
    /PLANT_ID_GUESSABLE/,
  );
  assert.throws(
    () => projectAtlasPlant({
      id: 'plantatlas0000003',
      scientificName: 'Taxus baccata',
      citations: [citation],
      careGuide: true,
    }),
    /ATLAS_CULTIVATION_FORBIDDEN/,
  );
});
