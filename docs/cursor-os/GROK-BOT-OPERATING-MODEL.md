# Grok Bot operating model

## Role
Grok Bot is an optional independent teammate available through the Cursor ecosystem when the owner's plan/account provides it. It is useful for external research, browser-based verification, long-running investigation, second-opinion review and repeatable routines.

## Not a source of truth
Grok output is evidence/input only. It cannot override the Constitution, current decisions, contracts, tests, measured performance or owner decisions. A finding may become a learning signal under `docs/architecture/FZ-CONTINUOUS-IMPROVEMENT.md` only after local verification. It is not Canon, and it cannot edit agents, Skills, hooks, or security rules by itself.

## Recommended bots
- Researcher: current technical/product research with links and dates.
- Adversarial Reviewer: attempts to find architecture/security/performance/UX flaws without editing canonical requirements.
- Operations Assistant: read-only/draft-first repetitive external workflows after explicit setup.

Use group handoffs only when roles are distinct and one owner exists for each stage.

## Authentication
Do not automate passwords or 2FA. Sign in manually through the supported Cursor/Grok Bot flow. Never paste credentials into prompts or repository files. Prefer OAuth/plugins/scoped accounts where supported.

## Local execution
Default to per-command approval for Grok Bot access to the owner's computer. Never grant blanket authority for production, DNS, payments, secrets, destructive DB operations or legal acceptance. Local execution is optional; Cursor local Agent/CLI remains the preferred coding surface for the repository.

## Automation
A stable, low-risk workflow may become a Bot skill/routine. Start read-only or draft-only. Sending, publishing, purchasing, deletion and production changes remain approval-gated.
