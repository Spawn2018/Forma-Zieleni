---
name: grok-research-handoff
description: Prepare a bounded research or independent-review handoff for Grok Bot (manual owner transfer). Does not invoke Grok programmatically and does not authorize implementation.
---

# Grok research / review handoff

Use this skill when Forma Zieleni needs **external research** or **independent adversarial review** via Grok Bot.

## Authority boundaries

- Binding Grok collaboration model: `docs/cursor-os/GROK-BOT-OPERATING-MODEL.md`
- Binding slice loop: `docs/cursor-os/CURSOR-OS-2026.md`
- Decision classes: `docs/workflows/DECISION-GATES.md`
- Grok findings are **inputs only** — never override Canon, contracts, tests or owner decisions
- This handoff is **research/review**, **not** implementation authorization
- Codex local Agent **cannot** programmatically invoke a named Grok Bot and receive a return today — produce the brief for **manual owner transfer**
- Never include secrets, tokens, credentials, private keys or customer/PII data
- Do not propose custom bridges, Electron automation as binding path, Supermemory init, Continual Learning edits, Orchestrate fan-out or Thermos runs unless the owner already opened a DECISION for that

## Produce exactly this structured handoff

```markdown
# Grok handoff — Forma Zieleni

## TASK
<one paragraph: what to research or review; named Bot(s): Researcher and/or Adversarial Reviewer>

## CONTEXT
- Repository: Forma Zieleni (local main-only workflow)
- Slice / objective:
- Relevant local paths (read-only for Grok unless owner grants computer use):
- What Codex local already concluded (to challenge or extend):

## CANON REFERENCES
- docs/constitution/PROJECT-CONSTITUTION.md
- docs/architecture/CURRENT-ARCHITECTURE.md
- docs/knowledge/POST-V2-DECISIONS.md
- <add Visual/UX/Content/Product/Security paths as applicable>
- Note: legacy/ is reference only; do not treat as current stack decisions

## RESEARCH QUESTIONS
1.
2.
3.

## REQUIRED EVIDENCE
- Current primary sources with URLs and retrieval dates where possible
- Explicit separation of fact vs inference
- What would falsify the Codex local conclusion

## REVIEW REQUEST
- Target Bot: Forma Zieleni — Researcher | Forma Zieleni — Adversarial Reviewer | both (Researcher first, then handoff)
- Severity taxonomy for Adversarial Reviewer: BLOCKER | MAJOR | MINOR | NO ISSUE
- Scope limits:

## ALLOWED ACTIONS
- Read Canon / supplied paths
- External research with provenance
- Independent challenge of conclusions
- Optional Codex CloudAgent **only if** owner/Grok explicitly enables it for this task and Forma Zieleni gates are respected (no silent branch/PR override of main-only)
- Local computer use **only** under per-command approval ("Ask every time")

## PROHIBITED ACTIONS
- Treat Grok/plugin/chat/Supermemory memory as source of truth
- Modify Forma Zieleni Canon or repository without going back through Codex local + gates
- Choose framework / hosting / DB / ORM / storage / payment provider
- Push, production, DNS, secrets, destructive data ops
- Build custom Codex→Grok bridges or control-ui automation as the delivery path
- Initialize Supermemory / Continual Learning / Orchestrate / Thermos unless a DECISION already exists
- Invent business facts, fake evidence or generic redesign

## DECISION GATES
- AUTO/REVIEW: proceed within this research/review scope
- DECISION: stop and surface to owner (framework, infra, provider, material scope, legal, material UX, custom bridge, Supermemory, Continual Learning, Orchestrate, etc.)
- DANGEROUS: stop (production, secrets, DNS, deletion, destructive migration, real payments, irreversible ops)

## EXPECTED RETURN FORMAT
### Summary
### Findings (BLOCKER / MAJOR / MINOR / NO ISSUE as applicable)
### Evidence (links + dates)
### Disagreements with Codex local conclusion
### Recommended next action for Codex local (research-only; not implementation auth)
### Explicit non-decisions (what must remain owner DECISION)
```

## After Grok returns

Codex local must:

1. reconcile against Canon and deterministic gates;
2. refuse to adopt unverified claims;
3. escalate DECISION/DANGEROUS items;
4. treat the return as evidence for the binding loop — not as COMPLETE/implementation approval.
