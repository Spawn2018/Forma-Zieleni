---
name: fz-autonomous-execution
description: Run a Forma Zieleni autonomous session inside an active /noc window. Reconstruct READY work, execute the binding loop, and continue until the Warsaw deadline or a real blocking gate.
---

# FZ autonomous execution

Session window only. The binding execution loop remains `docs/cursor-os/CURSOR-OS-2026.md`. Action classes remain `docs/workflows/DECISION-GATES.md`. This skill does not choose product, vendor, or architecture.

## Start

`/noc 9` means work until the next 09:00 `Europe/Warsaw`. `/noc` without an hour prints usage and does not start. `/noc stop` ends the window after the current atomic step.

1. Stay in Agent mode. Do not switch to Plan. Do not run the whole night as a background Task.
2. `node scripts/fz-noc/cli.mjs start <hour>`
3. Arm one `/loop` watchdog named `loop-noc` every 15 minutes in this same session. Prompt: read `.fz-noc/live.json`. If `status` is `stop` or `untilUtc` has passed, stop the loop. If `status` is `busy` and `lastBeat` is newer than 25 minutes, do nothing. If `lastBeat` is older than 25 minutes and the deadline is still ahead, run one recovery cycle through this skill. Do not start a second writer.
4. Run the first cycle immediately.

## Each cycle

Re-read `START-HERE-CURSOR.md`, `docs/cursor-os/CURSOR-OS-2026.md`, `docs/architecture/CURRENT-ARCHITECTURE.md`, `docs/architecture/NEXT-SLICES-CMS.md`, and `docs/architecture/NEXT-SLICES-MAIN.md`. Inspect git HEAD and status. Ignore chat history as project state.

`node scripts/fz-noc/cli.mjs select --commit <HEAD>`

The CLI applies the deterministic READY rule: completed dependencies, AUTO/REVIEW only, critical path, then work that unblocks the most remaining slices. It records the reason. Do not ask the Owner to pick between equivalent AUTO/REVIEW slices.

Then run the binding loop for that slice: discover, plan, contract, implement, test, refactor, security review when the boundary changes, performance or data review when applicable, UX/a11y/visual/content review when a real UI exists, document, final diff, pre-push gate, `pnpm push:main` (exact-SHA GitHub CI must be GREEN), only then `complete`.

`node scripts/fz-noc/cli.mjs select --commit <HEAD>` applies a quality interrupt before product READY selection. If the published `origin/main` SHA has mandatory CI in a failed/pending/unavailable state, `selected` is null and `qualityInterrupt` describes the repair. Do not start an unrelated product slice while current published HEAD is not CI_GREEN. Local unpublished HEAD is not a CI failure, but it also does not authorize selecting a new unrelated product slice.

Delegate, do not duplicate:

- `fz-verifier` when evidence could be fake or incomplete
- `fz-security-reviewer` when security or privacy changes; the existing `security-adversary` standard applies
- `fz-ux-a11y-reviewer` only for user-facing UI; the existing `visual-ux-reviewer` standard applies
- Grok, through `grok-research-handoff` and `node scripts/security/grok-callable.mjs`, for fresh external research or a substantial adversarial challenge. Grok output is evidence. Never send secrets, credentials, or customer data. Prefer the installed `grok` CLI headless path (`-p`) once authenticated. If Grok is unavailable, record `EXTERNAL ADVERSARIAL REVIEW: DEFERRED` / `GROK_DEFERRED` and continue. Grok must not mutate the repository.
- CodeRabbit only when review value is high. Use `scripts/security/coderabbit-quota.mjs`. At most 3 free CLI reviews per developer per rolling hour. Paid usage is OWNER-DECISION. Quota exhaustion records DEFERRED and does not stop other READY work.
- For a coherent checkpoint (not every micro-edit): after deterministic local verification and privacy/secret scope checks, run `node scripts/security/coderabbit-checkpoint.mjs run` when the planner says `action: review`. Prefer `--base-commit <SHA>` when re-reviewing a historical coherent range while already on `origin/main`. Record structured findings, dispositions, and the returned `CODERABBIT_*` state. Findings are advisory evidence; verify locally before adoption. `ACCEPT` requires repair then mandatory re-review (`CODERABBIT_PASS_AFTER_REPAIR`). Unresolved review debt blocks `pnpm push:main`. Never send secrets, credentials, or customer data.

Update the execution graph in the repository before `node scripts/fz-noc/cli.mjs complete --slice <id> --commit <HEAD>`. Local commit is allowed when the slice is complete and coherent. A safe fast-forward push to `origin` `main` is AUTO after the pre-push gate via `pnpm push:main` only. `pnpm push:main` waits for mandatory GitHub CI on the exact pushed SHA and returns overall success only when that run is GREEN. Direct `git push` stays denied. Force-push, deploy, Cloudflare, DNS, production secrets, spend, and live customer data stay DANGEROUS. A running `/noc` window is not approval for those.

`complete` verifies exact-SHA CI_GREEN for the published commit and refuses otherwise. Do not mark runtime slice COMPLETE before post-push GREEN.

When `qualityInterrupt.type` is `CI_REPAIR_REQUIRED`, the existing FZ orchestrator repairs: read safe CI evidence, reproduce locally, classify root cause, smallest fix, local gate, CodeRabbit if applicable, commit, `pnpm push:main`, wait exact new SHA CI. Record each repair attempt with `node scripts/fz-noc/cli.mjs attempt --slice CI-REPAIR --signature "<failureSignature>" --ci-repair`. Three identical failure signatures block further autonomous product work (`CI_REPAIR_BLOCKED`). Do not work-steal normal product slices over a red published HEAD.

`node scripts/fz-noc/cli.mjs beat` at the start and end of real work. On a repeated identical failure: `node scripts/fz-noc/cli.mjs attempt --slice <id> --commit <HEAD> --signature "<command>"`. Three identical attempts block that slice. Select again and work-steal.

## Continuation and stop

Do not end a cycle by asking the Owner to type continue, resume, or next. The `stop` hook submits the next cycle while `.fz-noc/live.json` is active. That hook is the turn boundary. The 15-minute loop is only the dead-session watchdog.

Stop the Owner only when no safe READY work remains and the blocker is a real OWNER-DECISION, OWNER-ONLY action, DANGEROUS action, technical blocker, or a roadmap acceptance checkpoint that needs the Owner. Silence is not approval. Do not downgrade a gate.

## Learning check

After COMPLETE, and before the next selection, apply the learning flywheel in `docs/architecture/FZ-CONTINUOUS-IMPROVEMENT.md`. Sequence: execute, verify, complete, learning check, record or promote only when proportionate, refresh the execution graph, next READY.

No material learning is a valid result. Use `node scripts/fz-cis/cli.mjs` to validate a record. Do not copy the FZ-CIS architecture into this skill. At the deadline, a short note may list work completed, material failures, material learning, Learning Debt opened or closed, avoidable Owner intervention, and next READY. That note is not a postmortem.

At the deadline, do not start a new slice. Checkpoint, validate completed work, commit locally if it is complete, report, then `node scripts/fz-noc/cli.mjs stop` and stop the `loop-noc` watchdog.

After context compaction or a new chat, reconstruct from the repository and `.fz-noc/live.json`. Do not treat the conversation as the execution graph.
