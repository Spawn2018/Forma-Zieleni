# Golden paths

Status: CURRENT. This is the minimum internal platform. It is not a
separate portal, and it is not Backstage.

One writer on `main` implements one slice. Read-only research and review
may run beside that writer. Work-stealing starts only when the current
slice is blocked. The loop is `docs/cursor-os/CURSOR-OS-2026.md`.

| Journey | Use | Done when |
| --- | --- | --- |
| New behavior | Cursor OS stages, including the documentation impact check | Tests for the behavior pass and the canonical page matches the code |
| New HTTP behavior | `contracts/openapi.json` plus an API test | `pnpm docs:check` still sees the safety flags on plan responses |
| New migration | `apps/api/src/db.ts` and a down path | No unused table is added for a feature with no consumer |
| New domain rule | `packages/domain` and a `node:test` file | The rule is named in the glossary only by a link |
| New integration | `INTEGRATIONS` in `packages/domain/src/growth.ts` | Live mutation still throws |
| New binding document | Catalog entry, map link, context-map pointer | `pnpm docs:check` passes |
| Production change | Owner gate | The page is not permission to deploy |

Low-risk engineering stays on tests and local review. Price, privacy,
legal terms, spend, DNS, Cloudflare, and hosting stay Owner or DANGEROUS
gates. Those gates are not a change board for ordinary code.

Platform quality is whether the next slice can be found and checked.
It is not the number of platform documents.
