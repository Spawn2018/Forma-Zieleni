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
import { requirements } from './registry.mjs';

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
  ['ADMIN', () => surfaceProfile('ADMIN-CRM-FILE')],
  ['LEAD', () => domainProfile('ADMIN-CRM-LEAD')],
  ['OPPORTUNITY', () => domainProfile('ADMIN-CRM-OPPORTUNITY')],
  ['OFFER', () => domainProfile('ADMIN-CRM-OFFER')],
  ['CONTRACT', () => domainProfile('ADMIN-CRM-CONTRACT')],
  ['SIGNING', () => providerProfile('FZ-SIGN-1')],
  ['PAYMENT', () => providerProfile('PAY-DOMAIN-NEUTRAL')],
  ['PROJECT', () => domainProfile('ADMIN-CRM-PROJECT and PORTAL-PROJECT-PROJECTION; browser journey waits')],
  ['MOBILE', () => futureProfile('MOBILE-ANDROID-FOUNDATION or MOBILE-IOS-FOUNDATION', true)],
  ['ANDROID', () => futureProfile('MOBILE-ANDROID-FOUNDATION', true)],
  ['IOS', () => futureProfile('MOBILE-IOS-FOUNDATION', true)],
  ['GARDENOS', () => futureProfile('GARDENOS-DOMAIN')],
  ['SITEINTEL', () => domainProfile('SITEINTEL-RULES')],
  ['ATLAS', () => futureProfile('ATLAS-PLANT-IDENTITY')],
  ['SKETCHUP', () => domainProfile('SKETCHUP-PROJECT-MAP')],
  ['PXI', () => domainProfile('PXI-SIGNAL-MODEL')],
  ['GROWTH', () => futureProfile('growth measurement stays production-gated')],
  ['CONNECTED', () => futureProfile('connected knowledge must not override canonical truth')],
  ['CMS', () => domainProfile('CMS public projection')],
  ['SEARCH', () => domainProfile('search intelligence stays non-authoritative over Canon')],
  ['MEDIA', () => domainProfile('media pipeline tests')],
  ['FILES', () => domainProfile('ADMIN-CRM-FILE and PORTAL-FILE-PROJECTION')],
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
  journey('lead-opportunity-create', 'OPPORTUNITY', 'FZ-REQ-ADMIN-006', 'opportunity-create', 'ADMIN-CRM-OPPORTUNITY'),
  journey('opportunity-offer', 'OFFER', 'FZ-REQ-CRM-OFFER-001', 'offer-issue', 'ADMIN-CRM-OFFER'),
  journey('offer-portal', 'PORTAL', 'FZ-REQ-PORTAL-002', 'portal-offer', 'PORTAL-OFFER acceptance'),
  journey('offer-contract', 'CONTRACT', 'FZ-REQ-CRM-CONTRACT-001', 'contract-open', 'ADMIN-CRM-CONTRACT'),
  journey('contract-project', 'PROJECT', 'FZ-REQ-ADMIN-005', 'project-create', 'ADMIN-CRM-PROJECT'),
  journey('project-file', 'FILES', 'FZ-REQ-ADMIN-007', 'file-metadata', 'ADMIN-CRM-FILE'),
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
  { id: 'authz', owner: 'packages/domain', markers: ['decideDraftRead', 'canSee'] },
  { id: 'offer-lifecycle', owner: 'packages/domain', markers: ['createOffer'] },
  { id: 'portal-visibility', owner: 'packages/domain', markers: ['projectOfferForPortal'] },
  { id: 'lead-qualify', owner: 'packages/domain', markers: ['qualifyLead'] },
  { id: 'contract-lifecycle', owner: 'packages/domain', markers: ['createContract'] },
  { id: 'project-activation', owner: 'packages/domain', markers: ['createProject'] },
  { id: 'client-visibility', owner: 'packages/domain', markers: ['projectProjectForPortal'] },
  { id: 'plant-identity', owner: 'packages/domain', markers: ['assertAtlasDoesNotAuthorizeAdvice'] },
  { id: 'garden-os', owner: 'packages/domain', markers: ['assertGardenOsNotTwin'] },
  { id: 'site-intelligence', owner: 'packages/domain', markers: ['assertSiteIntelligenceOrdering'] },
  { id: 'connected-knowledge', owner: 'packages/domain', markers: ['fieldOwner', 'assertProjectionCannotOwn'] },
]);

const DEBUG_LOOP_FIELDS = Object.freeze([
  'failure', 'reproducer', 'rootCause', 'blastRadius', 'fix', 'regression', 'effect', 'durableControl',
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

export function normalizeComparableSource(text) {
  const source = String(text);
  let out = '';
  let quote = null;
  let atLineStart = true;
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (quote) {
      out += ch;
      atLineStart = ch === '\n';
      if (ch === '\\') {
        const next = source[i + 1];
        if (next !== undefined) {
          out += next;
          i += 1;
          atLineStart = next === '\n';
        }
      } else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      out += ch;
      atLineStart = false;
      continue;
    }
    if (atLineStart && (ch === ' ' || ch === '\t')) continue;
    out += ch;
    atLineStart = ch === '\n';
  }
  return out.trim();
}

export function syntacticDuplicates(files = []) {
  const groups = new Map();
  for (const file of files) {
    const text = normalizeComparableSource(file.text);
    if (text.length < 120) continue;
    if (!groups.has(text)) groups.set(text, []);
    groups.get(text).push(file.path);
  }
  return [...groups.values()].filter((group) => group.length > 1);
}

function ignoredSyntacticPath(relative) {
  return relative.includes('/.react-router/')
    || relative.endsWith('/vite.config.ts')
    || relative.endsWith('/app/routes.ts');
}

export function scanSyntacticDuplicates(scanRoot = root) {
  const files = [];
  for (const dir of ['apps', 'packages']) {
    for (const file of walkSources(path.join(scanRoot, dir))) {
      if (/\.(test|spec)\./.test(file)) continue;
      const relative = path.relative(scanRoot, file).replace(/\\/g, '/');
      if (ignoredSyntacticPath(relative)) continue;
      files.push({ path: relative, text: readFileSync(file, 'utf8') });
    }
  }
  return syntacticDuplicates(files);
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

export function semanticOwnershipViolations(files = [], rules = BUSINESS_RULES) {
  const violations = [];
  for (const rule of rules) {
    const owner = `${String(rule.owner || '').replace(/\\/g, '/').replace(/\/$/, '')}/`;
    for (const marker of rule.markers || []) {
      const pattern = new RegExp(`export\\s+(?:async\\s+)?function\\s+${marker}\\b`);
      for (const file of files) {
        const relative = String(file.path || '').replace(/\\/g, '/');
        if (/\.(test|spec)\./.test(relative) || relative.startsWith(owner)) continue;
        if (pattern.test(file.text || '')) violations.push(`${rule.id}:${relative}:${marker}`);
      }
    }
  }
  return violations;
}

export function isGeneratedOrDependencyPath(relative) {
  return String(relative || '').replace(/\\/g, '/').split('/').some((part) => (
    part === 'node_modules' || part === 'dist' || part === 'build' || part === '.react-router'
  ));
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

export function cleanupPreservesBehavior(change = {}) {
  if (change.kind !== 'cleanup') return { ok: true, reason: 'not-cleanup' };
  if (change.characterized !== true) return { ok: false, reason: 'uncharacterized-cleanup' };
  if (change.behaviorChanged === true && change.contractApproved !== true) {
    return { ok: false, reason: 'behavior-changing-cleanup' };
  }
  return { ok: true, reason: 'characterized' };
}

export function debugLoopAccepted(record = {}) {
  if (record.kind !== 'fix') return { ok: true, reason: 'not-a-fix' };
  const missing = DEBUG_LOOP_FIELDS.filter((key) => !record[key]);
  if (missing.length) return { ok: false, reason: `missing:${missing.join(',')}` };
  return { ok: true, reason: 'closed' };
}

export function unusedDependencyFindings(packages = []) {
  const findings = [];
  for (const pkg of packages) {
    const source = pkg.source || '';
    for (const dep of pkg.dependencies || []) {
      if (!source.includes(dep)) findings.push(`${pkg.name}:${dep}`);
    }
    for (const dep of pkg.devDependencies || []) {
      if (dep === 'typescript' || dep.startsWith('@types/')) continue;
      if (!source.includes(dep)) findings.push(`${pkg.name}:${dep}`);
    }
  }
  return findings;
}

export function staleFeatureFlags(files = []) {
  const defined = new Map();
  const used = new Set();
  for (const file of files) {
    const relative = String(file.path || '').replace(/\\/g, '/');
    if (/\.(test|spec)\./.test(relative)) continue;
    for (const match of String(file.text || '').matchAll(/defineFeatureFlag\(\s*['"]([^'"]+)['"]/g)) {
      if (!defined.has(match[1])) defined.set(match[1], relative);
    }
    for (const match of String(file.text || '').matchAll(/featureFlag\(\s*['"]([^'"]+)['"]/g)) used.add(match[1]);
  }
  return [...defined].filter(([name]) => !used.has(name)).map(([name, file]) => `${file}:${name}`);
}

export function queryHazards(text = '') {
  const source = String(text);
  const findings = [];
  if (/for\s*\(\s*const\s+\w+\s+of\b[\s\S]{0,500}?selectFrom\(/.test(source)) findings.push('n-plus-one');
  for (const match of source.matchAll(/async\s+(list[A-Za-z0-9]+)\s*\([^)]*\)\s*(?::\s*[^{]+)?\{/g)) {
    const start = match.index + match[0].length;
    let depth = 1;
    let end = start;
    for (; end < source.length && depth > 0; end += 1) {
      if (source[end] === '{') depth += 1;
      else if (source[end] === '}') depth -= 1;
    }
    const body = source.slice(start, end);
    if (body.includes('selectFrom(') && !body.includes('.limit(')) findings.push(`unbounded:${match[1]}`);
  }
  return findings;
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
    if (isGeneratedOrDependencyPath(name)) continue;
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

export function importSpecifiers(text) {
  const specs = [];
  const pattern = /(?:from|import|require)\s*\(?\s*['"]([^'"]+)['"]/g;
  for (const match of String(text).matchAll(pattern)) specs.push(match[1]);
  return specs;
}

export function scanArchitectureImports(scanRoot = root) {
  const roots = ['apps', 'packages/domain'].map((dir) => path.join(scanRoot, dir));
  const violations = [];
  for (const dir of roots) {
    for (const file of walkSources(dir)) {
      const relative = path.relative(scanRoot, file).replace(/\\/g, '/');
      const text = readFileSync(file, 'utf8');
      for (const specifier of importSpecifiers(text)) {
        const reason = forbiddenImport(relative, specifier);
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
      if (/\bconsole\.(debug|trace)\b/.test(text)) findings.push(`${relative}:debug`);
      if (/\b(TODO|FIXME)\b/.test(text)) findings.push(`${relative}:todo`);
    }
  }
  return findings;
}

function productSources(scanRoot) {
  const files = [];
  for (const dir of ['apps', 'packages']) {
    for (const file of walkSources(path.join(scanRoot, dir))) {
      const relative = path.relative(scanRoot, file).replace(/\\/g, '/');
      if (isGeneratedOrDependencyPath(relative)) continue;
      files.push({ path: relative, text: readFileSync(file, 'utf8') });
    }
  }
  return files;
}

function protectedProductPaths() {
  const protectedPaths = new Set();
  for (const item of requirements()) {
    for (const value of [item.implementation, item.test, item.architecture]) {
      if (typeof value === 'string' && value.includes('/')) protectedPaths.add(value.replace(/\\/g, '/'));
    }
  }
  return protectedPaths;
}

function packageMeta(scanRoot, relative) {
  const [group, name] = relative.split('/');
  try {
    return JSON.parse(readFileSync(path.join(scanRoot, group, name, 'package.json'), 'utf8'));
  } catch {
    return {};
  }
}

function productEntry(relative, text, meta, protectedPaths) {
  if (/\.(test|spec)\./.test(relative)) return true;
  if (relative.includes('/routes/')) return true;
  if (/\/(entry\.server\.tsx|root\.tsx|vite\.config\.ts|react-router\.config\.ts|routes\.ts)$/.test(relative)) return true;
  if (/\/index\.(ts|mjs|js)$/.test(relative)) return true;
  if (text.includes('quality-protect: future-binding')) return true;
  if (protectedPaths.has(relative)) return true;
  const scripts = JSON.stringify(meta.scripts || {});
  if (scripts.includes(path.posix.basename(relative))) return true;
  const exportsText = JSON.stringify(meta.exports || {});
  const tail = relative.split('/').slice(2).join('/');
  return Boolean(tail) && exportsText.includes(tail);
}

export function deadProductFiles(files = [], protectedPaths = new Set()) {
  const imported = new Set();
  const byPath = new Map(files.map((file) => [file.path, file.text || '']));
  for (const file of files) {
    const dir = path.posix.dirname(file.path);
    for (const match of String(file.text || '').matchAll(/(?:from|import)\s*(?:\(\s*)?['"](\.[^'"]+)['"]/g)) {
      const base = path.posix.normalize(path.posix.join(dir, match[1]));
      for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}.mjs`, `${base}.js`, `${base}/index.ts`, `${base}/index.mjs`]) {
        if (byPath.has(candidate)) imported.add(candidate);
      }
    }
  }
  return files.filter((file) => {
    if (imported.has(file.path)) return false;
    return !productEntry(file.path, file.text || '', file.meta || {}, protectedPaths);
  }).map((file) => file.path);
}

export function scanSemanticOwnership(scanRoot = root) {
  return semanticOwnershipViolations(productSources(scanRoot));
}

export function scanDeadProductFiles(scanRoot = root) {
  const metaCache = new Map();
  const files = productSources(scanRoot).map((file) => {
    const key = file.path.split('/').slice(0, 2).join('/');
    if (!metaCache.has(key)) metaCache.set(key, packageMeta(scanRoot, file.path));
    return { ...file, meta: metaCache.get(key) };
  });
  return deadProductFiles(files, protectedProductPaths())
    .filter((file) => !/\.(test|spec)\./.test(file));
}

export function scanUnusedDependencies(scanRoot = root) {
  const packages = [];
  for (const group of ['apps', 'packages']) {
    let names = [];
    try {
      names = readdirSync(path.join(scanRoot, group));
    } catch {
      continue;
    }
    for (const name of names) {
      const dir = path.join(scanRoot, group, name);
      let pkg;
      try {
        pkg = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'));
      } catch {
        continue;
      }
      const source = walkSources(dir).map((file) => readFileSync(file, 'utf8')).join('\n');
      packages.push({
        name: pkg.name,
        dependencies: Object.keys(pkg.dependencies || {}),
        devDependencies: Object.keys(pkg.devDependencies || {}),
        source: `${source}\n${JSON.stringify(pkg.scripts || {})}`,
      });
    }
  }
  return unusedDependencyFindings(packages);
}

export function scanStaleFeatureFlags(scanRoot = root) {
  return staleFeatureFlags(productSources(scanRoot));
}

export function scanQueryHazards(scanRoot = root) {
  const findings = [];
  for (const file of walkSources(path.join(scanRoot, 'apps', 'api'))) {
    const relative = path.relative(scanRoot, file).replace(/\\/g, '/');
    if (/\.(test|spec)\./.test(relative) || isGeneratedOrDependencyPath(relative)) continue;
    for (const hazard of queryHazards(readFileSync(file, 'utf8'))) findings.push(`${relative}:${hazard}`);
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
  const scanRoot = options.root || root;
  const duplicates = semanticDuplication(rules);
  const ownership = options.ownership === undefined ? scanSemanticOwnership(scanRoot) : options.ownership;
  const clones = options.clones === undefined ? scanSyntacticDuplicates(scanRoot) : options.clones;
  const deadFiles = options.deadFiles === undefined ? scanDeadProductFiles(scanRoot) : options.deadFiles;
  const unusedDeps = options.unusedDependencies === undefined ? scanUnusedDependencies(scanRoot) : options.unusedDependencies;
  const flags = options.featureFlags === undefined ? scanStaleFeatureFlags(scanRoot) : options.featureFlags;
  const queries = options.queries === undefined ? scanQueryHazards(scanRoot) : options.queries;
  for (const id of duplicates) errors.push(`SEMANTIC_DUPLICATION:${id}`);
  for (const item of ownership) errors.push(`SEMANTIC_OWNERSHIP:${item}`);
  for (const group of clones) errors.push(`SYNTACTIC_DUPLICATION:${group.join('|')}`);
  for (const file of deadFiles) errors.push(`DEAD_FILE:${file}`);
  for (const dep of unusedDeps) errors.push(`UNUSED_DEPENDENCY:${dep}`);
  for (const flag of flags) errors.push(`STALE_FEATURE_FLAG:${flag}`);
  for (const hazard of queries) errors.push(`QUERY_HAZARD:${hazard}`);
  for (const cleanup of options.cleanups || []) {
    const result = cleanupPreservesBehavior(cleanup);
    if (!result.ok) errors.push(`BEHAVIOR_CHANGING_CLEANUP:${cleanup.id || result.reason}`);
  }
  if (options.repair && !debugLoopAccepted(options.repair).ok) errors.push('REPAIR_WITHOUT_ROOT_CAUSE');
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
      syntacticDuplication: clones.length,
      semanticOwnership: ownership.length,
      forbiddenImports: imports.length,
      deadCode: deadCodeFindings(dead).length,
      deadFiles: deadFiles.length,
      unusedDependencies: unusedDeps.length,
      staleFeatureFlags: flags.length,
      queryHazards: queries.length,
      debt: debt.length,
      secondStore: false,
      e2e: E2E_FOUNDATION.levels,
      productionExists: PRODUCTION_EXISTS,
    },
  };
}
