# docs — Forma Zieleni documentation map

This directory is the active project documentation tree. It is an **index**, not a second Canon.

## How to read (precedence)

1. [`constitution/PROJECT-CONSTITUTION.md`](./constitution/PROJECT-CONSTITUTION.md)
2. Explicit owner decisions — see [Decision sources](#decision-sources) below
3. [`vision/PRODUCT-CANON.md`](./vision/PRODUCT-CANON.md) + [`vision/MASTER-PLAN.md`](./vision/MASTER-PLAN.md)
4. Visual / UX / Content canons
5. [`architecture/CURRENT-ARCHITECTURE.md`](./architecture/CURRENT-ARCHITECTURE.md) + security
6. Domain / API contracts (when present)
7. Current slice specification
8. Active Cursor rules / skills / agents
9. Knowledge / legacy — **reference only**

Cursor agents start at repository root: [`../START-HERE-CURSOR.md`](../START-HERE-CURSOR.md).

---

## Constitution

| Document | Role |
|----------|------|
| [`constitution/PROJECT-CONSTITUTION.md`](./constitution/PROJECT-CONSTITUTION.md) | Highest stable engineering principles |

## Vision / product

| Document | Role |
|----------|------|
| [`vision/PRODUCT-CANON.md`](./vision/PRODUCT-CANON.md) | Binding product lifecycle and surfaces |
| [`vision/MASTER-PLAN.md`](./vision/MASTER-PLAN.md) | Staged program (A–D) |

## Architecture

| Document | Role |
|----------|------|
| [`architecture/CURRENT-ARCHITECTURE.md`](./architecture/CURRENT-ARCHITECTURE.md) | **Sole BINDING current architecture** |
| [`architecture/SECURITY.md`](./architecture/SECURITY.md) | Security requirements and baselines |
| [`architecture/DECISIONS.md`](./architecture/DECISIONS.md) | Formal ADR history |
| [`architecture/ARCHITECTURE.md`](./architecture/ARCHITECTURE.md) | Superseded redirect / provenance only |
| [`architecture/README.md`](./architecture/README.md) | Architecture folder index |

## Design / Visual Canon

| Document | Role |
|----------|------|
| [`design/VISUAL-PRODUCT-CANON.md`](./design/VISUAL-PRODUCT-CANON.md) | Binding visual language (anti-AI-slop) |
| [`design/VISUAL-REFERENCE-MAP.md`](./design/VISUAL-REFERENCE-MAP.md) | Index of required mockup evidence |

## UX Canon

| Document | Role |
|----------|------|
| [`ux/UX-PRODUCT-CANON.md`](./ux/UX-PRODUCT-CANON.md) | Binding UX lifecycle and interaction rules |

## Content Canon

| Document | Role |
|----------|------|
| [`content/CONTENT-AND-VOICE-CANON.md`](./content/CONTENT-AND-VOICE-CANON.md) | Binding voice; no invented business facts |

## Domain

| Document | Role |
|----------|------|
| [`domain/DOMAIN-MAP.md`](./domain/DOMAIN-MAP.md) | Planned domain modules (not yet implemented) |
| [`domain/README.md`](./domain/README.md) | Domain docs index |

## API

| Document | Role |
|----------|------|
| [`api/API-FIRST.md`](./api/API-FIRST.md) | API-first rules; Gate B posture |
| [`api/README.md`](./api/README.md) | API docs index + legacy OpenAPI warning |

There is **no** approved current OpenAPI file in the active tree yet.

## Engineering

| Document | Role |
|----------|------|
| [`engineering/ENGINEERING-STANDARD.md`](./engineering/ENGINEERING-STANDARD.md) | Professional code standard |
| [`engineering/PERFORMANCE-ENGINEERING.md`](./engineering/PERFORMANCE-ENGINEERING.md) | Performance discipline |
| [`engineering/DATABASE-ENGINEERING.md`](./engineering/DATABASE-ENGINEERING.md) | Data/schema discipline |
| [`engineering/PRE-PUSH-GATE.md`](./engineering/PRE-PUSH-GATE.md) | Mandatory pre-push engineering gate |
| [`engineering/REFACTORING-POLICY.md`](./engineering/REFACTORING-POLICY.md) | Safe refactoring policy |
| [`engineering/EVIDENCE-BASE.md`](./engineering/EVIDENCE-BASE.md) | Evidence over folklore |

## Quality

| Document | Role |
|----------|------|
| [`quality/QUALITY-GATES.md`](./quality/QUALITY-GATES.md) | Gate categories |
| [`quality/DEFINITION-OF-DONE.md`](./quality/DEFINITION-OF-DONE.md) | Definition of done |

## Workflows

| Document | Role |
|----------|------|
| [`workflows/DECISION-GATES.md`](./workflows/DECISION-GATES.md) | AUTO / REVIEW / DECISION / DANGEROUS |
| [`workflows/AUTONOMOUS-SLICES.md`](./workflows/AUTONOMOUS-SLICES.md) | Slice execution protocol |

## Knowledge / provenance

| Document | Role |
|----------|------|
| [`knowledge/README.md`](./knowledge/README.md) | Knowledge system + precedence |
| [`knowledge/POST-V2-DECISIONS.md`](./knowledge/POST-V2-DECISIONS.md) | **Current override decision ledger** |
| [`knowledge/COVERAGE-MATRIX.md`](./knowledge/COVERAGE-MATRIX.md) | Coverage / conflict resolutions |
| [`knowledge/REPOSITORY-CATALOG.md`](./knowledge/REPOSITORY-CATALOG.md) | Candidate repos (REVIEW_REQUIRED) |
| [`knowledge/URL-CATALOG.md`](./knowledge/URL-CATALOG.md) | URL inventory (re-verify before use) |
| [`knowledge/SOURCE-INVENTORY.csv`](./knowledge/SOURCE-INVENTORY.csv) | Source inventory |
| [`knowledge/freset-v2-reference/`](./knowledge/freset-v2-reference/) | F-RESET v2 **provenance snapshots** — not live Canon |

`../legacy/` is extracted source evidence. It never overrides current Canon.

## Cursor OS

| Document | Role |
|----------|------|
| [`cursor-os/CURSOR-OS-2026.md`](./cursor-os/CURSOR-OS-2026.md) | Cursor operating model |
| [`cursor-os/ORCHESTRATION-AND-MODEL-ROUTING.md`](./cursor-os/ORCHESTRATION-AND-MODEL-ROUTING.md) | Orchestration / model routing |
| [`cursor-os/PRE-PUSH-ORCHESTRATION.md`](./cursor-os/PRE-PUSH-ORCHESTRATION.md) | Pre-push orchestration |
| [`cursor-os/HOOKS-MCP-AUTOMATIONS.md`](./cursor-os/HOOKS-MCP-AUTOMATIONS.md) | Hooks / MCP / automations policy |
| [`cursor-os/GROK-BOT-OPERATING-MODEL.md`](./cursor-os/GROK-BOT-OPERATING-MODEL.md) | Binding Cursor ↔ Grok Bot collaboration model |
| [`cursor-os/PROJECTS-AND-LOCAL-EXECUTION.md`](./cursor-os/PROJECTS-AND-LOCAL-EXECUTION.md) | Projects / local execution |
| [`cursor-os/SETUP-FOR-NONTECHNICAL-OWNER.md`](./cursor-os/SETUP-FOR-NONTECHNICAL-OWNER.md) | Owner setup guide |
| [`cursor-os/CURSOR-2026-SOURCE-NOTES.md`](./cursor-os/CURSOR-2026-SOURCE-NOTES.md) | Source notes for Cursor OS layer |

## Runbooks

| Document | Role |
|----------|------|
| [`runbooks/DEVELOPMENT.md`](./runbooks/DEVELOPMENT.md) | Local monorepo development |
| [`runbooks/README.md`](./runbooks/README.md) | Runbooks index |

---

## Decision sources

Do not treat ADR history and the post-V2 ledger as the same kind of document.

| Document | Role |
|----------|------|
| [`architecture/DECISIONS.md`](./architecture/DECISIONS.md) | Formal **ADR history** (traceable decisions) |
| [`knowledge/POST-V2-DECISIONS.md`](./knowledge/POST-V2-DECISIONS.md) | **Current override / decision ledger** after F-RESET v2 |

**Rule:** latest explicit owner decision wins; history remains traceable.

---

## Infra notes (not hosting decisions)

See repository [`../infra/`](../infra/) — environment labels and Cloudflare **ingress** notes only. Hosting / compute / DB / storage remain UNDECIDED.
