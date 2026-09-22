# Unattended /noc permissions (Cursor Approvals)

Status: CURRENT supporting ops note. Decision Gates stay binding in
[`../workflows/DECISION-GATES.md`](../workflows/DECISION-GATES.md).

## Why Allow prompts appeared

Cursor Approvals & Execution (Run Modes) sit **above** the Forma Zieleni
`beforeShellExecution` hook. Harmless verifier commands such as
`git show`, `Select-String`, and `Write-Host` were prompting because the
repository had **no** `.cursor/permissions.json` allowlist, while the
IDE still required approval for non-allowlisted shell calls (common on
Windows when a command does not fully enter the sandbox).

The FZ hook already returned `permission: allow` for those SAFE
commands. The prompts were therefore **not** FZ Decision-Gate pauses.

## Repository controls

| File | Role |
|---|---|
| [`.cursor/permissions.json`](../../.cursor/permissions.json) | Narrow `terminalAllowlist` + Auto-review `allow_instructions` / `block_instructions` |
| [`.cursor/sandbox.json`](../../.cursor/sandbox.json) | Workspace read/write sandbox; deny-by-default network with package/registry allows; Cloudflare API denied |
| [`scripts/fz-noc/permissions.mjs`](../../scripts/fz-noc/permissions.mjs) | Classification + allowlist safety tests |
| [`scripts/fz-noc/policy.mjs`](../../scripts/fz-noc/policy.mjs) | DANGEROUS shell/MCP → `deny` (Cursor `ask` is unreliable) |

Do **not** allowlist bare `git`, `git push`, `powershell`, or `wrangler`.
A safe FF push stays AUTO via the FZ hook (`allow`) and Auto-review
steering; force/mirror/delete stay `deny`.

## Owner UI (required once)

`permissions.json` only applies when Run Mode is enabled:

1. Open **Cursor Settings → Agents → Approvals & Execution**.
2. Choose **Auto-review** (preferred) or **Allowlist** with sandboxing.
3. Do **not** choose **Run Everything**.
4. Confirm the Terminal allowlist shows as configured via
   `.cursor/permissions.json` (read-only in the IDE).

No global “allow all”. No sandbox disable (`insecure_none`).

## One writer

Only the primary `/noc` coordinator mutates `main`. Verifiers and
review subagents stay read-only. The allowlist does not authorize a
second writer.
