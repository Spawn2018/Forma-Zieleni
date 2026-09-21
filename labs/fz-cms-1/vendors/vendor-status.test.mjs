import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readJson(name) {
  return JSON.parse(readFileSync(path.join(root, 'evidence', name), 'utf8'));
}

test('licensing revalidation keeps the four finalists and does not invent a winner', () => {
  const licensing = readJson('licensing.json');
  assert.equal(licensing.payload.license, 'MIT');
  assert.equal(licensing.apostrophe.license, 'MIT');
  assert.equal(licensing.strapi.license, 'MIT Community');
  assert.equal(licensing.strapi.enterpriseOnly.includes('Review Workflows'), true);
  assert.match(licensing.strapi.growth.price, /\$45/);
  assert.equal(licensing.puck.package, '@puckeditor/core');
});

test('publishing matrix uses only the allowed cell labels', () => {
  const matrix = readJson('publishing-matrix.json');
  const allowed = new Set(matrix.cells);
  for (const [engine, row] of Object.entries(matrix.matrix)) {
    assert.equal(Object.keys(row).length, 11, engine);
    for (const [capability, value] of Object.entries(row)) {
      assert.equal(allowed.has(value), true, `${engine}.${capability}=${value}`);
    }
  }
  assert.equal(matrix.matrix.strapiCommunity.revisionHistory, 'PAID');
  assert.equal(matrix.matrix.payload.visualEditing, 'PAID');
  assert.equal(matrix.matrix.apostrophe.visualEditing, 'FREE OSS');
  assert.equal(matrix.matrix.native.draft, 'CUSTOM FZ');
});

test('payload exercise file records draft isolation through the Local API', () => {
  const payload = readJson('payload-exercise.json');
  assert.equal(payload.executed, true);
  assert.equal(payload.kind, 'WORKS THROUGH API/CODE ONLY');
  assert.equal(payload.adminUi, 'NOT TESTED');
  assert.equal(payload.adminShape, 'next.js');
  assert.equal(payload.results.publicUnchanged, true);
  assert.equal(payload.version, '3.90.1');
});

test('strapi exercise file records draft isolation through the Document Service', () => {
  const strapi = readJson('strapi-exercise.json');
  assert.equal(strapi.executed, true);
  assert.equal(strapi.kind, 'WORKS THROUGH API/CODE ONLY');
  assert.equal(strapi.adminUi, 'NOT TESTED');
  assert.equal(strapi.results.publicUnchanged, true);
  assert.equal(strapi.version, '5.54.0');
});

test('apostrophe exercise file records an API run, not an admin UI', () => {
  const apos = readJson('apostrophe-exercise.json');
  assert.equal(apos.executed, true);
  assert.equal(apos.kind, 'WORKS THROUGH API/CODE ONLY');
  assert.equal(apos.adminUi, 'NOT TESTED');
  assert.equal(apos.version, '4.32.2');
});

test('auth matrix flags paid SSO where official pages do', () => {
  const auth = readJson('auth-matrix.json');
  assert.equal(auth.candidates.payload.oidcOauthSso, 'PAID');
  assert.equal(auth.candidates.strapiCommunity.oidcOauthSso, 'PAID');
  assert.equal(auth.candidates.native.separateEditorIdentities, false);
  assert.equal(auth.betterAuthRemains.includes('Better Auth'), true);
});
