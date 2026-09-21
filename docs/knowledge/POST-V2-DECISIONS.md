# Post-F-RESET-v2 decisions — current override ledger

Status: CURRENT. These decisions supersede conflicting older material while preserving it as provenance.

1. Repository: `Spawn2018/Forma-Zieleni`, public monorepo. Work is performed directly on `main`; branches/PRs are not the required default workflow.
2. No open-source licence. Public visibility is not permission to copy/use/modify/distribute. Intended posture: All rights reserved; rights holder LOGMAR Sp. z o.o. Legal/public wording must be verified before production publication.
3. Current local foundation: pnpm/Turborepo monorepo; Node 24, pnpm 10. `apps/web`, `apps/portal`, `apps/admin`, `apps/api`; no `services/*`; mobile later. Application frameworks remain UNDECIDED.
4. Hosting/compute/database/storage/ORM remain UNDECIDED. Docker is not required now. Do not inherit Workers/D1/R2/Astro/Sanity as current choices.
5. Cloudflare is public/security ingress. Target: Cloudflare -> private origin. Current CT8 production remains legacy and public until controlled cutover; do not rebuild/tune it during new-product development.
6. Required environments: dev, staging, production. Initial infrastructure cost target: as close to 0 PLN/month as practical, without sacrificing security/reliability.
7. Cloudflare current operational state: zone active; OVH nameservers moved to Cloudflare; apex/www proxied; mail records DNS-only; Full (strict); Always Use HTTPS; TLS minimum 1.2; TLS 1.3; HSTS off intentionally; Bot Fight Mode off after diagnostics. Tunnel/private origin not implemented yet.
8. Mail current state: SPF PASS and DKIM PASS were verified in Gmail. DMARC record `v=DMARC1; p=none;` is configured but DMARC PASS has NOT been verified. Never state otherwise.
9. Fakturownia remains planned. Payment provider UNDECIDED; business requirement: card + BLIK + bank transfer + instant payment.
10. Google integrations must be reconnectable/OAuth/multi-account-ready. Test account must never be hard-wired. Core API remains source of truth.
11. API-first/modular monolith/event-driven core/transactional outbox/server-side authz remain current. OpenAPI direction remains 3.0.x, with 3.0.4 the current contract target/reference.
12. Cursor autonomy target: autonomous slice-by-slice execution with Owner in the decision loop. ChatGPT/OpenAI Decision Agent is disabled/optional; Owner is the active decision authority. The old rule requiring approval merely because >3 files change is superseded.
13. Legacy Cursor rules and technical freeze may be replaced. Preserve business/domain/UX/security intent; do not preserve legacy implementation by default.
14. Current source hierarchy target: Project Constitution -> explicit owner decisions/ADRs -> Product Canon/Master Plan -> Architecture/Security -> Domain/API contracts -> Slice spec -> active Cursor Rules/Skills/Agents -> legacy/reference.
15. Binding autonomous loop is owned by `docs/cursor-os/CURSOR-OS-2026.md`; historical shorter loop wording is superseded by that current definition.
16. Current action classes: AUTO, REVIEW, OWNER-DECISION, OWNER-ONLY, DANGEROUS. Owner resolves escalated choices. Production/secrets/DNS/data deletion/destructive migration/real payments/cutover/irreversible operations remain DANGEROUS.
17. Historical note about uncommitted structural orchestration changes is superseded. The previously reported orchestration activation commit `a90623b875e547dc0fe35110c139c239451b26e6` was pushed and main matched origin at that verification point; always re-check current Git state before relying on this historical observation.

18. Agentic operations adopt progressive autonomy, blast-radius classification, failure contracts, data/AI classification, provenance, evaluation, graceful degradation, cost/resource budgets and capability registry. These are cross-cutting requirements, not permission to add speculative agent frameworks.
19. Native unattended Codex repository-write execution remains blocked pending runtime-verified Windows sandbox/filesystem/credential isolation. Do not downgrade or bypass safeguards merely to obtain autonomy. Product work continues through Cursor/Owner workflow.
20. New source inspiration: *Agentic Design Patterns* and *Not Murphy's Law* inform agentic/runtime/governance/failure-engineering principles. They are design inputs, not canonical authorities; current Forma Zieleni Canon and explicit Owner decisions prevail.
21. Security review layer: CodeRabbit free/open-source path via Cursor IDE/CLI on main-only, plus OWASP ASVS 5.0.0, ZAP for runnable lab targets, and Dependency-Check after the stack is known. Binding policy: `docs/security/SECURITY-ASSURANCE.md`. Paid CodeRabbit usage is OWNER-DECISION. Active scans of CT8 or live customer environments remain DANGEROUS.
22. Contract lifecycle and electronic signature (FZ-SIGN-1): Core API owns contract state, authorization, lifecycle and archive metadata. The signing engine is an undecided adapter. Canonical definition: `docs/architecture/FZ-SIGN-1-CONTRACT-LIFECYCLE.md`. This does not close FZ-A1–A7 and does not make e-signature legally mandatory for every transaction.
