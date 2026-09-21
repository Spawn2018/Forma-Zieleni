# Native executor REVIEW slice — blocked at read isolation

Report date: 2026-09-21 (Europe/Warsaw). Live probe timestamps below are UTC on 2026-09-20. Continues the existing bootstrap; no product or production work.

## Actual evidence

- Native executable: `C:/Users/sebas/AppData/Local/OpenAI/Codex/bin/247581e40ee272fb/codex.exe`, version `0.155.0-alpha.9.2`, SHA-256 `bc45017e8239dc150258f69309ced9df6bbcdf5b8e4f346decf780ac0999e226`.
- A minimal child environment with the existing user auth-home location allowed `codex login status` to report ChatGPT login. Only that boolean/status was recorded; no credential values were printed, copied or created.
- Real `codex exec --ignore-user-config --ephemeral --strict-config --json --output-schema` ran without GUI and returned exit 0, `thread.started`, `turn.started`, `item.completed`, `turn.completed` and a schema-shaped BLOCKED reply. This proves native invocation/return, not completed execution.
- Example live run: `21:55:50.736Z`–`21:56:09.036Z`, session `115fb61a-0139-4a44-9e95-b8be39fac1e1`. Reply: “Probe launch was rejected; no nonce or booleans were measured.” No context modification or forbidden fixture file was found.
- Direct official `codex sandbox -P native-fixture` probe failed with exit 1: ``windows sandbox failed: elevated Windows sandbox requires effective `:root` read access``.
- Requested profile denied root reads, allowed platform minimum/runtime and fixture reads, denied auth-home reads and disabled tool networking. The installed backend refused this profile. We did not weaken it to broad root reads.
- Local sanitized reports remain under ignored `tmp/native executor */`; no raw native stdout/stderr transcript or credentials were persisted.

## Phase gates

| Gate | Result |
|---|---|
| Native Codex discovery / headless launch | PASS |
| Structured transport | Observed schema-shaped BLOCKED response; successful task result NOT established. Final stricter validator has offline regressions; no final live revalidation. |
| Read-only fixture and read/credential isolation | FAIL — restrictive native sandbox profile rejected before probe execution. |
| Bounded write fixture | NOT RUN — phase-one dependency failed. |
| Real repository read/write canaries | NOT RUN — earlier gates failed. |
| Controller integration | Not enabled; existing audited capabilities remain unchanged. |
| Multi-hour autonomy | Still blocked. No long-running session started. |

## Prepared code and tests

Final local checks: `node --test scripts/autonomous-session/*.test.mjs` — **41/41 PASS**, 0 skipped, approximately 80 seconds; existing strict TypeScript policy/engine check PASS; JavaScript syntax checks PASS; `git diff --check` PASS. No dedicated style linter or new dependency was introduced. These results do not override the failed live sandbox gate.

`native-process.mjs` and `native-job.ps1` provide the internal Windows process primitive: pinned executable identity, `shell:false`, fixed argument arrays, explicit cwd, caller-minimized environment, UTF-8 stdin/output, byte caps and finite timeout/cancellation. The supervisor joins a kill-on-close, non-breakaway Job Object before creating the child. Direct Node descendant cleanup was exercised; Codex sandbox broker/service process cleanup is not yet established.

`native-probe.mjs` is a manually invoked, machine-specific diagnostic harness, not an arbitrary-task executor. It uses a harmless isolated Git fixture and existing native authentication. The final version stops before invoking a model when deterministic sandbox preflight fails. The sandbox subcommand does not expose exec's `--ignore-user-config` switch; it selects the explicit permission profile and overrides tested settings, but ambient sandbox configuration isolation is not claimed as verified.

`native-result.mjs` validates exact reply fields/types, IDs, terminal events, refusal/error states and malformed/duplicated output. Model claims never prove the sandbox worked: successful acceptance additionally requires independent preflight, nonce correspondence, unchanged context, no unexpected file and COMPLETE with no blockers.

Independent process tests discovered and regressed two encoding defects (PowerShell console input and split UTF-8 stream chunks); both were fixed. Independent review also found that an early probe predicate could accept BLOCKED/malformed streams; strict validation and offline regression tests now reject them.

The three-slice simulation completes a normal slice, retries a retryable slice, then accepts a mocked structured AI decision. Four attempts are consumed because of the retry. OWNER-ONLY/DANGEROUS cause zero executor invocations. This simulation is explicitly not native-executor acceptance evidence.

## Added threat boundaries and limitations

- Task/model text never becomes a command string; executable paths/arguments are selected by trusted harness code. Hash changes reject launch. The fixture uses paths containing spaces.
- Minimal child environment excludes inherited secret and execution-override variables. This does not prove secrets are inaccessible to sandbox tools: native isolation failed before that could be tested.
- Native output is bounded and not dumped as raw logs. Structured response spoofing, extra authority fields, malformed JSONL, wrong IDs and duplicate terminal/reply events fail closed.
- Timeout/cancel tests prove termination of directly inherited Job descendants. They do not prove cleanup of native services/brokers that may execute outside that job.
- Junction/traversal/policy/Git/production restrictions for a future writing executor remain unverified and disabled. Post-run hashes would detect writes, not prevent them; they are not sufficient authority for enabling writes.
- The fixed probe uses discovered local installation paths. It is not a portable executor distribution or permission-elevation mechanism.

## Checkpoint continuation — 2026-09-21

Approval review was available for this continuation. The same pinned CLI binary was tested using the official `windows.sandbox` values, with identical root-deny, auth-home-deny, fixture/runtime-read, network-disabled and approval-never settings. No model was invoked.

| Configuration | Actual native result |
|---|---|
| `elevated`, 07:46:40–07:46:43 UTC | Exit 1: effective `:root` read access required. Evidence: ignored `tmp/native executor CWmvkt/sandbox-report.json`. |
| `unelevated`, 07:48:09–07:48:12 UTC | Exit 1: `Restricted read-only access requires the elevated Windows sandbox backend`. Evidence: ignored `tmp/native executor nSwdj5/sandbox-report.json`. |

Root cause: installed version `0.155.0-alpha.9.2` refuses this restricted-read policy in both native backends. Elevated requires root read; unelevated routes restricted read-only access back to elevated. This is a backend enforcement limitation, not evidence of an authentication failure. The official current [source guard](https://github.com/openai/codex/blob/main/codex-rs/windows-sandbox-rs/src/resolved_permissions.rs) explicitly rejects filesystem policies elevated cannot safely enforce; current main is corroboration, not a claim of source-tag equivalence with this binary.

The [official Windows documentation](https://learn.chatgpt.com/docs/windows/windows-sandbox) lists both modes and notes weaker isolation in unelevated. Unelevated was tested only for rejection with unchanged requested constraints; it is not approved as an executor fallback. No broad-root-read or full-access configuration was attempted.

Phase 1 remains FAIL at preflight. Credential isolation and native path guards remain NOT VERIFIED; neither a rejected launch nor absence of a fixture write proves isolation. No Phase 1 model rerun, bounded write, repository canary, controller enablement, push, production, DNS or secret access was performed. Existing offline test results remain historical, not renewed native security evidence.

Next: a supported backend/version that can enforce the same filesystem and credential boundary must first pass deterministic preflight; only then repeat Phase 1 and isolation/path-guard tests. The diagnostic harness now permits `--unelevated` only together with `--sandbox-only`, records backend and a bounded filtered error, and otherwise retains its elevated default.

## Previous rerun limitation and next action (superseded by continuation above)

Automatic approval review rejected the final sandbox-only rerun because the review service hit its usage limit. The command did not execute; this was a review-service failure, not a finding that the action was unsafe. No alternate route was used to bypass that check. Local offline verification can continue independently.

Next safe action: after approval review is available, verify an official Codex/Windows sandbox configuration or version that enforces the required restricted reads, then repeat phase one. Do not enable write fixtures, repository capabilities or multi-hour operation until that gate passes. No new API key is needed for this native executor path.

Official references reviewed: [permission profiles](https://learn.chatgpt.com/docs/permissions), [Windows sandbox](https://learn.chatgpt.com/docs/windows/windows-sandbox), [configuration](https://learn.chatgpt.com/docs/config-file/config-sample). Actual local runtime evidence takes precedence over assumed platform capability.

No project commits, branches, push, production/DNS/payment actions or customer data use in this slice. Temporary fixture Git initialization is isolated from the project checkout.
