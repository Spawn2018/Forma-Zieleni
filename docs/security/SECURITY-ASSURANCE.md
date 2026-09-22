# Security Assurance --- CodeRabbit + OWASP

Status: binding engineering security layer for development and pre-push
review.

## Purpose

Forma Zieleni uses independent, layered verification. AI review is
advisory evidence; deterministic tests and security gates remain
authoritative.

## CodeRabbit

CodeRabbit is an external independent code-review layer. For the current
public GitHub repository, use the free/open-source path where available.
Prefer local/IDE/CLI review before push so the existing `main-only`
workflow does not need to be replaced by a branch/PR workflow solely for
CodeRabbit.

Default integration order:

1.  CodeRabbit IDE extension in Cursor for interactive review.
2.  CodeRabbit CLI for explicit pre-push review and machine-readable
    agent output when supported.
3.  GitHub App PR review only when the project later adopts a PR
    workflow for a specific reason.

Rate-limit policy: use the live CodeRabbit account as the source of
truth. Verified 2026-09-21 for account `Spawn2018`: plan Advanced
(trial), seat assigned, usage-based billing inactive. Official published
Advanced trial CLI allowance is 10 reviews per developer per rolling
hour. `coderabbit usage` counts successful reviews in the billing period
(one completed review incremented Your reviews from 0 to 1; a failed
WebSocket review did not). The live hourly cap was not exhausted to
measure it. Until that hourly cap is measured, keep the conservative
project budget of 3 CLI reviews per developer per rolling hour. Do not
enable usage-based billing without Owner approval. When the review
budget is exhausted, continue local deterministic AUTO/REVIEW work,
queue the external review, and do not falsely mark CodeRabbit PASS.

Review batching: one CodeRabbit review should cover one coherent green
slice/checkpoint, not every tiny commit. Cursor may commit coherent
local slices, but a push that requires CodeRabbit evidence waits for the
next available review window unless the binding policy explicitly
permits a documented exception. Never force-push.

CodeRabbit findings are inputs, not Canon authority. High/critical
findings must be resolved or explicitly dispositioned before push.
Lower-severity findings must be triaged with evidence.

Executable closed loop (`scripts/security/coderabbit-checkpoint.mjs`):

1.  Parse structured `--agent` findings (not count-only).
2.  Fingerprint each finding class (path + issue class; not commit SHA).
3.  Disposition every finding: `ACCEPT`, `REJECT_WITH_REASON`,
    `OWNER_GATE` (autonomous `DEFER` is refused).
4.  `ACCEPT` → repair by the FZ orchestrator → `note-repair` →
    mandatory CodeRabbit re-review.
5.  `CODERABBIT_FINDINGS_FIXED` is intermediate only.
    Terminal clean-after-repair is `CODERABBIT_PASS_AFTER_REPAIR`.
6.  Unresolved review debt mechanically blocks `pnpm push:main` for the
    candidate HEAD. Ephemeral receipt: `.fz-noc/coderabbit-review.json`
    (gitignored). Runtime findings ingest into existing FZ-CIS.

## OWASP baseline

"OWASP" is not a single SaaS account. Use free/open standards and tools:

-   OWASP ASVS 5.0.0 as the application-security verification
    requirements baseline.
-   OWASP ZAP for DAST of running web/API surfaces.
-   OWASP Dependency-Check as an SCA option for known vulnerable
    dependencies when technically suitable.
-   GitHub native dependency/security alerts and Dependabot may
    complement SCA for the public repository.

No OWASP account is required for ASVS, ZAP, or Dependency-Check.

## ZAP execution policy

Before a runnable application exists: prepare scan policy/configuration
and acceptance mapping only.

Once local/staging web/API exists: - baseline/passive scan on normal
checkpoints; - API scan against the canonical OpenAPI contract when
applicable; - authenticated scans only against isolated lab/staging
accounts and data; - active/full scans only against local/lab/staging
targets explicitly designated for testing; - never active-scan CT8
legacy production or any live customer environment without explicit
Owner approval.

Prefer ZAP Automation Framework for repeatable non-trivial scans. Do not
make Docker mandatory: the project currently has no local Docker
requirement. Windows/local ZAP or the selected CI runner may be used
after the relevant environment decision.

## Security gate order

For an applicable code slice:

local tests/lint/typecheck → dependency/SCA checks → deterministic
security tests → CodeRabbit review when review budget is
available/required → ZAP when a runnable target exists and DAST applies
→ security finding triage → final diff → pre-push gate → push to main if
permitted.

CodeRabbit or ZAP unavailability never becomes permission to weaken
deterministic security checks. Rate-limit/service outages are recorded
as DEFERRED/BLOCKED evidence, not PASS.

Live S2.5 evidence: [`S2.5-EVIDENCE-2026-09-21.md`](./S2.5-EVIDENCE-2026-09-21.md).
Lead-slice ASVS map: [`ASVS-5.0.0-LEAD-SLICE.md`](./ASVS-5.0.0-LEAD-SLICE.md).

## Setup ownership

Cursor must guide the Owner step by step for any human-only
account/authorization action. It must stop at each external
authorization boundary, explain exactly what to click, request only the
minimum permissions, verify the resulting state, and then continue
automation.

CodeRabbit setup requires Owner interaction for GitHub sign-in/App
authorization and possibly IDE authentication. OWASP tools do not
require account creation.

## Cost guard

Default target is free usage. Usage-based CodeRabbit reviews, paid
CodeRabbit plans/add-ons, or any paid security service are
OWNER-DECISION before activation. No payment method or billing toggle
may be enabled automatically.
