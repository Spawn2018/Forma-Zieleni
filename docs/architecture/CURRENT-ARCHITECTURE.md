# Current architecture and decision boundaries

Status: CURRENT.

## Decided

-   Public monorepo; direct `main` workflow by owner decision.
-   pnpm/Turborepo repository foundation; current local Node 24/pnpm 10
    environment.
-   Product boundaries: web, portal, admin, api; mobile later.
-   API-first modular monolith; OpenAPI 3.0.x (current 3.0.4
    target/reference); event-driven core + transactional outbox.
-   Core API/domain data is source of truth; providers are adapters.
    Current lead-slice contract: `contracts/openapi.json`.
    Contract lifecycle and electronic signature:
    `FZ-SIGN-1-CONTRACT-LIFECYCLE.md`. The signing engine is an adapter,
    not business truth. Provider UNDECIDED. FZ-SIGN-1 does not close
    FZ-A1–A7.
-   Cloudflare is public/security ingress; target origin private.
-   dev/staging/production required.

## Explicitly undecided

Application frameworks; API framework/runtime; database provider/engine
final choice; ORM; hosting/compute; storage; payment provider;
observability backend; CMS; auth library; deployment provider;
electronic-signature engine (FZ-SIGN-1, later). Legacy
Astro/Sanity/Workers/D1/R2/wrangler choices do not decide these.

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

Agentic features sit above DATA -\> RULES -\> DOMAIN and consume bounded
tools/contracts. They are not canonical state. OpenAI/Grok/other
providers remain replaceable adapters. Owner is the current runtime
decision authority for escalated decisions. Native unattended
repository-write execution is not approved until isolation is
runtime-verified.

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
