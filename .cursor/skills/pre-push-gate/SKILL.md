---
description: Use immediately before any push to main or when asked
  whether a change is ready to ship.
name: pre-push-gate
---

# pre-push-gate

.cursor/skills/pre-push-gate/SKILL.md
Execute docs/engineering/PRE-PUSH-GATE.md. Inspect the actual diff. Run
`pnpm pre-push:gate` (or `pnpm push:main` when a safe fast-forward push
is intended) rather than assuming success or running `git push` directly.
`pnpm push:main` also waits for exact-SHA GitHub CI before overall success.
Block the push on failures or unresolved DECISION/DANGEROUS items. Return a
concise PASS/FAIL report with evidence and commands run.

## Security-tool integration update --- 2026-09-21

Binding security-tool details live in
`docs/security/SECURITY-ASSURANCE.md` and the Owner onboarding flow in
`docs/security/OWNER-SETUP-CODERABBIT-OWASP.md`.

CodeRabbit is an independent review layer, not Canon authority. Preserve
`main-only`; use Cursor/IDE/CLI pre-push review rather than creating PRs
solely for CodeRabbit. Respect the verified account rate limit; until
verified, budget at most 3 free CLI reviews per developer per rolling
hour. Usage-based billing is OWNER-DECISION.

OWASP baseline: ASVS 5.0.0 requirements, ZAP DAST for runnable
local/lab/staging targets, and Dependency-Check/SCA where technically
suitable. Never active-scan legacy CT8 production or live customer
environments without explicit Owner approval.
