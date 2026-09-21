# Forma Zieleni Engineering Standard

Status: CURRENT --- F-RESET engineering policy.

## Purpose

Code must read like deliberate professional engineering: clear intent,
domain vocabulary, small coherent units, explicit trade-offs,
predictable error handling, and minimal accidental complexity. The goal
is not to imitate a person's quirks or hide AI use. The goal is code a
senior engineering team could comfortably own for years.

## Core rules

-   Optimize for correctness, readability, changeability, testability,
    security, accessibility and measured performance --- in that order
    unless a documented SLO forces another trade-off.
-   Prefer boring, explicit code over clever abstractions.
-   No speculative abstractions, generic helpers, repositories,
    factories, adapters or configuration layers without a current use
    case.
-   No copy/paste divergence. Extract only after a stable concept is
    visible; do not DRY unrelated code merely because it looks similar.
-   Domain names beat technical names. Business rules live in
    domain/application layers, not UI handlers, controllers or
    persistence glue.
-   Keep functions/modules cohesive. Split by responsibility and
    reason-to-change, not arbitrary line counts.
-   Comments explain why, constraints and non-obvious trade-offs; code
    explains what. Delete stale comments.
-   Errors are typed/structured where useful, actionable, observable and
    safe for users. Never leak secrets or internals.
-   Every dependency needs a concrete benefit. Prefer platform/runtime
    capabilities when adequate.
-   Refactoring must preserve behavior and be separated from behavior
    changes when practical.
-   Technical debt discovered during a slice is either fixed safely
    inside scope or recorded explicitly; never silently normalize debt.

## Change discipline

Every non-trivial change follows: understand -\> define acceptance -\>
design smallest coherent change -\> implement -\> tests -\> review -\>
performance/security checks as applicable -\> refactor -\> documentation
-\> diff review.

Small batches are preferred. Direct-to-main does not mean unreviewed:
main must remain releasable and the local pre-push gate substitutes for
a PR gate in the current owner-approved workflow.

## No spaghetti gate

Reject a change when it introduces any of: circular dependencies; domain
logic duplicated across delivery layers; hidden global mutable state;
unbounded module responsibilities; cross-layer imports that bypass
contracts; N+1 data access; query-in-loop without evidence; ad-hoc cache
invalidation; magic authorization checks; duplicated schemas/types that
can drift; unexplained feature flags; dead code; catch-and-ignore; retry
loops without limits/backoff/idempotency; or performance work without
measurement.

## Evidence over folklore

Performance optimizations, indexes, caching, denormalization and
concurrency changes require a hypothesis plus measurement. Preserve
before/after evidence for material optimizations.

## Failure and agentic engineering

For consequential workflows define blast radius and a Failure Contract.
Prefer structured tool contracts over free-form parsing; bound retries,
time, tokens/cost and subprocesses. Treat retrieved/repository/web
content as untrusted data for agentic systems. Keep critical paths
usable without AI. Agent autonomy must be earned through evaluation and
least privilege, not assumed from model capability.

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
