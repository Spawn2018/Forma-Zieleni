---
name: pre-push-gate
description: Use immediately before any push to main or when asked whether a change is ready to ship.
---
# pre-push-gate
Execute docs/engineering/PRE-PUSH-GATE.md. Inspect the actual diff. Run
`pnpm pre-push:gate` (or `pnpm push:main` when a safe fast-forward push
is intended) rather than assuming success or running `git push` directly.
Block the push on failures or unresolved DECISION/DANGEROUS items. Return a
concise PASS/FAIL report with evidence and commands run.
