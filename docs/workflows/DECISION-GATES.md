# Decision Gates

- AUTO — reversible local work inside approved architecture; execute autonomously.
- REVIEW — autonomous execution plus additional review/quality/security checks.
- DECISION — stop before choosing: framework/infrastructure/provider, material cost, scope, breaking API/domain change, material UX/business rule, legal posture or similarly consequential choice.
- DANGEROUS — explicit owner approval before action: production, DNS, secrets, deletion, destructive migration, real payment actions, irreversible operations.

External tooling that can change project authority or fan-out work (Cursor SDK/Orchestrate, Supermemory init, Continual Learning binding-doc edits, custom Grok bridges) is **DECISION**, not AUTO. See `docs/cursor-os/GROK-BOT-OPERATING-MODEL.md`.
