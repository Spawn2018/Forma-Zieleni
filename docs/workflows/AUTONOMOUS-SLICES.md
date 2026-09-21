# Autonomous Slice Protocol

Status: CURRENT.

Binding loop is defined in `docs/cursor-os/CURSOR-OS-2026.md`. This file
defines slice recording and interruption behavior only.

Each slice records objective, source requirements/decisions, acceptance
criteria, affected contracts/domain, risk class, tests/gates, failure
contract when applicable, blast radius, documentation changes, and
completion evidence.

At OWNER-DECISION/OWNER-ONLY: checkpoint the dependent slice, emit a
Decision Packet, and continue independent AUTO/REVIEW work where safe.
At DANGEROUS: do not perform the action without explicit Owner approval
immediately before execution. A `/noc` window does not approve it.

`/noc <hour>` is the session window. It continues this protocol until the
next `<hour>:00` in `Europe/Warsaw`. Procedure:
`.cursor/skills/fz-autonomous-execution/SKILL.md`. It does not add a
second execution loop. After COMPLETE, the learning check in
`docs/architecture/FZ-CONTINUOUS-IMPROVEMENT.md` may record evidence.
It does not select the next slice.

Agentic work follows progressive autonomy: READ -\> SUGGEST -\> DRAFT
-\> ACT WITH APPROVAL -\> BOUNDED AUTO. Promotion requires evidence,
evaluation, bounded blast radius, auditability, recovery/rollback, and
Owner-approved policy.

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
