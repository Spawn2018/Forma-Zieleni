import test from 'node:test';
import assert from 'node:assert/strict';
import { assertAtlasDoesNotAuthorizeAdvice, atlasProvenanceBoundary } from './src/atlas-boundary.ts';

test('atlas provenance boundary keeps botanical sources taxonomic and forbids runtime UI', () => {
  const boundary = atlasProvenanceBoundary();
  assert.equal(boundary.requirementId, 'FZ-REQ-ATLAS-002');
  assert.equal(boundary.runtimeUi, false);
  assert.equal(boundary.horticulturalProof, false);
  assert.ok(boundary.sources.length >= 2);
  for (const source of boundary.sources) {
    assert.equal(source.role, 'taxonomic-authority');
    assert.match(source.note.toLowerCase(), /not horticultural|not a care/);
  }
});

test('atlas boundary rejects invented plant advice as product truth', () => {
  assert.doesNotThrow(() => assertAtlasDoesNotAuthorizeAdvice('Taxus baccata is a taxonomic name.'));
  assert.throws(() => assertAtlasDoesNotAuthorizeAdvice('Podlewaj cis co tydzień.'), /ATLAS_ADVICE_FORBIDDEN/);
  assert.throws(() => assertAtlasDoesNotAuthorizeAdvice('This is a care guide for planting.'), /ATLAS_ADVICE_FORBIDDEN/);
});
