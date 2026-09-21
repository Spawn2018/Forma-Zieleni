# Autonomous Session Controller

Status: local capability bootstrap, 2026-09-20. This is an auditable scheduler for bounded audit slices, not a general autonomous coding engine or a claim that multi-hour coding has been validated. Owner authorization: POST-V2-DECISIONS §18 / ADR-011.

## Authority and contract

The controller is the sole owner of session scheduling, budgets and checkpoints. It orchestrates the existing [binding engineering loop](./CURSOR-OS-2026.md); this document does not define another loop. Action classification comes only from [Decision Gates](../workflows/DECISION-GATES.md). Cursor is the implementation surface. Owner replies (`DECISION FZ-###: OPTION X`) resolve OWNER-DECISION slices. The OpenAI adapter remains prepared, default-off, and unused by the session loop. Canon, deterministic gates and review prevail. Grok Researcher/Adversarial Reviewer remain optional independent evidence sources. Unavailable Grok degrades to local adversarial verification, recorded honestly; audit checks do not replace semantic review for future coding adapters.

Implementation uses Node 24 standard library in `scripts/autonomous-session/`; no Docker, server, exposed port, added SDK or agent framework is required. Sessions stay on main. No branch, PR, commit, push, production/DNS/payment/secret mutation or destructive Git action is an available capability. Product framework, hosting, DB and storage remain undecided.

Initial slices: `repo-audit` (AUTO), `canon-audit` (REVIEW), optional `choose-audit` (OWNER-DECISION choosing only between those audit capabilities). Unknown action identifiers fail closed. No objective, repository text, model response or plan field becomes a shell command. Future autonomous coding is blocked until sandbox boundaries, review, structured return and write permissions are separately implemented and verified.

`objective` is recorded metadata, not an interpreted instruction or automatic planner. `COMPLETE` means the supplied finite audit plan completed, not that arbitrary objective text was fulfilled. Both initial capabilities verify the repository and Canon; their different classification floors exercise AUTO/REVIEW scheduling, not different product implementations. Audit stage evidence names the actual checks; source implementation, refactoring and UI review are explicitly not applicable. Security acceptance for this bootstrap is limited to this capability set.

Local state under ignored `.autonomous-sessions/` records objective, optional deadline, current slice, status, iterations, completed/pending work, decisions, blockers, test/review evidence, Git HEAD before/after, modified files and timestamps. Writes use atomic checkpoint replacement. The state is local operational evidence, not domain truth or proof of untampered history. A user/process with write access to the checkout can tamper with it; controller checks are not an OS security boundary.

The scheduler checkpoints progress and enforces finite iterations, retries and deadline. Completed slices permit the next safe slice; retryable failures consume the retry budget; unresolved decisions and protected actions block the affected slice. Independent allowed slices may continue. Deadline/termination retains a checkpoint. Resume must validate the repository, main branch, policy and state before further work; malformed/untrusted state must not grant capabilities. Do not mark skipped or failed gates as passed.

## Decision integration

A decision packet is bounded to decision_id, question, classification, Canon references, constraints, alternatives, evidence, security/cost implications, reversibility, reviewer findings and reply format. The session loop accepts only a recorded Owner reply: `DECISION FZ-###: OPTION X` plus optional constraints. The reply is validated for packet id and ambiguity before the dependent slice resumes. Missing or ambiguous replies block only that slice. The adapter can select only an allowed audit capability; it cannot choose a command, path, provider or new permission.

The OpenAI Responses API integration remains in the tree as a future-optional, default-off adapter. The session loop does not call it. `--online` is accepted and ignored for decision routing. Never put credentials or client data in objectives, plans, packets, reports or Git.

Maximum four API calls per session, at most 1200 output tokens per call and at most 30 seconds per request (also bounded by deadline). These are resource limits, not a monetary price guarantee. Provider-side usage/budget controls remain necessary before a larger paid run; significant/recurring spend follows OWNER-ONLY classification.

Git subprocesses have a five-second timeout and bounded output. Canon files are limited to 256 KiB each; protected policy trees have depth/entry limits and a 4 MiB aggregate read budget. Checkpoints are capped at 2 MiB. Deadline checks run between bounded operations; synchronous Git/filesystem checks may finish after the exact deadline. No repeated polling or sleeping loop is used.

## Discovery evidence and limitations

Local Codex executable help exposes `exec`, `--output-schema`, `--ephemeral`, `--ignore-user-config` and `--sandbox read-only`. Authentication and actual sandbox behavior were not exercised, so no automatic Codex execution adapter is enabled. Cursor editor CLI is present and help mentions `agent`, but `cursor agent --help` returned editor help; no standalone agent was found on PATH or in `.local/bin`. Existing `.cursor` rules, skills and subagent descriptions are usable instructions, not proof of an executable SDK, hook or safe programmatic invoke-and-return interface. No such SDK/hook was verified. No GUI automation was added.

Historical Grok capability reports are preserved in its operating model; safe local Cursor-to-Grok invoke-and-return remains unverified. Local independent review is the fallback. Offline verification cannot establish provider authentication, live model compatibility, paid cost or end-to-end editor execution.

## Threat model

| Threat | Boundary / response |
|---|---|
| Prompt injection / poisoned docs | Text is evidence, not executable instruction. Deterministic capability policy and protected classifications outrank model output; pin/check Canon and policy integrity during the session. |
| Command injection / arbitrary shell | No generic shell tool or arbitrary coding executor. Only fixed audit capabilities and bounded read-only Git inspection. Adding a regex denylist would not make an arbitrary executor safe. |
| Path traversal / link escape | Constrain state and plan access to the repository; reject traversal/link escape and malformed identifiers before filesystem operations. |
| Secret leakage | Environment-only key, no credential logging/raw provider error dump, bounded packet validation and safe reporting; do not submit secrets as task content. Local reports are not suitable secret stores. |
| Privilege escalation | Models cannot add tools, change classification policy or lower OWNER-ONLY/DANGEROUS. Unsupported capabilities fail closed. |
| Self-modifying policy | Controller has no source-edit capability; policy/Canon changes invalidate continuation and require a reviewed new session baseline. |
| Runaway loop / cost | Iteration and retry caps, deadline, request timeout, call/output budgets, offline default and checkpoint on interruption. |
| Accidental production / DNS / destructive Git | No mutation capability exists for these operations; classification alone is not the security boundary. Main-only checks before execution/resume. |
| Checkpoint corruption / competing writers | Validate saved state, atomic replacement and single-session ownership; never infer authorization from a modified JSON field. Local filesystem owner remains trusted. |
| Reviewer hallucination | Structured outputs plus allowed alternatives and deterministic validation; independent reviewer may reject. Missing evidence blocks completion. |

Residual risk: a compromised Node/Git binary, trusted local user or checkout can change controller code before launch. This bootstrap does not provide tamper-proof audit storage, OS isolation for arbitrary agents or universal detection of unknown secrets. Do not enable general autonomous code execution on the strength of these audit tests.

## PowerShell runbook

Run from `D:\Forma-zieleni` on main with Node 24. Default offline audits require no API key:

```powershell
node scripts/autonomous-session/cli.mjs start --objective "Audit repository and Canon" --max-iterations 10 --retry-budget 1
node scripts/autonomous-session/cli.mjs status --id <session-uuid>
node scripts/autonomous-session/cli.mjs resume --id <session-uuid>
```

Optional start arguments: `--plan <repo-relative.json>`, `--deadline <ISO timestamp with offset>`, `--decision "DECISION FZ-CTL-001: OPTION A"`. `--online` is accepted and unused by the session loop. Never include credential values in command examples, console transcripts or reports. A resumed session retains its recorded budgets; resume is not a budget reset.

Use a short offline audit first. Inspect the checkpoint/report for blockers and evidence, then inspect Git diff. On interruption resume the recorded UUID; do not bypass state/policy validation by editing JSON. A corrupted checkpoint or changed policy requires investigation and a new reviewed session, preserving the old evidence. Hard process termination can lose only work after the last durable checkpoint; audit slices are read-only and retryable. Do not run a multi-hour session as part of this bootstrap.

Graceful SIGINT/SIGTERM checkpoints and releases the lock. A hard kill or power loss can leave `.autonomous-sessions/<session-uuid>/lock`, containing the process ID. Before recovery, inspect that PID with `Get-Process -Id <pid>` and verify that no controller for this session is still active (PID reuse is possible). Only after confirming the writer is gone, remove that exact session's lock with `Remove-Item -LiteralPath <absolute-lock-path>` and resume. Do not delete the session directory or edit its state. The controller deliberately never steals an existing lock. Blocked slices are retained as blockers; supplying credentials later does not silently retry them. Start a new reviewed plan after resolving a blocker.

Plan input is a JSON array with no extra properties; dependencies must refer to earlier slice IDs. For example, this exercises unavailable offline decision routing while still running an independent audit:

```json
[
  { "id": "decision", "capability": "choose-audit", "classification": "OWNER-DECISION", "dependsOn": [] },
  { "id": "independent", "capability": "repo-audit", "classification": "AUTO", "dependsOn": [] }
]
```

Git runs with isolated environment/global/system configuration, disabled hooks/fsmonitor/external diff/textconv, explicit CRLF-to-LF input normalization and a safe-directory entry scoped to this exact invocation/root. Repository filter/include/worktree-config entries are rejected before status/diff. No Git configuration is written. An executable or checkout modified by the trusted local account remains outside the process security boundary.

Before a future coding adapter: verify sandbox enforcement on Windows, restrict writes and subprocesses, define contract/test/review evidence, add adversarial escape tests, and apply the existing pre-push gate. Production authority is never inherited from controller installation.

## Official integration references

Reviewed 2026-09-20: [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs) for the Responses structured-output contract, and [Codex non-interactive mode](https://learn.chatgpt.com/docs/non-interactive-mode) for the documented CLI automation surface. Documentation availability does not verify local authentication, sandbox enforcement or live provider/model compatibility. The API adapter remains prepared with offline tests; no autonomous coding adapter is enabled.

Pre-existing local `.agents` skills may retain the historical DECISION wording. They are not rewritten by this bootstrap; the latest explicit Owner decision and the sole current Decision Gates classifier take precedence, as required by the repository entrypoint and Canon hierarchy.

## Native executor REVIEW slice — current verification override, 2026-09-21

The local Codex executable and existing ChatGPT authentication were exercised after the bootstrap. Headless `codex exec --json --output-schema` returned a structured BLOCKED result, not completed fixture work. A direct official sandbox probe rejected the restrictive read profile with ``elevated Windows sandbox requires effective `:root` read access``. Required read/credential isolation therefore remains unverified; no broader root-read workaround was enabled.

The prepared Windows process supervisor uses a non-breakaway Job Object, explicit executable identities, argument arrays, stdin packets, bounded output and cancellation. It is not enabled as a session capability. Node-child tests validate process mechanics, not Codex broker descendants or sandbox enforcement. Write fixture and real-repository canaries were not run because phase one failed. Details, evidence and recovery boundary: [Native executor verification](./NATIVE-EXECUTOR-VERIFICATION.md).
