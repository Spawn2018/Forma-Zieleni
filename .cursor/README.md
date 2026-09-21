# .cursor — Forma Zieleni Cursor OS materials

Version-controlled Cursor rules, skills and subagents for this repository.

## Agent entrypoint

Agents must start at repository root: [`../START-HERE-CURSOR.md`](../START-HERE-CURSOR.md).

Binding architecture: [`../docs/architecture/CURRENT-ARCHITECTURE.md`](../docs/architecture/CURRENT-ARCHITECTURE.md).

## Cloudflare plugin note

`settings.json` may enable the Cloudflare editor plugin for **ingress / security / documentation** context.

That does **not** approve application hosting on Cloudflare compute/data products:

- Workers = **not selected**
- D1 = **not selected**
- R2 = **not selected**
- Pages = **not selected**

Do not infer stack choices from plugin availability. See `docs/architecture/CURRENT-ARCHITECTURE.md` and `infra/cloudflare/README.md`.
