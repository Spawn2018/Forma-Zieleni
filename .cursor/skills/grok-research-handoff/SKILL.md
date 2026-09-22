---
name: grok-research-handoff
description: Prepare a bounded research or independent-review task for Grok Bot without giving it authority over canonical decisions.
---
Produce a task brief containing goal, context files, exact questions, required current sources, output artifact, acceptance criteria and prohibited actions. Grok findings are inputs only and must be reconciled against authoritative sources and Forma Zieleni canon before adoption. Never include secrets or customer data.

Binding local channel: the Windows `grok` CLI (`scripts/security/grok-callable.mjs`). Check `node scripts/security/grok-callable.mjs status` before claiming CALLABLE. Use `plan` for trigger disposition and a synthetic `probe` only when authenticating a new machine. For real challenges, invoke headless `grok -p` with a sanitized brief, `--deny` mutation tools, and record `GROK_*` via `scripts/fz-noc/policy.mjs` `grokDisposition`. If `authenticated` is false, stop only the auth substep and ask the Owner to run `grok login` (or `grok login --device-auth`). Do not invent API keys or commit tokens.
