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

`pnpm readme:check` confirms machine-owned README regions. `pnpm readme:write`
refreshes only those regions. Both leave the file unchanged when it has
no `<!-- FZ:AUTO:START name -->` / `<!-- FZ:AUTO:END name -->` pair. The
only name is `progress`. Values come from the requirement coverage file,
the documentation catalog, and whether `apps/web`, `apps/portal`,
`apps/admin`, and `apps/api` have a `package.json`. That projection is
`UPDATED_AT_CHECKPOINT`, not a live feed, and it is not a completion
percentage. The current README has no such region. Do not insert a CI
badge unless the README already reserves that place. Run status on the
Actions tab is `LIVE_FROM_GITHUB`.

## GitHub verification

`.github/workflows/ci.yml` runs on a push to `main` and on
`workflow_dispatch`. It checks the repository. It does not deploy, and
it does not commit back. The product graph stays
[`../architecture/NEXT-SLICES-CMS.md`](../architecture/NEXT-SLICES-CMS.md).

## Where to read next

Start at `START-HERE-CURSOR.md`. Then open
`docs/DOCUMENTATION-MAP.md` and only the context-map entry for the task.
The context window size is not a reason to read every document.

## Next product slice

`LEAD-SEC-ACCEPT` report is filed
(`docs/security/LEAD-SEC-ACCEPT-REPORT-2026-09-22.md`). Lead is still
**not** security-accepted; that stays report-only and does not globally
block product work. After false-exhaustion repair, READY AUTO/REVIEW
product slices on `docs/architecture/NEXT-SLICES-MAIN.md` include
`PORTAL-PROJECT-PROJECTION`, `ADMIN-APP`, and boundary slices. Missing binding
slices are an internal materialization defect, not Owner roadmap
refresh. ZAP and Dependency-Check do not block unrelated product work.
The CMS/Search graph stays acceptance history. Do not start a second
roadmap.
