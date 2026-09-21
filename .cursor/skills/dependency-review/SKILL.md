---
description: Use before adding, upgrading or replacing a library, SDK,
  external repository or runtime dependency.
name: dependency-review
---

# dependency-review

Require a concrete use case. Check maintenance/activity, license
compatibility, security history/advisories, transitive dependency
weight, bundle/runtime cost, API stability, ecosystem fit and
exit/replacement cost. Prefer no dependency when platform capabilities
are adequate. Record the decision when dependency impact is
architectural or operational.

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
