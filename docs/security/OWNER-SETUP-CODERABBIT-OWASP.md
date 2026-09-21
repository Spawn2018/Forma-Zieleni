# Owner Setup Runbook --- CodeRabbit + OWASP

Use this runbook only when Cursor reaches the security-tool onboarding
slice.

## CodeRabbit

1.  Cursor first verifies that the GitHub repository is still public and
    that no secret/private data is present.
2.  Owner opens the official CodeRabbit service and signs in with the
    GitHub account that owns/controls the repository.
3.  Owner installs/authorizes CodeRabbit only for the Forma Zieleni
    repository where repository-scoped selection is available.
4.  Cursor verifies the installed GitHub App state without changing
    repository visibility.
5.  Owner installs the official CodeRabbit extension in Cursor/VS Code
    if Cursor does not already have it.
6.  Owner completes the extension authentication flow.
7.  Cursor verifies a read/review-only test against a harmless diff.
8.  Cursor discovers the installed CodeRabbit CLI/version. If CLI is not
    installed, it gives the Owner the current official install
    command/instructions and waits for confirmation.
9.  Owner completes `cr auth login` or the current official equivalent
    in the browser.
10. Cursor runs a harmless CLI review and verifies structured/agent
    output if available.
11. Cursor records the actual rate limit shown by the current
    account/product. Until verified, enforce the conservative project
    budget of at most 3 free CLI reviews per developer per rolling hour.
12. Usage-based reviews remain OFF. Any billing/add-on activation is
    OWNER-DECISION.
13. Cursor integrates CodeRabbit into the pre-push workflow: review
    coherent green slices, not every micro-commit.
14. Existing `main-only` policy remains. Do not create branches/PRs
    merely to satisfy CodeRabbit.

## OWASP

There is no OWASP account to create for the selected free baseline.

### ASVS

1.  Cursor pins OWASP ASVS 5.0.0 references in security acceptance
    criteria.
2.  Applicable ASVS requirement IDs are mapped to tests/evidence as
    features are implemented.

### Dependency/SCA

1.  Cursor evaluates OWASP Dependency-Check against the chosen stack
    after FZ-A2/FZ-A3.
2.  If it is technically appropriate, integrate it locally/CI.
3.  Also use the repository's native GitHub dependency alerts/Dependabot
    where appropriate.
4.  High/critical known-vulnerability findings block the affected
    release/push until fixed or explicitly dispositioned.

### ZAP

1.  Do not install ZAP until a runnable local/lab target exists unless
    the Owner wants the GUI earlier.
2.  On Windows, use the official ZAP installer; Java 17+ is required by
    current Windows packages.
3.  Docker is optional and must not become a project prerequisite solely
    for ZAP.
4.  First test is a harmless baseline/passive scan against local/lab.
5.  Then add API scan from the canonical OpenAPI document.
6.  Add authenticated lab scans only after test identities and isolated
    test data exist.
7.  Active/full scans are lab/staging only unless Owner explicitly
    authorizes another target.
8.  Store repeatable ZAP Automation Framework configuration in the
    repository without secrets.
9.  Add ZAP evidence to the security/pre-push/release gate where
    applicable.

## Success criteria

CodeRabbit: authenticated, repository scoped, Cursor/CLI review
verified, rate limit recorded, usage billing disabled, pre-push batching
policy working.

OWASP: ASVS baseline pinned, SCA strategy selected, ZAP baseline/API
automation ready when runnable targets exist, no production scanning.
