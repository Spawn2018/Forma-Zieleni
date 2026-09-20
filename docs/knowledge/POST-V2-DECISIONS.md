# Post-F-RESET-v2 decisions — current override ledger

Status: **CURRENT override / decision ledger**.

These decisions supersede conflicting older material while preserving it as provenance.

## Role vs ADR history

| Document | Role |
|----------|------|
| **This file** | Current override ledger for decisions after the F-RESET v2 baseline |
| [`../architecture/DECISIONS.md`](../architecture/DECISIONS.md) | Formal ADR **history** |

**Rule:** latest explicit owner decision wins; history remains traceable.

Binding architecture: [`../architecture/CURRENT-ARCHITECTURE.md`](../architecture/CURRENT-ARCHITECTURE.md) (sole binding entrypoint).

---

1. Repository: `Spawn2018/Forma-Zieleni`, public monorepo. Work is performed directly on `main`; branches/PRs are not the required default workflow.
2. No open-source licence. Public visibility is not permission to copy/use/modify/distribute. Intended posture: All rights reserved; rights holder LOGMAR Sp. z o.o. Legal/public wording must be verified before production publication.
3. Current local foundation: pnpm/Turborepo monorepo; Node 24, pnpm 10. `apps/web`, `apps/portal`, `apps/admin`, `apps/api`; no `services/*`; mobile later. Application frameworks remain UNDECIDED.
4. Hosting/compute/database/storage/ORM remain UNDECIDED. Docker is not required now. Do not inherit Workers/D1/R2/Pages/Astro/Sanity as current choices. Cloudflare as public/security ingress remains approved direction only.
5. Cloudflare is public/security ingress. Target: Cloudflare -> private origin. Current CT8 production remains legacy and public until controlled cutover; do not rebuild/tune it during new-product development.
6. Required environments: dev, staging, production. Initial infrastructure cost target: as close to 0 PLN/month as practical, without sacrificing security/reliability.
7. Cloudflare current operational state: zone active; OVH nameservers moved to Cloudflare; apex/www proxied; mail records DNS-only; Full (strict); Always Use HTTPS; TLS minimum 1.2; TLS 1.3; HSTS off intentionally; Bot Fight Mode off after diagnostics. Tunnel/private origin not implemented yet.
8. Mail current state: SPF PASS and DKIM PASS were verified in Gmail. DMARC record `v=DMARC1; p=none;` is configured but DMARC PASS has NOT been verified. Never state otherwise.
9. Fakturownia remains planned. Payment provider UNDECIDED; business requirement: card + BLIK + bank transfer + instant payment.
10. Google integrations must be reconnectable/OAuth/multi-account-ready. Test account must never be hard-wired. Core API remains source of truth.
11. API-first/modular monolith/event-driven core/transactional outbox/server-side authz remain current. OpenAPI direction remains 3.0.x, with 3.0.4 the current contract target/reference. Legacy `openapi.yaml` under `legacy/` is reference only and does not complete Gate B.
12. Cursor autonomy target: autonomous slice-by-slice execution. Owner intervention primarily at DECISION and DANGEROUS gates. The old rule requiring approval merely because >3 files change is superseded.
13. Legacy Cursor rules and technical freeze may be replaced. Preserve business/domain/UX/security intent; do not preserve legacy implementation by default.
14. Current source hierarchy target: Project Constitution -> explicit owner decisions (this ledger + ADR history; latest explicit wins) -> Product Canon/Master Plan -> Visual/UX/Content Canons -> `CURRENT-ARCHITECTURE`/Security -> Domain/API contracts -> Slice spec -> active Cursor Rules/Skills/Agents -> legacy/reference.
15. Current autonomous slice loop target: DISCOVER -> PLAN -> CONTRACT -> IMPLEMENT -> TEST -> SECURITY REVIEW -> QUALITY GATES -> DOCUMENT -> SELF-REVIEW -> COMPLETE or DECISION GATE.
16. Action classes: AUTO, REVIEW, DECISION, DANGEROUS. Framework/infrastructure/provider/material scope/breaking domain or API/legal/material UX choices are DECISION. Production/secrets/DNS/data deletion/destructive migration/production payments/irreversible operations are DANGEROUS.
17. Current active repo structural changes already prepared in Cursor but not yet committed include removal of `services/*`, separate portal, UTF-8 description correction, narrower SQL ignore patterns, foundational architecture/domain/API/runbook docs, and the documentation consistency-fix (single architecture entrypoint). Validate against the final Canon before committing.
