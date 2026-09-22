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
Status: OPEN.
Autonomous: yes.
Accept: OpenAPI + domain Contract (and version) owned by Core API with
explicit lifecycle transitions from an Offer path. Staff create/list/get
only. No signing-provider SDK, no payment capture, no Admin ceremony UI.
FZ-SIGN-1 provider stays UNDECIDED.
Tests: domain and contract tests plus Core API authz.
Security: BOLA on contract ids; anonymous 401; no client-supplied
lifecycle overwrite.
Next: none until a later product slice; payment stays OWNER-DECISION.

### ADMIN-APP

Dependencies: none. ADR-014 already requires `apps/admin` as React
Router Framework Mode. Unblocks FZ-REQ-ADMIN-001.
Gate: REVIEW.
Status: OPEN.
Autonomous: yes.
Accept: a real `apps/admin` React Router Framework Mode application in
the monorepo, wired into workspace test/typecheck/lint/build, with root
layout, route module, and error boundary. Staff shell only; no invented
CRM writes; no deploy, DNS, or Cloudflare mutation. Separate trust zone
from WWW and Portal.
Tests: `apps/admin` shell test and build.
Security: noindex for non-production; loaders do not invent client
project or offer facts; no anonymous CRM mutations.
Next: none from this shell alone.

### PORTAL-AUTH

Dependencies: PORTAL-APP.
Gate: REVIEW.
Status: OPEN.
Autonomous: yes.
Accept: client Better Auth identity for the portal trust zone; session
cookie and origin rules; anonymous visitors still see the signed-out
gate. Loaders still must not invent project, offer, or file facts. No
payment or signing ceremony.
Tests: portal session/auth HTTP or route tests.
Security: cookies origin-checked; tokens absent from logs; BOLA stays in
Core API for later projections.
Next: PORTAL-OFFER-PROJECTION.

### PORTAL-OFFER-PROJECTION

Dependencies: CRM-OFFER-CONTRACT, PORTAL-AUTH.
Gate: REVIEW.
Status: OPEN.
Autonomous: yes.
Accept: client-safe read projection of Offer (and/or Opportunity) the
authenticated client is authorized to see. Authorization in Core API.
No staff mutations from Portal.
Tests: Core API projection authz tests; portal loader refuses invented
facts.
Security: BOLA; anonymous 401; other clients 403.
Next: none until a later portal projection.

### MOBILE-CLIENT-BOUNDARY

Dependencies: CRM-CONTRACT-DOMAIN.
Gate: REVIEW.
Status: OPEN.
Autonomous: yes.
Accept: document and contract the mobile client boundary for
FZ-REQ-MOBILE-001: Core API remains business truth; no separate mobile
domain; typed client paths only. Do not ship Android/iOS apps in this
slice.
Tests: contract/path tests or documented inventory check.
Security: no second authz path; no production credentials.
Next: none until a later mobile implementation slice.

### SKETCHUP-ADAPTER-BOUNDARY

Dependencies: CRM-CONTRACT-DOMAIN.
Gate: REVIEW.
Status: OPEN.
Autonomous: yes.
Accept: document the SketchUp adapter boundary for FZ-REQ-SKETCHUP-001:
stable project identifiers via Core API; SketchUp is not business truth.
No plugin runtime install in this slice.
Tests: documentation/contract check against Canon.
Security: no local business ACL in the plugin.
Next: none until a later plugin slice.

### GARDENOS-RELATION-BOUNDARY

Dependencies: CRM-CONTRACT-DOMAIN.
Gate: REVIEW.
Status: OPEN.
Autonomous: yes.
Accept: document Garden OS as a future client relation for
FZ-REQ-GARDENOS-001, not a digital-twin runtime. No twin database or UI
in this slice.
Tests: documentation/registry check.
Security: no invented live twin data.
Next: none until a later Garden OS product slice.

## Deferred and Owner-gated (visible, not READY)

| Item | Gate | Note |
|---|---|---|
| Dependency-Check SCA | DEFERRED | `pnpm audit` covers npm today; Java/NVD install is not justified solely to invent PASS. Does **not** block Offer/Admin/Portal product slices. |
| Off-site backup / restic-pgBackRest | later staging | Local dump/restore exists; off-site is not this graph’s first READY |
| OpenObserve / Garage / Compose staging | later | Gate A horizons, not Lead acceptance |
| Cloudflare Tunnel / DNS / private-origin | DANGEROUS | Owner approval required |
| FZ-SIGN-1 provider | OWNER-DECISION | UNDECIDED; does not block Contract domain without a SaaS adapter |
| Payment provider | OWNER-DECISION | FZ-REQ-PAY-001; no transactions |
| FZ-SEARCH-CRAWL-1 | OWNER-DECISION | OPEN |
| CMS-ACCEPT / SEARCH-ACCEPT | report only | Stay on the CMS graph; not a global MAIN product barrier |
| Lead security acceptance | OPEN | Blocks only claims of Lead security-accepted; does **not** block Offer/Admin/Portal |
| ZAP ARMED_WAITING_FOR_TARGET | DEFERRED | Truthful; does **not** block unrelated product slices |
| MFA / operator provisioning UI | later | ASVS V6 later row |

## Continuous improvement

Not a second roadmap. Binding rules:
[`FZ-CONTINUOUS-IMPROVEMENT.md`](./FZ-CONTINUOUS-IMPROVEMENT.md).
Do not mark Lead or CMS security-accepted from learning alone.
