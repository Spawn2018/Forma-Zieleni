# Decision Gates

Status: CURRENT --- owner-in-the-loop override.

-   **AUTO** --- reversible local work inside approved architecture;
    execute autonomously.
-   **REVIEW** --- autonomous execution plus applicable deterministic
    tests and independent review.
-   **OWNER-DECISION** --- consequential but not inherently dangerous
    choice that needs Owner selection. Produce a compact Decision
    Packet, checkpoint the dependent slice, continue independent safe
    work, and resume only after an unambiguous Owner response.
-   **OWNER-ONLY** --- material business/product/legal commitment,
    material recurring spend, use of real customer data, irreversible
    vendor lock-in, or another choice explicitly reserved for Owner. Do
    not infer consent.
-   **DANGEROUS** --- explicit Owner approval immediately before action:
    production mutation/cutover, DNS/Cloudflare mutation, secrets
    creation/rotation/exposure, deletion/destructive migration, real
    payment action, force-push or other published-history rewrite, or
    another irreversible operation.

A safe checkpoint push is AUTO. It is a fast-forward update of the
existing `origin` `main` after the pre-push gate. It is not a deploy,
not a force-push, and not an Owner review. Unexpected remote
divergence, a failing gate, a secret, or customer data stops the push.
The gate is `docs/engineering/PRE-PUSH-GATE.md`.

## Decision Packet

Include: decision_id, question, why_blocked, canon_refs, constraints,
2--4 viable options, evidence, tests, security/privacy/cost
implications, reversibility, affected slices, safe parallel work, and
requested response format.

No agent/controller may lower OWNER-ONLY/DANGEROUS classification, treat
silence as consent, or modify safety policy during a session.

## Security-tool integration update --- 2026-09-21

Binding security-tool details live in
`docs/security/SECURITY-ASSURANCE.md` and the Owner onboarding flow in
`docs/security/OWNER-SETUP-CODERABBIT-OWASP.md`.

CodeRabbit is an independent review layer, not Canon authority. Preserve
`main-only`; use Cursor/IDE/CLI pre-push review rather than creating PRs
solely for CodeRabbit. The hourly review budget is operational state in
`docs/engineering/CODERABBIT-QUOTA.json`, not a timeless architecture
constant. Until that file records an account reading, the local helper
keeps a conservative budget of 3 successful reviews per rolling hour.
Usage-based billing is OWNER-DECISION.

OWASP baseline: ASVS 5.0.0 requirements, ZAP DAST for runnable
local/lab/staging targets, and Dependency-Check/SCA where technically
suitable. Never active-scan legacy CT8 production or live customer
environments without explicit Owner approval.
