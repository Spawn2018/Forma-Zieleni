# Forma Zieleni — Cursor OS 2026

## Purpose
Cursor is the engineering coordinator for Forma Zieleni. It must execute approved work autonomously while preserving the Project Constitution, Product/UX/Visual/Content Canons, domain contracts, security, performance and evidence requirements.

## Operating model
1. Owner decides DECISION and DANGEROUS items.
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

## Required loop
DISCOVER -> PLAN -> CONTRACT -> IMPLEMENT -> TEST -> REFACTOR -> SECURITY REVIEW -> PERFORMANCE/DATA REVIEW -> UX/A11Y REVIEW when applicable -> DOCUMENT -> FINAL DIFF -> PRE-PUSH GATE -> COMPLETE.

A failed gate returns work to the owning implementation agent. Never weaken a gate to make it pass.
