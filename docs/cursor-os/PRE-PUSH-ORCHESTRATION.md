# Pre-push orchestration

Before every push to `main`, Cursor must establish an evidence-backed
PASS for all applicable gates.

1.  Scope: diff belongs to the approved slice; no unrelated churn.
2.  Canon: no conflict with
    Constitution/Product/UX/Visual/Content/Architecture/Contracts.
3.  Code: professional-code + refactor-safely review.
4.  Static: formatting/lint/typecheck as available.
5.  Tests: relevant unit/integration/contract/e2e tests.
6.  Security: authz, secrets, PII, inputs, files, webhooks and
    dependency risk as applicable.
7.  Data: schema/query/migration/index/transaction review when
    applicable.
8.  Performance: budgets/benchmarks/query plans/bundle/network checks
    when applicable.
9.  UX: visual canon, content canon, accessibility and responsive
    behavior when applicable.
10. Operations: logging/metrics/audit/failure behavior when applicable.
11. Documentation: ADR/contracts/runbooks/canon updated when behavior
    changed.
12. Final diff: no debug artifacts, accidental generated files, TODO
    debt or secrets.

Result must be PASS or BLOCKED with concrete findings. BLOCKED work is
repaired and re-run. Cursor may prepare the push command, but pushing
remains an explicit action in the owner's current workflow until the
owner later authorizes automatic push.

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
