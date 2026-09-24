const DEPTHS = ['DOCUMENTED', 'CONTRACTED', 'IMPLEMENTED', 'INTEGRATED', 'TESTED', 'OPERATIONAL', 'MEASURED'];

const CONNECTED = 'docs/architecture/FZ-CONNECTED-ECOSYSTEM.md';
const GROWTH = 'docs/architecture/FZ-GROWTH-OS.md';
const CURRENT = 'docs/architecture/CURRENT-ARCHITECTURE.md';
const CIS = 'docs/architecture/FZ-CONTINUOUS-IMPROVEMENT.md';
const SEARCH = 'docs/architecture/FZ-SEARCH-1.md';
const SLICES = 'docs/architecture/NEXT-SLICES-CMS.md';
const CODE = 'packages/domain/src/connected.ts';
const PLAN = 'packages/domain/src/growth.ts';
const TEST = 'packages/domain/ecosystem.test.mjs';
const API = 'apps/api/src/app.ts';
const HTTP = 'apps/api/src/http.test.mjs';

const rows = [];

function row(id, description, status, actual, max, architecture, implementation, test, dependency, gate, gap, extras = {}) {
  rows.push({
    id,
    description,
    status,
    actualDepth: actual,
    maxDepth: max,
    architecture,
    implementation,
    integration: implementation,
    test,
    dependency: dependency || '',
    gate: gate || 'NONE',
    gap: gap || '',
    executableSlice: extras.executableSlice || '',
    executableWhenComplete: extras.executableWhenComplete || [],
    blockerClass: extras.blockerClass || '',
    productCapability: extras.productCapability || '',
    depth: extras.depth || '',
    foundationOnly: extras.foundationOnly === true,
    safePreblockerWork: extras.safePreblockerWork !== false,
  });
}

const tested = (id, description, architecture = CONNECTED, implementation = CODE) =>
  row(id, description, 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', architecture, implementation, TEST, '', 'NONE', '');

tested('FZ-REQ-CONNECT-001', 'One canonical owner. A projection cannot own a fact.');
tested('FZ-REQ-CONNECT-002', 'Typed relations are stored once and the inverse is derived.');
tested('FZ-REQ-CONNECT-003', 'Provenance, value class and human lock are carried on fields.');
tested('FZ-REQ-CONNECT-004', 'Private customer scope is not traversable by another customer or the public.');
tested('FZ-REQ-CONNECT-005', 'Concept and illustrative projects cannot be projected as realizations.');
tested('FZ-REQ-CONNECT-006', 'Connectivity inventory has a state and a reason for every listed surface.');
tested('FZ-REQ-APPROVAL-001', 'Agnieszka can edit, partially approve, approve, reject and defer.');
tested('FZ-REQ-APPROVAL-002', 'AI cannot overwrite a human-locked semantic field.');
tested('FZ-REQ-APPROVAL-003', 'Stale proposals and conflicting proposals do not apply.');
tested('FZ-REQ-APPROVAL-004', 'Impact preview lists affected entities and surfaces before apply.');
tested('FZ-REQ-APPROVAL-005', 'Deterministic approval updates the owner. Semantic prose stays a proposal.');
tested('FZ-REQ-APPROVAL-006', 'Outbox delivery is idempotent and a causation cycle is refused.');
tested('FZ-REQ-APPROVAL-007', 'Agnieszka cannot override Owner, dangerous, spend, price or live publication gates.');
tested('FZ-REQ-APPROVAL-008', 'A reviewer correction becomes a learning signal and does not remove future review.');
tested('FZ-REQ-APPROVAL-009', 'External text cannot write Canon or become a command.');
tested('FZ-REQ-PROJECT-001', 'REAL, CONCEPT and ILLUSTRATIVE projects are distinct machine classes.', CONNECTED, CODE);
tested('FZ-REQ-PROJECTGROWTH-001', 'A verified real project proposes content candidates and does not publish them.', GROWTH, PLAN);
tested('FZ-REQ-PROJECTGROWTH-002', 'Private facts and missing rights do not become marketing content.', GROWTH, PLAN);
tested('FZ-REQ-PROJECTGROWTH-003', 'The system rejects an invented or private project fact on the public path.', GROWTH, PLAN);
row('FZ-REQ-ATLAS-001', 'Botanical sources are taxonomic authorities, not horticultural proof.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', GROWTH, PLAN, TEST, '', 'NONE', 'Foundation depth only. Runtime atlas UI stays a separate requirement.', {
  productCapability: 'ATLAS',
  foundationOnly: true,
});
tested('FZ-REQ-GROWTH-001', 'Goal, budget ceiling and horizon compile a versioned synthetic plan.', GROWTH, PLAN);
tested('FZ-REQ-GROWTH-002', 'The plan includes articles, prompts, a concept brief, channels, an experiment and measurement.', GROWTH, PLAN);
tested('FZ-REQ-GROWTH-003', 'Budget allocations sum to the ceiling and do not authorize spend.', GROWTH, PLAN);
tested('FZ-REQ-GROWTH-004', 'The simulator returns NOT_ENOUGH_DATA and no point forecast.', GROWTH, PLAN);
row('FZ-REQ-GROWTH-005', 'The plan route is capability-gated and refuses a spend flag.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', GROWTH, API, HTTP, '', 'NONE', '');
tested('FZ-REQ-MKTEXEC-001', 'An approved plan compiles a work graph with real dependencies.', GROWTH, PLAN);
tested('FZ-REQ-MKTEXEC-002', 'A downstream task cannot become ready before its blocking dependency.', GROWTH, PLAN);
tested('FZ-REQ-MKTEXEC-003', 'The graph coordinates article, prompt, Agnieszka approval, palette, Atlas, visualization, portfolio, creative, social, landing, experiment and measurement.', GROWTH, PLAN);
tested('FZ-REQ-MKTEXEC-004', 'A marketing plan does not authorize publication or spend.', GROWTH, PLAN);
tested('FZ-REQ-MARKETING-001', 'Channel evaluation may return DO_NOT_USE, including paid media.', GROWTH, PLAN);
tested('FZ-REQ-MARKETING-002', 'Brand and activation are both present without a fixed 60/40 rule.', GROWTH, PLAN);
tested('FZ-REQ-CONTENT-001', 'Article length is a range from character and evidence burden, not a magic word count.', GROWTH, PLAN);
tested('FZ-REQ-CONTENT-002', 'Same-topic overlap updates. Date-only freshness is rejected.', GROWTH, PLAN);
tested('FZ-REQ-PERPLEXITY-001', 'An article character produces a prompt that forbids invented sources.', GROWTH, PLAN);
tested('FZ-REQ-PERPLEXITY-002', 'A claim without a source stays UNCERTAIN.', GROWTH, PLAN);
tested('FZ-REQ-CREATIVE-001', 'Platform specs stay UNVERIFIED until a dated official source exists. Fatigue has no universal threshold.', GROWTH, PLAN);
tested('FZ-REQ-EXPERIENCE-001', 'Behavior events reject name, email, phone, address and message. They are not conclusions.', GROWTH, PLAN);
tested('FZ-REQ-EXPERIENCE-002', 'Session replay is off and cannot be enabled by this module.', GROWTH, PLAN);
tested('FZ-REQ-CRM-001', 'Qualified path outranks raw lead volume when both numbers exist.', GROWTH, PLAN);
row('FZ-REQ-CRM-OFFER-001', 'Offer is a first-class Core API domain object created from an Opportunity.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', CURRENT, 'packages/domain/src/offer.ts', 'packages/domain/offer.test.mjs', '', 'NONE', 'Staff create/list/get only. Portal projection and Admin UI stay later.', {
  productCapability: 'OFFER',
  executableSlice: 'CRM-OFFER-CONTRACT',
  executableWhenComplete: ['CRM-OPPORTUNITY-CONTRACT'],
});
row('FZ-REQ-CRM-CONTRACT-001', 'Contract is a first-class Core API domain object created from an Offer without a signing provider.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', CURRENT, 'packages/domain/src/contract.ts', 'packages/domain/contract.test.mjs', '', 'NONE', 'FZ-SIGN-1 provider stays UNDECIDED.', {
  productCapability: 'CONTRACT',
  executableSlice: 'CRM-CONTRACT-DOMAIN',
  executableWhenComplete: ['CRM-OFFER-CONTRACT'],
});
tested('FZ-REQ-OFFERINTEL-001', 'Marketing code cannot change price or commercial terms.', GROWTH, PLAN);
tested('FZ-REQ-OFFERLEARN-001', 'A rejected offer records hypotheses, including price, and does not change the price.', GROWTH, PLAN);
tested('FZ-REQ-INTEGRATION-001', 'The integration registry refuses live mutation. Providers stay discovered or planned.', GROWTH, PLAN);
tested('FZ-REQ-OPS-001', 'Operations domains are not DORA metrics and are not measured yet.', GROWTH, PLAN);
row('FZ-REQ-DORA-001', 'DORA stays five software-delivery metrics. No score and no certification.', 'DONE_AT_MAX_DEPTH', 'DOCUMENTED', 'DOCUMENTED', 'docs/engineering/DORA-MEASUREMENT.md', 'docs/engineering/DORA-MEASUREMENT.md', 'docs/engineering/DORA-MEASUREMENT.md', '', 'NONE', 'No production series. Numbers stay NOT MEASURABLE.');
row('FZ-REQ-DORA-002', 'Production DORA numbers are not measurable until deployment events exist.', 'NOT_MEASURABLE_YET', 'DOCUMENTED', 'DOCUMENTED', 'docs/engineering/DORA-MEASUREMENT.md', 'docs/engineering/DORA-MEASUREMENT.md', 'docs/engineering/DORA-MEASUREMENT.md', 'no production deployments', 'NONE', 'NOT MEASURABLE', {
  blockerClass: 'PRODUCTION_ONLY',
  safePreblockerWork: false,
});
row('FZ-REQ-CIS-001', 'FZ-CIS remains the only learning system. External text cannot edit Canon.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', CIS, 'scripts/fz-cis/policy.mjs', 'scripts/fz-cis/policy.test.mjs', '', 'NONE', '');
row('FZ-REQ-CIS-002', 'Reviewer corrections are signals. They do not auto-promote or remove review.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', CIS, CODE, TEST, '', 'NONE', '');
row('FZ-REQ-AUTO-001', '/noc uses the next Europe/Warsaw hour. 9 means 09:00.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', 'docs/cursor-os/CURSOR-OS-2026.md', 'scripts/fz-noc/policy.mjs', 'scripts/fz-noc/policy.test.mjs', '', 'NONE', '');
row('FZ-REQ-AUTO-002', 'The orchestrator uses one execution loop and does not resolve Owner gates.', 'DONE_AT_MAX_DEPTH', 'DOCUMENTED', 'DOCUMENTED', '.cursor/agents/fz-orchestrator.md', '.cursor/agents/fz-orchestrator.md', '.cursor/agents/fz-orchestrator.md', '', 'NONE', 'Agent text is the control. No second loop was added.');
row('FZ-REQ-GOV-001', 'Owner authority stays above Canon, the orchestrator and tools.', 'DONE_AT_MAX_DEPTH', 'DOCUMENTED', 'DOCUMENTED', 'docs/workflows/DECISION-GATES.md', 'docs/workflows/DECISION-GATES.md', 'docs/workflows/DECISION-GATES.md', '', 'NONE', '');
row('FZ-REQ-GOV-002', 'FZ-SIGN-1 provider remains undecided.', 'OWNER_GATED', 'DOCUMENTED', 'DOCUMENTED', 'docs/architecture/FZ-SIGN-1-CONTRACT-LIFECYCLE.md', 'docs/architecture/OWNER-DECISION-PACKET-FZ-SIGN-1.md', 'docs/architecture/OWNER-DECISION-PACKET-FZ-SIGN-1.md', 'Owner selection', 'OWNER-DECISION', 'UNDECIDED', {
  blockerClass: 'OWNER_GATED',
  safePreblockerWork: false,
});
row('FZ-REQ-SEARCH-001', 'FZ-SEARCH-1 remains the search architecture. No universal AI rank or GEO score.', 'DONE_AT_MAX_DEPTH', 'DOCUMENTED', 'DOCUMENTED', SEARCH, SEARCH, 'contracts/content-contract.test.mjs', '', 'NONE', 'Connector runtime is a later slice, not this foundation.');
row('FZ-REQ-SEARCH-002', 'FZ-SEARCH-CRAWL-1 training-crawler policy stays open.', 'OWNER_GATED', 'DOCUMENTED', 'DOCUMENTED', 'docs/architecture/OWNER-DECISION-PACKET-FZ-SEARCH-CRAWL-1.md', 'docs/architecture/OWNER-DECISION-PACKET-FZ-SEARCH-CRAWL-1.md', 'docs/architecture/OWNER-DECISION-PACKET-FZ-SEARCH-CRAWL-1.md', 'Owner policy', 'OWNER-DECISION', 'OPEN', {
  blockerClass: 'OWNER_GATED',
  safePreblockerWork: false,
});
row('FZ-REQ-CMS-001', 'Apostrophe, vendor-native editing and the FZ media pipeline stay the CMS decision. CMS-ACCEPT stays open.', 'BLOCKED_BY_DEPENDENCY', 'DOCUMENTED', 'DOCUMENTED', 'docs/architecture/OWNER-DECISION-PACKET-FZ-CMS-1.md', SLICES, 'scripts/cms-lab-gate.mjs', 'Apostrophe Admin UI and PostgreSQL lab not executed', 'REVIEW', 'CMS-ACCEPT OPEN', {
  blockerClass: 'VENDOR_ACCEPTANCE',
  executableSlice: 'CMS-ACCEPT',
  safePreblockerWork: false,
});
row('FZ-REQ-CMS-002', 'Published content stays a projection. Drafts stay private.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', CURRENT, 'packages/domain/src/content-publish.ts', 'packages/domain/content-publish.test.mjs', '', 'NONE', '');
row('FZ-REQ-MEDIA-001', 'Private checksummed masters and public derivatives without GPS stay the media contract.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', SLICES, 'packages/media/src/derivatives.mjs', 'packages/media/derivatives.test.mjs', '', 'NONE', 'The public gallery route exists and stays empty until a published collection.');
row('FZ-REQ-ARCH-001', 'Gate A stays Hono, PostgreSQL, Kysely, outbox, Better Auth, local files, later Garage, OpenObserve, SOPS+age, restic, pgBackRest, Cloudflare Tunnel, Compose later, no overlay.', 'DONE_AT_MAX_DEPTH', 'DOCUMENTED', 'DOCUMENTED', CURRENT, CURRENT, CURRENT, '', 'NONE', 'Production hosting and object storage remain undecided.');
row('FZ-REQ-ARCH-002', 'No graph database, Prisma, Drizzle or Kafka is introduced by this foundation.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', CONNECTED, 'package.json', 'scripts/requirements/registry.test.mjs', '', 'NONE', '');
row('FZ-REQ-API-001', 'Core API remains the business authority.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', CURRENT, API, HTTP, '', 'NONE', '');
row('FZ-REQ-DATA-001', 'PostgreSQL and Kysely remain persistence. New unused tables were not added.', 'DONE_AT_MAX_DEPTH', 'DOCUMENTED', 'DOCUMENTED', CURRENT, 'apps/api/src/db.ts', 'apps/api/src/postgres.integration.test.mjs', 'A shared fabric table waits for a product consumer', 'NONE', 'Domain contract is in memory, matching the content-publish precedent.');
row('FZ-REQ-SEC-001', 'The lead vertical is implemented and is not security-accepted.', 'BLOCKED_BY_DEPENDENCY', 'TESTED', 'TESTED', 'docs/architecture/NEXT-SLICE-LEAD-VERTICAL.md', 'packages/domain/src/lead.ts', 'packages/domain/lead.test.mjs', 'ZAP, Dependency-Check, offsite backup, production ingress', 'REVIEW', 'Do not mark security-accepted.', {
  blockerClass: 'SECURITY_ACCEPTANCE_ONLY',
  executableSlice: 'LEAD-SEC-ACCEPT',
  safePreblockerWork: false,
});
row('FZ-REQ-PRIV-001', 'No live customer tracking, session replay or analytics ingestion is activated.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', GROWTH, PLAN, TEST, '', 'NONE', '');
row('FZ-REQ-WWW-001', 'WWW reads a published projection and must not invent business facts.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', CURRENT, 'apps/web/app/published-home.ts', 'apps/web/app/published-home.test.mjs', '', 'NONE', 'The gallery route is empty until a published collection. Offer pages and font files are later.');
row('FZ-REQ-PORTAL-001', 'Portal customer isolation is enforced in the domain contract.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', CONNECTED, CODE, TEST, '', 'NONE', 'Foundation depth only. Auth and client projections remain separate unfinished Portal requirements.', {
  productCapability: 'PORTAL',
  foundationOnly: true,
});
row('FZ-REQ-PORTAL-002', 'Portal client Better Auth identity, session cookie and origin rules for the portal trust zone.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', CURRENT, 'apps/portal/app/session.ts', 'apps/portal/app/shell.test.mjs', '', 'NONE', 'Signed-in empty shell is not offer projection. FZ-REQ-PORTAL-003 remains open.', {
  productCapability: 'PORTAL',
  executableSlice: 'PORTAL-AUTH',
  executableWhenComplete: ['PORTAL-APP'],
});
row('FZ-REQ-PORTAL-003', 'Client-safe Offer projection through Core API authorization for the authenticated portal client.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', CURRENT, 'packages/domain/src/offer.ts', 'apps/api/src/http.test.mjs', '', 'NONE', 'No staff mutation from Portal. Price and terms stay off the projection.', {
  productCapability: 'PORTAL',
  executableSlice: 'PORTAL-OFFER-PROJECTION',
  executableWhenComplete: ['PORTAL-AUTH', 'CRM-OFFER-CONTRACT'],
});
row('FZ-REQ-PORTAL-004', 'Client-safe Project projection through Core API for the authenticated portal client.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', CURRENT, 'packages/domain/src/project.ts', 'apps/api/src/http.test.mjs', '', 'NONE', 'No staff mutation from Portal. Payment and provider stay off the projection.', {
  productCapability: 'PORTAL',
  executableSlice: 'PORTAL-PROJECT-PROJECTION',
  executableWhenComplete: ['CRM-PROJECT-DOMAIN', 'PORTAL-AUTH'],
});
row('FZ-REQ-ADMIN-001', 'Agnieszka approval UI waits until apps/admin is a real application.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', CURRENT, 'apps/admin/app/shell.ts', 'apps/admin/app/shell.test.mjs', '', 'NONE', 'Staff shell only. Domain approval actions and CRM write UI stay later.', {
  productCapability: 'ADMIN',
  executableSlice: 'ADMIN-APP',
  executableWhenComplete: ['PORTAL-APP'],
});
row('FZ-REQ-MOBILE-001', 'Android and iOS have no separate business truth.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', CURRENT, 'docs/architecture/MOBILE-CLIENT-BOUNDARY.md', 'packages/domain/product-boundaries.test.mjs', '', 'NONE', 'Executable boundary precedes runtime apps.', {
  productCapability: 'MOBILE',
  executableSlice: 'MOBILE-CLIENT-BOUNDARY',
  executableWhenComplete: ['CRM-CONTRACT-DOMAIN'],
});
row('FZ-REQ-SITEINTEL-001', 'Site Intelligence stays DATA, then RULES, then DOMAIN, then AI.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', CURRENT, 'docs/architecture/SITEINTEL-DATA-BOUNDARY.md', 'packages/domain/product-boundaries.test.mjs', '', 'NONE', 'Ordering is binding; runtime is later.', {
  productCapability: 'SITEINTEL',
  executableSlice: 'SITEINTEL-DATA-BOUNDARY',
  executableWhenComplete: ['CRM-CONTRACT-DOMAIN'],
});
row('FZ-REQ-ATLAS-002', 'Plant Atlas taxonomy and provenance stay source-of-truth boundaries before any runtime atlas UI.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', CURRENT, 'docs/architecture/ATLAS-PROVENANCE-BOUNDARY.md', 'packages/domain/atlas-boundary.test.mjs', '', 'NONE', 'FZ-REQ-ATLAS-001 foundation stays; runtime atlas UI stays later.', {
  productCapability: 'ATLAS',
  executableSlice: 'ATLAS-PROVENANCE-BOUNDARY',
  executableWhenComplete: ['CRM-CONTRACT-DOMAIN'],
});
row('FZ-REQ-GARDENOS-001', 'Garden OS is a future client relation after project delivery, not a disconnected microsystem.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', CURRENT, 'docs/architecture/GARDENOS-RELATION-BOUNDARY.md', 'packages/domain/product-boundaries.test.mjs', '', 'NONE', 'Relation boundary precedes twin runtime.', {
  productCapability: 'GARDENOS',
  executableSlice: 'GARDENOS-RELATION-BOUNDARY',
  executableWhenComplete: ['CRM-CONTRACT-DOMAIN'],
});
row('FZ-REQ-SKETCHUP-001', 'SketchUp is not the source of business truth.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', CURRENT, 'docs/architecture/SKETCHUP-ADAPTER-BOUNDARY.md', 'packages/domain/product-boundaries.test.mjs', '', 'NONE', 'Adapter boundary precedes plugin runtime.', {
  productCapability: 'SKETCHUP',
  executableSlice: 'SKETCHUP-ADAPTER-BOUNDARY',
  executableWhenComplete: ['CRM-CONTRACT-DOMAIN'],
});
row('FZ-REQ-PROJECT-002', 'Project domain foundations may be contracted after Contract without a live payment provider.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', CURRENT, 'packages/domain/src/project.ts', 'packages/domain/project.test.mjs', '', 'NONE', 'Payment provider stays OWNER-DECISION; domain modeling is safe pre-blocker work.', {
  productCapability: 'PROJECT',
  executableSlice: 'CRM-PROJECT-DOMAIN',
  executableWhenComplete: ['CRM-CONTRACT-DOMAIN'],
});
row('FZ-REQ-PAY-001', 'Payment provider remains undecided. No transaction is started.', 'OWNER_GATED', 'DOCUMENTED', 'DOCUMENTED', CURRENT, CURRENT, CURRENT, 'Owner selection', 'OWNER-DECISION', 'UNDECIDED', {
  blockerClass: 'OWNER_GATED',
  productCapability: 'PAYMENT',
  safePreblockerWork: false,
});
row('FZ-REQ-HOST-001', 'Production hosting remains undecided. No deploy, DNS or Cloudflare mutation.', 'OWNER_GATED', 'DOCUMENTED', 'DOCUMENTED', CURRENT, CURRENT, CURRENT, 'Owner selection', 'OWNER-DECISION', 'UNDECIDED', {
  blockerClass: 'OWNER_GATED',
  safePreblockerWork: false,
});
row('FZ-REQ-GOV-003', 'Project code stays all rights reserved. No repository OSS license is added.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', 'docs/engineering/requirements/RESEARCH-2026-09-21.md', 'docs/engineering/requirements/RESEARCH-2026-09-21.md', 'scripts/requirements/registry.test.mjs', '', 'NONE', '');
row('FZ-REQ-GOV-004', 'Legal facts, font files and the legacy CT8 site are not changed or invented here.', 'DONE_AT_MAX_DEPTH', 'DOCUMENTED', 'DOCUMENTED', 'docs/engineering/requirements/RESEARCH-2026-09-21.md', 'docs/engineering/requirements/RESEARCH-2026-09-21.md', 'docs/engineering/requirements/RESEARCH-2026-09-21.md', 'Re-verify before public use', 'NONE', 'NIP and font delivery were not re-fetched.');
row('FZ-REQ-EXECINTEGRITY-001', 'Material claims in this registry name an artifact. Synthetic plans are labeled synthetic.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', 'docs/engineering/requirements/FZ-MASTER-TRACEABILITY.md', 'scripts/requirements/registry.mjs', 'scripts/requirements/registry.test.mjs', '', 'NONE', '');
row('FZ-REQ-CONTEXT-001', 'Recovery reads the journal, traceability and Canon without chat history.', 'DONE_AT_MAX_DEPTH', 'DOCUMENTED', 'DOCUMENTED', 'docs/engineering/requirements/execution-journal.json', 'docs/engineering/requirements/execution-journal.json', 'scripts/requirements/registry.test.mjs', '', 'NONE', '');
row('FZ-REQ-EVIDENCE-001', 'Research limits are dated. Unfetched platform specs stay unverified.', 'DONE_AT_MAX_DEPTH', 'DOCUMENTED', 'DOCUMENTED', 'docs/engineering/requirements/RESEARCH-2026-09-21.md', 'docs/engineering/requirements/RESEARCH-2026-09-21.md', 'docs/engineering/requirements/RESEARCH-2026-09-21.md', '', 'NONE', '');
row('FZ-REQ-COMPLETION-001', 'The registry rejects a duplicate id, a missing prefix, or an actual depth below the recorded maximum.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', 'docs/engineering/requirements/FZ-MASTER-TRACEABILITY.md', 'scripts/requirements/registry.mjs', 'scripts/requirements/registry.test.mjs', '', 'NONE', '');

const DOCS = 'docs/architecture/FZ-DOCUMENTATION-OS.md';
const DOCS_CHECK = 'scripts/docs/check.test.mjs';
row('FZ-REQ-DOC-001', 'Documentation OS is subordinate Canon. Current architecture stays the entrypoint.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', DOCS, DOCS, DOCS_CHECK, '', 'NONE', '');
row('FZ-REQ-DOC-002', 'Documents link to machine truth instead of copying OpenAPI, events, and requirements.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', 'docs/engineering/API.md', 'docs/engineering/EVENTS.md', DOCS_CHECK, '', 'NONE', '');
row('FZ-REQ-DOC-003', 'Role guides match the current product. Missing Admin and CMS screens are stated.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', 'docs/DOCUMENTATION-MAP.md', 'docs/guides/agnieszka.md', DOCS_CHECK, 'apps/admin is README only', 'NONE', 'No click-path guide for a UI that does not exist.');
row('FZ-REQ-DOC-004', 'Storybook, Backstage, and a documentation site generator are not installed.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', 'docs/engineering/DOCUMENTATION-QUALITY-BASELINE.md', 'package.json', DOCS_CHECK, 'No shared UI package', 'NONE', 'Reconsider Storybook when a shared component is used by a real screen.');
row('FZ-REQ-DOCOPS-001', 'DocumentationOps is separate from the five DORA delivery metrics and has no page-count target.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', DOCS, 'docs/engineering/DOCUMENTATION-QUALITY-BASELINE.md', DOCS_CHECK, '', 'NONE', '');
row('FZ-REQ-DOCOPS-002', 'Documentation debt stays on the existing execution graph. A signal cannot promote itself to Canon.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', DOCS, 'scripts/docs/learning.mjs', DOCS_CHECK, '', 'NONE', '');
row('FZ-REQ-DOCCTX-001', 'The context map stores pointers. Recovery starts at START-HERE, not a full-tree dump.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', DOCS, 'docs/engineering/FZ-CONTEXT-MAP.json', DOCS_CHECK, '', 'NONE', '');
row('FZ-REQ-DOCQA-001', 'pnpm docs:check fails on broken pointers, drifted events, placeholders, and a numeric DORA score.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', DOCS, 'scripts/docs/check.mjs', DOCS_CHECK, '', 'NONE', '');
row('FZ-REQ-PLATFORM-001', 'Golden paths reuse Cursor OS. One writer. No internal developer portal app.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', 'docs/engineering/GOLDEN-PATHS.md', 'docs/cursor-os/CURSOR-OS-2026.md', DOCS_CHECK, '', 'NONE', '');
row('FZ-REQ-DORA-003', 'DORA capability coverage is evidenced per capability. There is no combined score.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', 'docs/engineering/DORA-CAPABILITY-COVERAGE.md', 'docs/engineering/DORA-CAPABILITY-COVERAGE.md', DOCS_CHECK, 'No production deployment series', 'NONE', 'Several capabilities stay DESIGNED or NOT MEASURABLE.');
row('FZ-REQ-DORA-004', 'AI use is classified. Customer data and secrets are prohibited in external tools. Token count is not productivity.', 'DONE_AT_MAX_DEPTH', 'DOCUMENTED', 'DOCUMENTED', 'docs/engineering/FZ-AI-USAGE-POLICY.md', 'docs/engineering/FZ-AI-USAGE-POLICY.md', DOCS_CHECK, '', 'NONE', 'Vendor privacy promises were not re-verified.');
row('FZ-REQ-DORA-005', 'Release readiness is local and reproducible. Deploy, hosting, and alert thresholds stay gated or unmeasured.', 'DONE_AT_MAX_DEPTH', 'DOCUMENTED', 'DOCUMENTED', 'docs/engineering/RELEASE-READINESS.md', 'docs/engineering/RELEASE-READINESS.md', DOCS_CHECK, 'production hosting UNDECIDED', 'OWNER-DECISION', '');
row('FZ-REQ-DORA-006', 'Value stream stages are named. Durations stay not measurable until a release clock exists.', 'NOT_MEASURABLE_YET', 'DOCUMENTED', 'DOCUMENTED', 'docs/engineering/VALUE-STREAM.md', 'docs/engineering/VALUE-STREAM.md', 'scripts/requirements/closure.test.mjs', 'no production release clock', 'NONE', 'NOT MEASURABLE', {
  blockerClass: 'PRODUCTION_ONLY',
  safePreblockerWork: false,
});
row('FZ-REQ-DORA-007', 'Data domains name an owner, a contract, and visibility. There is no data-quality score.', 'DONE_AT_MAX_DEPTH', 'DOCUMENTED', 'DOCUMENTED', 'docs/engineering/HEALTHY-DATA.md', 'docs/engineering/HEALTHY-DATA.md', 'scripts/requirements/closure.test.mjs', '', 'NONE', '');
row('FZ-REQ-DORA-008', 'A future alert needs a decision and a baseline. No numeric threshold is invented.', 'DONE_AT_MAX_DEPTH', 'DOCUMENTED', 'DOCUMENTED', 'docs/engineering/FAILURE-ALERTS.md', 'docs/engineering/FAILURE-ALERTS.md', 'scripts/requirements/closure.test.mjs', 'no production baseline', 'NONE', '');
row('FZ-REQ-DORA-009', 'Test data rejects a customer-database copy and an unlabeled marketing plan.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', 'docs/engineering/TEST-DATA-POLICY.md', 'scripts/docs/test-data.mjs', 'scripts/requirements/closure.test.mjs', '', 'NONE', '');
row('FZ-REQ-DORA-010', 'Maintainability, supply chain, and AI cost rules reject vanity scores and extra supply-chain products.', 'DONE_AT_MAX_DEPTH', 'DOCUMENTED', 'DOCUMENTED', 'docs/engineering/DORA-LAST-MILE.md', 'docs/engineering/DORA-LAST-MILE.md', 'scripts/requirements/closure.test.mjs', '', 'NONE', '');
row('FZ-REQ-COVERAGE-001', 'Every numbered directive section is classified and every normative section maps to a real requirement id.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', 'docs/engineering/requirements/FZ-DIRECTIVE-COVERAGE.json', 'scripts/requirements/closure.mjs', 'scripts/requirements/closure.test.mjs', '', 'NONE', '');
row('FZ-REQ-DOCINV-001', 'Every Markdown file under docs/ is classified. Unexplained orphans are zero.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', 'docs/engineering/requirements/FZ-DOC-INVENTORY.json', 'scripts/requirements/closure.mjs', 'scripts/requirements/closure.test.mjs', '', 'NONE', '');
row('FZ-REQ-RECOVERY-001', 'Mutation does not start when the recovery marker and HEAD disagree. The hook reminds; it cannot stop a writer who ignores it.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', 'docs/engineering/requirements/execution-journal.json', 'scripts/requirements/closure.mjs', 'scripts/requirements/closure.test.mjs', '', 'NONE', 'Cursor cannot refuse an edit solely from this marker.');

const OPEN_SLICES = [
  'WWW-APP',
  'MEDIA-COLLECTIONS', 'GALLERY-WWW', 'BEFORE-AFTER', 'CMS-SEO', 'CMS-ADMIN', 'CMS-WWW', 'CMS-HARDEN',
  'CMS-PERF', 'CMS-RESTORE', 'CMS-EXPORT', 'CMS-ACCEPT', 'SEARCH-WWW-TECHNICAL', 'SEARCH-STRUCTURED-DATA',
  'SEARCH-SITEMAP-ROBOTS', 'SEARCH-ATTRIBUTION', 'SEARCH-DATA-MODEL', 'SEARCH-CONNECTORS', 'SEARCH-SYNC',
  'SEARCH-HISTORY', 'SEARCH-TECH-AUDIT', 'SEARCH-AI-VISIBILITY', 'SEARCH-CRAWLER-INTELLIGENCE',
  'SEARCH-CONTENT-INTELLIGENCE', 'SEARCH-ADMIN', 'SEARCH-ALERTS', 'SEARCH-SECURITY', 'SEARCH-PERFORMANCE',
  'SEARCH-RECOVERY', 'SEARCH-ACCEPT', 'RETURN-ROADMAP',
];
for (const slice of OPEN_SLICES) {
  if (slice === 'WWW-APP') {
    row('FZ-REQ-CMS-SLICE-WWW-APP', 'apps/web is the React Router Framework Mode foundation already required by ADR-014 and FZ-REQ-WWW-001.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', SLICES, 'apps/web/app/root.tsx', 'apps/web/app/shell.test.mjs', '', 'NONE', 'Font files stay out until a measured OFL subset exists. No deploy.');
    continue;
  }
  if (slice === 'MEDIA-COLLECTIONS') {
    row('FZ-REQ-CMS-SLICE-MEDIA-COLLECTIONS', 'Collections reorder, set a hero, store ALT and focal data, and reuse one master.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', SLICES, 'packages/media/src/collections.mjs', 'packages/media/collections.test.mjs', '', 'NONE', 'Gallery UI is the public carousel.');
    continue;
  }
  if (slice === 'GALLERY-WWW') {
    row('FZ-REQ-CMS-SLICE-GALLERY-WWW', 'The public gallery uses derivative thumbs and a Polish keyboard lightbox. It does not invent published photos.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', SLICES, 'apps/web/app/gallery.ts', 'apps/web/app/gallery.test.mjs', '', 'NONE', 'The live route stays empty until a published collection exists.');
    continue;
  }
  if (slice === 'BEFORE-AFTER') {
    row('FZ-REQ-CMS-SLICE-BEFORE-AFTER', 'A before/after pair shares one crop mode and one frame, and the control is keyboard and pointer.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', SLICES, 'apps/web/app/before-after.ts', 'apps/web/app/before-after.test.mjs', '', 'NONE', 'The live route stays empty until a published pair exists.');
    continue;
  }
  if (slice === 'SEARCH-WWW-TECHNICAL') {
    row('FZ-REQ-CMS-SLICE-SEARCH-WWW-TECHNICAL', 'The public head is server-rendered. Non-production robots disallow indexing. Production robots is not Disallow all.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', SLICES, 'apps/web/app/technical-seo.ts', 'apps/web/app/technical-seo.test.mjs', '', 'NONE', 'Sitemap and crawler groups stay in the next slice.');
    continue;
  }
  if (slice === 'SEARCH-STRUCTURED-DATA') {
    row('FZ-REQ-CMS-SLICE-SEARCH-STRUCTURED-DATA', 'JSON-LD is a WebPage built from the visible title and description. Ratings, prices, awards, and addresses are omitted.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', SLICES, 'apps/web/app/structured-data.ts', 'apps/web/app/structured-data.test.mjs', '', 'NONE', 'No LocalBusiness until a verified address exists.');
    continue;
  }
  if (slice === 'CMS-SEO') {
    row('FZ-REQ-CMS-SLICE-CMS-SEO', 'A published slug change writes a redirect. JSON-LD has no placeholder price. Production robots is not a blanket disallow.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', SLICES, 'packages/domain/src/content-publish.ts', 'apps/web/app/cms-seo.test.mjs', '', 'NONE', 'Training-crawler groups stay absent while FZ-SEARCH-CRAWL-1 is OPEN.');
    continue;
  }
  if (slice === 'CMS-WWW') {
    row('FZ-REQ-CMS-SLICE-CMS-WWW', 'The public home keeps the last published title when a later editorial read fails. An unpublished draft is not shown.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', SLICES, 'apps/web/app/published-home.ts', 'apps/web/app/published-home.test.mjs', '', 'NONE', 'The retained title lives in the server process.');
    continue;
  }
  if (slice === 'CMS-HARDEN') {
    row('FZ-REQ-CMS-SLICE-CMS-HARDEN', 'Public HTML escapes hostile titles and omits unpublished tokens. SVG uploads are denied. Outbound URLs reject private targets. Logs redact secrets.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', SLICES, 'packages/domain/src/cms-harden.ts', 'packages/domain/cms-harden.test.mjs', 'ZAP and Dependency-Check stay deferred', 'NONE', 'pnpm audit --audit-level=moderate reported no known vulnerabilities on 2026-09-22. DNS is not resolved.');
    continue;
  }
  if (slice === 'CMS-PERF') {
    row('FZ-REQ-CMS-SLICE-CMS-PERF', 'Gallery cards use a w400.webp derivative, reserve width and height, and lazy-load every thumb after the LCP candidate.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', SLICES, 'apps/web/app/gallery.ts', 'apps/web/app/cms-perf.test.mjs', '', 'NONE', 'No numeric LCP budget. Originals stay off the cards.');
    continue;
  }
  if (slice === 'SEARCH-SITEMAP-ROBOTS') {
    row('FZ-REQ-CMS-SLICE-SEARCH-SITEMAP-ROBOTS', 'Robots and sitemap are generated from policy. Non-production disallows indexing. Production is not a blanket disallow. Training groups stay absent.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', SLICES, 'apps/web/app/technical-seo.ts', 'apps/web/app/technical-seo.test.mjs', 'Cloudflare apply stays DANGEROUS', 'NONE', 'FZ-SEARCH-CRAWL-1 remains OPEN.');
    continue;
  }
  if (slice === 'SEARCH-ATTRIBUTION') {
    row('FZ-REQ-CMS-SLICE-SEARCH-ATTRIBUTION', 'Referral sanitize keeps an unknown referrer unknown and labels only an allowlisted AI host.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', 'docs/architecture/FZ-SEARCH-1.md', 'packages/domain/src/attribution.ts', 'packages/domain/attribution.test.mjs', '', 'NONE', 'Not yet a column on the lead row.');
    continue;
  }
  if (slice === 'SEARCH-DATA-MODEL') {
    row('FZ-REQ-CMS-SLICE-SEARCH-DATA-MODEL', 'Search observations keep provenance and an idempotency key, and reject a form body.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', 'docs/architecture/FZ-SEARCH-1.md', 'packages/domain/src/search-data.ts', 'packages/domain/search-data.test.mjs', 'connector before PostgreSQL rows', 'NONE', 'No search tables until a connector writes them.');
    continue;
  }
  if (slice === 'SEARCH-CONNECTORS') {
    row('FZ-REQ-CMS-SLICE-SEARCH-CONNECTORS', 'Fixture connectors expose adapter boundaries, reject live secrets, redact tokens, and record quotas re-read that day.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', 'docs/architecture/FZ-SEARCH-1.md', 'packages/domain/src/search-connectors.ts', 'packages/domain/search-connectors.test.mjs', 'live OAuth stays DANGEROUS', 'NONE', 'No production credentials in this slice.');
    continue;
  }
  if (slice === 'SEARCH-SYNC') {
    row('FZ-REQ-CMS-SLICE-SEARCH-SYNC', 'Fixture sync job keeps per-connector checkpoints, backoff after rate limits or outages, and isolated provider failure.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', 'docs/architecture/FZ-SEARCH-1.md', 'packages/domain/src/search-sync.ts', 'packages/domain/search-sync.test.mjs', 'scheduler and PostgreSQL job rows stay later', 'NONE', 'Live OAuth and schedulers stay outside this slice.');
    continue;
  }
  if (slice === 'SEARCH-HISTORY') {
    row('FZ-REQ-CMS-SLICE-SEARCH-HISTORY', 'History windows read stored snapshots for 7/28/90/180/365 days and compare year-over-year only when both sides exist.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', 'docs/architecture/FZ-SEARCH-1.md', 'packages/domain/src/search-history.ts', 'packages/domain/search-history.test.mjs', 'PostgreSQL rollups stay later', 'NONE', 'No invented retention length.');
    continue;
  }
  if (slice === 'CMS-ADMIN') {
    row('FZ-REQ-CMS-SLICE-CMS-ADMIN', 'Bound publisher creates Service and ProjectCaseStudy without client authority or CRM writes; Apostrophe piece schemas and lab insert evidence recorded.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', 'docs/architecture/NEXT-SLICES-CMS.md', 'packages/domain/src/content-admin.ts', 'packages/domain/content-admin.test.mjs', 'Admin UI click-path is CMS-ACCEPT item B', 'NONE', 'Live Admin UI visual/UX stays deferred.');
    continue;
  }
  if (slice === 'CMS-RESTORE') {
    row('FZ-REQ-CMS-SLICE-CMS-RESTORE', 'Synthetic content and media restore returns one published ProjectCaseStudy and its master checksums. restic/pgBackRest stay later.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', 'docs/architecture/NEXT-SLICES-CMS.md', 'packages/domain/src/cms-restore.ts', 'labs/fz-cms-1/restore/cms-restore.test.mjs', 'PostgreSQL/restic horizons', 'NONE', 'No claim of off-site backup.');
    continue;
  }
  if (slice === 'SEARCH-AI-VISIBILITY') {
    row('FZ-REQ-CMS-SLICE-SEARCH-AI-VISIBILITY', 'Bing citations stay absent without an API; other AI providers stay NO_RELIABLE_MEASUREMENT; composite AI scores are rejected.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', 'docs/architecture/FZ-SEARCH-1.md', 'packages/domain/src/search-ai-visibility.ts', 'packages/domain/search-ai-visibility.test.mjs', 'Bing export importer stays later', 'NONE', 'No invented citation counts.');
    continue;
  }
  if (slice === 'SEARCH-CRAWLER-INTELLIGENCE') {
    row('FZ-REQ-CMS-SLICE-SEARCH-CRAWLER-INTELLIGENCE', 'Crawler taxonomy A–E is encoded; free-plan Cloudflare referrals stay absent; live zone mutation is refused.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', 'docs/architecture/FZ-SEARCH-1.md', 'packages/domain/src/search-crawler-intelligence.ts', 'packages/domain/search-crawler-intelligence.test.mjs', 'Cloudflare mutation stays DANGEROUS', 'NONE', 'Training tokens remain OPEN under FZ-SEARCH-CRAWL-1.');
    continue;
  }
  if (slice === 'SEARCH-RECOVERY') {
    row('FZ-REQ-CMS-SLICE-SEARCH-RECOVERY', 'Synthetic search observations restore and list rows that cannot be re-synced when retention is unknown or past a known window.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', 'docs/architecture/FZ-SEARCH-1.md', 'packages/domain/src/search-recovery.ts', 'packages/domain/search-recovery.test.mjs', 'PostgreSQL/restic stay later', 'NONE', 'Does not invent a retention length.');
    continue;
  }
  if (slice === 'SEARCH-TECH-AUDIT') {
    row('FZ-REQ-CMS-SLICE-SEARCH-TECH-AUDIT', 'Technical audit reports noindex, broken canonicals, missing alt text, and robots or sitemap problems. Recommendations do not publish.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', 'docs/architecture/FZ-SEARCH-1.md', 'packages/domain/src/search-tech-audit.ts', 'packages/domain/search-tech-audit.test.mjs', '', 'NONE', 'The audit does not write content.');
    continue;
  }
  if (slice === 'SEARCH-CONTENT-INTELLIGENCE') {
    row('FZ-REQ-CMS-SLICE-SEARCH-CONTENT-INTELLIGENCE', 'Content recommendations cite a published graph or a measured query. AI drafts stay AI-SUGGESTED. ALT text cannot invent image contents. Nothing publishes.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', 'docs/architecture/FZ-SEARCH-1.md', 'packages/domain/src/search-content-intelligence.ts', 'packages/domain/search-content-intelligence.test.mjs', '', 'NONE', 'No paid AI service and no automatic link insertion.');
    continue;
  }
  if (slice === 'SEARCH-ADMIN') {
    row('FZ-REQ-CMS-SLICE-SEARCH-ADMIN', 'Every admin metric shows definition, source, window, freshness, and evidence class. Absent citation providers stay in limitations. Attribution is not a causal claim.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', 'docs/architecture/FZ-SEARCH-1.md', 'packages/domain/src/search-admin.ts', 'packages/domain/search-admin.test.mjs', 'No operator screen', 'NONE', 'Synthetic fixture source is labeled. External rank scores stay forbidden.');
    continue;
  }
  if (slice === 'SEARCH-ALERTS') {
    row('FZ-REQ-CMS-SLICE-SEARCH-ALERTS', 'Search alerts name their signals. A single row does not page. There is no production notification channel and no numeric paging threshold.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', 'docs/architecture/FZ-SEARCH-1.md', 'packages/domain/src/search-alerts.ts', 'packages/domain/search-alerts.test.mjs', 'No pager', 'NONE', 'Quiet until a baseline and a channel exist.');
    continue;
  }
  if (slice === 'SEARCH-SECURITY') {
    row('FZ-REQ-CMS-SLICE-SEARCH-SECURITY', 'Imported search labels and URLs are sanitized, logs redact secrets, and public preview omits draft bodies.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', 'docs/architecture/FZ-SEARCH-1.md', 'packages/domain/src/search-security.ts', 'packages/domain/search-security.test.mjs', 'ZAP stays deferred', 'NONE', 'No live connector credentials.');
    continue;
  }
  if (slice === 'SEARCH-PERFORMANCE') {
    row('FZ-REQ-CMS-SLICE-SEARCH-PERFORMANCE', 'Field CWV and lab media notes stay in different fields. The lab LCP candidate is a derivative with width and height.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', 'docs/architecture/FZ-SEARCH-1.md', 'packages/domain/src/search-performance.ts', 'packages/domain/search-performance.test.mjs', '', 'NONE', 'No field score is copied from a lab image.');
    continue;
  }
  if (slice === 'CMS-EXPORT') {
    row('FZ-REQ-CMS-SLICE-CMS-EXPORT', 'Structured CMS export carries slugs, SEO, media regeneration rules, omits private GPS, and re-imports onto a fresh store.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', 'docs/architecture/NEXT-SLICES-CMS.md', 'packages/domain/src/cms-export.ts', 'packages/domain/cms-export.test.mjs', 'vendor dump formats stay later', 'NONE', 'No customer GPS in the export.');
    continue;
  }
  if (slice === 'RETURN-ROADMAP') {
    row('FZ-REQ-CMS-SLICE-RETURN-ROADMAP', 'RETURN-ROADMAP stands up NEXT-SLICES-MAIN and resumes Lead security plus Portal selection without marking Lead or CMS security-accepted.', 'DONE_AT_MAX_DEPTH', 'DOCUMENTED', 'DOCUMENTED', 'docs/architecture/NEXT-SLICES-MAIN.md', 'docs/architecture/NEXT-SLICES-MAIN.md', 'scripts/fz-noc/policy.test.mjs', '', 'NONE', 'CMS-ACCEPT and Lead security-acceptance stay open.');
    continue;
  }
  row(`FZ-REQ-CMS-SLICE-${slice}`, `${slice} remains in the CMS and Search graph and is not marked complete by this audit.`, 'BLOCKED_BY_DEPENDENCY', 'DOCUMENTED', 'DOCUMENTED', SLICES, SLICES, SLICES, 'slice not executed', 'REVIEW', 'Acceptance text is in NEXT-SLICES-CMS.md.', {
    executableSlice: slice,
    blockerClass: /ACCEPT$/.test(slice) ? 'VENDOR_ACCEPTANCE' : 'INTERNAL',
    safePreblockerWork: !/ACCEPT$/.test(slice),
  });
}
const ACCEPTANCE = [
  ['A', 'Apostrophe plus PostgreSQL in the intended architecture'],
  ['B', 'Real Apostrophe Admin and editor UI'],
  ['C', 'Real page, project, article, and service editing'],
  ['D', 'Native visual editing quality'],
  ['E', 'FZ media pipeline integration in the vendor editor'],
  ['F', 'Draft and publish in the vendor product'],
  ['G', 'Preview'],
  ['H', 'Revision, history, and rollback in the vendor product'],
  ['I', 'Scheduler strategy'],
  ['J', 'Permissions and auth integration with the vendor'],
  ['K', 'Last-known-good publication in the running CMS'],
  ['L', 'CMS backup and restore'],
  ['M', 'CMS export and exit'],
  ['N', 'CMS security lab'],
  ['O', 'CMS performance evidence'],
  ['P', 'CMS accessibility evidence'],
  ['Q', 'React Router WWW integration'],
];
for (const [letter, text] of ACCEPTANCE) {
  row(`FZ-REQ-CMS-ACCEPT-${letter}`, text, 'BLOCKED_BY_DEPENDENCY', 'DOCUMENTED', 'DOCUMENTED', SLICES, SLICES, SLICES, 'CMS-ACCEPT is open', 'REVIEW', 'Domain contracts do not close vendor acceptance.', {
    blockerClass: 'VENDOR_ACCEPTANCE',
    executableSlice: 'CMS-ACCEPT',
    safePreblockerWork: false,
  });
}

row('FZ-REQ-CRM-OPP-001', 'Opportunity is a first-class Core API object on the Lead to Offer path.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', CURRENT, 'packages/domain/src/opportunity.ts', 'packages/domain/opportunity.test.mjs', '', 'NONE', '', {
  productCapability: 'OPPORTUNITY',
  depth: 'DOMAIN',
});
row('FZ-REQ-WWW-002', 'The public site projects real or explicitly synthetic portfolio projects. It does not invent awards, prices, or client claims.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', CURRENT, 'apps/web/app/portfolio-projection.ts', 'apps/web/app/portfolio-projection.test.mjs', '', 'NONE', 'Evidence: projectPortfolioItem / projectPublicPortfolio. Concept and illustrative stay non-realizations; private fields refused. Sales portfolio UI and CMS case-study pages stay later.', {
  productCapability: 'WWW',
  depth: 'CLIENT_PROJECTION',
  executableSlice: 'WWW-PORTFOLIO-PROJECTION',
  executableWhenComplete: ['CRM-PROJECT-DOMAIN'],
});
row('FZ-REQ-PORTAL-005', 'An authenticated client can see their own project files through Core API authorization. Staff files stay hidden.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', CURRENT, 'packages/domain/src/project-file.ts', 'apps/api/src/http.test.mjs', '', 'NONE', 'Portal file projection lists and gets metadata-only files scoped by clientSubject; BOLA denied.', {
  productCapability: 'PORTAL',
  depth: 'CLIENT_PROJECTION',
  executableSlice: 'PORTAL-FILE-PROJECTION',
  executableWhenComplete: ['PORTAL-PROJECT-PROJECTION'],
});
row('FZ-REQ-ADMIN-002', 'Staff can list and qualify leads in apps/admin through the existing Core API. No second lead store.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', CURRENT, 'apps/admin/app/shell.ts', 'apps/admin/app/shell.test.mjs', '', 'NONE', 'Admin UI reads and qualifies via Core API only.', {
  productCapability: 'ADMIN',
  depth: 'WORKFLOW',
  executableSlice: 'ADMIN-CRM-LEAD',
  executableWhenComplete: ['ADMIN-APP'],
});
row('FZ-REQ-MOBILE-002', 'Android is a Core API client with its own app foundation, not a second business backend.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', CURRENT, 'apps/mobile-android/foundation.mjs', 'apps/mobile-android/foundation.test.mjs', '', 'NONE', 'Android foundation probes Core API only; no commercial state or Play credentials in tree.', {
  productCapability: 'MOBILE',
  depth: 'ANDROID_RUNTIME',
  executableSlice: 'MOBILE-ANDROID-FOUNDATION',
  executableWhenComplete: ['MOBILE-CLIENT-BOUNDARY'],
});
row('FZ-REQ-MOBILE-003', 'iOS is a Core API client with its own app foundation, not a second business backend.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', CURRENT, 'apps/mobile-ios/foundation.mjs', 'apps/mobile-ios/foundation.test.mjs', '', 'NONE', 'iOS foundation probes Core API only; no commercial state or App Store credentials in tree.', {
  productCapability: 'MOBILE',
  depth: 'IOS_RUNTIME',
  executableSlice: 'MOBILE-IOS-FOUNDATION',
  executableWhenComplete: ['MOBILE-CLIENT-BOUNDARY'],
});
row('FZ-REQ-GARDENOS-002', 'Garden OS domain state links a delivered project to a garden record owned by Core API.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', CURRENT, 'packages/domain/src/garden.ts', 'packages/domain/garden.test.mjs', '', 'NONE', 'Domain garden record only. Twin runtime, HTTP garden routes, and UI stay later.', {
  productCapability: 'GARDENOS',
  depth: 'DOMAIN',
  executableSlice: 'GARDENOS-DOMAIN',
  executableWhenComplete: ['GARDENOS-RELATION-BOUNDARY'],
});
row('FZ-REQ-SITEINTEL-002', 'Site Intelligence rules consume normalized observations and do not let AI invent site facts.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', CURRENT, 'docs/architecture/SITEINTEL-RULES.md', 'packages/domain/product-boundaries.test.mjs', '', 'NONE', 'Rules over normalized observations only. Domain records are the next binding stage.', {
  productCapability: 'SITEINTEL',
  depth: 'RULES',
  executableSlice: 'SITEINTEL-RULES',
  executableWhenComplete: ['SITEINTEL-DATA-BOUNDARY'],
});
row('FZ-REQ-SITEINTEL-003', 'Site Intelligence domain records constraints and opportunities from rules output. AI does not conclude them.', 'BLOCKED_BY_DEPENDENCY', 'DOCUMENTED', 'DOCUMENTED', CURRENT, 'docs/architecture/NEXT-SLICES-MAIN.md', 'docs/architecture/NEXT-SLICES-MAIN.md', 'SITEINTEL-RULES', 'REVIEW', 'DOMAIN follows RULES. HTTP runtime, twin storage, and the AI stage stay out of this slice.', {
  productCapability: 'SITEINTEL',
  depth: 'DOMAIN',
  executableSlice: 'SITEINTEL-DOMAIN',
  executableWhenComplete: ['SITEINTEL-RULES'],
  blockerClass: 'INTERNAL',
});
row('FZ-REQ-ATLAS-003', 'Plant identity is a Core API record distinct from taxonomic-source proof and from cultivation claims.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', CURRENT, 'packages/domain/src/plant-identity.ts', 'packages/domain/plant-identity.test.mjs', '', 'NONE', 'Domain identity only. Public Atlas surface stays a later slice.', {
  productCapability: 'ATLAS',
  depth: 'DOMAIN',
  executableSlice: 'ATLAS-PLANT-IDENTITY',
  executableWhenComplete: ['ATLAS-PROVENANCE-BOUNDARY'],
});
row('FZ-REQ-ATLAS-004', 'A public Atlas surface reads approved plant identity and cites taxonomy sources. It does not invent cultivation facts.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', CURRENT, 'packages/domain/src/plant-identity.ts', 'packages/domain/plant-identity.test.mjs', '', 'NONE', 'Domain projection only. Full WWW Atlas UI stays later.', {
  productCapability: 'ATLAS',
  depth: 'RUNTIME',
  executableSlice: 'ATLAS-PUBLIC-SURFACE',
  executableWhenComplete: ['ATLAS-PLANT-IDENTITY'],
});
row('FZ-REQ-SKETCHUP-002', 'SketchUp project mapping uses Core API project ids and does not own commercial truth.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', CURRENT, 'packages/domain/src/product-boundaries.ts', 'packages/domain/product-boundaries.test.mjs', '', 'NONE', 'Evidence: mapSketchUpModelToProject / sketchUpProjectMapBoundary. Plugin runtime stays later.', {
  productCapability: 'SKETCHUP',
  depth: 'INTEGRATION',
  executableSlice: 'SKETCHUP-PROJECT-MAP',
  executableWhenComplete: ['SKETCHUP-ADAPTER-BOUNDARY'],
});
row('FZ-REQ-PAY-002', 'Payment schedule and states exist without a provider and without moving money.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', CURRENT, 'packages/domain/src/payment.ts', 'packages/domain/payment.test.mjs', '', 'NONE', 'Provider-neutral schedule on Contract; FZ-REQ-PAY-001 provider stays OWNER-DECISION.', {
  productCapability: 'PAYMENT',
  depth: 'DOMAIN',
  executableSlice: 'PAY-DOMAIN-NEUTRAL',
  executableWhenComplete: ['CRM-CONTRACT-DOMAIN'],
});
row('FZ-REQ-SIGN-001', 'Contract version locking and a provider-neutral signature request exist without a signing vendor.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', 'docs/architecture/FZ-SIGN-1-CONTRACT-LIFECYCLE.md', 'packages/domain/src/signing.ts', 'packages/domain/signing.test.mjs', '', 'NONE', 'Provider-neutral lock + signature request; FZ-REQ-GOV-002 provider stays OWNER-DECISION. No QES claim.', {
  productCapability: 'SIGNING',
  depth: 'DOMAIN',
  executableSlice: 'SIGN-STATE-NEUTRAL',
  executableWhenComplete: ['CRM-CONTRACT-DOMAIN'],
});
row('FZ-REQ-PXI-001', 'Experience signals are versioned, minimized, and replay-off. They do not become a universal experience score.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', GROWTH, 'packages/domain/src/pxi.ts', 'packages/domain/pxi.test.mjs', '', 'NONE', 'Production telemetry stays gated. The signal contract is safe now.', {
  productCapability: 'PXI',
  depth: 'CONTRACT',
  executableSlice: 'PXI-SIGNAL-MODEL',
  executableWhenComplete: ['ADMIN-APP'],
});

const KNOWN_DEPTH = {
  'FZ-REQ-MOBILE-001': 'BOUNDARY',
  'FZ-REQ-GARDENOS-001': 'BOUNDARY',
  'FZ-REQ-SITEINTEL-001': 'BOUNDARY',
  'FZ-REQ-ATLAS-001': 'FOUNDATION',
  'FZ-REQ-ATLAS-002': 'BOUNDARY',
  'FZ-REQ-SKETCHUP-001': 'BOUNDARY',
  'FZ-REQ-ADMIN-001': 'FOUNDATION',
  'FZ-REQ-PORTAL-001': 'FOUNDATION',
  'FZ-REQ-PORTAL-002': 'RUNTIME',
  'FZ-REQ-PORTAL-003': 'CLIENT_PROJECTION',
  'FZ-REQ-PORTAL-004': 'CLIENT_PROJECTION',
  'FZ-REQ-WWW-001': 'FOUNDATION',
  'FZ-REQ-PAY-001': 'OWNER_DECISION',
  'FZ-REQ-GOV-002': 'OWNER_DECISION',
  'FZ-REQ-CRM-OFFER-001': 'DOMAIN',
  'FZ-REQ-CRM-CONTRACT-001': 'DOMAIN',
  'FZ-REQ-PROJECT-002': 'DOMAIN',
  'FZ-REQ-SEC-001': 'ACCEPTANCE',
};
for (const item of rows) {
  if (!item.depth && KNOWN_DEPTH[item.id]) item.depth = KNOWN_DEPTH[item.id];
  if (item.id === 'FZ-REQ-GOV-002') item.productCapability = item.productCapability || 'SIGNING';
  if (item.id === 'FZ-REQ-WWW-001') item.productCapability = item.productCapability || 'WWW';
}

const PREFIXES = [
  'FZ-REQ-GOV', 'FZ-REQ-AUTO', 'FZ-REQ-DORA', 'FZ-REQ-CIS', 'FZ-REQ-ARCH', 'FZ-REQ-SEC', 'FZ-REQ-PRIV',
  'FZ-REQ-WWW', 'FZ-REQ-PORTAL', 'FZ-REQ-ADMIN', 'FZ-REQ-MOBILE', 'FZ-REQ-API', 'FZ-REQ-DATA', 'FZ-REQ-CMS',
  'FZ-REQ-MEDIA', 'FZ-REQ-SEARCH', 'FZ-REQ-CONNECT', 'FZ-REQ-APPROVAL', 'FZ-REQ-PROJECT', 'FZ-REQ-ATLAS',
  'FZ-REQ-GROWTH', 'FZ-REQ-MARKETING', 'FZ-REQ-CONTENT', 'FZ-REQ-PERPLEXITY', 'FZ-REQ-CREATIVE',
  'FZ-REQ-EXPERIENCE', 'FZ-REQ-CRM', 'FZ-REQ-SITEINTEL', 'FZ-REQ-GARDENOS', 'FZ-REQ-SKETCHUP',
  'FZ-REQ-INTEGRATION', 'FZ-REQ-OPS', 'FZ-REQ-MKTEXEC', 'FZ-REQ-OFFERINTEL', 'FZ-REQ-OFFERLEARN',
  'FZ-REQ-PROJECTGROWTH', 'FZ-REQ-EXECINTEGRITY', 'FZ-REQ-CONTEXT', 'FZ-REQ-EVIDENCE', 'FZ-REQ-COMPLETION',
  'FZ-REQ-DOC', 'FZ-REQ-DOCOPS', 'FZ-REQ-DOCCTX', 'FZ-REQ-DOCQA', 'FZ-REQ-PLATFORM',
  'FZ-REQ-COVERAGE', 'FZ-REQ-DOCINV', 'FZ-REQ-RECOVERY', 'FZ-REQ-PXI', 'FZ-REQ-SIGN',
];

function rank(depth) {
  const index = DEPTHS.indexOf(depth);
  if (index < 0) throw new Error(`BAD_DEPTH ${depth}`);
  return index;
}

export function requirements() {
  return rows.map(item => ({ ...item }));
}

import {
  missingExecutablePathDeclarations,
  registryMaterializationGap,
} from '../requirements/executable-path.mjs';

export function validateRequirements() {
  const errors = [];
  const seen = new Set();
  for (const item of rows) {
    if (seen.has(item.id)) errors.push(`DUPLICATE ${item.id}`);
    seen.add(item.id);
    if (!item.description || !item.architecture || !item.implementation || !item.test) errors.push(`BLANK ${item.id}`);
    if (rank(item.actualDepth) < rank(item.maxDepth)) errors.push(`DEPTH ${item.id}`);
    if (rank(item.actualDepth) > rank(item.maxDepth)) errors.push(`OVERCLAIM ${item.id}`);
  }
  for (const prefix of PREFIXES) {
    if (!rows.some(item => item.id.startsWith(`${prefix}-`))) errors.push(`PREFIX ${prefix}`);
  }
  for (const id of missingExecutablePathDeclarations(rows)) {
    errors.push(`EXECUTABLE_PATH ${id}`);
  }
  const incomplete = rows.filter(item => item.status === 'INCOMPLETE_SAFE' || rank(item.actualDepth) < rank(item.maxDepth));
  return { errors, total: rows.length, incomplete: incomplete.length, ids: [...seen] };
}

export { registryMaterializationGap };

export function ledger() {
  const counts = {
    TOTAL: rows.length,
    DONE_AT_MAX_DEPTH: 0,
    OWNER_GATED: 0,
    PRODUCTION_ONLY: 0,
    BLOCKED_BY_DEPENDENCY: 0,
    NOT_MEASURABLE_YET: 0,
    INCOMPLETE_SAFE: 0,
  };
  for (const item of rows) {
    if (counts[item.status] === undefined) counts[item.status] = 0;
    counts[item.status] += 1;
  }
  counts.SHELLS = rows.filter(item => item.gap.startsWith('SHELL')).length;
  counts.UNEXPLAINED_ORPHANS = 0;
  return counts;
}

export function renderMarkdown() {
  const lines = [
    '# FZ master traceability',
    '',
    'Status: CURRENT registry for the master-audit foundation.',
    'Machine source: `scripts/requirements/registry.mjs`.',
    'This is not a second roadmap. Product execution stays in `docs/architecture/NEXT-SLICES-MAIN.md` after RETURN-ROADMAP.',
    '',
    'Actual/Max is evidence depth. Product depth is the binding product layer of that row. DONE_AT_MAX_DEPTH is not parent-product completion.',
    '',
    '| ID | Status | Actual | Max | Product depth | Requirement | Evidence | Gate | Gap |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ];
  for (const item of rows) {
    lines.push(`| ${item.id} | ${item.status} | ${item.actualDepth} | ${item.maxDepth} | ${item.depth || ''} | ${item.description.replaceAll('|', '/')} | ${item.test} | ${item.gate} | ${item.gap.replaceAll('|', '/')} |`);
  }
  lines.push('');
  return lines.join('\n');
}
