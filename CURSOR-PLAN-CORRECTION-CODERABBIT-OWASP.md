# CURSOR PLAN CORRECTION --- CodeRabbit + OWASP + rolling execution

Modify the current "Rolling Forma Zieleni execution" plan; do not
restart planning from zero.

The current plan is accepted directionally. Preserve its evidence,
Owner-in-loop semantics, main-only workflow, sandbox blocker handling,
Slices 1--4, Gate A/B/C/D continuation, Definition of Done, and
work-stealing behavior.

Add the following binding changes.

## 1. Add Security Tooling Slice S2.5

Place it after the controller deterministic verification and before
treating pre-push/release security automation as mature. It may run in
parallel with Gate A research where safe.

### CodeRabbit

Goal: integrate the free/open-source CodeRabbit path with Cursor and
pre-push review without changing main-only merely to create PRs.

Cursor must guide Owner step by step through every human-only action: -
verify repository is still public and safe for external review; - sign
in to CodeRabbit with GitHub; - install/authorize CodeRabbit only for
Forma Zieleni where repository scoping is available; - verify GitHub App
installation; - install/verify official CodeRabbit extension in
Cursor/VS Code; - authenticate extension; - discover/install official
CodeRabbit CLI using current official instructions; - complete browser
authentication (`cr auth login` or current official equivalent); - run a
harmless review test; - verify agent/structured CLI output if
supported; - record the actual account/product rate limits.

Do not request passwords/tokens in chat or commit credentials.

Use free usage by default. Keep usage-based billing/add-ons OFF. Any
paid plan, overage, Security Scan add-on, or Agent billing is
OWNER-DECISION.

Until the live account limit is verified, enforce a conservative project
budget of no more than 3 free CLI reviews per developer per rolling
hour.

Do NOT convert Forma Zieleni to branch/PR workflow solely for
CodeRabbit. Preserve main-only.

Use CodeRabbit primarily as: Cursor coding → deterministic checks →
coherent checkpoint → CodeRabbit IDE/CLI review → fix/triage → rerun
affected checks → final diff → PRE-PUSH-GATE → push main.

Do not invoke CodeRabbit on every micro-commit. Batch one coherent green
slice per review. Track review timestamps/quota. If rate-limited,
continue independent local work, queue the review, and do not report
CodeRabbit PASS. Push policy must respect the binding pre-push
requirements and available review evidence; never buy overage
automatically.

CodeRabbit findings are independent review evidence, not Canon
authority.

### OWASP free baseline

Do not describe OWASP as one product/account. No OWASP account is
required for the selected baseline.

Adopt: - OWASP ASVS 5.0.0 as the security requirements/verification
baseline; - OWASP ZAP as DAST for runnable web/API surfaces; - OWASP
Dependency-Check/SCA where suitable after the dependency/runtime stack
is selected; - GitHub dependency alerts/Dependabot as complementary
supply-chain evidence where appropriate.

Cursor must guide Owner step by step only where local
installation/authorization is actually required.

ZAP: - do not block current work before a runnable target exists; -
first baseline/passive scan on local/lab; - API scan from canonical
OpenAPI when available; - authenticated scan only with isolated lab
identities/data; - active/full scan only against designated
local/lab/staging; - NEVER active-scan legacy CT8 production or live
customer targets without explicit Owner approval; - prefer Automation
Framework for repeatable scans; - Docker is optional and must not become
a prerequisite solely for ZAP; - on Windows verify current official
prerequisites before installation.

ASVS: map applicable versioned requirements to acceptance
criteria/tests/evidence for each security-sensitive slice.

Dependency/SCA: integrate only after the actual stack is known;
high/critical known-vulnerability findings block the affected
release/push until fixed or explicitly dispositioned.

## 2. Update security/pre-push Definition of Done

For applicable slices add: deterministic tests → SCA/dependency evidence
→ CodeRabbit review when required/available → ZAP evidence when a
runnable target and DAST applicability exist → finding triage → final
diff → pre-push gate.

External service outage/rate limit is DEFERRED/BLOCKED, never PASS.

## 3. Preserve rolling construction

Do NOT add a new "stop after S2.5" condition.

After Owner decisions, continue: Gate A implementation → Gate B API
contract → Gate C vertical domain implementation → WWW → Portal →
Admin/CRM → Mobile → later SketchUp/Garden OS/Site Intelligence/Plant
Knowledge/bounded AI.

If CodeRabbit quota is exhausted or ZAP is not yet applicable, continue
all safe independent AUTO/REVIEW product work.

## 4. Documentation reconciliation

During execution reconcile current repo with: -
`docs/security/SECURITY-ASSURANCE.md` -
`docs/security/OWNER-SETUP-CODERABBIT-OWASP.md` - engineering standard -
pre-push gate/orchestration - Definition of Done/quality gates - Cursor
OS - current architecture - autonomous slices/decision gates - relevant
Cursor rules/skills/reviewers - Master Plan/Product Canon -
handoff/master execution prompt

Preserve historical provenance; do not rewrite legacy reference
documents as if they were current Canon.

## 5. Return revised plan now

Do not execute yet. Return the revised rolling plan with S2.5, exact
Owner setup checkpoints, CodeRabbit rate-limit-aware review/push policy,
OWASP ASVS/ZAP/SCA gates, and unchanged continuation into real product
implementation.
