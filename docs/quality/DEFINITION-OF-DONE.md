# Definition of Done

Apply gates proportionally to slice type: acceptance criteria;
lint/typecheck/build where applicable;
unit/integration/contract/security/accessibility tests as applicable;
migration safety; observability/audit impact; documentation sync; no
secrets/PII; no accidental unresolved placeholders; final
diff/self-review. A documented plan is never reported as implemented or
production-verified.

For workflows with external side effects, customer impact, money, files,
integrations, automation or AI, DoD also requires an applicable Failure
Contract, declared blast radius, recovery/degraded-mode evidence and
auditability. Agentic actions additionally require bounded permissions,
structured contracts, evaluation evidence and data-classification
compliance before autonomy is increased.

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

For an applicable security-sensitive or pre-push slice the evidence
order is: deterministic tests → SCA/dependency evidence once the stack
exists → CodeRabbit review when required and within quota → ZAP when a
runnable target exists and DAST applies → finding triage → final diff →
pre-push gate. External outage, missing authentication and rate limit
are DEFERRED or BLOCKED, never PASS.
