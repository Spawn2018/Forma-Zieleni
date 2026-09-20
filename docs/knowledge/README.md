# Knowledge system

The `legacy/` directory is intentionally non-canonical source evidence. Never let a legacy file override current Canon. Use it to recover detailed copy, UX, marketing, research, schemas, API ideas, code and visual intent when a slice needs them.

## Current precedence

1. Project Constitution
2. Explicit current owner decisions — see decision roles below
3. Product Canon / Master Plan
4. **[`../architecture/CURRENT-ARCHITECTURE.md`](../architecture/CURRENT-ARCHITECTURE.md)** (sole binding architecture) + Security
5. Current Domain/API/Data contracts (when approved — none yet for OpenAPI)
6. Approved slice specification
7. Active Cursor rules/skills/agents
8. Legacy/reference evidence (including `freset-v2-reference/` and `../../legacy/`)

## Decision roles

| Document | Role |
|----------|------|
| [`POST-V2-DECISIONS.md`](./POST-V2-DECISIONS.md) | **Current override / decision ledger** after F-RESET v2 |
| [`../architecture/DECISIONS.md`](../architecture/DECISIONS.md) | Formal **ADR history** |

**Rule:** latest explicit owner decision wins; history remains traceable.

## Important indexes

- `SOURCE-INVENTORY.csv`
- `COVERAGE-MATRIX.md`
- `POST-V2-DECISIONS.md`
- `REPOSITORY-CATALOG.md`
- `URL-CATALOG.md`
- [`freset-v2-reference/`](./freset-v2-reference/) — F-RESET v2 **provenance snapshots** (not live Canon)

## Legacy OpenAPI

`../../legacy/freset-v2-full/contracts/openapi.yaml` and any OpenAPI paths cited under provenance indexes are **LEGACY / REFERENCE**. They are not the current API contract and do not complete Gate B.
