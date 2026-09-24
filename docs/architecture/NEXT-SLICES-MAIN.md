# Main product execution graph

Status: AUTHORIZED after `RETURN-ROADMAP` on the CMS/Search graph.
This file is the product execution graph for `/noc` selection once
`RETURN-ROADMAP` is COMPLETE. The CMS/Search graph remains historical
and acceptance-only; it does not disappear.

Binding sources: [`MASTER-PLAN.md`](../vision/MASTER-PLAN.md),
[`NEXT-SLICE-LEAD-VERTICAL.md`](./NEXT-SLICE-LEAD-VERTICAL.md),
[`GATE-IMPLEMENTATION-CHECKPOINT.md`](./GATE-IMPLEMENTATION-CHECKPOINT.md),
[`ASVS-5.0.0-LEAD-SLICE.md`](../security/ASVS-5.0.0-LEAD-SLICE.md).

Do not create an endless agent loop. One bounded slice at a time.
Stop at OWNER-ONLY or DANGEROUS. CMS-ACCEPT and SEARCH-ACCEPT stay
report-only and are not Lead security acceptance. FZ-SIGN-1 stays
UNDECIDED. FZ-SEARCH-CRAWL-1 stays OPEN.

## Shared rules for every slice

- Lead remains implemented and not security-accepted until named
  evidence exists. Deferred ZAP, Dependency-Check, off-site backup,
  Cloudflare, and live credentials stay visible and never PASS by
  absence.
- Content ≠ CRM. WWW/Admin content rules from ADR-015 stay binding.
- Better Auth remains identity. Core API remains domain authorization.
- Synthetic data only until Owner supplies real copy or credentials.
- No Docker merely to develop on Windows.
- No Cloudflare/DNS/production mutation.
- FZ-SIGN-1 stays UNDECIDED.
- Continuous Improvement, Growth OS, and Connected Ecosystem are not
  a second roadmap.

## Slices

### LEAD-SEC-SESSION

Dependencies: none. Lead Core API is already implemented.
Gate: AUTO.
Status: COMPLETE for staff logout and post-logout invalidation of
Better Auth sessions used by list/get/qualify. MFA and operator
provisioning stay out of scope.
Autonomous: yes.
Accept: HTTP evidence for staff logout and session invalidation after
logout for Better Auth sessions used by list/get/qualify. Close the
ASVS V7 “later” row only where a runtime test exists. Do not claim
MFA or operator provisioning.
Tests: `apps/api/src/postgres.integration.test.mjs` logout case;
`apps/api/src/session.test.mjs` origin checks.
Security: cookies stay origin-checked; tokens do not appear in logs.
Next: LEAD-OUTBOX-SUPERVISOR.

### LEAD-OUTBOX-SUPERVISOR

Dependencies: LEAD-SEC-SESSION.
Gate: AUTO.
Status: COMPLETE for a local supervised outbox loop that restarts
safely, claims with `FOR UPDATE SKIP LOCKED`, records retry/poison,
and does not require a broker. Extends `dispatch-once`.
Autonomous: yes.
Accept: a local supervised outbox loop that restarts safely, claims
with `FOR UPDATE SKIP LOCKED`, records retry/poison, and does not
require a broker. Extends `dispatch-once`; does not invent a cloud
queue.
Tests: `apps/api/src/outbox-supervisor.test.mjs`; claim/retry/poison
remain covered by `postgres.integration.test.mjs`.
Security: payloads stay ids-only where the lead outbox already does;
no PII in supervisor logs.
Next: LEAD-ZAP-BASELINE.

### LEAD-ZAP-BASELINE

Dependencies: LEAD-OUTBOX-SUPERVISOR.
Gate: REVIEW.
Status: COMPLETE as DEFERRED with readiness evidence. Java, ZAP
launcher, and `FZ_ZAP_TARGET_URL` were absent on 2026-09-22.
`node scripts/security/zap-readiness.mjs` returned
`ARMED_WAITING_FOR_TARGET`. No scan was run and no PASS was claimed.
Evidence: `docs/security/ZAP-LEAD-BASELINE-DEFERRED-2026-09-22.json`.
Autonomous: yes.
Accept: OWASP ZAP Automation Framework passive/baseline against a
local synthetic Lead API on loopback, using
`tooling/security/zap/` and `docs/security/ZAP-LEAD-LOCAL.md`. If Java
or ZAP is missing, record DEFERRED with readiness evidence and do not
mark PASS. Never scan CT8 or live customer hosts.
Tests: readiness script plus scan report or explicit DEFERRED record.
Security: synthetic credentials only; no production secrets.
Next: LEAD-SEC-ACCEPT.

### LEAD-SEC-ACCEPT

Dependencies: LEAD-ZAP-BASELINE.
Gate: REVIEW.
Status: COMPLETE as report-only checklist
(`docs/security/LEAD-SEC-ACCEPT-REPORT-2026-09-22.md`). Lead is **not**
security-accepted while ZAP, Dependency-Check, off-site backup,
supervised production worker, and private-origin validation remain
deferred or unmet.
Autonomous: report only.
Entry: Lead security slices recorded.
Accept: checklist report only. Do not mark Lead security-accepted while
ZAP, Dependency-Check, off-site backup, supervised production worker,
or private-origin validation remain deferred or unmet.
Next: none from this report.

### PORTAL-APP

Dependencies: none. ADR-014 already requires `apps/portal` as React
Router Framework Mode.
Gate: REVIEW.
Status: COMPLETE for the SSR signed-out shell. React Router 8.4.0
Framework Mode, Vite 8, React 19. No Tailwind, no font files, no deploy,
no client CRM data.
Autonomous: yes.
Accept: a real `apps/portal` React Router Framework Mode application
in the monorepo, wired into workspace test/typecheck/lint/build, with
root layout, route module, and error boundary. Client-only shell; no
CRM writes; no invented project or offer facts. Separate trust zone
from WWW and Admin. No deploy, DNS, or Cloudflare mutation.
Tests: `apps/portal/app/shell.test.mjs`. `pnpm --filter @forma-zieleni/portal build` succeeds. Client CSS is about 0.93 kB.
Security: anonymous visitors see only the signed-out gate; loaders do
not fetch client project data; `noindex` is set.
Next: CRM-OPPORTUNITY-CONTRACT.

### CRM-OPPORTUNITY-CONTRACT

Dependencies: PORTAL-APP.
Gate: REVIEW.
Status: COMPLETE for OpenAPI + domain Opportunity created only from a
qualified Lead, with staff create/list/get through Core API
authorization. No Admin UI, signing provider, payment path, or portal
projection UI.
Autonomous: yes.
Accept: OpenAPI + `packages/domain` Opportunity created only from a
qualified Lead. No Admin UI, no signing provider, no payment path.
Staff create/list/get only through Core API authorization. Portal may
read a client-safe projection later; this slice does not invent that
UI.
Tests: `packages/domain/opportunity.test.mjs`,
`packages/validation/opportunity.test.mjs`,
`packages/types/opportunity.test.mjs`, `contracts/openapi.test.mjs`,
`apps/api/src/http.test.mjs` opportunity cases.
Security: BOLA on opportunity ids; anonymous callers get 401; no
client-supplied status machine; one Opportunity per Lead.
Next: CRM-OFFER-CONTRACT.

### CRM-OFFER-CONTRACT

Dependencies: CRM-OPPORTUNITY-CONTRACT.
Gate: REVIEW.
Status: COMPLETE for OpenAPI + domain Offer created only from an
existing Opportunity, with staff create/list/get through Core API
authorization. No Admin UI, signing provider, payment capture, or portal
commercial invent.
Autonomous: yes.
Accept: OpenAPI + `packages/domain` Offer created only from an existing
Opportunity. Staff create/list/get through Core API authorization.
Opaque ids; BOLA; no client-supplied price machine that bypasses
domain. No Admin UI, no signing provider, no payment capture, no portal
invent of commercial facts.
Tests: `packages/domain/offer.test.mjs`,
`packages/validation/offer.test.mjs`, `packages/types/offer.test.mjs`,
`contracts/openapi.test.mjs`, `apps/api/src/http.test.mjs` offer cases.
Security: anonymous 401; portal without offer caps 403; BOLA on offer
ids; marketing code cannot mutate commercial terms.
Next: CRM-CONTRACT-DOMAIN.

### CRM-CONTRACT-DOMAIN

Dependencies: CRM-OFFER-CONTRACT.
Gate: REVIEW.
Status: COMPLETE for OpenAPI + domain Contract created only from an
existing Offer, with staff create/list/get through Core API
authorization. No signing-provider SDK, no payment capture, no Admin
ceremony UI. FZ-SIGN-1 provider stays UNDECIDED.
Autonomous: yes.
Accept: OpenAPI + domain Contract (and version) owned by Core API with
explicit lifecycle transitions from an Offer path. Staff create/list/get
only. No signing-provider SDK, no payment capture, no Admin ceremony UI.
FZ-SIGN-1 provider stays UNDECIDED.
Tests: `packages/domain/contract.test.mjs`,
`packages/validation/contract.test.mjs`,
`packages/types/contract.test.mjs`, `contracts/openapi.test.mjs`,
`apps/api/src/http.test.mjs` contract cases.
Security: BOLA on contract ids; anonymous 401; no client-supplied
lifecycle overwrite.
Next: none until a later product slice; payment stays OWNER-DECISION.
Safe pre-provider work may continue via CRM-PROJECT-DOMAIN.

### ADMIN-APP

Dependencies: none. ADR-014 already requires `apps/admin` as React
Router Framework Mode. Unblocks FZ-REQ-ADMIN-001.
Gate: REVIEW.
Status: COMPLETE for a real `apps/admin` React Router Framework Mode
application with root layout, route `/`, error boundary, staff shell
session classification, workspace test/typecheck/lint/build. No invented
CRM writes; no deploy, DNS, or Cloudflare mutation. Separate trust zone
from WWW and Portal.
Autonomous: yes.
Accept: a real `apps/admin` React Router Framework Mode application in
the monorepo, wired into workspace test/typecheck/lint/build, with root
layout, route module, and error boundary. Staff shell only; no invented
CRM writes; no deploy, DNS, or Cloudflare mutation. Separate trust zone
from WWW and Portal.
Tests: `apps/admin/app/shell.test.mjs`, `apps/admin` build.
Security: noindex for non-production; loaders do not invent client
project or offer facts; no anonymous CRM mutations.
Next: none from this shell alone.

### PORTAL-AUTH

Dependencies: PORTAL-APP.
Gate: REVIEW.
Status: COMPLETE for portal trust-zone session classification against
Core API Better Auth identity: signed-out, unauthorized, and signed-in
empty states; `GET /v1/portal/session` identity-only; origin/cookie
helpers. No offer/project/file projection, no payment or signing.
Autonomous: yes.
Accept: client Better Auth identity for the portal trust zone; session
cookie and origin rules; anonymous visitors still see the signed-out
gate. Loaders still must not invent project, offer, or file facts. No
payment or signing ceremony.
Tests: `apps/portal/app/shell.test.mjs`, `apps/api/src/http.test.mjs`
portal session cases, `contracts/openapi.test.mjs`.
Security: cookies origin-checked; tokens absent from logs; BOLA stays in
Core API for later projections.
Next: PORTAL-OFFER-PROJECTION.

### PORTAL-OFFER-PROJECTION

Dependencies: CRM-OFFER-CONTRACT, PORTAL-AUTH.
Gate: REVIEW.
Status: COMPLETE for client-safe Offer projection through Core API
`GET /v1/portal/offers` and `GET /v1/portal/offers/:id`, authorized by
`offers:portal-read` and `clientSubject` BOLA. No staff mutation from
Portal; no price/terms invent; empty list when unbound.
Autonomous: yes.
Accept: client-safe read projection of Offer (and/or Opportunity) the
authenticated client is authorized to see. Authorization in Core API.
No staff mutations from Portal.
Tests: `packages/domain/offer.test.mjs` projection cases,
`apps/api/src/http.test.mjs` portal offer cases,
`contracts/openapi.test.mjs`.
Security: BOLA; anonymous 401; other clients 404; staff portal path 403.
Next: none until a later portal projection.

### CRM-PROJECT-DOMAIN

Dependencies: CRM-CONTRACT-DOMAIN.
Gate: REVIEW.
Status: COMPLETE for OpenAPI + domain Project created only from an
existing Contract, with staff create/list/get through Core API
authorization. No payment provider, no payment capture, no signing SaaS,
no Admin ceremony UI. Payment stays OWNER-DECISION.
Autonomous: yes.
Accept: Project as a first-class Core API domain foundation after
Contract, without a live payment provider or payment capture. Opaque
ids; tenant/authz; BOLA; staff create/list/get minimum. No payment
activation, no signing SaaS, no Admin ceremony UI, no invented client
facts.
Tests: `packages/domain/project.test.mjs`,
`packages/validation/project.test.mjs`,
`packages/types/project.test.mjs`, `contracts/openapi.test.mjs`,
`apps/api/src/http.test.mjs` project cases.
Security: anonymous 401; portal without project caps 403; BOLA.
Next: PORTAL-PROJECT-PROJECTION.

### PORTAL-PROJECT-PROJECTION

Dependencies: CRM-PROJECT-DOMAIN, PORTAL-AUTH.
Gate: REVIEW.
Status: COMPLETE for client-safe Project projection through Core API
`GET /v1/portal/projects` and `GET /v1/portal/projects/:id`, authorized
by `projects:portal-read` and `clientSubject` BOLA. No staff mutation
from Portal; no payment invent; empty list when unbound. Portal shell
still refuses invented CRM facts.
Autonomous: yes.
Accept: client-safe read projection of Project the authenticated portal
client is authorized to see. Authorization in Core API. No staff
mutations from Portal. No invented project facts.
Tests: `packages/domain/project.test.mjs` projection cases,
`apps/api/src/http.test.mjs` portal project cases,
`contracts/openapi.test.mjs`, `apps/portal/app/shell.test.mjs`.
Security: BOLA; anonymous 401; other clients 404; staff portal path 403.
Next: none until a later portal projection.

### SITEINTEL-DATA-BOUNDARY

Dependencies: CRM-CONTRACT-DOMAIN.
Gate: REVIEW.
Status: COMPLETE for DATA → RULES → DOMAIN → AI ordering contract:
`docs/architecture/SITEINTEL-DATA-BOUNDARY.md` plus domain ordering
helpers/tests. No live third-party critical UX, no twin database.
Autonomous: yes.
Accept: document and contract Site Intelligence DATA → RULES → DOMAIN
→ AI ordering for FZ-REQ-SITEINTEL-001. No live third-party dependency
in critical UX; no invented geospatial facts. No twin database.
Tests: `packages/domain/product-boundaries.test.mjs`,
`docs/architecture/SITEINTEL-DATA-BOUNDARY.md`.
Security: no production third-party credentials.
Next: none until a later Site Intelligence runtime slice.

### ATLAS-PROVENANCE-BOUNDARY

Dependencies: CRM-CONTRACT-DOMAIN.
Gate: REVIEW.
Status: COMPLETE for Plant Atlas taxonomy/provenance source-of-truth
boundary: `docs/architecture/ATLAS-PROVENANCE-BOUNDARY.md` plus domain
`atlasProvenanceBoundary()` / tests. Botanical sources stay taxonomic
authorities, not horticultural proof. No atlas runtime UI.
Autonomous: yes.
Accept: document Plant Atlas taxonomy/provenance source-of-truth
boundary for FZ-REQ-ATLAS-002. Botanical sources stay taxonomic
authorities, not horticultural proof. No atlas runtime UI in this
slice.
Tests: `packages/domain/atlas-boundary.test.mjs`,
`docs/architecture/ATLAS-PROVENANCE-BOUNDARY.md`.
Security: no invented plant advice as product truth.
Next: none until a later Atlas product slice.

### MOBILE-CLIENT-BOUNDARY

Dependencies: CRM-CONTRACT-DOMAIN.
Gate: REVIEW.
Status: COMPLETE for mobile client boundary:
`docs/architecture/MOBILE-CLIENT-BOUNDARY.md` plus domain helpers/tests.
Core API remains business truth; no separate mobile domain; apps not
shipped in this slice.
Autonomous: yes.
Accept: document and contract the mobile client boundary for
FZ-REQ-MOBILE-001: Core API remains business truth; no separate mobile
domain; typed client paths only. Do not ship Android/iOS apps in this
slice.
Tests: `packages/domain/product-boundaries.test.mjs`,
`docs/architecture/MOBILE-CLIENT-BOUNDARY.md`.
Security: no second authz path; no production credentials.
Next: none until a later mobile implementation slice.

### SKETCHUP-ADAPTER-BOUNDARY

Dependencies: CRM-CONTRACT-DOMAIN.
Gate: REVIEW.
Status: COMPLETE for SketchUp adapter boundary:
`docs/architecture/SKETCHUP-ADAPTER-BOUNDARY.md` plus domain
helpers/tests. Core API owns identifiers; SketchUp is not business
truth; no plugin runtime.
Autonomous: yes.
Accept: document the SketchUp adapter boundary for FZ-REQ-SKETCHUP-001:
stable project identifiers via Core API; SketchUp is not business truth.
No plugin runtime install in this slice.
Tests: `packages/domain/product-boundaries.test.mjs`,
`docs/architecture/SKETCHUP-ADAPTER-BOUNDARY.md`.
Security: no local business ACL in the plugin.
Next: none until a later plugin slice.

### GARDENOS-RELATION-BOUNDARY

Dependencies: CRM-CONTRACT-DOMAIN.
Gate: REVIEW.
Status: COMPLETE for Garden OS relation boundary:
`docs/architecture/GARDENOS-RELATION-BOUNDARY.md` plus domain
helpers/tests. Relation only; no twin runtime or twin database.
Autonomous: yes.
Accept: document Garden OS as a future client relation for
FZ-REQ-GARDENOS-001, not a digital-twin runtime. No twin database or UI
in this slice.
Tests: `packages/domain/product-boundaries.test.mjs`,
`docs/architecture/GARDENOS-RELATION-BOUNDARY.md`.
Security: no invented live twin data.
Next: GARDENOS-DOMAIN.

### PAY-DOMAIN-NEUTRAL

Dependencies: CRM-CONTRACT-DOMAIN.
Gate: REVIEW.
Status: COMPLETE for a provider-neutral payment schedule and installment
states on a Contract in `packages/domain/src/payment.ts`. Synthetic
amounts only. No provider, charge, webhook, or card data.
Autonomous: yes.
Accept: a provider-neutral payment schedule and states on a contract,
with synthetic amounts only. No provider, no charge, no webhook to a
vendor.
Tests: `packages/domain/payment.test.mjs`.
Security: no card data, no provider secrets.
Next: SIGN-STATE-NEUTRAL.

### SIGN-STATE-NEUTRAL

Dependencies: CRM-CONTRACT-DOMAIN.
Gate: REVIEW.
Status: COMPLETE for contract version lock plus a provider-neutral
signature request record in `packages/domain/src/signing.ts`. No QES
claim and no vendor connection. Signer references are opaque actor ids.
Autonomous: yes.
Accept: contract version lock plus a provider-neutral signature request
record. No QES claim and no vendor connection.
Tests: `packages/domain/signing.test.mjs`,
`packages/domain/contract.test.mjs`.
Security: signer references are ids, not documents from a vendor.
Next: none.

### ADMIN-CRM-LEAD

Dependencies: ADMIN-APP.
Gate: REVIEW.
Status: COMPLETE for staff list and qualify of leads in apps/admin
through Core API `GET /v1/leads` and `POST /v1/leads/:id/qualify`.
Empty, error, and forbidden states are real. No second lead store.
Autonomous: yes.
Accept: staff list and qualify leads in apps/admin through Core API.
Empty, error, and unauthorized states are real. No second lead store
and no invented customers.
Tests: `apps/admin/app/shell.test.mjs` (shell + API-backed qualify
workflow with synthetic fetch).
Security: staff session only; client tokens cannot qualify (Core API).
Next: ADMIN-CRM-OPPORTUNITY.

### ADMIN-CRM-OPPORTUNITY

Dependencies: ADMIN-CRM-LEAD, CRM-OPPORTUNITY-CONTRACT.
Gate: REVIEW.
Status: COMPLETE for staff list and create of opportunities in apps/admin
through Core API `GET /v1/opportunities` and `POST /v1/opportunities`.
Empty, error, and forbidden states are real. No stage, price, or
probability on the list UI. No second opportunity store and no invented
commercial rows.
Autonomous: yes.
Accept: staff list and create opportunities in apps/admin through Core
API. Empty, error, and unauthorized states are real. No second
opportunity store and no invented customers.
Tests: `apps/admin/app/shell.test.mjs` (shell + API-backed opportunity
fetch/create with synthetic fetch).
Security: staff session only; portal tokens cannot create or list staff
opportunities (Core API).
Next: ADMIN-CRM-OFFER.

### ADMIN-CRM-OFFER

Dependencies: ADMIN-CRM-OPPORTUNITY, CRM-OFFER-CONTRACT.
Gate: REVIEW.
Status: COMPLETE for staff list and create of offers in apps/admin
through Core API `GET /v1/offers` and `POST /v1/offers`. Empty, error,
and forbidden states are real. Price stays off the staff list UI. No
second offer store and no invented commercial rows.
Autonomous: yes.
Accept: staff list and create offers in apps/admin through Core API.
Empty, error, and unauthorized states are real. No second offer store,
no price on the list UI, and no invented customers.
Tests: `apps/admin/app/shell.test.mjs` (shell + API-backed offer
fetch/create with synthetic fetch).
Security: staff session only; portal tokens cannot create or list staff
offers (Core API).
Next: ADMIN-CRM-CONTRACT.

### ADMIN-CRM-CONTRACT

Dependencies: ADMIN-CRM-OFFER, CRM-CONTRACT-DOMAIN.
Gate: REVIEW.
Status: COMPLETE for staff list and create of contracts in apps/admin
through Core API `GET /v1/contracts` and `POST /v1/contracts`. Empty,
error, and forbidden states are real. No signing ceremony UI, no
payment UI, no second contract store, and no invented commercial rows.
Autonomous: yes.
Accept: staff list and create contracts in apps/admin through Core API.
Empty, error, and unauthorized states are real. No signing-provider
ceremony, no payment capture, and no invented customers.
Tests: `apps/admin/app/shell.test.mjs` (shell + API-backed contract
fetch/create with synthetic fetch).
Security: staff session only; portal tokens cannot create or list staff
contracts (Core API). FZ-SIGN-1 provider stays UNDECIDED.
Next: ADMIN-CRM-PROJECT.

### ADMIN-CRM-PROJECT

Dependencies: ADMIN-CRM-CONTRACT, CRM-PROJECT-DOMAIN.
Gate: REVIEW.
Status: COMPLETE for staff list and create of projects in apps/admin
through Core API `GET /v1/projects` and `POST /v1/projects`. Empty,
error, and forbidden states are real. `contractId` only on create. No
payment UI, no signing ceremony, no second project store, and no
invented commercial rows.
Autonomous: yes.
Accept: staff list and create projects in apps/admin through Core API.
Empty, error, and unauthorized states are real. No payment capture, no
signing-provider ceremony, and no invented customers.
Tests: `apps/admin/app/shell.test.mjs` (shell + API-backed project
fetch/create with synthetic fetch).
Security: staff session only; portal tokens cannot create or list staff
projects (Core API).
Next: ADMIN-CRM-FILE.

### ADMIN-CRM-FILE

Dependencies: ADMIN-CRM-PROJECT.
Gate: REVIEW.
Status: COMPLETE for staff list and create of project file metadata in
apps/admin through Core API `GET /v1/files` and `POST /v1/files`.
Empty, error, and forbidden states are real. Metadata-only create
(`projectId`, `name`, `mimeType`, `sizeBytes`). No binary upload UI,
no storage keys on the staff list projection, no second file store,
and no invented file rows.
Autonomous: yes.
Accept: staff list and create file metadata in apps/admin through Core
API. Empty, error, and unauthorized states are real. No binary upload,
no storage provider ceremony, and no invented customers.
Tests: `apps/admin/app/shell.test.mjs` (shell + API-backed file
fetch/create with synthetic fetch); `apps/api/src/http.test.mjs` (staff
list, portal forbidden on staff route, empty page).
Security: staff session only; portal tokens cannot list staff files
(Core API).
Next: FILE-BYTES-LOCAL.

### MOBILE-ANDROID-FOUNDATION

Dependencies: MOBILE-CLIENT-BOUNDARY.
Gate: REVIEW.
Status: COMPLETE for an Android-surface client foundation in
`apps/mobile-android` that probes Core API `/v1/health` and `/v1/ready`
through typed api-client paths. No on-device commercial state, no Play
credentials, no store upload.
Autonomous: yes.
Accept: an Android client foundation that calls Core API and does not
own commercial state.
Tests: `apps/mobile-android/foundation.test.mjs`. No store upload.
Security: no production credentials in the tree.
Next: none.

### MOBILE-IOS-FOUNDATION

Dependencies: MOBILE-CLIENT-BOUNDARY.
Gate: REVIEW.
Status: COMPLETE for an iOS-surface client foundation in
`apps/mobile-ios` that probes Core API `/v1/health` and `/v1/ready`
through typed api-client paths. No on-device commercial state, no App
Store credentials, no store upload.
Autonomous: yes.
Accept: an iOS client foundation that calls Core API and does not own
commercial state.
Tests: `apps/mobile-ios/foundation.test.mjs`. No store upload.
Security: no production credentials in the tree.
Next: none.

### GARDENOS-DOMAIN

Dependencies: GARDENOS-RELATION-BOUNDARY.
Gate: REVIEW.
Status: COMPLETE for Core API domain Garden linked only to a
`delivered` Project, with clientSubject BOLA and no twin/live invent.
`deliverProject()` unlocks linkage. No twin database, no HTTP garden
routes, no Garden OS UI.
Autonomous: yes.
Accept: a Core API garden record linked to a delivered project. No twin
database and no invented live garden.
Tests: `packages/domain/garden.test.mjs`,
`packages/domain/project.test.mjs` delivery cases,
`docs/architecture/GARDENOS-DOMAIN.md`.
Security: client isolation matches the project owner.
Next: none.

### SITEINTEL-RULES

Dependencies: SITEINTEL-DATA-BOUNDARY.
Gate: REVIEW.
Status: COMPLETE for rules over normalized site observations
(`docs/architecture/SITEINTEL-RULES.md` plus domain helpers/tests).
AI cannot invent site facts ahead of those rules. No third-party
credentials.
Autonomous: yes.
Accept: rules over normalized site observations. AI cannot invent site
facts ahead of those rules.
Tests: `packages/domain/product-boundaries.test.mjs`,
`docs/architecture/SITEINTEL-RULES.md`.
Security: no third-party credentials.
Next: SITEINTEL-DOMAIN.

### SITEINTEL-DOMAIN

Dependencies: SITEINTEL-RULES.
Gate: REVIEW.
Status: COMPLETE for Core API domain records of site constraints and
opportunities from RULES output (`docs/architecture/SITEINTEL-DOMAIN.md`
plus domain helpers/tests). AI cannot write those records. No HTTP site
API, twin database, live third-party calls, or production credentials.
Autonomous: yes.
Accept: Core API domain records of site constraints and opportunities
produced only from Site Intelligence rules output over normalized
observations. AI cannot write those records. No HTTP site API, no twin
database, no live third-party calls, and no production credentials.
Tests: `packages/domain/site-intelligence.test.mjs`,
`docs/architecture/SITEINTEL-DOMAIN.md`.
Security: no third-party credentials; client site facts stay on the
owning project.
Next: none.

### ATLAS-PLANT-IDENTITY

Dependencies: ATLAS-PROVENANCE-BOUNDARY.
Gate: REVIEW.
Status: COMPLETE for Core API domain PlantIdentity with taxonomic
citations (not horticultural proof), draft→approved, and no cultivation
claims. No public Atlas UI.
Autonomous: yes.
Accept: a plant identity record distinct from taxonomic-source proof.
No invented cultivation claims.
Tests: `packages/domain/plant-identity.test.mjs`,
`docs/architecture/ATLAS-PLANT-IDENTITY.md`.
Security: sources stay citations, not product truth.
Next: ATLAS-PUBLIC-SURFACE.

### ATLAS-PUBLIC-SURFACE

Dependencies: ATLAS-PLANT-IDENTITY.
Gate: REVIEW.
Status: COMPLETE for domain public projection of approved PlantIdentity
with taxonomic citations only. Drafts stay off the response. No
cultivation claims and no full WWW Atlas UI.
Autonomous: yes.
Accept: a public surface lists approved plant identities and their
taxonomic citations. It does not state cultivation advice as fact.
Tests: `packages/domain/plant-identity.test.mjs` public projection cases,
`docs/architecture/ATLAS-PUBLIC-SURFACE.md`.
Security: unpublished identities stay off the public response.
Next: ATLAS-WWW-SURFACE.

### ATLAS-WWW-SURFACE

Dependencies: ATLAS-PUBLIC-SURFACE.
Gate: REVIEW.
Status: COMPLETE for a public WWW Atlas page that lists approved plant
identities from the public projection and shows taxonomic citations
only (`apps/web/app/atlas-projection.ts`, `/atlas`). No cultivation
claims, no live third-party scrapers, and no invented SEO copy. Empty
catalog is an honest empty state.
Autonomous: yes.
Accept: `apps/web` renders an Atlas route from the public plant
projection contract. Drafts stay off the page. Citations link to named
botanical authorities. Empty catalog is an honest empty state.
Tests: `apps/web/app/atlas-projection.test.mjs`,
`docs/architecture/ATLAS-WWW-SURFACE.md`.
Security: no cultivation advice as product truth; no private plant
fields on the public response.
Next: none.

### SKETCHUP-PROJECT-MAP

Dependencies: SKETCHUP-ADAPTER-BOUNDARY.
Gate: REVIEW.
Status: COMPLETE for SketchUp model → Core API project id mapping
(`docs/architecture/SKETCHUP-PROJECT-MAP.md` plus domain helpers/tests).
The plugin does not own price, contract, or customer truth. No local
business ACL.
Autonomous: yes.
Accept: a mapping from a SketchUp model reference to a Core API project
id. The plugin does not own price, contract, or customer truth.
Tests: `packages/domain/product-boundaries.test.mjs`,
`docs/architecture/SKETCHUP-PROJECT-MAP.md`.
Security: no local business ACL.
Next: none.

### PORTAL-FILE-PROJECTION

Dependencies: PORTAL-PROJECT-PROJECTION.
Gate: REVIEW.
Status: COMPLETE.
Autonomous: yes.
Accept: an authenticated client sees only their project files. Staff
files and other clients' files stay hidden.
Tests: HTTP authorization tests with synthetic file ids.
Security: BOLA denied for another client's file.
Next: none.

### WWW-PORTFOLIO-PROJECTION

Dependencies: CRM-PROJECT-DOMAIN.
Gate: REVIEW.
Status: COMPLETE for a pure public portfolio projection
(`apps/web/app/portfolio-projection.ts`). Sales portfolio UI and CMS
case-study pages stay later.
Autonomous: yes.
Accept: the public site can project a project only when it is marked
for publication. Concept and illustrative projects stay distinct. No
invented awards or prices.
Tests: `apps/web/app/portfolio-projection.test.mjs` with synthetic
projects.
Security: private project fields stay off the public response.
Next: WWW-LEAD-CAPTURE.

### PXI-SIGNAL-MODEL

Dependencies: ADMIN-APP.
Gate: REVIEW.
Status: COMPLETE for a versioned experience-signal contract
(`packages/domain/src/pxi.ts`). Production telemetry stays off.
Autonomous: yes.
Accept: a versioned experience-signal contract that rejects email,
phone, and message bodies, keeps replay off, and refuses a universal
experience score.
Tests: `packages/domain/pxi.test.mjs`; growth `recordBehavior` stays a
thin alias of `recordExperienceSignal`.
Security: no customer PII and no replay payload.
Next: none.

## FZ-CONTINUE-1 — authorized depth while Owner gates stay deferred

Owner authorization 2026-09-24:
[`OWNER-AUTHORIZATION-FZ-CONTINUE-1.md`](./OWNER-AUTHORIZATION-FZ-CONTINUE-1.md).
Provider picks, hosting, crawl policy, Cloudflare, secrets, spend, and
live data stay gated. These slices deepen product surfaces with
provider-neutral and local-only work.

### FILE-BYTES-LOCAL

Dependencies: ADMIN-CRM-FILE.
Gate: REVIEW.
Status: OPEN.
Autonomous: yes.
Accept: Core API stores and serves project file **bytes** through the
already-decided local private adapter (FZ-A4). Checksummed immutable
object under a non-guessable key. Download only through authorized Core
API. No Garage, no public URL as ACL, no production object store, no
provider pick.
Tests: domain or API tests for store/get/deny; BOLA on file id; portal
cannot use staff byte routes.
Security: staff/portal authorization unchanged; no storage keys in
logs; synthetic bytes only.
Next: ADMIN-FILE-BYTES.

### ADMIN-FILE-BYTES

Dependencies: FILE-BYTES-LOCAL.
Gate: REVIEW.
Status: OPEN.
Autonomous: yes.
Accept: staff upload and download of project file bytes in `apps/admin`
through Core API only. Empty, error, and forbidden states are real. No
second store and no invented files.
Tests: `apps/admin` shell/API-backed tests with synthetic bytes.
Security: staff session only; no client MIME trust beyond server sniff
or allowlist already used by media rules where applicable.
Next: none.

### WWW-LEAD-CAPTURE

Dependencies: none. WWW shell and public `POST /leads` already exist.
Gate: REVIEW.
Status: OPEN.
Autonomous: yes.
Accept: a real public lead-capture form on `apps/web` that posts to
Core API `POST /leads`. Synthetic copy only. No invented business
facts, no second lead store, no CRM write from WWW loaders.
Tests: web route/form test plus API contract already covering capture.
Security: anonymous capture only; no staff tokens in the browser; rate
limits remain on the API.
Next: CAPACITY-DOMAIN.

### CAPACITY-DOMAIN

Dependencies: WWW-LEAD-CAPTURE.
Gate: REVIEW.
Status: OPEN.
Autonomous: yes.
Accept: Core API / domain Capacity that records owner/designer
availability windows and refuses a promised consultation or start date
outside capacity. No calendar SaaS, no Google hard-wire, no spend.
Tests: domain tests for refuse-outside-capacity; no PII in capacity
rows beyond actor ids if needed.
Security: staff-only mutation; public cannot read raw capacity.
Next: PROJECT-MILESTONE-DOMAIN.

### PROJECT-MILESTONE-DOMAIN

Dependencies: CAPACITY-DOMAIN, CRM-PROJECT-DOMAIN.
Gate: REVIEW.
Status: OPEN.
Autonomous: yes.
Accept: OpenAPI + domain Project milestones and a decision/change-order
log owned by Core API. No payment, no signing provider, no portal UI in
this slice.
Tests: domain + OpenAPI + HTTP create/list with BOLA.
Security: staff capabilities only; client cannot mutate milestones.
Next: SIGN-LIFECYCLE-STAFF.

### SIGN-LIFECYCLE-STAFF

Dependencies: PROJECT-MILESTONE-DOMAIN, ADMIN-CRM-CONTRACT, SIGN-STATE-NEUTRAL.
Gate: REVIEW.
Status: OPEN.
Autonomous: yes.
Accept: staff can advance provider-neutral contract lifecycle states
already owned by Core API (for example DRAFT → INTERNAL_REVIEW →
APPROVED → SENT) in `apps/admin`. No signing vendor, no ceremony, no
QES claim, no webhook to a SaaS.
Tests: admin + API transition tests; illegal transitions rejected.
Security: staff session only; audit without contract body PII in logs.
Next: PAY-SCHEDULE-STAFF.

### PAY-SCHEDULE-STAFF

Dependencies: SIGN-LIFECYCLE-STAFF, PAY-DOMAIN-NEUTRAL.
Gate: REVIEW.
Status: OPEN.
Autonomous: yes.
Accept: staff can view and adjust the provider-neutral payment schedule
on a Contract in `apps/admin`. No payment provider, no charge, no BLIK,
no card, no money movement.
Tests: admin + API schedule tests; amount fields stay server-validated.
Security: staff only; no provider secrets; no real payment action.
Next: PORTAL-OFFER-VIEW.

### PORTAL-OFFER-VIEW

Dependencies: PAY-SCHEDULE-STAFF, PORTAL-OFFER-PROJECTION.
Gate: REVIEW.
Status: OPEN.
Autonomous: yes.
Accept: authenticated portal UI renders the existing client-safe Offer
projection. Price/terms stay off if the projection already omits them.
No staff mutation from Portal.
Tests: portal route/view tests with synthetic projection.
Security: clientSubject isolation; no staff tokens.
Next: PORTAL-PROJECT-VIEW.

### PORTAL-PROJECT-VIEW

Dependencies: PORTAL-OFFER-VIEW, PORTAL-PROJECT-PROJECTION.
Gate: REVIEW.
Status: OPEN.
Autonomous: yes.
Accept: authenticated portal UI renders the existing client-safe Project
projection and metadata-only files already exposed. No upload from
Portal in this slice unless FILE-BYTES-LOCAL already defines a client
path (default: no).
Tests: portal route/view tests; BOLA denied for another client.
Security: clientSubject isolation.
Next: ADMIN-APPROVAL-SURFACE.

### ADMIN-APPROVAL-SURFACE

Dependencies: PORTAL-PROJECT-VIEW, ADMIN-APP.
Gate: REVIEW.
Status: OPEN.
Autonomous: yes.
Accept: staff approval UI in `apps/admin` for the existing Agnieszka
approval domain actions (edit / partial approve / approve / reject /
defer) over synthetic proposals. Cannot override Owner, spend, price,
or live publication gates.
Tests: admin UI + domain/API wiring tests.
Security: staff capabilities; AI cannot overwrite human-locked fields.
Next: GARDENOS-HTTP.

### GARDENOS-HTTP

Dependencies: ADMIN-APPROVAL-SURFACE, GARDENOS-DOMAIN.
Gate: REVIEW.
Status: OPEN.
Autonomous: yes.
Accept: Core API HTTP routes for Garden records already modeled in
domain. No digital-twin runtime, no XR, no invented plant advice.
Tests: HTTP create/list/get with BOLA; portal read only if a safe
projection already exists (otherwise staff-only).
Security: authorization in Core API; no twin claim.
Next: SITEINTEL-HTTP.

### SITEINTEL-HTTP

Dependencies: GARDENOS-HTTP, SITEINTEL-DOMAIN.
Gate: REVIEW.
Status: OPEN.
Autonomous: yes.
Accept: Core API HTTP routes for Site Intelligence domain records from
rules output. No live Geoportal credentials, no AI conclusion stage, no
production crawl.
Tests: HTTP + BOLA; AI cannot invent site facts.
Security: staff-only writes; synthetic observations only.
Next: none.

## Deferred and Owner-gated (visible, not READY)

| Item | Gate | Note |
|---|---|---|
| Dependency-Check SCA | DEFERRED | `pnpm audit` covers npm today; Java/NVD install is not justified solely to invent PASS. Does **not** block Offer/Admin/Portal product slices. |
| Off-site backup / restic-pgBackRest | later staging | Local dump/restore exists; off-site is not this graph’s first READY |
| OpenObserve / Garage / Compose staging | later | Gate A horizons, not Lead acceptance |
| Cloudflare Tunnel / DNS / private-origin | DANGEROUS | Owner approval required |
| FZ-SIGN-1 provider | OWNER-DECISION | UNDECIDED; FZ-CONTINUE-1 authorizes neutral lifecycle staff UI only |
| Payment provider | OWNER-DECISION | FZ-REQ-PAY-001; no transactions; schedule staff UI only |
| FZ-SEARCH-CRAWL-1 | OWNER-DECISION | OPEN; continue does not invent crawl policy |
| Production hosting | OWNER-DECISION | UNDECIDED; no deploy |
| CMS-ACCEPT / SEARCH-ACCEPT | report only | Stay on the CMS graph; not a global MAIN product barrier |
| Lead security acceptance | OPEN | Blocks only claims of Lead security-accepted; does **not** block Offer/Admin/Portal |
| ZAP ARMED_WAITING_FOR_TARGET | DEFERRED | Truthful; does **not** block unrelated product slices |
| MFA / operator provisioning UI | later | ASVS V6 later row |
| FZ-CONTINUE-1 | AUTHORIZED | Defer open Owner gates; keep DANGEROUS/OWNER-ONLY |

## Continuous improvement

Not a second roadmap. Binding rules:
[`FZ-CONTINUOUS-IMPROVEMENT.md`](./FZ-CONTINUOUS-IMPROVEMENT.md).
Do not mark Lead or CMS security-accepted from learning alone.
