import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { ledger, renderMarkdown, validateRequirements } from './registry.mjs';

test('the requirement registry is unique, prefixed and not below its recorded depth', () => {
  const result = validateRequirements();
  assert.deepEqual(result.errors, []);
  const counts = ledger();
  assert.equal(counts.INCOMPLETE_SAFE, 0);
  assert.equal(counts.TOTAL, result.total);
  assert.ok(result.total >= 40);
  const markdown = readFileSync(new URL('../../docs/engineering/requirements/FZ-MASTER-TRACEABILITY.md', import.meta.url), 'utf8');
  assert.equal(markdown, renderMarkdown());
  for (const id of result.ids) assert.match(markdown, new RegExp(id));
});

test('this foundation does not add a graph database or a second ORM', () => {
  const packageJson = readFileSync(new URL('../../package.json', import.meta.url), 'utf8');
  const domain = readFileSync(new URL('../../packages/domain/package.json', import.meta.url), 'utf8');
  for (const text of [packageJson, domain]) {
    assert.equal(/prisma|drizzle|kafka|neo4j/i.test(text), false);
  }
});

test('the repository has no open-source license file for project code', () => {
  for (const name of ['LICENSE', 'LICENSE.md', 'LICENCE', 'COPYING']) {
    assert.equal(existsSync(new URL(`../../${name}`, import.meta.url)), false);
  }
});

test('the execution journal names the directive and the recovery files', () => {
  const journal = JSON.parse(readFileSync(new URL('../../docs/engineering/requirements/execution-journal.json', import.meta.url), 'utf8'));
  assert.equal(journal.directiveId, 'FZ-MASTER-PROJECT-AUDIT-1');
  assert.equal(journal.push, false);
  assert.ok(journal.evidencePaths.includes('packages/domain/ecosystem.test.mjs'));
});
