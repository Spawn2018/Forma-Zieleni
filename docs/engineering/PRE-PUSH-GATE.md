# Pre-Push Engineering Gate

Current workflow is direct-to-main by owner decision. Therefore every
push must pass a local/CI-quality gate equivalent to a disciplined
software-house review.

## Executable control (source of truth)

Autonomous Cursor must not run `git push` directly. The mandatory
deterministic gate and the only AUTO safe-main push path are:

- Gate: `pnpm pre-push:gate` → `scripts/ci/pre-push-gate.mjs`
- Push: `pnpm push:main` → `scripts/ci/push-main.mjs`

The gate runs the same Verify commands as `.github/workflows/ci.yml`
plus `git diff --check`, refuses a dirty tree except the Owner-local
`.cursor/settings.json`, binds PASS to the captured HEAD, and fails
closed on the first non-zero check. `pnpm push:main` re-checks that
state, refuses non-fast-forward intent, runs only
`git push origin main`, then waits for mandatory GitHub Actions workflow
`.github/workflows/ci.yml` on the **exact pushed SHA**. Overall success
requires that exact-SHA run to conclude `success`. Transport success
(`pushed: true`) is reported even when CI fails; quality success
(`ok: true`) requires `CI_GREEN`. Final CI failures ingest into the
existing FZ-CIS path (`CI_FAILED` / `CI_REGRESSION`) with run-id
idempotency.

Controller: `scripts/ci/post-push-ci.mjs`
(`node scripts/ci/post-push-ci.mjs status|wait --sha <SHA>`).

Cursor `beforeShellExecution` denies direct `git push` (including
`--no-verify`) and keeps force/mirror/delete as DANGEROUS. This is
mechanical enforcement of the autonomous Cursor path, not a claim that
a human with a raw terminal cannot bypass a local control.

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
12. Final `git diff` review, then the executable gate above
    (`pnpm pre-push:gate` / `pnpm push:main`). Semantics for repository
    integrity: `docs/engineering/REPOSITORY-INTEGRITY.md`.
13. Security-tool evidence when applicable: deterministic tests, then
    SCA once the stack exists, then one CodeRabbit review per coherent
    green slice when quota is available, then ZAP when a runnable
    target exists. Record DEFERRED/BLOCKED when the external tool is
    unavailable. Never mark that state PASS.
14. Critical unresolved learning: an open critical security or incident
    record from
    [`../architecture/FZ-CONTINUOUS-IMPROVEMENT.md`](../architecture/FZ-CONTINUOUS-IMPROVEMENT.md)
    blocks the push. Other Learning Debt does not.

Push is blocked on failures. A passing local gate authorizes a
fast-forward push to the existing `origin` `main` without a separate
Owner review (AUTO per `docs/workflows/DECISION-GATES.md`). Use
`pnpm push:main`. Slice completion and the next product READY selection
require that exact-SHA GitHub CI to be GREEN. A red or pending published
HEAD is a quality interrupt ahead of product selection — not a second
execution graph.
`.github/workflows/ci.yml` is the mandatory post-push verifier. It does
not deploy, and it does not commit. `pnpm readme:check` is part of that
verification. It does not rewrite the README.
Do not silence tests, loosen types, skip
security checks or raise performance budgets just to make the gate
green.

## Future VERIFY EFFECT evidence (contract only)

FZ-CIS record `projection-drift-after-materialization` is VALIDATING
against this control. A later VERIFY EFFECT slice should be able to
distinguish, without a second learning store:

A. A push was attempted after a local deterministic failure and was
   blocked by `pre-push-gate` / `push-main` (gate `reason=check_failed`).
B. The same projection-drift class recurred locally but did not escape
   to `main` because the gate refused the push.
C. The class still reached GitHub CI on `main`, meaning this control was
   insufficient or bypassed outside the autonomous Cursor path.
D. The gate produced excessive false blocks / toil (repeated
   `disallowed_dirty` / unrelated failures with no product defect).

Do not invent production metrics here. Runtime VERIFY EFFECT remains a
later slice.

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
