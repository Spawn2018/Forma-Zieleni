# Forma Zieleni --- F-RESET Master Plan

Status: CURRENT.

## A --- Security + Infrastructure Lab

Repository foundation -\> dev -\> staging -\> Cloudflare security/public
ingress -\> private-origin design/validation -\> runtime candidate -\>
database candidate -\> backup -\> real restore -\>
monitoring/observability -\> security suite -\> webhook tests -\> load
tests.

Cloudflare is protection/ingress, not an automatic
hosting/compute/database/storage decision by itself. Gate A
architecture is DECIDED in
`docs/architecture/CURRENT-ARCHITECTURE.md`: local Windows now, Linux
Docker Compose later, PostgreSQL + Kysely, local private files now,
Garage only as a later staging direction. Production compute and
production object storage remain later Owner decisions. Target private
origin must not accept direct public Internet traffic. Current CT8
remains legacy production until controlled cutover. Initial cost
objective is as close to 0 PLN/month as practical, subordinate to
security/reliability. Architecture selection is not implementation or
security acceptance.

## B --- API Contract

OpenAPI 3.0.4 target/reference -\> validation -\> generated typed
clients -\> contract tests -\> breaking-change checks -\> CI. Same
canonical contract serves web/portal/admin/mobile/integrations and later
Ruby SketchUp adapter. Current start: `contracts/openapi.json`
plus typed paths in `packages/api-client`. HTTP transport is the next
lead vertical
([`NEXT-SLICE-LEAD-VERTICAL.md`](../architecture/NEXT-SLICE-LEAD-VERTICAL.md)),
not a missing architecture choice.

## C --- Core Domain

Identity/Auth -\> CRM -\> Sales -\> Capacity -\> Projects -\> Offers -\>
Payments -\> Files -\> Events -\> Automation; then Site Intelligence -\>
Plant Knowledge -\> Garden OS foundations.

Architecture: API-first modular monolith, event-driven core,
transactional outbox, server-side authz, private files,
signed/idempotent/replay-safe webhooks. Contract lifecycle and
e-signature boundary (provider undecided):
`docs/architecture/FZ-SIGN-1-CONTRACT-LIFECYCLE.md`. Gate A architecture
is decided separately and does not select a signing provider.

## D --- Products

WWW -\> Portal -\> Admin/CRM UI -\> Mobile -\> SketchUp -\> Garden OS
extensions -\> AI -\> XR, subject to product validation and gates. Do
not build all surfaces in parallel.

WWW public copy, service pages, articles, project case studies and
public media follow the decided FZ-CMS-1 architecture
([`../architecture/OWNER-DECISION-PACKET-FZ-CMS-1.md`](../architecture/OWNER-DECISION-PACKET-FZ-CMS-1.md)).
Do not hard-code unverified marketing facts into React Router. Execute
[`../architecture/NEXT-SLICES-CMS.md`](../architecture/NEXT-SLICES-CMS.md),
including Search Intelligence from
[`../architecture/FZ-SEARCH-1.md`](../architecture/FZ-SEARCH-1.md),
then return to this product sequence. Content is not CRM. The CMS
decision is not CMS-ACCEPT.

## Cross-cutting operational readiness

Across A--D, add failure engineering, data/AI classification, capability
registry, audit trails, progressive autonomy and evaluation where
applicable. These are cross-cutting acceptance requirements, not a new
phase that delays product delivery. Product work should proceed in
vertical end-to-end slices once minimum foundations are ready.

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
