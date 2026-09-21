import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { documentationSignal, assertSignalCannotPromote } from './learning.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OWNERS = new Set(['OWNER', 'AGNIESZKA', 'ENGINEERING', 'FZ-ORCHESTRATOR', 'CORE-API', 'CMS', 'GROWTH', 'SEARCH', 'SECURITY', 'OPERATIONS']);
const STATUSES = new Set(['CURRENT', 'DESIGNED', 'PLANNED', 'CONTRACT_READY', 'PRODUCTION_ONLY', 'OWNER_GATED', 'GAP']);
const SECRET = /-----BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----|AKIA[0-9A-Z]{16}|password\s*[:=]\s*\S+/i;
const CAPABILITIES = [
  'Documentation quality', 'Code maintainability', 'Version control', 'Working in small batches',
  'Continuous integration', 'Continuous delivery', 'Deployment automation', 'Database change management',
  'Test automation', 'Test data management', 'Monitoring and observability', 'Proactive failure notification',
  'Reliability engineering', 'Pervasive security', 'Flexible infrastructure', 'Loosely coupled architecture',
  'Streamlined change approval', 'Customer feedback', 'User-centric focus', 'Team experimentation',
  'Value stream visibility', 'WIP limits', 'Learning culture', 'Quality internal platform',
  'Platform engineering', 'Empowering teams to choose tools', 'Trunk-based development',
  'Monitoring systems to inform business decisions',
  'AI-accessible internal data', 'Healthy data ecosystem', 'Clear and communicated AI stance',
];

function read(rel) {
  return readFileSync(path.join(root, rel), 'utf8');
}

export function checkDocumentation() {
  const errors = [];
  const catalog = JSON.parse(read('docs/engineering/documentation-catalog.json'));
  const ids = new Set();
  for (const doc of catalog.documents) {
    if (ids.has(doc.docId)) errors.push(`duplicate doc ${doc.docId}`);
    ids.add(doc.docId);
    if (!OWNERS.has(doc.owner)) errors.push(`owner ${doc.docId}`);
    if (!STATUSES.has(doc.status)) errors.push(`status ${doc.docId}`);
    if (doc.status === 'OPERATIONAL') errors.push(`operational label ${doc.docId}`);
    const abs = path.join(root, doc.path);
    if (!existsSync(abs)) {
      errors.push(`missing ${doc.path}`);
      continue;
    }
    const text = read(doc.path);
    if (SECRET.test(text)) errors.push(`secret ${doc.path}`);
    if (doc.status === 'CURRENT' && /TODO:|PLACEHOLDER_DOC|lorem ipsum/i.test(text)) errors.push(`placeholder ${doc.path}`);
  }
  const context = JSON.parse(read('docs/engineering/FZ-CONTEXT-MAP.json'));
  if (context.recovery[0] !== 'START-HERE-CURSOR.md') errors.push('recovery order');
  for (const rel of context.recovery) {
    if (!existsSync(path.join(root, rel))) errors.push(`recovery missing ${rel}`);
  }
  for (const domain of context.domains) {
    for (const rel of [domain.canon, ...domain.code, ...domain.tests, ...domain.decisions]) {
      if (!existsSync(path.join(root, rel))) errors.push(`context missing ${rel}`);
    }
  }
  const linked = [
    'docs/DOCUMENTATION-MAP.md',
    'docs/architecture/FZ-DOCUMENTATION-OS.md',
    'docs/guides/developer.md',
    'docs/engineering/API.md',
    'docs/domain/GLOSSARY.md',
  ];
  for (const rel of linked) checkLinks(rel, errors);
  checkEvents(errors);
  const pkg = read('package.json');
  for (const name of ['storybook', '@backstage/', 'docusaurus', 'vitepress']) {
    if (pkg.toLowerCase().includes(name)) errors.push(`docs platform ${name}`);
  }
  const openapi = read('contracts/openapi.json');
  if (!openapi.includes('"/growth/plans"') || !openapi.includes('"authorizesSpend"')) errors.push('openapi plan contract');
  const dora = read('docs/engineering/DORA-CAPABILITY-COVERAGE.md');
  if (!dora.includes('There is no DORA score')) errors.push('dora score denial');
  if (/DORA score is \d+/i.test(dora)) errors.push('dora score');
  for (const name of CAPABILITIES) {
    if (!dora.includes(name)) errors.push(`capability ${name}`);
  }
  const os = read('docs/architecture/FZ-DOCUMENTATION-OS.md');
  const fences = os.split('```');
  if (fences.length % 2 === 0) errors.push('mermaid fence');
  const signal = documentationSignal('DOC_AGENT_CONTEXT_GAP', 'The agent opened a superseded architecture page.');
  assertSignalCannotPromote(signal);
  try {
    assertSignalCannotPromote({ status: 'PROMOTED' });
    errors.push('promotion guard');
  } catch (error) {
    if (error.message !== 'DOC_SIGNAL_AUTHORITY') errors.push('promotion guard');
  }
  return errors;
}

function checkLinks(rel, errors) {
  const text = read(rel);
  const linkRe = /\[[^\]]*\]\(([^)\s]+)\)/g;
  for (const match of text.matchAll(linkRe)) {
    const raw = match[1];
    if (/^(https?:|mailto:|#)/.test(raw)) continue;
    const target = raw.split('#')[0];
    if (!target) continue;
    const resolved = path.resolve(path.dirname(path.join(root, rel)), target);
    if (!existsSync(resolved)) errors.push(`${rel} missing link ${raw}`);
  }
}

function checkEvents(errors) {
  const page = read('docs/engineering/EVENTS.md');
  const block = page.match(/<!-- events:start -->\n([\s\S]*?)<!-- events:end -->/);
  if (!block) {
    errors.push('events block');
    return;
  }
  const documented = new Set(block[1].split('\n').map(line => line.trim()).filter(Boolean));
  const code = [
    read('packages/domain/src/content-publish.ts'),
    read('packages/domain/src/connected.ts'),
  ].join('\n');
  const found = new Set([...code.matchAll(/['"](content\.published|fabric\.field-updated)['"]/g)].map(match => match[1]));
  for (const name of documented) if (!found.has(name)) errors.push(`event doc extra ${name}`);
  for (const name of found) if (!documented.has(name)) errors.push(`event doc missing ${name}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const errors = checkDocumentation();
  if (errors.length) {
    for (const error of errors) console.error(error);
    console.error(`docs-check: ${errors.length} problem(s)`);
    process.exit(1);
  }
  console.log('docs-check: ok');
}
