# Forma Zieleni — Cursor OS 2026

## Purpose
Cursor is the engineering coordinator for Forma Zieleni. It must execute approved work autonomously while preserving the Project Constitution, Product/UX/Visual/Content Canons, domain contracts, security, performance and evidence requirements.

## Operating model
1. Owner is the decision authority for OWNER-DECISION, OWNER-ONLY and DANGEROUS items. OpenAI/ChatGPT is not required in the runtime decision loop.
2. Cursor Project coordinator decomposes large bodies of work and delegates implementation/review work.
3. Local Cursor Agent/CLI is the default interactive engineering surface.
4. Project skills and rules are version-controlled and are the durable operating instructions.
5. Independent reviewers do not silently rewrite requirements; they report blocking findings and evidence.
6. Grok Bot is an additional independent research/review/operations teammate, not the source of truth and not an uncontrolled production operator.
7. Deterministic tools (tests, linters, type checks, contract checks, benchmarks, migration checks) decide mechanical gates whenever possible; LLM judgment supplements them.

## Canon loading order
PROJECT-CONSTITUTION -> owner decisions (`POST-V2-DECISIONS` override ledger + `DECISIONS` ADR history; latest explicit wins) -> PRODUCT-CANON/MASTER-PLAN -> VISUAL/UX/CONTENT CANONS -> **CURRENT-ARCHITECTURE** (sole binding) -> DOMAIN/API contracts -> current slice -> Rules/Skills -> legacy/reference.

`docs/architecture/ARCHITECTURE.md` is a superseded redirect only.

## Parallelism policy
Parallelize research, independent review, test investigation and non-overlapping implementation. Do not parallel-edit the same domain boundary or migration unless ownership is explicit. One agent owns final integration for a slice.

## Human-quality code
Code must be intentional, boring where possible, domain-named, locally understandable and proportionate to current requirements. Avoid AI-shaped abstraction inflation, generic helpers, speculative frameworks, duplicate wrappers, verbose comments that restate code, invented business rules and broad rewrites unrelated to the slice.

## Binding autonomous execution loop

**This section is the sole binding definition** of the autonomous slice execution loop for Forma Zieleni.

```text
DISCOVER
→ PLAN
→ CONTRACT
→ IMPLEMENT
→ TEST
→ REFACTOR
→ SECURITY REVIEW
→ PERFORMANCE/DATA REVIEW when applicable
→ UX/A11Y/VISUAL/CONTENT REVIEW when applicable
→ DOCUMENT
→ FINAL DIFF
→ PRE-PUSH GATE
→ COMPLETE
```

### Stage notes
- **CONTRACT** is required before implementation wherever the slice affects API/domain contracts or introduces a new external surface.
- **TEST**, **REFACTOR**, **SECURITY REVIEW**, **DOCUMENT**, **FINAL DIFF**, **PRE-PUSH GATE**, and **COMPLETE** are mandatory for implementation slices (proportionate evidence for docs-only / non-code slices).
- **PERFORMANCE/DATA REVIEW** runs when the slice can affect hot paths, queries, migrations, caching, bundles, media, uploads or resource use.
- **UX/A11Y/VISUAL/CONTENT REVIEW** runs when the slice affects customer-facing or operator-facing UI/copy; obey Visual, UX and Content Canons.
- A failed gate returns work to the owning implementation agent. Never weaken a gate to make it pass.
- Pre-push detail: `docs/cursor-os/PRE-PUSH-ORCHESTRATION.md` and `docs/engineering/PRE-PUSH-GATE.md`.

### Decision Gate — interrupt / exit condition (every stage)

**DECISION GATE is not a normal terminal step of the loop.**

It is an **interrupt / exit condition that applies at every stage**:

- If an **OWNER-DECISION**, **OWNER-ONLY** or **DANGEROUS** action arises, the agent **stops** the dependent slice immediately and follows `docs/workflows/DECISION-GATES.md`.
- **AUTO** / **REVIEW** work may proceed through the binding loop autonomously.
- Independent safe slices continue while the blocked slice waits.
- Silence is never consent. Do not reclassify OWNER-DECISION, OWNER-ONLY or DANGEROUS as AUTO to keep the loop moving.

### Related protocol documents
- Slice recording / autonomy rules (short index): `docs/workflows/AUTONOMOUS-SLICES.md`
- Action classes: `docs/workflows/DECISION-GATES.md`
- Grok Bot collaboration (binding): `docs/cursor-os/GROK-BOT-OPERATING-MODEL.md`
- Grok handoff skill: `.cursor/skills/grok-research-handoff/SKILL.md`
- Security assurance: `docs/security/SECURITY-ASSURANCE.md`
- Owner security-tool setup: `docs/security/OWNER-SETUP-CODERABBIT-OWASP.md`

## Agentic execution policy
Agentic automation is layered on top of clean data, explicit contracts and deterministic rules; it is never the source of truth. Prefer bounded tools, structured inputs/outputs and deterministic gates. Every consequential automation defines blast radius, failure/recovery behavior, audit evidence and resource budgets. Graceful degradation must keep critical product/business workflows usable when AI is unavailable.

## Owner-in-loop controller
The Autonomous Session Controller may orchestrate the binding loop, but it must not create a competing loop or weaken gates. OWNER-DECISION pauses only the dependent slice; safe independent work may continue. An Owner reply uses `DECISION FZ-###: OPTION X` plus optional constraints and is validated for id and ambiguity before the slice resumes. The OpenAI adapter remains in the tree, default-off, and unused by the session loop. Native unattended write execution remains disabled until filesystem/credential/path isolation is runtime-verified. The known Codex/Windows sandbox blocker must not be bypassed merely to gain autonomy. That limitation belongs to the audit controller. It does not disable the interactive Cursor Agent.

## Session window (`/noc`)

`/noc <hour>` is the Owner's session window, not a second execution loop and not a second roadmap. `/noc 9` means the next 09:00 in `Europe/Warsaw`, including daylight saving. The command is `.cursor/commands/noc.md`. The procedure is [the autonomous execution skill](../../.cursor/skills/fz-autonomous-execution/SKILL.md).

The interactive Agent stays on the binding loop above. When an ordinary turn completes inside an active window, the project `stop` hook submits the next cycle. A 15-minute `loop-noc` watchdog recovers a dead session; it does not choose work. Runtime coordination lives in gitignored `.fz-noc/live.json` (shape: [`.fz-noc/live.example.json`](../../.fz-noc/live.example.json)). The execution graph remains `docs/architecture/NEXT-SLICES-CMS.md`.

Local commit, push, and deploy stay distinct. The window does not approve OWNER-DECISION, OWNER-ONLY, or DANGEROUS actions. Grok and CodeRabbit remain evidence sources; their absence does not stop other READY work. Product execution stays on the local Agent. A Cloud or Background Agent is not the autonomy path unless the Owner decides otherwise.

## Learning flywheel

After COMPLETE, the autonomous skill runs a proportional learning check. That check is not a stage of the loop above and is not a second execution loop. Binding rules: [`../architecture/FZ-CONTINUOUS-IMPROVEMENT.md`](../architecture/FZ-CONTINUOUS-IMPROVEMENT.md).

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
