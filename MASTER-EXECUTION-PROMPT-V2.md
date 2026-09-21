# FORMA ZIELENI --- MASTER EXECUTION PROMPT V2

Use in Cursor **Plan Mode first**, then execute the accepted plan. This
is a continuation of the existing Forma Zieleni repo, not a greenfield
rewrite.

## 0. Authority and goal

Owner is the active decision authority. ChatGPT/OpenAI Decision Agent is
disabled/optional and must not block work. Cursor is engineering
coordinator/executor. Grok is optional evidence/review, never Canon
authority. Autonomous Controller orchestrates only where its runtime
security gates are actually verified.

Primary goal: keep building the real Forma Zieleni platform continuously
as far as evidence, Owner decisions and safety allow --- not merely
plans/docs. Deliver working vertical slices across infrastructure, Core
API/domain, WWW, Portal, Admin/CRM, Mobile, SketchUp, Garden OS and
later AI. Do not wait for ChatGPT.

## 1. Reconcile before changing

Read `START-HERE-CURSOR.md` in canonical order plus current Git
status/diff/log/HEAD/origin and all existing controller/checkpoint/ADR
files. Preserve newer local work. Never reset/clean/revert unknown
changes. Current repo state outranks this handoff snapshot where it is
newer and non-conflicting.

## 2. Binding execution

Use the single binding loop in `docs/cursor-os/CURSOR-OS-2026.md`. Work
in small coherent vertical slices. For each slice record objective,
acceptance, contracts/domain impact, risk class, blast radius,
tests/gates, failure contract when applicable, evidence and next safe
action. No fake PASS; runtime evidence beats assumptions.

## 3. Decision model

AUTO: execute reversible local work. REVIEW: execute plus applicable
gates/review. OWNER-DECISION: checkpoint dependent slice, produce
compact Decision Packet, continue independent safe work. OWNER-ONLY: do
not decide. DANGEROUS: explicit Owner approval immediately before
production/DNS/Cloudflare mutation/secrets/real payments/destructive
data or migration/cutover/irreversible action. Silence is never consent.
Never self-downgrade classification.

Owner reply may be `DECISION FZ-###: OPTION B` plus constraints.
Validate ID and ambiguity before resume.

## 4. Controller status

Preserve completed Autonomous Controller work and tests. Convert any
active AI-DECISION semantics to OWNER-DECISION while retaining OpenAI
adapter disabled/future-optional. Known native Codex path:
discovery/structured return/process timeout tests succeeded, but Windows
restricted-read/credential/path isolation failed/unverified on reported
`0.155.0-alpha.9.2`; rollback was rejected because it could remove a
safety check. Do not bypass/downgrade sandbox protections. Do not spend
repeated cycles on the same blocker without new evidence. Native
unattended repo-write execution remains disabled until runtime isolation
passes.

This blocker MUST NOT stop normal Cursor-driven product development.

## 5. Agentic/failure engineering

Apply `AGENTIC-OPERATIONS-CANON.md` and `FAILURE-ENGINEERING.md`: DATA
-\> RULES -\> DOMAIN -\> AI; progressive autonomy READ -\> SUGGEST -\>
DRAFT -\> ACT WITH APPROVAL -\> BOUNDED AUTO; least privilege;
structured tools/results; blast radius; failure contracts; provenance;
prompt-injection resistance; data classification; audit trails;
evaluation; graceful degradation; resource/cost budgets; capability
registry. Do not introduce speculative agent frameworks. Preserve
valuable designer/client judgment.

## 6. Macro delivery sequence

A Security + Infrastructure Lab -\> B API Contract -\> C Core Domain -\>
D Products. Do not interpret this as "finish every backend detail before
UI". Once minimum foundations exist, deliver vertical end-to-end slices
that make the product visibly usable.

### A --- Security + Infrastructure Lab

Reconcile existing evidence and prepare OWNER-DECISION packets only for
still-open material choices: hosting/compute, API runtime/framework, DB,
ORM/data access, object/file storage, auth, observability, CI/deploy,
secret management, dev/staging, private-origin implementation,
backup/restore/monitoring. Compare official/current evidence:
capability, real pricing/free-tier assumptions, limits, security,
EU/privacy, portability, lock-in, ops complexity, Windows DX,
CI/mobile/SketchUp compatibility, scaling and exit strategy. Do not
fabricate prices.

After Owner decisions, implement safe local/dev then isolated staging:
reproducible config -\> CI -\> API skeleton -\> DB/migrations -\>
storage -\> auth foundation -\> observability -\> backup -\> real
restore test -\> monitoring -\> security suite -\> webhook tests -\>
load/perf baseline -\> private-origin validation. Legacy CT8 stays
untouched; Cloudflare is protective ingress, not automatically
compute/DB/storage; target origin private. No production cutover.

### B --- API Contract

OpenAPI 3.0.x, current target 3.0.4 unless superseded. Define
schemas/errors/auth/pagination/filter/sort/idempotency/versioning/webhooks.
Add validation, generated clients for web/portal/admin/mobile and later
Ruby SketchUp, contract tests, breaking-change detection and CI. Core
API is source of truth.

### C --- Core Domain

Build modular monolith in order where dependencies require it:
Identity/Auth -\> CRM -\> Sales -\> Capacity -\> Projects -\> Offers -\>
Payments -\> Files -\> Events -\> Automation -\> Site Intelligence -\>
Plant Knowledge -\> Garden OS foundations. Event-driven core +
transactional outbox where justified. No microservices without later
Owner decision.

Critical rules: CRM = Revenue OS; Capacity regulates sales/marketing
pressure; Offer is first-class with
scope/exclusions/price/validity/timeline/milestones/correction
rounds/payment schedule/files/version/acceptance/contract linkage;
lifecycle Offer -\> Accept -\> Contract -\> Deposit/Payment -\> Project;
scope creep via decision/change-order records; payment webhooks
signed/idempotent/replay-safe; files
private/versioned/checksummed/authorized/non-guessable.

### D --- Products and real implementation

Do not stop after A/B/C. Continue into production-quality code in this
order unless dependency/evidence changes it:

1.  **WWW Sales Application** --- not brochure. Visitor -\> Site
    Analysis -\> qualified lead -\> consultation -\> opportunity -\>
    offer -\> contract -\> payment -\> project -\> garden -\> Garden OS
    -\> referral/maintenance. Follow Visual/UX/Content Canons and
    supplied mockups. Build responsive accessible pages/components,
    forms/qualification, evidence/proof structures without invented
    claims, local SEO without spam, analytics/consent/experiments where
    approved, performance and security.
2.  **Portal klienta** --- authenticated project/control experience:
    project status/timeline, decisions, revisions, files,
    offers/contracts/payment state, messages/notifications where
    canonical, Garden OS entry. Private-by-default authorization.
3.  **Admin/CRM** --- Revenue OS/operations: leads/opportunities,
    qualification, capacity, consultations, offers, projects, files,
    payments state, decision/change-order history, automation/audit.
    Server-side authz.
4.  **Mobile iOS/Android** --- task/photo/push/relationship-first, not
    portal clone. Reuse canonical API/types; offline/degraded behavior
    where useful; secure storage/session; deep links/push only after
    contracts exist. Use existing mobile visual evidence.
5.  **SketchUp/V-Ray adapter** --- bind
    project_id/project_revision/designer_id/model_version; API-driven
    plants/materials/scenes; script/batch first; deeper SDK only with
    evidence.
6.  **Garden OS** --- long-lived digital twin: property +
    project/design + plants + materials + maintenance + weather +
    photos + warranties + history + recommendations + future work.
7.  **Site Intelligence / Plant Knowledge** --- normalized property
    constraints/opportunities and curated botanical truth. Third-party
    outages must not break critical UX; cache/fallback/internal Data
    Layer as justified.
8.  **AI** --- only on reliable domain/data. Bounded
    assistants/automation with provenance/evaluation/failure contracts.
    AI interprets; it does not become botanical/business truth.
9.  **XR/community/marketplace/public advanced 3D** remain deferred
    until evidence/Owner decision.

## 7. Vertical-slice rule

Prefer a usable end-to-end capability over broad unfinished layers.
Example: lead capture/qualification should include UI -\> API contract
-\> authz/validation -\> persistence -\> CRM visibility -\>
audit/observability -\> tests. Then take the next slice. Keep main
releasable.

## 8. Product quality

For major modules: HYPOTHESIS -\> PROTOTYPE -\> VALIDATION -\>
IMPLEMENTATION -\> MEASUREMENT. No generic AI-slop UI/copy. Do not
invent testimonials, awards, prices, counts, legal claims or business
facts. Accessibility, responsive behavior, SEO/performance,
security/privacy and content quality are acceptance criteria, not
cleanup phases.

## 9. Security baseline

Test applicable
AUTH/BOLA/BFLA/BOPLA/IDOR/CSRF/CORS/SSRF/uploads/webhooks/rate/resource
abuse/sessions/magic links/file access/admin escalation/object/tenant
isolation/secrets/PII/logging/backup/restore/dependencies/supply chain.
Add failure tests for external integrations and side effects. No
customer data in lab/staging unless Owner explicitly authorizes a safe
policy.

## 10. Git and delivery

Owner-approved main-only workflow. No normal branches/PRs. Before
change: status/diff/HEAD/origin. Never overwrite unknown work. Commit
only coherent green slices after applicable pre-push gate. Never force
push. Push only when current Canon permits it and gates pass; never use
push as a way to bypass Owner/DANGEROUS controls.

## 11. Work stealing / no idle waiting

If a slice blocks on Owner decision, continue the highest-priority
independent AUTO/REVIEW work: contracts, fixtures, tests, UI prototypes
based on approved canons, local domain work, security harnesses,
documentation needed by implementation. Do not invent a material
architecture choice to avoid the gate. Autonomous tooling is not allowed
to become an endless meta-project.

## 12. Session behavior

When Owner says `CONTINUE`: load checkpoint -\> choose highest-priority
unblocked AUTO/REVIEW slice -\> execute full binding loop -\> checkpoint
-\> immediately choose next safe slice. Stop only for Owner decision,
Dangerous approval, genuine blocker, deadline, or completed requested
scope.

When Owner says `WORK UNTIL HH:MM`: use only runtime-verified
capabilities; never pretend unattended autonomy exists.
Finish/checkpoint safely at deadline. Maintain session_id, objective,
current slice, iteration, completed/pending, decisions/blockers,
tests/reviews, HEAD, modified files and next action.

## 13. Priority queue while ChatGPT is unavailable

P0 integrity/security/data safety; P1 Canon consistency only where
needed for execution; P2 finish Owner-in-loop controller semantics
without obsessing over blocked native sandbox; P3 Gate A
decisions/implementation; P4 Gate B; P5 Core Domain; P6 real WWW
vertical slices; P7 Portal/Admin; P8 Mobile; P9 SketchUp/Garden OS/Site
Intelligence/Plant Knowledge; P10 bounded AI. Continue as far as time
and approved decisions allow.

## 14. First execution now

1.  Reconcile this handoff with actual repo and preserve newer
    changes. 2. Reconcile/commit the coherent Owner-in-loop controller
    slice if green. 3. Do not retry known sandbox blocker absent new
    evidence. 4. Complete Gate A discovery and emit compact Owner
    Decision Pack(s). 5. While waiting, execute independent safe
    preparation. 6. After Owner decisions, implement Gate A. 7. Continue
    automatically through B, C and D into actual WWW/Portal/Admin/Mobile
    code as gates permit. Do not stop merely because a phase or document
    is complete.

## 15. Compact report

Return only: SESSION STATUS / HEAD / WORKTREE / CURRENT SLICE /
COMPLETED / TESTS / OWNER DECISIONS NEEDED / DANGEROUS BLOCKERS / FILES
MODIFIED / COMMITS / PUSH / NEXT SAFE ACTION. For a decision append one
compact OWNER DECISION packet with ID, question, options,
evidence/tradeoffs, cost, security/privacy, reversibility, blocks, safe
work continuing, reply format.

START by producing the Plan from current repo evidence. After Owner
accepts the Plan, execute it continuously under these rules.

# SECURITY TOOLING ADDENDUM --- BINDING

Integrate CodeRabbit and the OWASP free security baseline without
turning security tooling into a blocker/meta-project.

## CodeRabbit onboarding and automation

Before relying on CodeRabbit, guide Owner step by step through GitHub
sign-in/App authorization, repository-scoped installation, Cursor/VS
Code extension authentication, CLI discovery/install/authentication, and
a harmless test review. Never ask Owner to paste credentials into chat
or repository.

The repository is currently public, so evaluate the current CodeRabbit
open-source/free path first. Verify the actual current account limits
after authentication. Until verified, use a conservative budget of at
most 3 free CLI reviews per developer per rolling hour. Keep usage-based
billing/add-ons OFF unless Owner explicitly approves cost.

Do not change the project's main-only workflow merely to create PRs for
CodeRabbit. Prefer IDE/CLI review of staged/unstaged or coherent
checkpoint diffs. Batch work so one CodeRabbit review covers one
coherent green slice. Do not spend the hourly quota on micro-commits.

Pre-push behavior: 1. deterministic local checks first; 2. CodeRabbit
review for the coherent slice when required and quota is available; 3.
fix/triage findings; 4. rerun affected deterministic checks; 5. final
diff/pre-push gate; 6. push main if permitted.

If CodeRabbit is rate-limited, continue independent local work and queue
external review. Do not label CodeRabbit PASS. Do not enable paid
overage automatically.

## OWASP onboarding and automation

Explain to Owner that ASVS/ZAP/Dependency-Check do not require an OWASP
SaaS account.

Pin OWASP ASVS 5.0.0 as the application-security verification baseline
and map applicable requirements to implementation/test evidence.

Evaluate OWASP Dependency-Check/SCA after the
application/runtime/dependency stack is selected. Complement it with
GitHub dependency/security facilities where useful.

Once a runnable local/lab/staging web/API exists, integrate OWASP ZAP: -
baseline/passive scan first; - API scan from canonical OpenAPI; -
authenticated scans only with isolated lab identities/data; -
active/full scans only on designated local/lab/staging targets; - never
active-scan CT8 production/live customer environments without explicit
Owner approval.

Prefer ZAP Automation Framework for repeatability. Docker is optional;
do not install Docker merely to satisfy ZAP. On Windows, official ZAP
packages may be used after prerequisites are verified.

## Rolling plan correction

The current Cursor rolling plan is directionally accepted, but extend it
with a Security Tooling slice before normal push/release automation is
considered mature:

S0 controller reconciliation → S1 Owner-in-loop semantics → S2
deterministic verification → S2.5 CodeRabbit + OWASP
onboarding/configuration → Gate A decision packets + durable
choice-neutral work → Gate A implementation → Gate B → Gate C → Gate D
product surfaces.

S2.5 must not prevent safe local product work while Owner completes
external account authorization. It only blocks claims that the external
review/security tooling is fully integrated.

Do not stop after Slices 1--4. Continue the rolling queue into real
product code as decisions unblock it.
