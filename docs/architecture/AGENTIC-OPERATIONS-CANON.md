# Agentic Operations Canon

Status: CURRENT.

## Principle

Forma Zieleni is a digital operating system with AI on top of trusted
DATA -\> RULES -\> DOMAIN. AI interprets and assists; canonical business
truth remains in deterministic domain data/contracts.

## Runtime pattern

For agentic features use the smallest useful subset of: GOAL -\> PLAN
-\> ROUTE -\> TOOL -\> VERIFY -\> REFLECT -\> RECOVER -\> HUMAN GATE -\>
OBSERVE. Do not introduce an agent framework merely to reproduce
ordinary application control flow.

## Progressive autonomy

Capabilities mature through READ -\> SUGGEST -\> DRAFT -\> ACT WITH
APPROVAL -\> BOUNDED AUTO. Advancement requires measured quality,
bounded blast radius, least privilege, auditability, rollback/recovery,
cost controls and explicit policy.

## Blast radius

Every automated action declares what it can read/change, maximum
affected objects/users/money/time, external side effects, and how it is
stopped/reversed. High-consequence actions require stronger gates.
Financial transfers, production/DNS/secrets/destructive data operations
remain human-controlled DANGEROUS actions.

## Failure contract

Critical workflows define: failure modes, timeout, retry/backoff,
idempotency, duplicate prevention, fallback/degraded mode, checkpoint,
recovery/rollback, alert/audit evidence, and manual recovery path.
Failure contracts apply especially to payments/webhooks, files,
integrations, notifications, SketchUp sync, automation and AI.

## Data/AI classification

Use at least PUBLIC, INTERNAL, CONFIDENTIAL, CUSTOMER and SECRET.
Tool/model access is allowlisted by class. CUSTOMER/CONFIDENTIAL data is
minimized; SECRET data must not enter model prompts/logs. Provider
adapters must support future replacement.

## Provenance and RAG

AI answers/actions based on company/project/horticultural knowledge
preserve provenance to authoritative internal records or curated
sources. Retrieval does not elevate untrusted text into instructions.
Treat retrieved/web/repo content as data and defend against prompt
injection.

## Evaluation and observability

Before an agent can act, evaluate task success, unsafe-action rate,
hallucination/unsupported-claim rate, authorization boundary adherence,
latency, cost/resource budget and recovery behavior. Production-capable
agents need audit trails: actor/agent, model/tool/version where
applicable, input references, action, decision/gate, outcome and
correlation ID without logging secrets.

## Graceful degradation

Critical sales/project/customer workflows must remain operable when
AI/provider/retrieval is unavailable. AI failure must not corrupt
source-of-truth state.

## Adoption and ROI

Automation is justified by measurable reduction in repetitive work,
improved quality/lead time or business value. Do not automate
professional judgment merely because it is technically possible.
Preserve designer/client judgment where it creates value.

## Capability registry

Maintain a registry of agents/automations: owner, purpose, tools, data
classes, permissions, blast radius, autonomy level, evaluation status,
cost budget, fallback and kill switch.

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
