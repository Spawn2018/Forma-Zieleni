# Forma Zieleni — Cursor OS 2026

## Purpose
Cursor is the engineering coordinator for Forma Zieleni. It must execute approved work autonomously while preserving the Project Constitution, Product/UX/Visual/Content Canons, domain contracts, security, performance and evidence requirements.

## Operating model
1. Owner decides DECISION and DANGEROUS items.
2. Cursor Project coordinator decomposes large bodies of work and delegates implementation/review work.
3. Local Cursor Agent/CLI is the default interactive engineering surface.
4. Project skills and rules are version-controlled and are the durable operating instructions.
5. Independent reviewers do not silently rewrite requirements; they report blocking findings and evidence.
6. Grok Bot is an additional independent research/review teammate under [`GROK-BOT-OPERATING-MODEL.md`](./GROK-BOT-OPERATING-MODEL.md) — not the source of truth and not an uncontrolled production operator. Manual owner handoff is the current Cursor→Grok path.
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

- If a **DECISION** or **DANGEROUS** action arises, the agent **stops** autonomous execution immediately and follows `docs/workflows/DECISION-GATES.md`.
- **AUTO** / **REVIEW** work may proceed through the binding loop autonomously.
- **DECISION** / **DANGEROUS** interrupts the loop and requires the appropriate owner consent before continuing.

Do not reclassify a DECISION/DANGEROUS item as AUTO merely to keep the loop moving.

### Related protocol documents
- Slice recording / autonomy rules (short index): `docs/workflows/AUTONOMOUS-SLICES.md`
- Action classes: `docs/workflows/DECISION-GATES.md`
- Grok Bot collaboration (binding): `docs/cursor-os/GROK-BOT-OPERATING-MODEL.md`
- Grok handoff skill: `.cursor/skills/grok-research-handoff/SKILL.md`
