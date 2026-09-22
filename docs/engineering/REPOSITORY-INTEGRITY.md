# Repository integrity

Status: CURRENT. This file is the only definition of what a checksum
artifact means in this repository.

## Current manifest

`SHA256SUMS.txt` at the repository root is the **current** integrity
manifest.

It records SHA-256 of the **LF-normalized text blob form** (and raw
bytes for binary) of every Git-tracked path, sorted by path, in
`sha256sum` form (`<hex>  <path>`). This matches Git `text=auto` /
Linux CI checkouts. Raw Windows CRLF working trees must not produce a
different manifest. Full per-file `git hash-object -w` is intentionally
not used in the gate (object-store churn).

It does **not** list:

- itself (a self-hash cannot stay stable),
- `.cursor/settings.json` (intentional local IDE state; do not commit
  local edits unless a later Canon decision says otherwise),
- ignored or untracked paths (`node_modules/`, `.pnpm-store/`, `.turbo/`,
  `.autonomous-sessions/`, `.source-materials/`, `tmp/`, real `.env`
  files, private keys).

Regenerate only with `node scripts/repo-integrity.mjs --write`, then
verify with `pnpm repo:check`. Do not edit the manifest by hand.

`pnpm repo:check` also checks tracked-file hygiene, a small secret-pattern
scan of tracked text, workspace `package.json` files that already
exist, required Canon entrypoints, the recorded FZ-A1–A7 decisions,
FZ-SIGN-1 still UNDECIDED, and relative links in the current Canon set.
It does not select a stack or a signing provider. OpenAPI behavior
stays in `pnpm test` (`contracts/openapi.test.mjs`).

## Not current manifests

These files are frozen provenance. Do not regenerate them to match HEAD.

| File | Role |
|---|---|
| `FILE-MANIFEST-SHA256.txt` (repository root) | Snapshot committed with the Canon baseline (`e840aa3`). It includes gitignored `.source-materials/` paths and a hash of an older `SHA256SUMS.txt`. It is not the current tree. |
| `docs/knowledge/freset-v2-reference/FILE-MANIFEST-SHA256.txt` | F-RESET v2 provenance, dated 2026-09-20 in its header. |
| `legacy/freset-v2-full/docs/FILE-MANIFEST-SHA256.txt` | Same historical pack, preserved under `legacy/`. `legacy/` is reference, not runtime truth. |

## Placeholders

`pnpm-workspace.yaml` globs `apps/*`, `packages/*` and `tooling/*`.
Directories such as `apps/web`, `apps/portal`, `apps/admin`, `apps/api`,
`packages/ui` and `packages/config` may exist without `package.json`
until an implementation slice adds them. Gate A being DECIDED does not
make a missing manifest a failed integrity check. An implementation
slice adds the real package when it creates the app.

An empty local `services/` directory, if present, is not a workspace
member (ADR-008 removed `services/*`). Do not add placeholder packages
there.
