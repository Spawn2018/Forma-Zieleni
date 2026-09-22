---
name: grok-research-handoff
description: Prepare a bounded research or independent-review handoff for Grok without giving it authority over canonical decisions.
---

# Grok research / review handoff

Use when Forma Zieleni needs **external research** or **independent adversarial review**.

## Authority

- Binding model: `docs/cursor-os/GROK-BOT-OPERATING-MODEL.md`
- Local callable channel: `node scripts/security/grok-callable.mjs` (Windows `grok` CLI)
- Findings are **inputs only** — never override Canon, contracts, tests, or Owner decisions
- Never include secrets, tokens, credentials, or customer/PII data
- Grok must not mutate the repository; Cursor remains the writer

## Before claiming CALLABLE

1. `node scripts/security/grok-callable.mjs status`
2. If `authenticated` is false: stop only auth — Owner runs `grok login` or `grok login --device-auth`
3. Optional machine probe: `node scripts/security/grok-callable.mjs probe`

## Produce a structured brief

Goal, context paths, exact questions, required sources, output artifact, acceptance criteria, prohibited actions. Prefer headless `grok -p` with `--deny` for mutation tools when the challenge is justified by `grokDisposition` triggers. Routine work records `GROK_NOT_NEEDED`.

## After Grok returns

Reconcile against Canon and tests. Adopt, reject, or defer with local verification. Record `GROK_*` state; optional FZ-CIS learning only after verification.
