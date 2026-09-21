# START HERE --- Cursor / Forma Zieleni

This package is the consolidated working knowledge base for Forma
Zieleni. Do not begin by choosing a framework or rewriting the product.

Read in order: 1. `docs/constitution/PROJECT-CONSTITUTION.md` 2.
`docs/vision/PRODUCT-CANON.md` 3. `docs/vision/MASTER-PLAN.md` 4.
`docs/architecture/CURRENT-ARCHITECTURE.md` 5.
`docs/workflows/DECISION-GATES.md` 6.
`docs/workflows/AUTONOMOUS-SLICES.md` 7.
`docs/engineering/ENGINEERING-STANDARD.md` 8.
`docs/architecture/AGENTIC-OPERATIONS-CANON.md` 9.
`docs/engineering/FAILURE-ENGINEERING.md` 10.
`docs/design/VISUAL-PRODUCT-CANON.md` 11. `docs/ux/UX-PRODUCT-CANON.md`
12. `docs/content/CONTENT-AND-VOICE-CANON.md` 13.
`docs/design/VISUAL-REFERENCE-MAP.md` 14. relevant
domain/contracts/knowledge/legacy references for the slice.
Contract lifecycle (provider undecided, not a Gate A blocker):
`docs/architecture/FZ-SIGN-1-CONTRACT-LIFECYCLE.md`.
CMS / public content is DECIDED (ADR-015, Apostrophe; CMS-ACCEPT remains open):
`docs/architecture/OWNER-DECISION-PACKET-FZ-CMS-1.md` and
`docs/architecture/NEXT-SLICES-CMS.md`.

Rules: - Current canon outranks legacy implementation. - Legacy material
is preserved for provenance and detailed domain/UX knowledge. - Supplied
mockups are required visual evidence where relevant; they do not
reactivate legacy stack choices. - No generic AI-slop UI or copy. - No
invented business facts. - No
framework/DB/hosting/storage/payment-provider choice without
OWNER-DECISION. - Owner is the active decision authority; OpenAI/ChatGPT
decision routing is optional/disabled unless Owner later re-enables
it. - Product implementation must continue when safe; autonomous tooling
must not become an endless meta-project. - Work slice-by-slice using
quality/security/performance gates. - Before push to `main`, run the
applicable pre-push gate and independent reviewers.

## Cursor OS 2026 extension

Before autonomous implementation, read
`docs/cursor-os/CURSOR-OS-2026.md` and the applicable orchestration
documents. Use project Skills/subagents rather than improvising
workflows. External AI/Bots are independent helpers, not canonical
authorities. Before every push use
`docs/cursor-os/PRE-PUSH-ORCHESTRATION.md`.

## Continuous improvement

Learning is not a second execution loop. Binding rules:
`docs/architecture/FZ-CONTINUOUS-IMPROVEMENT.md`.
Connected facts: `docs/architecture/FZ-CONNECTED-ECOSYSTEM.md`.
Growth plans: `docs/architecture/FZ-GROWTH-OS.md`.
Requirement registry: `docs/engineering/requirements/FZ-MASTER-TRACEABILITY.md`.
Recovery state: `docs/engineering/requirements/execution-journal.json`.
Document finding aid: `docs/DOCUMENTATION-MAP.md`.
Read the context map for the task. Do not load the whole tree.
Raw observations are not Canon. Owner gates cannot be learned away.

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
