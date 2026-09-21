# Autonomous execution plane — bootstrap verification

Date: 2026-09-20. Scope: fixed read-only audit controller, prepared advisory OpenAI integration and binding documentation update. This is not acceptance of a general autonomous coding engine.

## Git and scope evidence

Before implementation, local main, origin/main and live `git ls-remote origin refs/heads/main` all resolved to `a90623b875e547dc0fe35110c139c239451b26e6`. The stale statement in POST-V2-DECISIONS §17 was corrected on this evidence. Project HEAD stayed unchanged. No project branch, PR, commit or push was created. Temporary test repositories used fixture commits and were removed after validation.

Pre-existing untracked `.agents/` and `.codex/` were preserved. No product application, CT8, Cloudflare/DNS, real payment, customer data, hosting/DB/storage/framework selection or secret creation/rotation was changed. No new dependency was added; no paid API call was made.

## Acceptance and verification

| Check | Evidence / result |
|---|---|
| Deterministic tests | `node --test scripts/autonomous-session/*.test.mjs`: 30 passed, 0 failed, 0 skipped; final full run approximately 44 seconds on this Windows environment. |
| Final local CLI smoke | Session `7a6304b7-1a5f-4dbb-872a-ebbcdedfe3e4`: COMPLETE, 2 iterations, 2 audits completed, 0 blockers, 0 API calls; elapsed 11.9 seconds. Its ignored checkpoint remains local. |
| Type checking | Existing local `node_modules/.bin/tsc.cmd --noEmit --strict --target es2023 --module nodenext --allowImportingTsExtensions scripts/autonomous-session/policy.ts scripts/autonomous-session/engine.ts`: PASS for typed policy/engine. JavaScript adapters are exercised by integration tests and syntax checks, not claimed as fully typechecked. |
| Syntax / available lint | `node --check` for cli.mjs, repo.mjs and decision.mjs: PASS. No dedicated JavaScript style linter is configured in this repository. |
| Workspace checks | Local Turbo lint/typecheck/test/build invocation returned zero packages/tasks. That is foundation discovery, not evidence of product tests/build. Controller tests/checks ran directly. |
| Package-manager issue | The environment's pnpm launcher attempted an automatic modules installation and refused without a TTY. Dependencies were not purged/reinstalled; the existing Node, TypeScript and Turbo binaries provided the checks above. |
| Security | Independent adversarial review found gate-evidence, checkpoint-validation and inherited-property defects; all repaired with regression tests. Follow-up review found no remaining blocker within the fixed audit scope. |
| Additional safety review | Git filters/includes/worktree config rejected before status/diff; Windows path aliases, traversal, junctions, malformed state and unknown commands rejected; API budgets charged before requests, raw errors suppressed. |
| Resource review | Finite plan/iteration/retry/call budgets; bounded files/state/provider bodies; request/process timeouts; no polling service or exposed port. No optimization or product SLO claim. |
| Documentation | One binding loop retained in CURSOR-OS-2026; one current classifier in DECISION-GATES; controller owns sessions; ADR-011 and ledger §18 record authorization; historical provenance retained. |
| UI / data / production | Not applicable: no UI, domain database, migration or production change. |
| Diff / secret review | Tracked diff whitespace check and new-file whitespace inspection pass. A secret-pattern scan candidate was the intentional PEM-header rejection fixture in decision.test.mjs, not a private key; no credential material found in changed files. |

Tests cover classification floors and forged labels, OWNER-ONLY/DANGEROUS stops with independent continuation, decision routing and adversarial rejection, deadline/stop, max iterations, retry exhaustion, crash accounting, persisted decision reuse, atomic checkpoint/lock behavior, corrupted state, main/policy guards, no-secret reporting, bounded API responses, and CLI start/status/resume. Source edits are not available to the controller.

## Integration status and remaining work

- OpenAI: PREPARED. Structured Responses adapter and two-context proposal/review contract pass offline transport tests. Authentication/model compatibility and actual billing were not exercised.
- Codex/Cursor: PARTIAL. Codex executable help was inspected; Cursor launcher exists, but a safe executable editor invoke-and-return interface was not verified. No automatic coding adapter is enabled.
- Grok: PARTIAL. Historical independent research/review roles preserved. No GUI/custom bridge added; local deterministic verification is the audit fallback, and separate agent review assessed this implementation.
- Controller/security: PASS only for the documented bounded audit capabilities. Arbitrary objective fulfillment and multi-hour autonomous coding remain unimplemented and unverified.

Next safe REVIEW slice: investigate and test a native Codex/Cursor read-only adapter in an isolated fixture, verifying Windows sandbox enforcement, credential isolation, cancellation and structured return before considering repository-write capabilities. Do not start a multi-hour session as part of this bootstrap.

Runbook and threat model: [Autonomous Session Controller](./AUTONOMOUS-SESSION-CONTROLLER.md).
