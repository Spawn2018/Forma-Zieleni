# Pre-Push Engineering Gate

Current workflow is direct-to-main by owner decision. Therefore every
push must pass a local/CI-quality gate equivalent to a disciplined
software-house review.

## Mandatory sequence for a changed slice

1.  Scope check: diff contains only intended work; no generated junk,
    secrets, credentials, PII, dumps or private files.
2.  Architecture check: boundaries and contracts respected; no
    accidental coupling/circular dependencies.
3.  Human-quality review: naming, readability, duplication, error paths,
    edge cases, stale comments, dead code, overengineering.
4.  Format/lint/typecheck.
5.  Relevant unit/integration/contract tests.
6.  Security review proportional to risk; mandatory for auth,
    authorization, files, payments, webhooks, admin, PII and external
    input.
7.  Database/migration review when data changes.
8.  Performance review when hot paths, queries, bundles, rendering,
    uploads, images, caching or network behavior change.
9.  Accessibility review for user-facing UI.
10. Build/package verification.
11. Documentation/ADR/OpenAPI synchronization where applicable.
12. Final `git diff` review, `git diff --check`, and `pnpm repo:check`
    (current tracked-file manifest plus repository hygiene). Semantics:
    `docs/engineering/REPOSITORY-INTEGRITY.md`.
13. Security-tool evidence when applicable: deterministic tests, then
    SCA once the stack exists, then one CodeRabbit review per coherent
    green slice when quota is available, then ZAP when a runnable
    target exists. Record DEFERRED/BLOCKED when the external tool is
    unavailable. Never mark that state PASS.
14. Critical unresolved learning: an open critical security or incident
    record from
    [`../architecture/FZ-CONTINUOUS-IMPROVEMENT.md`](../architecture/FZ-CONTINUOUS-IMPROVEMENT.md)
    blocks the push. Other Learning Debt does not.

Push is blocked on failures. A passing gate authorizes a fast-forward
push to the existing `origin` `main` without a separate Owner review.
Do not silence tests, loosen types, skip
security checks or raise performance budgets just to make the gate
green.

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
