/**
 * One quality classification over the existing product scope.
 * Not a second learning store, debt backlog, or execution graph.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { toLearningInput } from '../fz-cis/ingest.mjs';
import { syntheticProductionRejected } from '../fz-cis/learning-governance.mjs';
import { loadProductScope } from './product-scope.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export const QUALITY_CLASSES = Object.freeze([
  'UNIT', 'DOMAIN', 'PROPERTY', 'MUTATION', 'FUZZ', 'INTEGRATION', 'CONTRACT',
  'DATABASE', 'MIGRATION', 'CONCURRENCY', 'AUTHZ', 'SECURITY',
  'E2E_SMOKE', 'E2E_CRITICAL', 'E2E_FULL', 'VISUAL', 'ACCESSIBILITY',
  'PERFORMANCE', 'LOAD', 'STRESS', 'SOAK', 'RESILIENCE', 'BACKUP_RESTORE',
  'COMPATIBILITY', 'MOBILE_NATIVE', 'RELEASE', 'PRODUCTION_SAFE',
]);

export const QUALITY_APPLICABILITY = Object.freeze([
  'REQUIRED', 'NOT_APPLICABLE', 'WAITING_FOR_RUNTIME', 'WAITING_FOR_STAGING',
  'WAITING_FOR_PRODUCTION', 'OWNER_GATED',
]);

export const QUALITY_DEPTHS = Object.freeze([
  'QUALITY_CONTRACTED', 'QUALITY_IMPLEMENTED', 'QUALITY_TESTED',
  'QUALITY_RUNTIME_READY', 'QUALITY_STAGING_VERIFIED', 'QUALITY_PRODUCTION_VERIFIED',
]);

const EXTRA_SUBJECTS = Object.freeze([
  'ANDROID', 'IOS', 'FILES', 'SECURITY', 'ACCESSIBILITY', 'PERFORMANCE',
  'RELIABILITY', 'ENGINEERING', 'CODERABBIT', 'GROK', 'FZ-CIS',
]);

const CLIENT_APPS = new Set(['web', 'portal', 'admin']);
const APP_NAMES = new Set(['web', 'portal', 'admin', 'api']);

function tested(activation = null) {
  return { applicability: 'REQUIRED', depth: 'QUALITY_TESTED', activation, reason: null };
}

function contracted(activation) {
  return { applicability: 'REQUIRED', depth: 'QUALITY_CONTRACTED', activation, reason: null };
}

function waiting(applicability, activation) {
  return { applicability, depth: 'QUALITY_CONTRACTED', activation, reason: null };
}

function na(reason) {
  return { applicability: 'NOT_APPLICABLE', depth: 'QUALITY_CONTRACTED', activation: null, reason };
}

function owner(activation) {
  return { applicability: 'OWNER_GATED', depth: 'QUALITY_CONTRACTED', activation, reason: null };
}

function classes(spec) {
  const missing = QUALITY_CLASSES.filter((name) => !spec[name]);
  if (missing.length) throw new Error(`QUALITY_CLASS_MISSING:${missing.join(',')}`);
  return spec;
}

function domainProfile(activation) {
  return classes({
    UNIT: tested(),
    DOMAIN: tested(),
    PROPERTY: contracted('targeted fast-check only when the input space is high-dimensional'),
    MUTATION: contracted('targeted Stryker only for critical logic on a change; not a vanity score'),
    FUZZ: contracted('targeted robust-input cases only where parsing or external input exists'),
    INTEGRATION: tested(),
    CONTRACT: tested(),
    DATABASE: contracted('PostgreSQL semantics where the entity is persisted; no Docker mandate on the workstation'),
    MIGRATION: waiting('WAITING_FOR_RUNTIME', 'representative previous-schema upgrade when a material migration exists'),
    CONCURRENCY: contracted('idempotent retry and version conflict on the authoritative write'),
    AUTHZ: tested(),
    SECURITY: tested(),
    E2E_SMOKE: waiting('WAITING_FOR_RUNTIME', activation),
    E2E_CRITICAL: waiting('WAITING_FOR_RUNTIME', activation),
    E2E_FULL: waiting('WAITING_FOR_STAGING', activation),
    VISUAL: waiting('WAITING_FOR_RUNTIME', 'approved visual reference plus a real journey'),
    ACCESSIBILITY: contracted('experience-contract A11Y list; browser axe waits for the runtime journey'),
    PERFORMANCE: waiting('WAITING_FOR_RUNTIME', 'measured baseline before any optimization claim'),
    LOAD: waiting('WAITING_FOR_STAGING', 'synthetic load only after a staging target exists'),
    STRESS: waiting('WAITING_FOR_STAGING', 'synthetic stress only after a staging target exists'),
    SOAK: waiting('WAITING_FOR_STAGING', 'soak waits for a long-running isolated target'),
    RESILIENCE: contracted('no silent success when a dependency or acknowledgement fails'),
    BACKUP_RESTORE: waiting('WAITING_FOR_STAGING', 'restore stays WAITING_FOR_ENVIRONMENT until an isolated restore runs'),
    COMPATIBILITY: waiting('WAITING_FOR_RUNTIME', 'modern engines for the real web surface; no invented support matrix'),
    MOBILE_NATIVE: na('this capability is not a native mobile runtime'),
    RELEASE: waiting('WAITING_FOR_STAGING', 'release gate stays waiting until staging exists'),
    PRODUCTION_SAFE: waiting('WAITING_FOR_PRODUCTION', 'production does not exist'),
  });
}

function surfaceProfile(activation) {
  const base = domainProfile(activation);
  return classes({
    ...base,
    UNIT: contracted('shell and projection tests exist; full journey E2E waits for runtime'),
    DOMAIN: na('business truth stays in Core API and packages/domain'),
    INTEGRATION: contracted(activation),
    DATABASE: na('client surfaces do not own business persistence'),
    MIGRATION: na('client surfaces do not own schema migrations'),
    AUTHZ: tested(),
    E2E_SMOKE: waiting('WAITING_FOR_RUNTIME', activation),
    E2E_CRITICAL: waiting('WAITING_FOR_RUNTIME', activation),
    VISUAL: waiting('WAITING_FOR_RUNTIME', 'experience contract plus an approved reference; no automatic baseline overwrite'),
    ACCESSIBILITY: contracted('keyboard, focus, semantics, contrast, labels, touch-targets, screen-reader'),
  });
}

function futureProfile(activation, mobile = false) {
  const base = domainProfile(activation);
  return classes({
    ...base,
    UNIT: contracted(activation),
    DOMAIN: contracted(activation),
    INTEGRATION: waiting('WAITING_FOR_RUNTIME', activation),
    CONTRACT: contracted(activation),
    AUTHZ: contracted(activation),
    SECURITY: contracted(activation),
    MOBILE_NATIVE: mobile
      ? waiting('WAITING_FOR_RUNTIME', activation)
      : na('no native mobile surface on this capability'),
  });
}

function providerProfile(activation) {
  const base = domainProfile(activation);
  return classes({
    ...base,
    UNIT: contracted('provider-neutral state tests stay executable'),
    DOMAIN: contracted('provider-neutral domain remains executable while the vendor is undecided'),
    INTEGRATION: owner(activation),
    E2E_SMOKE: owner(`${activation}; sandbox E2E waits for provider selection`),
    E2E_CRITICAL: owner(`${activation}; sandbox E2E waits for provider selection`),
    E2E_FULL: owner(activation),
  });
}

function engineeringProfile(activation) {
  return classes({
    UNIT: tested(),
    DOMAIN: na('engineering controls are not a product domain'),
    PROPERTY: na('no high-dimensional product input on this control'),
    MUTATION: contracted('a strong-coverage claim that lets a critical mutant live fails this gate'),
    FUZZ: na('no external parser on this control'),
    INTEGRATION: tested(),
    CONTRACT: tested(),
    DATABASE: na('this control does not own business persistence'),
    MIGRATION: na('this control does not own schema migrations'),
    CONCURRENCY: na('no business write race on this control'),
    AUTHZ: contracted('Owner gates stay outside autonomous relaxation'),
    SECURITY: tested(),
    E2E_SMOKE: na('not a user journey'),
    E2E_CRITICAL: na('not a user journey'),
    E2E_FULL: na('not a user journey'),
    VISUAL: na('not a visual surface'),
    ACCESSIBILITY: na('not a user interface'),
    PERFORMANCE: contracted('optimization claims require a measured baseline'),
    LOAD: waiting('WAITING_FOR_STAGING', 'no production capacity is known'),
    STRESS: waiting('WAITING_FOR_STAGING', 'no production capacity is known'),
    SOAK: waiting('WAITING_FOR_STAGING', 'no long-running production target'),
    RESILIENCE: contracted(activation),
    BACKUP_RESTORE: waiting('WAITING_FOR_STAGING', 'config is not a verified restore'),
    COMPATIBILITY: na('no browser surface'),
    MOBILE_NATIVE: na('no native runtime'),
    RELEASE: waiting('WAITING_FOR_STAGING', 'release readiness is contracted, not a production pass'),
    PRODUCTION_SAFE: waiting('WAITING_FOR_PRODUCTION', 'production does not exist'),
  });
}

const SUBJECTS = Object.freeze([
  ['WWW', () => surfaceProfile('WWW-PORTFOLIO-PROJECTION')],
  ['PORTAL', () => surfaceProfile('PORTAL-FILE-PROJECTION')],
  ['ADMIN', () => surfaceProfile('ADMIN-CRM-LEAD')],
  ['LEAD', () => domainProfile('ADMIN-CRM-LEAD')],
  ['OPPORTUNITY', () => domainProfile('CRM-OPPORTUNITY-CONTRACT is complete; browser journey waits')],
  ['OFFER', () => domainProfile('PORTAL-OFFER acceptance journey')],
  ['CONTRACT', () => domainProfile('SIGN-STATE-NEUTRAL')],
  ['SIGNING', () => providerProfile('FZ-SIGN-1')],
  ['PAYMENT', () => providerProfile('PAY-DOMAIN-NEUTRAL')],
  ['PROJECT', () => domainProfile('PORTAL-PROJECT-PROJECTION is complete; browser journey waits')],
  ['MOBILE', () => futureProfile('MOBILE-ANDROID-FOUNDATION or MOBILE-IOS-FOUNDATION', true)],
  ['ANDROID', () => futureProfile('MOBILE-ANDROID-FOUNDATION', true)],
  ['IOS', () => futureProfile('MOBILE-IOS-FOUNDATION', true)],
  ['GARDENOS', () => futureProfile('GARDENOS-DOMAIN')],
  ['SITEINTEL', () => futureProfile('SITEINTEL-RULES')],
  ['ATLAS', () => futureProfile('ATLAS-PLANT-IDENTITY')],
  ['SKETCHUP', () => futureProfile('SKETCHUP-PROJECT-MAP')],
  ['PXI', () => futureProfile('PXI-SIGNAL-MODEL')],
  ['GROWTH', () => futureProfile('growth measurement stays production-gated')],
  ['CONNECTED', () => futureProfile('connected knowledge must not override canonical truth')],
  ['CMS', () => domainProfile('CMS public projection')],
  ['SEARCH', () => domainProfile('search intelligence stays non-authoritative over Canon')],
  ['MEDIA', () => domainProfile('media pipeline tests')],
  ['FILES', () => futureProfile('PORTAL-FILE-PROJECTION')],
  ['HOSTING', () => classes({
    ...providerProfile('FZ-REQ-HOST-001'),
    UNIT: owner('hosting selection'),
    DOMAIN: na('hosting is not a business domain'),
    MOBILE_NATIVE: na('hosting is not a mobile runtime'),
  })],
  ['SECURITY', () => engineeringProfile('security regression control')],
  ['ACCESSIBILITY', () => classes({
    ...engineeringProfile('experience-contract accessibility gate'),
    ACCESSIBILITY: contracted('semantics, keyboard, focus, labels, contrast, touch-targets, screen-reader'),
    VISUAL: waiting('WAITING_FOR_RUNTIME', 'manual acceptance stays beside automated checks'),
  })],
  ['PERFORMANCE', () => classes({
    ...engineeringProfile('measured performance only'),
    PERFORMANCE: contracted('NOT_MEASURED until a baseline exists; no unmeasured optimization claim'),
  })],
  ['RELIABILITY', () => engineeringProfile('backup, restore, and rollback wait for an environment')],
  ['ENGINEERING', () => engineeringProfile('this quality gate')],
  ['CODERABBIT', () => engineeringProfile('checkpoint review remains advisory')],
  ['GROK', () => engineeringProfile('read-only challenger; agreement is not effect evidence')],
  ['FZ-CIS', () => engineeringProfile('material quality failures enter the existing store')],
]);

export const QUALITY_SUBJECTS = Object.freeze(SUBJECTS.map(([id, build]) => ({ id, classes: build() })));

export const E2E_FOUNDATION = Object.freeze({
  webRunner: 'playwright',
  runnerState: 'CONTRACTED_NOT_INSTALLED',
  reason: 'No critical browser journey is runtime-ready. Playwright is the selected OSS runner and installs with the first runtime-ready critical journey.',
  levels: Object.freeze({
    E2E_SMOKE: 'WAITING_FOR_RUNTIME',
    E2E_CRITICAL: 'WAITING_FOR_RUNTIME',
    E2E_FULL: 'WAITING_FOR_STAGING',
    E2E_PRODUCTION_SAFE: 'WAITING_FOR_PRODUCTION',
  }),
  androidActivation: 'MOBILE-ANDROID-FOUNDATION',
  iosActivation: 'MOBILE-IOS-FOUNDATION',
});

export const CRITICAL_JOURNEYS = Object.freeze([
  journey('www-lead', 'WWW', 'FZ-REQ-WWW-001', 'public-enquiry', 'WWW-PORTFOLIO-PROJECTION'),
  journey('lead-opportunity', 'LEAD', 'FZ-REQ-SEC-001', 'lead-qualify', 'ADMIN-CRM-LEAD'),
  journey('opportunity-offer', 'OFFER', 'FZ-REQ-CRM-OFFER-001', 'offer-issue', 'PORTAL-OFFER acceptance'),
  journey('offer-portal', 'PORTAL', 'FZ-REQ-PORTAL-002', 'portal-offer', 'PORTAL-OFFER acceptance'),
  journey('offer-contract', 'CONTRACT', 'FZ-REQ-CRM-CONTRACT-001', 'contract-open', 'SIGN-STATE-NEUTRAL'),
  journey('contract-sign', 'SIGNING', 'FZ-REQ-SIGN-001', 'sign-state', 'FZ-SIGN-1'),
  journey('contract-pay', 'PAYMENT', 'FZ-REQ-PAY-001', 'pay-state', 'PAY-DOMAIN-NEUTRAL'),
  journey('project-portal', 'PROJECT', 'FZ-REQ-PROJECT-001', 'project-open', 'PORTAL-PROJECT-PROJECTION'),
  journey('project-garden', 'GARDENOS', 'FZ-REQ-GARDENOS-001', 'garden-link', 'GARDENOS-DOMAIN'),
  journey('project-mobile', 'MOBILE', 'FZ-REQ-MOBILE-001', 'field-read', 'MOBILE-ANDROID-FOUNDATION'),
  journey('site-rules', 'SITEINTEL', 'FZ-REQ-SITEINTEL-001', 'site-rules', 'SITEINTEL-RULES'),
  journey('atlas-link', 'ATLAS', 'FZ-REQ-ATLAS-001', 'plant-identity', 'ATLAS-PLANT-IDENTITY'),
]);

function journey(id, capability, requirement, workflow, activation) {
  return {
    id,
    capability,
    requirement,
    workflow,
    activation,
    runtimeReady: false,
    transport: 'browser',
    claimsUiE2e: false,
    e2e: 'WAITING_FOR_RUNTIME',
  };
}

export const BUSINESS_RULES = Object.freeze([
  { id: 'offer-lifecycle', owner: 'packages/domain' },
  { id: 'portal-visibility', owner: 'packages/domain' },
  { id: 'lead-qualify', owner: 'packages/domain' },
  { id: 'contract-lifecycle', owner: 'packages/domain' },
  { id: 'project-activation', owner: 'packages/domain' },
]);

/** Material debt stays here, on the existing graph. Empty means none was proven in this closure. */
export const QUALITY_DEBT = Object.freeze([]);

export const PRODUCTION_EXISTS = false;

export function requiredQualityIds(scope = loadProductScope()) {
  return [...new Set([...scope.map((item) => item.id), ...EXTRA_SUBJECTS])];
}

export function forbiddenImport(file, specifier) {
  const normalized = String(file || '').replace(/\\/g, '/');
  const spec = String(specifier || '');
  const app = /^apps\/(web|portal|admin|api)\//.exec(normalized)?.[1];
  if (app && CLIENT_APPS.has(app) && spec.includes('@forma-zieleni/domain')) {
    return 'client-app-owns-domain';
  }
  if (normalized.startsWith('packages/domain/') && /@forma-zieleni\/(web|portal|admin|api)/.test(spec)) {
    return 'domain-imports-app';
  }
  if (app) {
    for (const other of APP_NAMES) {
      if (other === app) continue;
      const pkg = `@forma-zieleni/${other}`;
      if (spec === pkg || spec.startsWith(`${pkg}/`)) return 'app-imports-app';
    }
  }
  return null;
}

export function workspaceEdges(scanRoot = root) {
  const edges = [];
  for (const group of ['apps', 'packages']) {
    let names = [];
    try {
      names = readdirSync(path.join(scanRoot, group));
    } catch {
      continue;
    }
    for (const name of names) {
      let pkg;
      try {
        pkg = JSON.parse(readFileSync(path.join(scanRoot, group, name, 'package.json'), 'utf8'));
      } catch {
        continue;
      }
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      for (const spec of Object.keys(deps)) {
        if (spec.startsWith('@forma-zieleni/')) edges.push([pkg.name, spec]);
      }
    }
  }
  return edges;
}

export function dependencyCycles(edges = []) {
  const graph = new Map();
  for (const [from, to] of edges) {
    if (!graph.has(from)) graph.set(from, new Set());
    graph.get(from).add(to);
  }
  const cycles = [];
  const stack = new Set();
  function walk(node, trail) {
    if (stack.has(node)) {
      cycles.push([...trail, node].join('→'));
      return;
    }
    stack.add(node);
    for (const next of graph.get(node) || []) walk(next, [...trail, node]);
    stack.delete(node);
  }
  for (const node of graph.keys()) walk(node, []);
  return [...new Set(cycles)];
}

export function semanticDuplication(rules = BUSINESS_RULES) {
  const owners = new Map();
  const duplicates = [];
  for (const rule of rules) {
    const previous = owners.get(rule.id);
    if (previous && previous !== rule.owner) duplicates.push(rule.id);
    else owners.set(rule.id, rule.owner);
  }
  return duplicates;
}

export function deadCodeFindings(items = []) {
  return items.filter((item) => item.referenced === false && !item.protection);
}

export function clientAccessAllowed(actor, resource) {
  if (!actor?.clientId || actor.clientId !== resource?.clientId) {
    return { ok: false, reason: 'BOLA' };
  }
  return { ok: true, reason: 'same-client' };
}

export function mutationSurvived(claim = {}) {
  return claim.coverageClaim === 'strong' && claim.mutantKilled !== true;
}

export function independentOccurrences(events = []) {
  const seen = new Set();
  let count = 0;
  for (const event of events) {
    if (seen.has(event.signature)) continue;
    seen.add(event.signature);
    count += 1;
  }
  return count;
}

export function flakyDisposition(result = {}) {
  if (result.firstAttemptFailed === true && result.passed === true && result.retries > 0) {
    return { pass: false, instability: true, reason: 'retry_is_not_pass' };
  }
  return { pass: result.passed === true, instability: false, reason: 'direct' };
}

export function optimizationClaim(claim = {}) {
  if (claim.improved === true && !claim.baseline) return { ok: false, reason: 'NOT_MEASURED' };
  return { ok: true, reason: claim.baseline ? 'measured' : 'no-claim' };
}

export function migrationReadiness(result = {}) {
  if (result.applicable === false) return { ok: true, reason: 'not-applicable' };
  if (result.freshOk === true && result.previousSchemaOk !== true) {
    return { ok: false, reason: 'previous-schema-failed' };
  }
  return { ok: result.previousSchemaOk === true, reason: 'previous-schema' };
}

export function completionAllowed(state = {}) {
  if (state.requestSent === true && state.remoteAck !== true && state.uiComplete === true) return false;
  return true;
}

export function restoreReadiness(backup = {}) {
  if (backup.restoreVerified === true) return { accepted: true, state: 'VERIFIED' };
  return { accepted: false, state: 'WAITING_FOR_ENVIRONMENT' };
}

export function visualBaselineUpdate(update = {}) {
  if (update.automatic === true && update.reviewed !== true) return { ok: false, reason: 'unreviewed-baseline' };
  return { ok: true, reason: 'reviewed-or-unchanged' };
}

export function evidenceSufficient(evidence = {}) {
  if (evidence.aiAgreement === true && evidence.local !== true) return false;
  return evidence.local === true;
}

export function globalLearningAllowed(record = {}) {
  if ((record.scope === 'PROJECT' || record.scope === 'CUSTOMER') && record.generalizability === 'GLOBAL' && record.humanApproval !== true) {
    return false;
  }
  return true;
}

export function providerTestPlan(provider = {}) {
  return {
    sandbox: provider.selected === true ? 'READY' : 'OWNER_GATED',
    neutralContract: 'EXECUTABLE',
  };
}

export function securityFixDurable(fix = {}) {
  if (fix.removedFailingTest === true && !fix.regressionControl) return false;
  return Boolean(fix.regressionControl);
}

export function selectQualityChecks(change = {}) {
  const checks = ['unit', 'domain', 'architecture', 'security'];
  if (change.domainOnly === true) return checks;
  if (change.uiJourney === true) checks.push('e2e-critical', 'semantic', 'a11y', 'visual');
  if (change.sharedCritical === true) checks.push('property', 'mutation', 'concurrency');
  return checks;
}

export function qualityLearningInput(event = {}) {
  if (event.kind === 'pass' || event.passed === true) return { ok: false, reason: 'noise_skip' };
  if (syntheticProductionRejected(event)) return { ok: false, reason: 'synthetic_production_rejected' };
  const kind = event.kind === 'test_flaky' || event.kind === 'security_finding' ? event.kind : 'test_failed';
  return toLearningInput({
    kind,
    observation: event.observation,
    evidence: event.evidence,
    patternKey: event.patternKey,
    scope: event.scope || 'engineering',
    relatedCommit: event.relatedCommit,
  });
}

function walkSources(dir, out = []) {
  let entries = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (name === 'node_modules' || name === 'dist' || name === 'build') continue;
    const full = path.join(dir, name);
    let info;
    try {
      info = statSync(full);
    } catch {
      continue;
    }
    if (info.isDirectory()) walkSources(full, out);
    else if (/\.(mjs|js|ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
}

export function scanArchitectureImports(scanRoot = root) {
  const roots = ['apps', 'packages/domain'].map((dir) => path.join(scanRoot, dir));
  const violations = [];
  for (const dir of roots) {
    for (const file of walkSources(dir)) {
      const relative = path.relative(scanRoot, file).replace(/\\/g, '/');
      const text = readFileSync(file, 'utf8');
      for (const match of text.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
        const reason = forbiddenImport(relative, match[1]);
        if (reason) violations.push(`${relative}:${reason}`);
      }
    }
  }
  return violations;
}

export function scanStrayDebug(scanRoot = root) {
  const findings = [];
  for (const dir of ['apps', 'packages']) {
    for (const file of walkSources(path.join(scanRoot, dir))) {
      if (/\.test\./.test(file)) continue;
      const text = readFileSync(file, 'utf8');
      const relative = path.relative(scanRoot, file).replace(/\\/g, '/');
      if (/\bdebugger\b/.test(text)) findings.push(`${relative}:debugger`);
      if (/\b(TODO|FIXME)\b/.test(text)) findings.push(`${relative}:todo`);
    }
  }
  return findings;
}

function validateCell(id, name, cell, errors) {
  if (!cell || !QUALITY_APPLICABILITY.includes(cell.applicability)) {
    errors.push(`${id}:${name}:UNKNOWN`);
    return;
  }
  if (!QUALITY_DEPTHS.includes(cell.depth)) errors.push(`${id}:${name}:BAD_DEPTH`);
  if (cell.applicability === 'NOT_APPLICABLE' && !cell.reason) errors.push(`${id}:${name}:NA_WITHOUT_REASON`);
  if (!PRODUCTION_EXISTS && cell.depth === 'QUALITY_PRODUCTION_VERIFIED') {
    errors.push(`${id}:${name}:FAKE_PRODUCTION`);
  }
}

export function checkQualityCoverage(options = {}) {
  const subjects = options.subjects || QUALITY_SUBJECTS;
  const scope = options.productScope || loadProductScope();
  const journeys = options.journeys || CRITICAL_JOURNEYS;
  const rules = options.rules || BUSINESS_RULES;
  const debt = options.debt || QUALITY_DEBT;
  const dead = options.dead || [];
  const imports = options.imports === undefined ? scanArchitectureImports(options.root || root) : options.imports;
  const edges = options.edges === undefined ? workspaceEdges(options.root || root) : options.edges;
  const debug = options.debug === undefined ? scanStrayDebug(options.root || root) : options.debug;
  const errors = [];
  const byId = new Map(subjects.map((item) => [item.id, item]));
  for (const id of requiredQualityIds(scope)) {
    const subject = byId.get(id);
    if (!subject) {
      errors.push(`UNCLASSIFIED:${id}`);
      continue;
    }
    for (const name of QUALITY_CLASSES) validateCell(id, name, subject.classes?.[name], errors);
  }
  for (const item of journeys) {
    if (!item.requirement || !item.workflow || !item.capability) errors.push(`ORPHAN_JOURNEY:${item.id}`);
    if (item.runtimeReady === true && item.e2e !== 'REQUIRED') errors.push(`RUNTIME_JOURNEY_WITHOUT_E2E:${item.id}`);
    if (item.claimsUiE2e === true && item.transport === 'api') errors.push(`API_CALL_IS_NOT_UI_E2E:${item.id}`);
  }
  const duplicates = semanticDuplication(rules);
  for (const id of duplicates) errors.push(`SEMANTIC_DUPLICATION:${id}`);
  for (const cycle of dependencyCycles(edges)) errors.push(`DEPENDENCY_CYCLE:${cycle}`);
  for (const violation of imports) errors.push(`FORBIDDEN_IMPORT:${violation}`);
  for (const item of deadCodeFindings(dead)) errors.push(`DEAD_CODE:${item.id}`);
  for (const finding of debug) {
    const tracked = debt.some((item) => item.evidence?.includes(finding));
    if (!tracked) errors.push(`UNTRACKED_CODE_HEALTH:${finding}`);
  }
  for (const item of debt) {
    if (!item.id || !item.evidence || !item.location || !item.capability || !item.remediation || !item.executablePath) {
      errors.push(`DEBT_WITHOUT_PATH:${item.id || 'unknown'}`);
    }
    if (item.safeRemediable === true && (item.severity === 'CRITICAL' || item.severity === 'HIGH')) {
      errors.push(`SAFE_REMEDIABLE_DEBT:${item.id}`);
    }
  }
  const runtimeReady = journeys.filter((item) => item.runtimeReady === true);
  const missingE2e = runtimeReady.filter((item) => item.e2e !== 'REQUIRED');
  return {
    ok: errors.length === 0,
    errors,
    summary: {
      binding: requiredQualityIds(scope).length,
      classified: requiredQualityIds(scope).filter((id) => byId.has(id)).length,
      unknown: errors.filter((error) => error.endsWith(':UNKNOWN') || error.startsWith('UNCLASSIFIED:')).length,
      journeys: journeys.length,
      runtimeReadyJourneys: runtimeReady.length,
      runtimeReadyMissingE2e: missingE2e.length,
      semanticDuplication: duplicates.length,
      forbiddenImports: imports.length,
      deadCode: deadCodeFindings(dead).length,
      debt: debt.length,
      secondStore: false,
      e2e: E2E_FOUNDATION.levels,
      productionExists: PRODUCTION_EXISTS,
    },
  };
}
