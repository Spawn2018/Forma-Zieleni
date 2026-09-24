# Current architecture and decision boundaries

Status: CURRENT. Gate A architecture selection is DECIDED (2026-09-21,
ADR-014). Implementation and security acceptance are not complete.

## Runtime

- Node 24
- pnpm 10
- Turborepo

## Applications

- `apps/api` = Hono on Node 24. Core API remains canonical. Lead capture/qualification, staff Opportunity/Offer/Contract/Project/File create/list/get, and portal offer/project/file projections are live in the current tree.
- `apps/web` = React Router Framework Mode. The shell reads one published title from Core API `GET /v1/content/:id` and does not invent public copy.
- `apps/portal` = React Router Framework Mode. Portal trust-zone session
  classification (signed-out / unauthorized / signed-in empty). Does not
  invent project, offer, or file facts. Core API exposes client-safe
  offer, project, and file metadata projections under `/v1/portal/*`.
- `apps/admin` = README only until ADMIN-APP ships a real React Router app.
- WWW, Portal and Admin stay separate applications and trust zones.
- React Router loaders and actions may act as BFF adapters only. They
  are not domain or business truth.
- Android, iOS, SketchUp and future agents consume the Core API
  contract, not frontend framework internals.
- Mobile is later.

## Data

- PostgreSQL is the persistence truth.
- Kysely is the typed SQL and data-access layer. It does not replace
  SQL or database semantics.
- Transactional outbox remains binding (ADR-004).
- Prisma and other ORMs are not introduced.

## Identity

- Phased protocol-ready embedded auth.
- NOW: Better Auth.
- Preserve a stable `actorId`, issuer/`sub` mapping, separate conceptual
  client identities for web, portal, admin, mobile, SketchUp and
  machine-to-machine, and PKCE for public clients where applicable.
- Domain BOLA, BFLA and BOPLA stay exclusively in Core API.
- No dedicated identity provider is deployed now. A later issuer
  migration must not move domain ACLs.

## Files

- NOW: local gitignored private file storage.
- Files stay private, versioned and checksummed, and are authorized
  through Core API.
- A public bucket URL is not authorization.
- LATER staging direction: Garage. That direction is not an irrevocable
  production selection.
- Production object storage remains a later Owner decision.
- Public content media is not a private business file. FZ-CMS-1 is
  DECIDED (ADR-015): ApostropheCMS on PostgreSQL is the content
  engine; Apostrophe native visual editing is the initial direction;
  Forma Zieleni owns the media pipeline
  (`VISUAL=vendor-native`, `MEDIA=fz-pipeline`). Apostrophe is not
  CRM, Lead, Contract, Payment, business Project, Core API
  authorization, or private file authority. Puck is not a default.
  The 2026-09-21 lab did not execute the vendor Admin UI or
  PostgreSQL. CMS-ACCEPT is not granted.
- Published WWW content is a projection. The last published snapshot
  remains servable if the editorial process is down. Drafts stay
  private. Public portfolio items project only when marked for
  publication (`WWW-PORTFOLIO-PROJECTION`); concept and illustrative
  classes stay distinct; awards and prices are not invented.
- Search Intelligence is a bounded FZ capability
  ([`FZ-SEARCH-1.md`](./FZ-SEARCH-1.md)). It does not live in
  Apostrophe tables and does not write CRM state. Fixture connector
  adapters exist (`packages/domain/src/search-connectors.ts`); live
  OAuth to a business property stays DANGEROUS. Training-crawler
  production policy is OPEN
  ([`OWNER-DECISION-PACKET-FZ-SEARCH-CRAWL-1.md`](./OWNER-DECISION-PACKET-FZ-SEARCH-CRAWL-1.md)).

## Observability

- NOW: OpenTelemetry-compatible instrumentation and structured JSON.
- LATER Linux staging: OpenObserve.
- OpenObserve is not stood up on the Windows workstation merely to
  satisfy this decision.
- Session replay remains OFF unless separately approved after a privacy
  review.

## Secrets

- Direction: SOPS+age when repository-adjacent encrypted secret material
  is actually needed.
- Local secrets are handled outside git.
- No secrets in git, prompts, logs or fixtures.

## Backup

- A backup is not accepted until restore is tested.
- restic for backup copies.
- pgBackRest when PostgreSQL persistence reaches the relevant remote
  staging or production stage.
- pgBackRest is not stood up on the Windows workstation merely to
  satisfy this decision.

## Ingress

- NOW: localhost only.
- LATER staging public ingress: Cloudflare Tunnel.
- Cloudflare remains the required public protection layer.
- The origin must not become directly Internet-accessible around
  Cloudflare.
- No operator overlay now (`OVERLAY=none`).
- Creating a tunnel, or changing DNS, firewall, Cloudflare or
  production, is DANGEROUS and needs explicit Owner approval immediately
  before execution.

## Deployment

- NOW: native local Windows development. Docker is not a Windows
  development prerequisite.
- LATER Linux staging: Docker Compose.
- No remote host is purchased or created by the Gate A record.
- Production compute remains a later Owner decision.

## Already decided before Gate A

- Public monorepo; direct `main` workflow by owner decision.
- Product boundaries: web, portal, admin, api; mobile later.
- API-first modular monolith; OpenAPI 3.0.4
  (`contracts/openapi.json`); event-driven core + transactional outbox.
- Contract lifecycle and electronic signature:
  `FZ-SIGN-1-CONTRACT-LIFECYCLE.md`. The signing engine is an adapter,
  not business truth. Provider UNDECIDED.
- dev, staging and production remain required environments.
- Local development cost target is approximately 0 PLN/month. Gate A
  authorizes no paid subscription and no recurring spend.

## Explicitly still undecided

Payment provider; electronic-signature engine (FZ-SIGN-1); production compute host; production object storage (Garage is a staging direction only); production training-crawler policy (FZ-SEARCH-CRAWL-1 OPEN). CMS engine selection is DECIDED in ADR-015 and is not CMS-ACCEPT. Legacy Astro/Sanity/Workers/D1/R2/wrangler choices do not decide these.

## Integration model

Google Calendar/Gmail/Drive, Fakturownia, Meta, payment provider,
Cloudflare and AI providers are reconnectable adapters. Test accounts
are not production identity. Action tools require authz/approval/audit
appropriate to risk.

## Security test baseline

AUTH, BOLA, BFLA, BOPLA, IDOR, CSRF, CORS, SSRF, uploads, webhooks,
rate/resource abuse, sessions/magic links, file access, admin
escalation, tenant/object isolation, secrets/PII/logging,
backup/restore.

## Agentic boundary

Agentic features sit above DATA -> RULES -> DOMAIN and consume bounded
tools/contracts. They are not canonical state. OpenAI/Grok/other
providers remain replaceable adapters. Owner is the current runtime
decision authority for escalated decisions. Native unattended
repository-write execution is not approved until isolation is
runtime-verified.

## Continuous improvement

FZ-CIS is cross-cutting. It does not change the product architecture
above. Binding rules:
[`FZ-CONTINUOUS-IMPROVEMENT.md`](./FZ-CONTINUOUS-IMPROVEMENT.md).
Connected facts:
[`FZ-CONNECTED-ECOSYSTEM.md`](./FZ-CONNECTED-ECOSYSTEM.md).
Growth plans:
[`FZ-GROWTH-OS.md`](./FZ-GROWTH-OS.md).
The execution loop stays in Cursor OS. The execution graph stays in
[`NEXT-SLICES-CMS.md`](./NEXT-SLICES-CMS.md).
Documentation rules:
[`FZ-DOCUMENTATION-OS.md`](./FZ-DOCUMENTATION-OS.md).
The finding aid is [`../DOCUMENTATION-MAP.md`](../DOCUMENTATION-MAP.md).

## Security-tool integration update --- 2026-09-21

Binding security-tool details live in
`docs/security/SECURITY-ASSURANCE.md` and the Owner onboarding flow in
`docs/security/OWNER-SETUP-CODERABBIT-OWASP.md`.

CodeRabbit is an independent review layer, not Canon authority. Preserve
`main-only`; use Cursor/IDE/CLI pre-push review rather than creating PRs
solely for CodeRabbit. Respect the verified account rate limit; until
verified, budget at most 3 free CLI reviews per developer per rolling
hour. Usage-based billing is OWNER-DECISION.

OWASP baseline: ASVS 5.0.0 requirements, ZAP DAST for runnable
local/lab/staging targets, and Dependency-Check/SCA where technically
suitable. Never active-scan legacy CT8 production or live customer
environments without explicit Owner approval.
