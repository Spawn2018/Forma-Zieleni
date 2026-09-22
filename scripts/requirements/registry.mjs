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

function row(id, description, status, actual, max, architecture, implementation, test, dependency, gate, gap) {
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
tested('FZ-REQ-ATLAS-001', 'Botanical sources are taxonomic authorities, not horticultural proof.', GROWTH, PLAN);
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
tested('FZ-REQ-OFFERINTEL-001', 'Marketing code cannot change price or commercial terms.', GROWTH, PLAN);
tested('FZ-REQ-OFFERLEARN-001', 'A rejected offer records hypotheses, including price, and does not change the price.', GROWTH, PLAN);
tested('FZ-REQ-INTEGRATION-001', 'The integration registry refuses live mutation. Providers stay discovered or planned.', GROWTH, PLAN);
tested('FZ-REQ-OPS-001', 'Operations domains are not DORA metrics and are not measured yet.', GROWTH, PLAN);
row('FZ-REQ-DORA-001', 'DORA stays five software-delivery metrics. No score and no certification.', 'DONE_AT_MAX_DEPTH', 'DOCUMENTED', 'DOCUMENTED', 'docs/engineering/DORA-MEASUREMENT.md', 'docs/engineering/DORA-MEASUREMENT.md', 'docs/engineering/DORA-MEASUREMENT.md', '', 'NONE', 'No production series. Numbers stay NOT MEASURABLE.');
row('FZ-REQ-DORA-002', 'Production DORA numbers are not measurable until deployment events exist.', 'NOT_MEASURABLE_YET', 'DOCUMENTED', 'DOCUMENTED', 'docs/engineering/DORA-MEASUREMENT.md', 'docs/engineering/DORA-MEASUREMENT.md', 'docs/engineering/DORA-MEASUREMENT.md', 'no production deployments', 'NONE', 'NOT MEASURABLE');
row('FZ-REQ-CIS-001', 'FZ-CIS remains the only learning system. External text cannot edit Canon.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', CIS, 'scripts/fz-cis/policy.mjs', 'scripts/fz-cis/policy.test.mjs', '', 'NONE', '');
row('FZ-REQ-CIS-002', 'Reviewer corrections are signals. They do not auto-promote or remove review.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', CIS, CODE, TEST, '', 'NONE', '');
row('FZ-REQ-AUTO-001', '/noc uses the next Europe/Warsaw hour. 9 means 09:00.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', 'docs/cursor-os/CURSOR-OS-2026.md', 'scripts/fz-noc/policy.mjs', 'scripts/fz-noc/policy.test.mjs', '', 'NONE', '');
row('FZ-REQ-AUTO-002', 'The orchestrator uses one execution loop and does not resolve Owner gates.', 'DONE_AT_MAX_DEPTH', 'DOCUMENTED', 'DOCUMENTED', '.cursor/agents/fz-orchestrator.md', '.cursor/agents/fz-orchestrator.md', '.cursor/agents/fz-orchestrator.md', '', 'NONE', 'Agent text is the control. No second loop was added.');
row('FZ-REQ-GOV-001', 'Owner authority stays above Canon, the orchestrator and tools.', 'DONE_AT_MAX_DEPTH', 'DOCUMENTED', 'DOCUMENTED', 'docs/workflows/DECISION-GATES.md', 'docs/workflows/DECISION-GATES.md', 'docs/workflows/DECISION-GATES.md', '', 'NONE', '');
row('FZ-REQ-GOV-002', 'FZ-SIGN-1 provider remains undecided.', 'OWNER_GATED', 'DOCUMENTED', 'DOCUMENTED', 'docs/architecture/FZ-SIGN-1-CONTRACT-LIFECYCLE.md', 'docs/architecture/OWNER-DECISION-PACKET-FZ-SIGN-1.md', 'docs/architecture/OWNER-DECISION-PACKET-FZ-SIGN-1.md', 'Owner selection', 'OWNER-DECISION', 'UNDECIDED');
row('FZ-REQ-SEARCH-001', 'FZ-SEARCH-1 remains the search architecture. No universal AI rank or GEO score.', 'DONE_AT_MAX_DEPTH', 'DOCUMENTED', 'DOCUMENTED', SEARCH, SEARCH, 'contracts/content-contract.test.mjs', '', 'NONE', 'Connector runtime is a later slice, not this foundation.');
row('FZ-REQ-SEARCH-002', 'FZ-SEARCH-CRAWL-1 training-crawler policy stays open.', 'OWNER_GATED', 'DOCUMENTED', 'DOCUMENTED', 'docs/architecture/OWNER-DECISION-PACKET-FZ-SEARCH-CRAWL-1.md', 'docs/architecture/OWNER-DECISION-PACKET-FZ-SEARCH-CRAWL-1.md', 'docs/architecture/OWNER-DECISION-PACKET-FZ-SEARCH-CRAWL-1.md', 'Owner policy', 'OWNER-DECISION', 'OPEN');
row('FZ-REQ-CMS-001', 'Apostrophe, vendor-native editing and the FZ media pipeline stay the CMS decision. CMS-ACCEPT stays open.', 'BLOCKED_BY_DEPENDENCY', 'DOCUMENTED', 'DOCUMENTED', 'docs/architecture/OWNER-DECISION-PACKET-FZ-CMS-1.md', SLICES, 'scripts/cms-lab-gate.mjs', 'Apostrophe Admin UI and PostgreSQL lab not executed', 'REVIEW', 'CMS-ACCEPT OPEN');
row('FZ-REQ-CMS-002', 'Published content stays a projection. Drafts stay private.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', CURRENT, 'packages/domain/src/content-publish.ts', 'packages/domain/content-publish.test.mjs', '', 'NONE', '');
row('FZ-REQ-MEDIA-001', 'Private checksummed masters and public derivatives without GPS stay the media contract.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', SLICES, 'packages/media/src/derivatives.mjs', 'packages/media/derivatives.test.mjs', '', 'NONE', 'Gallery UI remains the next ordinary slice.');
row('FZ-REQ-ARCH-001', 'Gate A stays Hono, PostgreSQL, Kysely, outbox, Better Auth, local files, later Garage, OpenObserve, SOPS+age, restic, pgBackRest, Cloudflare Tunnel, Compose later, no overlay.', 'DONE_AT_MAX_DEPTH', 'DOCUMENTED', 'DOCUMENTED', CURRENT, CURRENT, CURRENT, '', 'NONE', 'Production hosting and object storage remain undecided.');
row('FZ-REQ-ARCH-002', 'No graph database, Prisma, Drizzle or Kafka is introduced by this foundation.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', CONNECTED, 'package.json', 'scripts/requirements/registry.test.mjs', '', 'NONE', '');
row('FZ-REQ-API-001', 'Core API remains the business authority.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', CURRENT, API, HTTP, '', 'NONE', '');
row('FZ-REQ-DATA-001', 'PostgreSQL and Kysely remain persistence. New unused tables were not added.', 'DONE_AT_MAX_DEPTH', 'DOCUMENTED', 'DOCUMENTED', CURRENT, 'apps/api/src/db.ts', 'apps/api/src/postgres.integration.test.mjs', 'A shared fabric table waits for a product consumer', 'NONE', 'Domain contract is in memory, matching the content-publish precedent.');
row('FZ-REQ-SEC-001', 'The lead vertical is implemented and is not security-accepted.', 'BLOCKED_BY_DEPENDENCY', 'TESTED', 'TESTED', 'docs/architecture/NEXT-SLICE-LEAD-VERTICAL.md', 'packages/domain/src/lead.ts', 'packages/domain/lead.test.mjs', 'ZAP, Dependency-Check, offsite backup, production ingress', 'REVIEW', 'Do not mark security-accepted.');
row('FZ-REQ-PRIV-001', 'No live customer tracking, session replay or analytics ingestion is activated.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', GROWTH, PLAN, TEST, '', 'NONE', '');
row('FZ-REQ-WWW-001', 'WWW reads a published projection and must not invent business facts.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', CURRENT, 'packages/domain/src/content-publish.ts', 'packages/domain/content-publish.test.mjs', '', 'NONE', 'The public site application is not built yet.');
row('FZ-REQ-PORTAL-001', 'Portal customer isolation is enforced in the domain contract.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', CONNECTED, CODE, TEST, 'apps/portal is a boundary note', 'NONE', 'No portal UI.');
row('FZ-REQ-ADMIN-001', 'Agnieszka approval UI waits until apps/admin is a real application.', 'BLOCKED_BY_DEPENDENCY', 'CONTRACTED', 'CONTRACTED', CONNECTED, CODE, TEST, 'apps/admin is README only', 'NONE', 'Domain actions exist. No fake admin screen.');
row('FZ-REQ-MOBILE-001', 'Android and iOS have no separate business truth.', 'BLOCKED_BY_DEPENDENCY', 'DOCUMENTED', 'DOCUMENTED', CURRENT, CURRENT, CURRENT, 'No mobile client', 'NONE', '');
row('FZ-REQ-SITEINTEL-001', 'Site Intelligence stays DATA, then RULES, then DOMAIN, then AI.', 'DONE_AT_MAX_DEPTH', 'DOCUMENTED', 'DOCUMENTED', CURRENT, CONNECTED, TEST, 'No site-intelligence runtime', 'NONE', '');
row('FZ-REQ-GARDENOS-001', 'Garden OS is a future relation, not a digital-twin runtime.', 'BLOCKED_BY_DEPENDENCY', 'DOCUMENTED', 'DOCUMENTED', CONNECTED, CODE, TEST, 'No Garden OS product', 'NONE', '');
row('FZ-REQ-SKETCHUP-001', 'SketchUp is not the source of business truth.', 'BLOCKED_BY_DEPENDENCY', 'DOCUMENTED', 'DOCUMENTED', CURRENT, CONNECTED, TEST, 'No SketchUp plugin', 'NONE', '');
row('FZ-REQ-PAY-001', 'Payment provider remains undecided. No transaction is started.', 'OWNER_GATED', 'DOCUMENTED', 'DOCUMENTED', CURRENT, CURRENT, CURRENT, 'Owner selection', 'OWNER-DECISION', 'UNDECIDED');
row('FZ-REQ-HOST-001', 'Production hosting remains undecided. No deploy, DNS or Cloudflare mutation.', 'OWNER_GATED', 'DOCUMENTED', 'DOCUMENTED', CURRENT, CURRENT, CURRENT, 'Owner selection', 'OWNER-DECISION', 'UNDECIDED');
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
row('FZ-REQ-DORA-006', 'Value stream stages are named. Durations stay not measurable until a release clock exists.', 'NOT_MEASURABLE_YET', 'DOCUMENTED', 'DOCUMENTED', 'docs/engineering/VALUE-STREAM.md', 'docs/engineering/VALUE-STREAM.md', 'scripts/requirements/closure.test.mjs', 'no production release clock', 'NONE', 'NOT MEASURABLE');
row('FZ-REQ-DORA-007', 'Data domains name an owner, a contract, and visibility. There is no data-quality score.', 'DONE_AT_MAX_DEPTH', 'DOCUMENTED', 'DOCUMENTED', 'docs/engineering/HEALTHY-DATA.md', 'docs/engineering/HEALTHY-DATA.md', 'scripts/requirements/closure.test.mjs', '', 'NONE', '');
row('FZ-REQ-DORA-008', 'A future alert needs a decision and a baseline. No numeric threshold is invented.', 'DONE_AT_MAX_DEPTH', 'DOCUMENTED', 'DOCUMENTED', 'docs/engineering/FAILURE-ALERTS.md', 'docs/engineering/FAILURE-ALERTS.md', 'scripts/requirements/closure.test.mjs', 'no production baseline', 'NONE', '');
row('FZ-REQ-DORA-009', 'Test data rejects a customer-database copy and an unlabeled marketing plan.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', 'docs/engineering/TEST-DATA-POLICY.md', 'scripts/docs/test-data.mjs', 'scripts/requirements/closure.test.mjs', '', 'NONE', '');
row('FZ-REQ-DORA-010', 'Maintainability, supply chain, and AI cost rules reject vanity scores and extra supply-chain products.', 'DONE_AT_MAX_DEPTH', 'DOCUMENTED', 'DOCUMENTED', 'docs/engineering/DORA-LAST-MILE.md', 'docs/engineering/DORA-LAST-MILE.md', 'scripts/requirements/closure.test.mjs', '', 'NONE', '');
row('FZ-REQ-COVERAGE-001', 'Every numbered directive section is classified and every normative section maps to a real requirement id.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', 'docs/engineering/requirements/FZ-DIRECTIVE-COVERAGE.json', 'scripts/requirements/closure.mjs', 'scripts/requirements/closure.test.mjs', '', 'NONE', '');
row('FZ-REQ-DOCINV-001', 'Every Markdown file under docs/ is classified. Unexplained orphans are zero.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', 'docs/engineering/requirements/FZ-DOC-INVENTORY.json', 'scripts/requirements/closure.mjs', 'scripts/requirements/closure.test.mjs', '', 'NONE', '');
row('FZ-REQ-RECOVERY-001', 'Mutation does not start when the recovery marker and HEAD disagree. The hook reminds; it cannot stop a writer who ignores it.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', 'docs/engineering/requirements/execution-journal.json', 'scripts/requirements/closure.mjs', 'scripts/requirements/closure.test.mjs', '', 'NONE', 'Cursor cannot refuse an edit solely from this marker.');

const OPEN_SLICES = [
  'MEDIA-COLLECTIONS', 'GALLERY-WWW', 'BEFORE-AFTER', 'CMS-SEO', 'CMS-ADMIN', 'CMS-WWW', 'CMS-HARDEN',
  'CMS-PERF', 'CMS-RESTORE', 'CMS-EXPORT', 'CMS-ACCEPT', 'SEARCH-WWW-TECHNICAL', 'SEARCH-STRUCTURED-DATA',
  'SEARCH-SITEMAP-ROBOTS', 'SEARCH-ATTRIBUTION', 'SEARCH-DATA-MODEL', 'SEARCH-CONNECTORS', 'SEARCH-SYNC',
  'SEARCH-HISTORY', 'SEARCH-TECH-AUDIT', 'SEARCH-AI-VISIBILITY', 'SEARCH-CRAWLER-INTELLIGENCE',
  'SEARCH-CONTENT-INTELLIGENCE', 'SEARCH-ADMIN', 'SEARCH-ALERTS', 'SEARCH-SECURITY', 'SEARCH-PERFORMANCE',
  'SEARCH-RECOVERY', 'SEARCH-ACCEPT', 'RETURN-ROADMAP',
];
for (const slice of OPEN_SLICES) {
  if (slice === 'MEDIA-COLLECTIONS') {
    row('FZ-REQ-CMS-SLICE-MEDIA-COLLECTIONS', 'Collections reorder, set a hero, store ALT and focal data, and reuse one master.', 'DONE_AT_MAX_DEPTH', 'TESTED', 'TESTED', SLICES, 'packages/media/src/collections.mjs', 'packages/media/collections.test.mjs', '', 'NONE', 'Gallery UI is the next slice and needs a web app.');
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
  row(`FZ-REQ-CMS-SLICE-${slice}`, `${slice} remains in the CMS and Search graph and is not marked complete by this audit.`, 'BLOCKED_BY_DEPENDENCY', 'DOCUMENTED', 'DOCUMENTED', SLICES, SLICES, SLICES, 'slice not executed', 'REVIEW', 'Acceptance text is in NEXT-SLICES-CMS.md.');
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
  row(`FZ-REQ-CMS-ACCEPT-${letter}`, text, 'BLOCKED_BY_DEPENDENCY', 'DOCUMENTED', 'DOCUMENTED', SLICES, SLICES, SLICES, 'CMS-ACCEPT is open', 'REVIEW', 'Domain contracts do not close vendor acceptance.');
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
  'FZ-REQ-COVERAGE', 'FZ-REQ-DOCINV', 'FZ-REQ-RECOVERY',
];

function rank(depth) {
  const index = DEPTHS.indexOf(depth);
  if (index < 0) throw new Error(`BAD_DEPTH ${depth}`);
  return index;
}

export function requirements() {
  return rows.map(item => ({ ...item }));
}

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
  const incomplete = rows.filter(item => item.status === 'INCOMPLETE_SAFE' || rank(item.actualDepth) < rank(item.maxDepth));
  return { errors, total: rows.length, incomplete: incomplete.length, ids: [...seen] };
}

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
    'This is not a second roadmap. Product execution stays in `docs/architecture/NEXT-SLICES-CMS.md`.',
    '',
    'Depth is the highest honest depth of that row. A blocked row is not a shell when the maximum possible depth is the same as the actual depth.',
    '',
    '| ID | Status | Actual | Max | Requirement | Evidence | Gate | Gap |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
  ];
  for (const item of rows) {
    lines.push(`| ${item.id} | ${item.status} | ${item.actualDepth} | ${item.maxDepth} | ${item.description.replaceAll('|', '/')} | ${item.test} | ${item.gate} | ${item.gap.replaceAll('|', '/')} |`);
  }
  lines.push('');
  return lines.join('\n');
}
