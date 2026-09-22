import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { apostropheModules, CMS_ADMIN_EDITORIAL_TYPES } from '../schemas/apostrophe-modules.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('Apostrophe schemas expose Service and ProjectCaseStudy piece types for CMS-ADMIN', () => {
  assert.deepEqual(CMS_ADMIN_EDITORIAL_TYPES, ['Service', 'ProjectCaseStudy']);
  assert.equal(apostropheModules.service.extend, '@apostrophecms/piece-type');
  assert.equal(apostropheModules.service.options.label, 'Service');
  assert.equal(apostropheModules['project-case-study'].options.label, 'ProjectCaseStudy');
  assert.equal(apostropheModules['project-case-study'].fields.add.publicLocality.type, 'string');
  assert.equal(apostropheModules['project-case-study'].fields.add._gallery.withType, '@apostrophecms/image');
});

test('Apostrophe lab exercise created Service and ProjectCaseStudy through real modules', () => {
  const evidence = JSON.parse(readFileSync(path.join(root, 'evidence', 'apostrophe-exercise.json'), 'utf8'));
  assert.equal(evidence.executed, true);
  assert.equal(evidence.product, 'apostrophe');
  assert.equal(evidence.version, '4.32.2');
  assert.ok(evidence.results.serviceId);
  assert.ok(evidence.results.studyId);
  assert.equal(evidence.cmsAdmin.serviceAndStudyCreated, true);
  assert.equal(evidence.cmsAdmin.withoutSourceEdits, true);
  assert.equal(evidence.adminUi, 'NOT TESTED');
});
