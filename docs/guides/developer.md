# Local development

Audience: a developer or a Cursor agent on a fresh checkout.

## Requirements

Node 24 and pnpm 10, as declared in the root `package.json`. Git is
required. Docker is not required for local work. PostgreSQL is optional.
Integration tests skip when `LEAD_DATABASE_URL` is unset and no local
PostgreSQL binaries are found. The skip reason is printed by the test.

Windows is the current workstation. Eight supervisor tests skip when
`pwsh` is not on PATH. That skip is visible in the test output.

## Commands

```text
pnpm typecheck
pnpm test
pnpm repo:check
pnpm docs:check
```

`pnpm test` runs package tests, contract tests, and the CMS lab gate.
It does not push and it does not deploy.

## Where to read next

Start at `START-HERE-CURSOR.md`. Then open
`docs/DOCUMENTATION-MAP.md` and only the context-map entry for the task.
The context window size is not a reason to read every document.

## Next product slice

`docs/architecture/NEXT-SLICES-CMS.md` still lists MEDIA-COLLECTIONS as
the next ordinary READY slice after the documentation rows in the
requirement registry. Do not start a second roadmap.
