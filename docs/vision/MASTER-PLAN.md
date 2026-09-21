# Forma Zieleni --- F-RESET Master Plan

Status: CURRENT.

## A --- Security + Infrastructure Lab

Repository foundation -\> dev -\> staging -\> Cloudflare security/public
ingress -\> private-origin design/validation -\> runtime candidate -\>
database candidate -\> backup -\> real restore -\>
monitoring/observability -\> security suite -\> webhook tests -\> load
tests.

Cloudflare is protection/ingress, not an automatic
hosting/compute/database/storage decision. Target private origin must
not accept direct public Internet traffic. Current CT8 remains legacy
production until controlled cutover. Hosting/compute/DB/storage/ORM are
open decisions. Initial cost objective is as close to 0 PLN/month as
practical, subordinate to security/reliability.

## B --- API Contract

OpenAPI 3.0.4 target/reference -\> validation -\> generated typed
clients -\> contract tests -\> breaking-change checks -\> CI. Same
canonical contract serves web/portal/admin/mobile/integrations and later
Ruby SketchUp adapter. Current start: `contracts/openapi.json`
plus typed paths in `packages/api-client`. HTTP transport waits on
FZ-A2.

## C --- Core Domain

Identity/Auth -\> CRM -\> Sales -\> Capacity -\> Projects -\> Offers -\>
Payments -\> Files -\> Events -\> Automation; then Site Intelligence -\>
Plant Knowledge -\> Garden OS foundations.

Architecture: API-first modular monolith, event-driven core,
transactional outbox, server-side authz, private files,
signed/idempotent/replay-safe webhooks. Contract lifecycle and
e-signature boundary (provider undecided, not a Gate A blocker):
`docs/architecture/FZ-SIGN-1-CONTRACT-LIFECYCLE.md`.

## D --- Products

WWW -\> Portal -\> Admin/CRM UI -\> Mobile -\> SketchUp -\> Garden OS
extensions -\> AI -\> XR, subject to product validation and gates. Do
not build all surfaces in parallel.

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
