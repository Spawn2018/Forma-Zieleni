# Current architecture and decision boundaries

Status: **CURRENT / BINDING** architecture entrypoint for Forma Zieleni.

All active docs, Cursor rules and agents must treat this file as the sole binding architecture source of truth. Do not use `ARCHITECTURE.md` as a second current architecture.

Related decision sources (different roles — not architecture duplicates):
- Formal ADR history: [`DECISIONS.md`](./DECISIONS.md)
- Current override ledger after F-RESET v2 baseline: [`../knowledge/POST-V2-DECISIONS.md`](../knowledge/POST-V2-DECISIONS.md)

Rule: **latest explicit owner decision wins; history remains traceable.**

---

## Decided

- Public monorepo; direct `main` workflow by owner decision.
- pnpm / Turborepo repository foundation; current local Node 24 / pnpm 10 environment.
- Product boundaries: `apps/web`, `apps/portal`, `apps/admin`, `apps/api`; mobile later.
- API-first **modular monolith**; OpenAPI **3.0.x** (current target/reference **3.0.4**); event-driven core + **transactional outbox**.
- **Core API + canonical domain database** are the system of record; external providers are adapters, not business truth.
- Cloudflare is **public/security ingress**; target origin is **private**.
- Environments required: **dev**, **staging**, **production**.
- Shared packages intended: `ui`, `config`, `types`, `api-client`, `domain`, `validation`.
- Workspace does **not** use `services/*` on start (automations live inside the API modular boundary until evidence justifies otherwise).
- AI architecture: **DATA → RULES → DOMAIN → AI**. AI may interpret/propose/automate; it is never botanical, financial, authorization or domain truth.
- Authorization is always **server-side**.
- Current CT8 production remains **legacy** and is **not** yet a private origin; do not rebuild or tune CT8 during new-product development.

## Explicitly undecided

Application frameworks; API framework/runtime; database provider/engine; ORM; hosting/compute; object storage; payment provider; observability backend; CMS; auth library; deployment provider.

Legacy Astro / Sanity / **Cloudflare Workers / D1 / R2 / Pages** / wrangler choices do **not** decide these.

### Cloudflare product boundary (important)

| Concern | Status |
|---------|--------|
| Cloudflare as public/security ingress | **Approved direction** |
| Private origin behind Cloudflare | **Approved target**; not implemented for CT8 yet |
| Cloudflare Workers | **UNDECIDED** |
| Cloudflare D1 | **UNDECIDED** |
| Cloudflare R2 | **UNDECIDED** |
| Cloudflare Pages | **UNDECIDED** |

Cursor Cloudflare tooling (including an enabled editor plugin) is for ingress/security/docs context only. It must **not** be interpreted as selecting Workers, D1, R2 or Pages as the application stack.

---

## System shape

### Purpose

Production platform for a garden-design practice: public sales WWW, client portal, admin / CRM / Revenue OS, Core API, offers/contracts/payments, projects/files, Site Intelligence, Plant Knowledge Graph, Garden OS, automations/integrations; later mobile and SketchUp — all against the same Core API.

### Modular monolith

One deployable Core API with explicit domain-module boundaries.

- Shared canonical database for domain data.
- Modules communicate through explicit internal APIs / domain events — not by reaching into each other's tables.
- Extract separate services only when evidence justifies (scale, failure isolation, independent lifecycle).

### API-first

- External HTTP contract exists before (or strictly above) UI implementation.
- `web`, `portal`, `admin`, future mobile, SketchUp and integrations consume the **same** Core API.
- No hidden “UI-only” endpoints.

### OpenAPI 3.0.x

- HTTP surface is defined in OpenAPI 3.0.x (target/reference 3.0.4).
- Types and clients are derived from the contract (intended codegen → `packages/types`, `packages/api-client`).

### Current OpenAPI status

There is **no** approved current OpenAPI contract in the active tree yet.

`legacy/freset-v2-full/contracts/openapi.yaml` (and copies under knowledge provenance) is **LEGACY / REFERENCE only**. It does **not** complete Master Plan Gate B and must **not** be implemented as the live contract without a new approved **API Contract** slice.

### Domain data source of truth

**Core API + its database** are the only canonical domain store.

- Frontends do not hold canonical business state.
- AI is not a source of truth.
- Caches, search indexes and read-model projections are derived and rebuildable.

### Event-driven core + transactional outbox

Domain mutations emit events. Automations, notifications and projections consume them. External integrations that change domain state must not bypass the event model where it applies.

Reliable publication uses a **transactional outbox**:

1. In one DB transaction: persist domain state + outbox row.
2. A publisher/worker publishes outbox rows asynchronously.
3. Consumers are idempotent where required.

Goal: no lost events if the process dies between commit and publish.

### DATA → RULES → DOMAIN → AI

| Layer | Role |
|-------|------|
| DATA | Persisted facts (measurement, contract, payment, file, event) |
| RULES | Explicit validation and policy |
| DOMAIN | Business decisions and behavior |
| AI | Assistance and proposals — never canonical state |

AI may propose; the system accepts only after domain rules and server-side authorization.

### Client applications

| Surface | Role |
|---------|------|
| `apps/web` | Public sales WWW |
| `apps/portal` | Separate client portal |
| `apps/admin` | Admin / CRM / operations UI |
| `apps/api` | Core API (modular monolith) |
| mobile (later) | Native clients — same API |
| SketchUp (later) | Integration — same API |

UI apps are not sources of truth. Authz is always server-side.

### Shared packages (intended)

- `packages/ui` — UI primitives (no business rules)
- `packages/config` — shared tooling config
- `packages/types` — shared / generated types
- `packages/api-client` — typed API client
- `packages/domain` — domain rules
- `packages/validation` — shared schemas (server remains authoritative)

---

## Integration model

Google Calendar / Gmail / Drive, Fakturownia, Meta, payment provider, Cloudflare and AI providers are **reconnectable adapters**. Test accounts must never be hard-wired as production identity. Action tools require authz, approval and audit appropriate to risk.

---

## Security test baseline

AUTH, BOLA, BFLA, BOPLA, IDOR, CSRF, CORS, SSRF, uploads, webhooks, rate/resource abuse, sessions/magic links, file access, admin escalation, tenant/object isolation, secrets/PII/logging, backup/restore.

Detail and checklists: [`SECURITY.md`](./SECURITY.md).

---

## Out of scope for this document

- Choosing application or API frameworks
- Implementing domain modules
- Requiring Docker
- Adding `apps/mobile` before an approved stage
- Treating legacy OpenAPI or legacy stack choices as current decisions

---

## Related documents

- [`SECURITY.md`](./SECURITY.md) — security requirements
- [`DECISIONS.md`](./DECISIONS.md) — formal ADR history
- [`../knowledge/POST-V2-DECISIONS.md`](../knowledge/POST-V2-DECISIONS.md) — current override decision ledger
- [`../api/API-FIRST.md`](../api/API-FIRST.md) — API-first rules and Gate B posture
- [`../domain/DOMAIN-MAP.md`](../domain/DOMAIN-MAP.md) — planned domain modules
- [`../vision/PRODUCT-CANON.md`](../vision/PRODUCT-CANON.md) — product truth
- [`../vision/MASTER-PLAN.md`](../vision/MASTER-PLAN.md) — staged program
