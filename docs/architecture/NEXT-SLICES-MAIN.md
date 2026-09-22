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
Status: OPEN.
Autonomous: yes.
Accept: HTTP evidence for staff logout and session invalidation after
logout for Better Auth sessions used by list/get/qualify. Close the
ASVS V7 “later” row only where a runtime test exists. Do not claim
MFA or operator provisioning.
Tests: `apps/api` HTTP session tests.
Security: cookies stay origin-checked; tokens do not appear in logs.
Next: LEAD-OUTBOX-SUPERVISOR.

### LEAD-OUTBOX-SUPERVISOR

Dependencies: LEAD-SEC-SESSION.
Gate: AUTO.
Status: OPEN.
Autonomous: yes.
Accept: a local supervised outbox loop that restarts safely, claims
with `FOR UPDATE SKIP LOCKED`, records retry/poison, and does not
require a broker. Extends `dispatch-once`; does not invent a cloud
queue.
Tests: `apps/api` outbox supervisor tests.
Security: payloads stay ids-only where the lead outbox already does;
no PII in supervisor logs.
Next: LEAD-ZAP-BASELINE.

### LEAD-ZAP-BASELINE

Dependencies: LEAD-OUTBOX-SUPERVISOR.
Gate: REVIEW.
Status: OPEN.
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
Status: OPEN.
Autonomous: yes.
Accept: OpenAPI + `packages/domain` Opportunity created only from a
qualified Lead. No Admin UI, no signing provider, no payment path.
Staff create/list/get only through Core API authorization. Portal may
read a client-safe projection later; this slice does not invent that
UI.
Tests: domain and contract tests.
Security: BOLA on opportunity ids; anonymous callers get 401; no
client-supplied status machine.
Next: none until a later roadmap refresh.

## Deferred and Owner-gated (visible, not READY)

| Item | Gate | Note |
|---|---|---|
| Dependency-Check SCA | DEFERRED | `pnpm audit` covers npm today; Java/NVD install is not justified solely to invent PASS |
| Off-site backup / restic-pgBackRest | later staging | Local dump/restore exists; off-site is not this graph’s first READY |
| OpenObserve / Garage / Compose staging | later | Gate A horizons, not Lead acceptance |
| Cloudflare Tunnel / DNS / private-origin | DANGEROUS | Owner approval required |
| FZ-SIGN-1 provider | OWNER-DECISION | UNDECIDED |
| FZ-SEARCH-CRAWL-1 | OWNER-DECISION | OPEN |
| CMS-ACCEPT / SEARCH-ACCEPT | report only | Stay on the CMS graph; not Lead security acceptance |
| MFA / operator provisioning UI | later | ASVS V6 later row |

## Continuous improvement

Not a second roadmap. Binding rules:
[`FZ-CONTINUOUS-IMPROVEMENT.md`](./FZ-CONTINUOUS-IMPROVEMENT.md).
Do not mark Lead or CMS security-accepted from learning alone.
