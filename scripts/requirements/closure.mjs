import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requirements } from '../requirements/registry.mjs';
import { assertSafeTestData } from '../docs/test-data.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const EVIDENCE = ['docs/engineering/requirements/FZ-DIRECTIVE-COVERAGE.json'];

const OPEN_SLICES = [
  'MEDIA-COLLECTIONS', 'GALLERY-WWW', 'BEFORE-AFTER', 'CMS-SEO', 'CMS-ADMIN', 'CMS-WWW', 'CMS-HARDEN',
  'CMS-PERF', 'CMS-RESTORE', 'CMS-EXPORT', 'CMS-ACCEPT', 'SEARCH-WWW-TECHNICAL', 'SEARCH-STRUCTURED-DATA',
  'SEARCH-SITEMAP-ROBOTS', 'SEARCH-ATTRIBUTION', 'SEARCH-DATA-MODEL', 'SEARCH-CONNECTORS', 'SEARCH-SYNC',
  'SEARCH-HISTORY', 'SEARCH-TECH-AUDIT', 'SEARCH-AI-VISIBILITY', 'SEARCH-CRAWLER-INTELLIGENCE',
  'SEARCH-CONTENT-INTELLIGENCE', 'SEARCH-ADMIN', 'SEARCH-ALERTS', 'SEARCH-SECURITY', 'SEARCH-PERFORMANCE',
  'SEARCH-RECOVERY', 'SEARCH-ACCEPT', 'RETURN-ROADMAP',
];

function section(family, id, normative, mappedRequirementIds, notes) {
  return {
    sourceFamily: family,
    sourceSectionId: id,
    normative,
    mappedRequirementIds,
    coverageStatus: normative ? 'MAPPED' : 'INFORMATIONAL',
    evidencePaths: EVIDENCE,
    notes,
  };
}

function range(family, prefix, from, to, reqs, notes, informational = false) {
  const rows = [];
  for (let n = from; n <= to; n += 1) {
    rows.push(section(family, `${prefix}${n}`, !informational, informational ? [] : reqs, notes));
  }
  return rows;
}

function masterMap(n) {
  if (n <= 12) return [['FZ-REQ-ARCH-001', 'FZ-REQ-GOV-001'], 'Repository and authority baseline.'];
  if (n <= 18) return [['FZ-REQ-AUTO-001', 'FZ-REQ-AUTO-002'], 'One loop, /noc, and the orchestrator.'];
  if (n <= 27) return [['FZ-REQ-CIS-001', 'FZ-REQ-CIS-002'], 'FZ-CIS only. External text is not Canon.'];
  if (n <= 31) return [['FZ-REQ-DORA-001', 'FZ-REQ-DORA-002'], 'Five delivery metrics. No score.'];
  if (n <= 33) return [['FZ-REQ-ARCH-001'], 'Gate A and the modular monolith.'];
  if (n <= 37) return [['FZ-REQ-WWW-001', 'FZ-REQ-PORTAL-001', 'FZ-REQ-ADMIN-001', 'FZ-REQ-MOBILE-001'], 'Product surfaces at their real depth.'];
  if (n <= 40) return [['FZ-REQ-SITEINTEL-001', 'FZ-REQ-GARDENOS-001', 'FZ-REQ-SKETCHUP-001'], 'Future products are not runtimes.'];
  if (n <= 44) return [['FZ-REQ-OFFERINTEL-001', 'FZ-REQ-PAY-001', 'FZ-REQ-GOV-002'], 'Commercial truth and undecided providers.'];
  if (n === 45) return [['FZ-REQ-SEC-001'], 'Lead vertical is not security-accepted.'];
  if (n <= 50) return [['FZ-REQ-CMS-001', 'FZ-REQ-CMS-002', 'FZ-REQ-MEDIA-001'], 'CMS decision and media contract.'];
  if (n <= 54) return [['FZ-REQ-SEARCH-001', 'FZ-REQ-SEARCH-002'], 'One search architecture. Crawler policy is open.'];
  if (n <= 76) return [['FZ-REQ-CONNECT-001', 'FZ-REQ-APPROVAL-001'], 'Connected facts and human approval.'];
  if (n <= 84) return [['FZ-REQ-PROJECT-001', 'FZ-REQ-ATLAS-001', 'FZ-REQ-PROJECTGROWTH-001'], 'Projects, atlas, portfolio.'];
  if (n <= 109) return [['FZ-REQ-GROWTH-001', 'FZ-REQ-MKTEXEC-001', 'FZ-REQ-MARKETING-001'], 'Growth plan and execution graph.'];
  if (n <= 128) return [['FZ-REQ-CONTENT-001', 'FZ-REQ-PERPLEXITY-001', 'FZ-REQ-CREATIVE-001'], 'Content, prompts, and creative limits.'];
  if (n <= 141) return [['FZ-REQ-EXPERIENCE-001', 'FZ-REQ-EXPERIENCE-002', 'FZ-REQ-PRIV-001'], 'Experience signals and replay off.'];
  if (n <= 147) return [['FZ-REQ-CRM-001', 'FZ-REQ-OFFERLEARN-001'], 'Qualified outcomes. Price is locked.'];
  if (n <= 155) return [['FZ-REQ-INTEGRATION-001'], 'No live mutation.'];
  if (n <= 160) return [['FZ-REQ-MOBILE-001', 'FZ-REQ-GARDENOS-001', 'FZ-REQ-SKETCHUP-001'], 'No second business truth.'];
  if (n <= 171) return [['FZ-REQ-OPS-001', 'FZ-REQ-DORA-001'], 'Operations metrics are not DORA metrics.'];
  if (n === 172) return [['FZ-REQ-ARCH-002'], 'No extra ORM or graph database.'];
  if (n <= 179) return [['FZ-REQ-COMPLETION-001', 'FZ-REQ-EXECINTEGRITY-001'], 'Traceability and anti-false-done.'];
  if (n <= 221) return [['FZ-REQ-COVERAGE-001'], 'Closure process. The manifest is the record.'];
  if (n === 222) return [['FZ-REQ-COMPLETION-001', 'FZ-REQ-CONNECT-004', 'FZ-REQ-GROWTH-001', 'FZ-REQ-CMS-001'], 'Acceptance questions map to tested or gated rows.'];
  if (n === 223) return [['FZ-REQ-GOV-001', 'FZ-REQ-PRIV-001'], 'Safety confirmations.'];
  if (n === 224) return [['FZ-REQ-COMPLETION-001'], 'Definition of done.'];
  return null;
}

function buildDirectiveSections() {
  const rows = [];
  for (let n = 0; n <= 225; n += 1) {
    const mapped = masterMap(n);
    if (mapped) rows.push(section('MASTER', `MAIN:${n}`, true, mapped[0], mapped[1]));
    else rows.push(section('MASTER', `MAIN:${n}`, false, [], 'Start instruction. Obligations are the earlier sections.'));
  }
  const closed = [
    [0, 2, ['FZ-REQ-COVERAGE-001'], 'Additive rule and traceability.'],
    [3, 12, ['FZ-REQ-MKTEXEC-001', 'FZ-REQ-MKTEXEC-002'], 'Execution graph and gates.'],
    [13, 24, ['FZ-REQ-OFFERINTEL-001', 'FZ-REQ-OFFERLEARN-001'], 'Offer intelligence.'],
    [25, 36, ['FZ-REQ-PROJECTGROWTH-001', 'FZ-REQ-PROJECTGROWTH-002'], 'Real-project flywheel.'],
    [37, 50, ['FZ-REQ-EXECINTEGRITY-001', 'FZ-REQ-EVIDENCE-001'], 'Evidence over assertion.'],
    [51, 75, ['FZ-REQ-CONTEXT-001', 'FZ-REQ-COMPLETION-001'], 'Journal and completion ledger.'],
    [76, 78, ['FZ-REQ-MKTEXEC-001', 'FZ-REQ-OFFERINTEL-001', 'FZ-REQ-PROJECTGROWTH-001'], 'Acceptance blocks.'],
    [79, 80, ['FZ-REQ-COMPLETION-001', 'FZ-REQ-AUTO-001', 'FZ-REQ-RECOVERY-001'], 'Integrity and recovery.'],
    [81, 88, ['FZ-REQ-COVERAGE-001'], 'Report and continue. No second roadmap.'],
  ];
  for (const [from, to, reqs, notes] of closed) {
    for (let n = from; n <= to; n += 1) rows.push(section('CLOSED_LOOP', `CLOSED_LOOP:A${n}`, true, reqs, notes));
  }
  for (let n = 0; n <= 168; n += 1) {
    const reqs = n >= 149 && n <= 156 ? ['FZ-REQ-DOCQA-001', 'FZ-REQ-DOCCTX-001', 'FZ-REQ-RECOVERY-001']
      : n >= 131 && n <= 136 ? ['FZ-REQ-DOCINV-001']
        : n === 17 || n === 41 ? ['FZ-REQ-DOC-004']
          : ['FZ-REQ-DOC-001', 'FZ-REQ-DOCOPS-001', 'FZ-REQ-DOCCTX-001'];
    rows.push(section('DOC_OS', `DOC_OS:D${n}`, true, reqs, 'Documentation OS obligation.'));
  }
  const dl = {
    1: ['FZ-REQ-PLATFORM-001'],
    2: ['FZ-REQ-DORA-006'],
    3: ['FZ-REQ-PLATFORM-001'],
    4: ['FZ-REQ-DORA-004'],
    5: ['FZ-REQ-DORA-007'],
    6: ['FZ-REQ-DORA-005'],
    7: ['FZ-REQ-DORA-009'],
    8: ['FZ-REQ-DORA-008'],
    9: ['FZ-REQ-DORA-005', 'FZ-REQ-GOV-001'],
    10: ['FZ-REQ-DORA-005', 'FZ-REQ-HOST-001'],
    11: ['FZ-REQ-DORA-010'],
    12: ['FZ-REQ-DORA-010'],
    13: ['FZ-REQ-DORA-004'],
    14: ['FZ-REQ-DORA-010'],
    15: ['FZ-REQ-DORA-010'],
    16: ['FZ-REQ-DORA-008'],
    17: ['FZ-REQ-DORA-003'],
    18: ['FZ-REQ-DORA-001', 'FZ-REQ-EVIDENCE-001'],
    19: ['FZ-REQ-COVERAGE-001'],
    20: ['FZ-REQ-GOV-001', 'FZ-REQ-PRIV-001'],
  };
  for (let n = 1; n <= 20; n += 1) rows.push(section('DORA_LAST_MILE', `DORA_LAST_MILE:DL${n}`, true, dl[n], 'Last-mile capability.'));
  for (let n = 0; n <= 63; n += 1) {
    rows.push(section('CLOSURE', `CLOSURE:${n}`, n !== 63, n === 63 ? [] : ['FZ-REQ-COVERAGE-001', 'FZ-REQ-DOCINV-001', 'FZ-REQ-RECOVERY-001'], n === 63 ? 'Begin instruction.' : 'Closure obligation.'));
  }
  for (let n = 1; n <= 34; n += 1) rows.push(section('MASTER', `ACCEPT:MAIN:${n}`, true, ['FZ-REQ-COMPLETION-001'], 'Master acceptance item.'));
  for (const id of ['A76.1', 'A76.2', 'A76.3', 'A76.4', 'A76.5', 'A77.1', 'A77.2', 'A77.3', 'A77.4', 'A77.5', 'A78.1', 'A78.2', 'A78.3', 'A78.4', 'A78.5']) {
    rows.push(section('CLOSED_LOOP', `ACCEPT:${id}`, true, ['FZ-REQ-MKTEXEC-001', 'FZ-REQ-OFFERINTEL-001', 'FZ-REQ-PROJECTGROWTH-001'], 'Closed-loop acceptance item.'));
  }
  for (let n = 1; n <= 10; n += 1) rows.push(section('CLOSED_LOOP', `ACCEPT:A79.${n}`, true, ['FZ-REQ-COMPLETION-001'], 'Integrity acceptance item.'));
  for (let n = 1; n <= 4; n += 1) rows.push(section('CLOSED_LOOP', `ACCEPT:A80.${n}`, true, ['FZ-REQ-RECOVERY-001', 'FZ-REQ-AUTO-001'], 'Context acceptance item.'));
  for (const letter of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB', 'AC']) {
    rows.push(section('DOC_OS', `ACCEPT:DOC:${letter}`, true, ['FZ-REQ-DOC-001', 'FZ-REQ-DOCQA-001'], 'Documentation acceptance item.'));
  }
  for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    rows.push(section('CLOSURE', `ACCEPT:CLOSURE:${letter}`, true, ['FZ-REQ-COVERAGE-001'], 'Closure acceptance item.'));
  }
  const letters = 'ABCDEFGHIJKLMNOPQ'.split('');
  for (const letter of letters) {
    rows.push(section('CMS_ACCEPT', `CMS_ACCEPT:${letter}`, true, [`FZ-REQ-CMS-ACCEPT-${letter}`], 'CMS acceptance item. Not granted.'));
  }
  for (const slice of OPEN_SLICES.filter(item => item.startsWith('SEARCH-'))) {
    rows.push(section('SEARCH', `SEARCH:${slice}`, true, [`FZ-REQ-CMS-SLICE-${slice}`], 'Open search slice. Not executed.'));
  }
  rows.push(section('SEARCH', 'SEARCH:FZ-SEARCH-CRAWL-1', true, ['FZ-REQ-SEARCH-002'], 'Training-crawler policy is open.'));
  const gates = [
    ['OPEN_GATES:FZ-SIGN-1', ['FZ-REQ-GOV-002']],
    ['OPEN_GATES:FZ-SEARCH-CRAWL-1', ['FZ-REQ-SEARCH-002']],
    ['OPEN_GATES:CMS-ACCEPT', ['FZ-REQ-CMS-001']],
    ['OPEN_GATES:PAYMENT', ['FZ-REQ-PAY-001']],
    ['OPEN_GATES:HOSTING', ['FZ-REQ-HOST-001']],
    ['OPEN_GATES:PUSH', ['FZ-REQ-GOV-001']],
    ['OPEN_GATES:DEPLOY', ['FZ-REQ-HOST-001']],
    ['OPEN_GATES:SPEND', ['FZ-REQ-GROWTH-003']],
    ['OPEN_GATES:TRACKING', ['FZ-REQ-PRIV-001']],
  ];
  for (const [id, reqs] of gates) rows.push(section('OPEN_GATES', id, true, reqs, 'Owner or dangerous gate. Not resolved.'));
  const canon = [
    ['CANON:ONE-LOOP', ['FZ-REQ-AUTO-002']],
    ['CANON:GATE-A', ['FZ-REQ-ARCH-001']],
    ['CANON:NO-GRAPH-DB', ['FZ-REQ-ARCH-002']],
    ['CANON:CMS-OPTION-B', ['FZ-REQ-CMS-001']],
    ['CANON:SIGN-UNDECIDED', ['FZ-REQ-GOV-002']],
    ['CANON:LEAD-NOT-ACCEPTED', ['FZ-REQ-SEC-001']],
    ['CANON:SESSION-REPLAY-OFF', ['FZ-REQ-EXPERIENCE-002']],
    ['CANON:DORA-FIVE', ['FZ-REQ-DORA-001']],
    ['CANON:CIS-ONE', ['FZ-REQ-CIS-001']],
  ];
  for (const [id, reqs] of canon) rows.push(section('CANON', id, true, reqs, 'Binding Canon obligation.'));
  return rows;
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const abs = path.join(dir, name);
    if (statSync(abs).isDirectory()) walk(abs, out);
    else if (name.endsWith('.md')) out.push(path.relative(root, abs).replaceAll('\\', '/'));
  }
  return out;
}

function classify(rel) {
  const historical = rel.startsWith('docs/knowledge/freset-v2-reference/');
  const superseded = rel === 'docs/architecture/ARCHITECTURE.md';
  let owner = 'ENGINEERING';
  if (rel.startsWith('docs/security/') || rel.includes('SECURITY')) owner = 'SECURITY';
  if (rel.startsWith('docs/constitution/') || rel.startsWith('docs/guides/wlasciciel.md')) owner = 'OWNER';
  if (rel.startsWith('docs/guides/agnieszka.md')) owner = 'AGNIESZKA';
  if (rel.startsWith('docs/architecture/FZ-SEARCH') || rel.includes('SEARCH')) owner = 'SEARCH';
  if (rel.includes('GROWTH') || rel.includes('FZ-AI')) owner = 'GROWTH';
  const discovery = historical ? 'docs/knowledge/README.md'
    : superseded ? 'docs/architecture/CURRENT-ARCHITECTURE.md'
      : rel.startsWith('docs/guides/') ? 'docs/DOCUMENTATION-MAP.md'
        : rel.startsWith('docs/architecture/') ? 'docs/architecture/README.md'
          : 'docs/README.md';
  return {
    path: rel,
    docType: historical ? 'EVIDENCE' : superseded ? 'REDIRECT' : 'DOCUMENT',
    audience: rel.startsWith('docs/guides/wlasciciel.md') ? 'owner' : rel.startsWith('docs/guides/agnieszka.md') ? 'agnieszka' : 'developer',
    owner,
    canonical: rel === 'docs/architecture/CURRENT-ARCHITECTURE.md',
    currentState: historical ? 'HISTORICAL' : superseded ? 'SUPERSEDED' : 'CURRENT',
    freshnessClass: historical ? 'STABLE' : 'SLOW-CHANGING',
    discovery,
    action: 'KEEP',
    notes: historical ? 'Reset evidence. Not current Canon.' : superseded ? 'Superseded by CURRENT-ARCHITECTURE.' : 'Classified. Not rewritten for style.',
  };
}

export function buildInventory() {
  return walk(path.join(root, 'docs')).sort().map(classify);
}

export function buildCoverage() {
  return buildDirectiveSections();
}

export function requiredSectionIds() {
  return buildCoverage().map(item => item.sourceSectionId);
}

export function mayStartMutation(marker, head) {
  if (typeof marker !== 'string' || typeof head !== 'string' || marker.length < 7 || head.length < 7) {
    return { ok: false, reason: 'RECOVERY_REQUIRED' };
  }
  if (marker !== head) return { ok: false, reason: 'RECOVERY_REQUIRED' };
  return { ok: true };
}

export function checkClosure() {
  const errors = [];
  const ids = new Set(requirements().map(item => item.id));
  const coverage = buildCoverage();
  const seen = new Set();
  let normative = 0;
  let mapped = 0;
  for (const item of coverage) {
    if (seen.has(item.sourceSectionId)) errors.push(`duplicate ${item.sourceSectionId}`);
    seen.add(item.sourceSectionId);
    if (item.normative) {
      normative += 1;
      if (!item.mappedRequirementIds.length) errors.push(`unmapped ${item.sourceSectionId}`);
      else mapped += 1;
      for (const id of item.mappedRequirementIds) if (!ids.has(id)) errors.push(`missing req ${id} for ${item.sourceSectionId}`);
    } else if (!item.notes) errors.push(`informational ${item.sourceSectionId}`);
  }
  const families = new Set(coverage.map(item => item.sourceFamily));
  for (const family of ['MASTER', 'CLOSED_LOOP', 'DOC_OS', 'DORA_LAST_MILE', 'CANON', 'CMS_ACCEPT', 'SEARCH', 'OPEN_GATES', 'CLOSURE']) {
    if (!families.has(family)) errors.push(`family ${family}`);
  }
  const onDisk = JSON.parse(readFileSync(path.join(root, 'docs/engineering/requirements/FZ-DIRECTIVE-COVERAGE.json'), 'utf8'));
  if (onDisk.sections.length !== coverage.length) errors.push('coverage file drift');
  const inventory = buildInventory();
  const inventoryDisk = JSON.parse(readFileSync(path.join(root, 'docs/engineering/requirements/FZ-DOC-INVENTORY.json'), 'utf8'));
  if (inventoryDisk.files.length !== inventory.length) errors.push('inventory file drift');
  const unexplained = inventory.filter(item => !item.action || !item.owner || !item.discovery || !item.audience);
  if (unexplained.length) errors.push(`orphans ${unexplained.length}`);
  for (const item of inventory) {
    if (!existsSync(path.join(root, item.discovery))) errors.push(`discovery ${item.path}`);
  }
  const lastMile = readFileSync(path.join(root, 'docs/engineering/DORA-LAST-MILE.md'), 'utf8');
  for (let n = 1; n <= 20; n += 1) if (!lastMile.includes(`## DL${n}`)) errors.push(`DL${n}`);
  if (/DORA score is \d+/i.test(lastMile)) errors.push('dora score');
  try {
    assertSafeTestData({ kind: 'marketing-plan', synthetic: true });
    assertSafeTestData({ kind: 'note' });
    assertSafeTestData({ kind: 'marketing-plan', synthetic: false, note: 'production customer dump' });
    errors.push('customer dump');
  } catch (error) {
    if (error.message !== 'CUSTOMER_DUMP' && error.message !== 'SYNTHETIC_LABEL_REQUIRED') errors.push('test data');
  }
  const marker = mayStartMutation('df200a6a12a66bb26af04f000fcc43ac27984986', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  if (marker.ok) errors.push('recovery mismatch allowed');
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root }).toString().trim();
  const journal = JSON.parse(readFileSync(path.join(root, 'docs/engineering/requirements/execution-journal.json'), 'utf8'));
  if (journal.recoveryVerifiedHead && journal.recoveryVerifiedHead !== head) {
    try {
      execFileSync('git', ['merge-base', '--is-ancestor', journal.recoveryVerifiedHead, 'HEAD'], { cwd: root, stdio: 'ignore' });
    } catch {
      errors.push('recovery marker');
    }
  }
  return { errors, sections: coverage.length, normative, mapped, files: inventory.length, unexplained: unexplained.length };
}

function writeJson(rel, value) {
  writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--write')) {
    writeJson('docs/engineering/requirements/FZ-DIRECTIVE-COVERAGE.json', { version: 1, sections: buildCoverage() });
    writeJson('docs/engineering/requirements/FZ-DOC-INVENTORY.json', { version: 1, files: buildInventory() });
  }
  const result = checkClosure();
  if (result.errors.length) {
    for (const error of result.errors) console.error(error);
    process.exit(1);
  }
  console.log(`closure: ok sections=${result.sections} normative=${result.normative} files=${result.files}`);
}
