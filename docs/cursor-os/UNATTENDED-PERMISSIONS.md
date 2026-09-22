# Unattended /noc permissions (Cursor Approvals)

Status: CURRENT supporting ops note. Decision Gates stay binding in
[`../workflows/DECISION-GATES.md`](../workflows/DECISION-GATES.md).

Verified against installed Cursor **3.21.16**
(`%LOCALAPPDATA%\Programs\cursor\Cursor.exe`) and the bundled schema
`extensions/cursor-always-local/schemas/permissions.schema.json`.

## Why the UI says “Shell allowlist is empty”

Auto-review’s Shell allowlist panel shows the **in-IDE** allowlist.
That list is empty on this machine.

The repository file [`.cursor/permissions.json`](../../.cursor/permissions.json)
is **schema-valid** for this Cursor build (`terminalAllowlist` +
`autoRun` match the installed schema; no unknown fields). Path and
filename are the documented project location, and the extension
registers JSON validation for `.cursor/permissions.json`.

However, Cursor desktop **does not yet apply repository-level
allowlists** to the effective Shell allowlist. Cursor staff confirmed
this gap (2026-08-10): put allowlists in `~/.cursor/permissions.json`
only; “Repo-level allowlists in `<workspace>/.cursor/permissions.json`
aren’t applied yet.” Forum:
https://forum.cursor.com/t/permissions-json-does-not-appear-to-control-the-effective-allowlist/167877

So the empty UI is expected: the repo file is present and valid, but
this Cursor version does not load project `terminalAllowlist` into the
Approvals UI.

Related Cursor limitation: putting a non-empty `terminalAllowlist` in
**user-level** `~/.cursor/permissions.json` currently forces Allowlist
mode and disables Auto-review. Do **not** use that path while Auto-review
must stay selected.

## What still works from the repository

| File | What it does on Cursor 3.21.16 |
|---|---|
| [`.cursor/permissions.json`](../../.cursor/permissions.json) | Schema-valid intent + `autoRun` steering text. **Does not** populate the Shell allowlist UI. |
| [`.cursor/sandbox.json`](../../.cursor/sandbox.json) | Sandbox network/FS policy when sandboxing runs. |
| [`scripts/fz-noc/policy.mjs`](../../scripts/fz-noc/policy.mjs) | DANGEROUS shell/MCP → `deny` (independent of IDE allowlist). |
| [`scripts/fz-noc/permissions.mjs`](../../scripts/fz-noc/permissions.mjs) | Classification tests for SAFE vs gated commands. |

FZ hooks already `allow` SAFE verification. IDE Allow prompts are the
Cursor Approvals layer, not Decision Gates.

## Owner UI action (required for Auto-review)

Keep **Auto-review**. Do **not** switch to Run Everything. Do **not**
add `terminalAllowlist` to `~/.cursor/permissions.json` while Auto-review
must remain selected.

1. Open **Cursor Settings → Agents → Approvals & Execution**.
2. Confirm Run Mode is **Auto-review**.
3. In the **Shell allowlist** editor (IDE-managed, not file-managed),
   add these prefixes one by one (same set as the repo intent file;
   do **not** add bare `git`, `git push`, `powershell`, or `wrangler`):

```text
git status
git diff
git show
git log
git rev-parse
git merge-base
git ls-files
git grep
git add
git commit
git branch
git remote
git fetch
node
pnpm
npm test
npm run
npx
Select-String
Select-Object
Measure-Object
Write-Host
Write-Output
Get-Content
Get-ChildItem
Test-Path
```

4. Fully quit Cursor (**File → Exit** / quit the app) and reopen the
   Forma Zieleni workspace once after the first batch of entries.
5. Optional: on a SAFE prompt, use **Add to allowlist** for that exact
   prefix instead of typing it — same IDE allowlist.

After that, Auto-review runs allowlisted SAFE calls immediately; other
calls still go through sandbox/classifier. FZ hooks continue to **deny**
force-push, destructive git, wrangler, and Cloudflare mutations.

## One writer

Only the primary `/noc` coordinator mutates `main`. Verifiers and
review subagents stay read-only. The allowlist does not authorize a
second writer.
