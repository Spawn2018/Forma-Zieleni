import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyRegions } from './regions.mjs';
import { documentationRows, loadPublicSnapshot, renderDocumentationCatalog, renderProgress } from './status.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const progress = () => '\nclassification: UPDATED_AT_CHECKPOINT\nnormative-sections: 1\n';

function wrap(interior) {
  return `before\n<!-- FZ:AUTO:START progress -->${interior}<!-- FZ:AUTO:END progress -->\nafter\n`;
}

test('region replacement is idempotent and leaves outside bytes unchanged', () => {
  const source = wrap('\nstale\n');
  const once = applyRegions(source, { progress });
  const twice = applyRegions(once, { progress });
  assert.equal(twice, once);
  assert.equal(once.startsWith('before\n<!-- FZ:AUTO:START progress -->'), true);
  assert.equal(once.endsWith('<!-- FZ:AUTO:END progress -->\nafter\n'), true);
  assert.equal(once.includes('stale'), false);
});

test('missing, duplicate, nested, and malformed markers fail closed', () => {
  assert.throws(() => applyRegions('<!-- FZ:AUTO:START progress -->\n', { progress }), /missing FZ:AUTO end/);
  assert.throws(() => applyRegions('<!-- FZ:AUTO:END progress -->', { progress }), /missing FZ:AUTO start/);
  const pair = wrap('\n');
  assert.throws(() => applyRegions(`${pair}${pair}`, { progress }), /duplicate FZ:AUTO marker/);
  assert.throws(() => applyRegions('<!-- FZ:AUTO:START progress --><!-- FZ:AUTO:START other --><!-- FZ:AUTO:END other --><!-- FZ:AUTO:END progress -->', {
    progress,
    other: () => '\n',
  }), /nested FZ:AUTO marker/);
  assert.throws(() => applyRegions('<!-- FZ:AUTO:START -->', { progress }), /malformed FZ:AUTO marker/);
  assert.throws(() => applyRegions(wrap('\n'), {}), /unknown FZ:AUTO region/);
});

test('progress projection has no percentage and no private fields', () => {
  const snapshot = loadPublicSnapshot(root);
  const rendered = renderProgress(snapshot);
  assert.equal(rendered, renderProgress(snapshot));
  assert.equal(snapshot.classification, 'UPDATED_AT_CHECKPOINT');
  assert.equal(rendered.includes('%'), false);
  assert.equal(rendered.includes('@'), false);
  assert.equal(rendered.includes('package-present') || rendered.includes('not-built'), true);
  assert.equal(snapshot.surfaces.web, 'package-present');
  assert.equal(snapshot.surfaces.portal, 'package-present');
  assert.equal(snapshot.surfaces.admin, 'package-present');
  assert.equal(snapshot.surfaces.api, 'package-present');
});

test('documentation catalog rejects a type outside the OS set', () => {
  assert.throws(() => documentationRows([{
    type: 'NOTE',
    audience: 'developer',
    title: 'Loose note',
    path: 'docs/README.md',
  }]), /not in the OS set/);
});

test('documentation catalog is the OS set and has no completion percentage', () => {
  const rendered = renderDocumentationCatalog(root);
  assert.equal(rendered, renderDocumentationCatalog(root));
  assert.equal(rendered.includes('legacy/'), false);
  assert.equal(rendered.includes('%'), false);
  assert.match(rendered, /\| Kanon \| developer \| \[Current architecture\]\(docs\/architecture\/CURRENT-ARCHITECTURE\.md\) \|/);
  assert.match(rendered, /\| Przewodnik \| właściciel \|/);
});

test('readme check and write do not change the current README', () => {
  const readme = path.join(root, 'README.md');
  const before = readFileSync(readme);
  for (const mode of ['check', 'write']) {
    const result = spawnSync(process.execPath, ['scripts/readme/cli.mjs', mode], { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(readFileSync(readme), before);
  }
  const text = before.toString('utf8');
  assert.equal(text.split('<!-- FZ:AUTO:START docs -->').length, 2);
  assert.equal(text.split('<!-- FZ:AUTO:END docs -->').length, 2);
});
