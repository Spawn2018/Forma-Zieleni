# Pre-Push Engineering Gate

Current workflow is direct-to-main by owner decision. Therefore every push must pass a local/CI-quality gate equivalent to a disciplined software-house review.

## Mandatory sequence for a changed slice
1. Scope check: diff contains only intended work; no generated junk, secrets, credentials, PII, dumps or private files.
2. Architecture check: boundaries and contracts respected; no accidental coupling/circular dependencies.
3. Human-quality review: naming, readability, duplication, error paths, edge cases, stale comments, dead code, overengineering.
4. Format/lint/typecheck.
5. Relevant unit/integration/contract tests.
6. Security review proportional to risk; mandatory for auth, authorization, files, payments, webhooks, admin, PII and external input.
7. Database/migration review when data changes.
8. Performance review when hot paths, queries, bundles, rendering, uploads, images, caching or network behavior change.
9. Accessibility review for user-facing UI.
10. Build/package verification.
11. Documentation/ADR/OpenAPI synchronization where applicable.
12. Final `git diff` review and `git diff --check`.

Push is blocked on failures. Do not silence tests, loosen types, skip security checks or raise performance budgets just to make the gate green.
