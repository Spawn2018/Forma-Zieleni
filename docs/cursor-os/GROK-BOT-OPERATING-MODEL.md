# Grok Bot operating model

Status: **CURRENT / BINDING** for Cursor OS ↔ Grok Bot collaboration on Forma Zieleni.

Binding autonomous slice loop remains: [`CURSOR-OS-2026.md`](./CURSOR-OS-2026.md).
This file does **not** redefine that loop.

## Verified capabilities (environment)

| Direction | Status |
|-----------|--------|
| Grok Bot → Cursor CloudAgent | **AVAILABLE** (tested PASS) |
| Grok Bot ↔ Grok Bot (Researcher → Adversarial Reviewer) | **AVAILABLE** (tested PASS) |
| Grok Bot → local computer | **AVAILABLE** with per-command approval; default **"Ask every time"** |
| Cursor local Agent → named Grok Bot (programmatic invoke + return) | **NOT AVAILABLE** as an official path |
| Cursor SDK as Grok Bot API / Cursor→Grok bridge | **NOT** — do not treat SDK as Grok Bot API |
| Cursor SDK / Orchestrate autonomous fan-out | **Do not run** without **DECISION** (external SDK/API key/cloud fan-out) |
| control-ui / Electron automation of Grok Bot | **FALLBACK only** — never the binding orchestration path |
| Supermemory for Forma Zieleni | **Do not initialize** without **DECISION**; never source of truth |
| Continual Learning auto-edit of `AGENTS.md` / binding knowledge | **Forbidden** without **DECISION** |
| Thermos | Optional independent review tool; does **not** replace Forma Zieleni reviewers; do not run autonomously if it assumes branch/PR workflow against main-only policy |
| tinkabot / Create Plugin as Grok bridge | **Do not build** without a callable Grok API; marketplace publication is not a project goal |

## Binding role model

| Role | Authority |
|------|-----------|
| **OWNER** | Business / architecture / infrastructure / provider / irreversible **DECISION** and **DANGEROUS** gates |
| **CURSOR LOCAL** | Primary coordinator and implementation plane; binding Cursor OS loop; **local main-only** workflow |
| **GROK RESEARCHER** | External research, evidence gathering, current documentation verification, independent second opinion |
| **GROK ADVERSARIAL REVIEWER** | Independent challenge/review; attempts to falsify conclusions; reports **BLOCKER / MAJOR / MINOR / NO ISSUE** |
| **CURSOR CLOUDAGENT** | Optional worker launched **from Grok** only when explicitly appropriate; must obey Forma Zieleni gates; must **not** silently override **main-only** with branch/PR workflow |

## Source of truth

**Forma Zieleni Canon + repository hierarchy** remain authoritative.

Never authoritative over binding repository documentation:

- Grok memory / chat memory
- plugin memory
- Supermemory
- Continual Learning artifacts
- model recollection

Grok (and any external bot) output is **evidence/input only**. Reconcile against Canon, contracts, tests and measurements before adoption.

## Handoff model (current)

```text
Cursor local
  → structured Grok research/review handoff (skill: grok-research-handoff)
  → owner may transfer handoff to Grok
       (until an official safe invoke+return API exists)
  → Grok Researcher
  → Grok Adversarial Reviewer
  → optional Cursor CloudAgent (from Grok, when appropriate)
  → evidence/report
  → Cursor local consumes result
  → deterministic tests / contracts / gates arbitrate
```

### Manual owner handoff

**Intentional.** Do **not** build a custom bridge merely to eliminate one copy/paste step.

Future automation may replace manual transfer only when:

1. an official callable interface exists, **or**
2. a separately approved **DECISION** authorizes a custom bridge.

### Custom bridge status

**NOT APPROVED.**

### Research/review vs implementation

A Grok handoff is **research/review** only. It is **not** implementation authorization and does **not** bypass Decision Gates.

## Local computer policy

Default for Grok Bot access to the owner's computer: **ask every time**.
Never grant blanket authority for production, DNS, payments, secrets, destructive DB operations or legal acceptance.
Cursor local Agent/CLI remains the preferred coding surface for the repository.

## Authentication

Do not automate passwords or 2FA. Sign in manually through supported Cursor/Grok Bot flows. Never paste credentials into prompts or repository files.

## Group handoffs

Use Grok group handoffs only when roles are distinct and **one owner exists for each stage** (e.g. Researcher then Adversarial Reviewer).

## Skill

Structured handoffs: `.cursor/skills/grok-research-handoff/SKILL.md`.
