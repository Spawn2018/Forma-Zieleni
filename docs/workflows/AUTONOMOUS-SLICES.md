# Autonomous Slice Protocol

Status: protocol index / recording rules.
**Binding execution loop:** [`../cursor-os/CURSOR-OS-2026.md`](../cursor-os/CURSOR-OS-2026.md) — section *Binding autonomous execution loop*.

Do not maintain a competing loop definition in this file.

## Short summary (non-binding)

Approved slices run the binding loop in `CURSOR-OS-2026.md`:

DISCOVER → PLAN → CONTRACT → IMPLEMENT → TEST → REFACTOR → SECURITY REVIEW → PERFORMANCE/DATA REVIEW when applicable → UX/A11Y/VISUAL/CONTENT REVIEW when applicable → DOCUMENT → FINAL DIFF → PRE-PUSH GATE → COMPLETE.

**Decision Gate** is not a normal end step. It is an interrupt/exit condition at **every** stage: DECISION or DANGEROUS stops autonomy per [`DECISION-GATES.md`](./DECISION-GATES.md). AUTO/REVIEW may proceed; DECISION/DANGEROUS requires owner consent.

## Autonomy and recording

Cursor may execute an approved slice without per-file approval. It must not convert an architectural/product/provider/legal choice into an implementation detail merely to avoid asking.

Each slice records objective, source requirements/decisions, acceptance criteria, affected contracts/domain, risk class, tests/gates, documentation changes and completion evidence.
