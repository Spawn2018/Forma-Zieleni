# Forma Zieleni --- Product Canon

Status: CURRENT.

## North-star lifecycle

Anonymous Visitor -\> Site Analysis -\> Qualified Lead -\> Consultation
-\> Opportunity -\> Offer -\> Contract -\> Payment -\> Project -\>
Garden -\> Garden OS -\> Maintenance / Referral / Next Project.

The company constraint is owner/designer capacity. Optimize qualified
demand, contribution/revenue per owner hour, margin, client value and
delivery quality --- not raw lead volume. Capacity is part of sales and
should regulate marketing pressure.

## 1. Revenue OS

Public WWW is a Sales Application, not a brochure. It combines
acquisition, qualification, Site Analysis entry, CRM, opportunity,
capacity, consultation, first-class Offer, contract/payment activation,
Evidence Engine, local SEO, analytics, experiments and referrals.
Experiments are judged by lead quality, consultation/offer/sale rates
and business value, not clicks alone. Local SEO must be genuinely useful
and unique; no programmatic spam.

Offer is a first-class object with scope, exclusions, price, validity,
timeline, milestones, correction rounds, payment schedule, files,
version/acceptance and contract linkage. Canonical activation: Offer -\>
Accept -\> Contract -\> Deposit/Payment -\> Project. Capacity informs
promised dates. Scope creep is made visible through decisions/change
orders rather than hidden labour.

## 2. Project OS

Projects bind client/property, scope, exclusions, milestones, files,
versions/revisions, decision log, correction rounds, change orders,
timeline, deliverables and history. SketchUp/V-Ray is an
adapter/workflow of this project truth, not a separate truth.

## 3. Garden Intelligence

Site Intelligence turns a property into normalized
constraints/opportunities using geospatial/context, soil,
climate/weather, sun, topography and surroundings. Candidate sources
include Geoportal, OSM, SoilGrids and weather providers. Critical UX
must not depend on live third-party availability; use an internal Data
Layer/cache/fallback as appropriate.

Plant Knowledge Graph models tolerances, soil/pH/moisture/light, mature
size, growth, seasonality/flowering, wildlife value, maintenance,
toxicity, visual character, compatibility and constraints. Botanical
truth lives in curated DATA/RULES; AI interprets it.

## 4. Garden OS

Garden OS is the client's long-lived digital twin: property +
design/project + plants + materials + maintenance + weather + photos +
warranties + history + recommendations + future work. It extends the
relationship after project delivery.

## Product surfaces

-   `apps/web`: public sales application.
-   `apps/portal`: separate client portal.
-   `apps/admin`: internal CRM/operations/control surface.
-   `apps/api`: Core API boundary/runtime, implementation stack
    undecided.
-   Mobile later: task/photo/push/relationship-first, not a portal
    clone.
-   SketchUp later: stable `project_id`, `project_revision`,
    `designer_id`, `model_version`; API-driven plants/materials/scenes;
    V-Ray script/batch first, deeper SDK only if justified.
-   AI/XR later, after reliable domain/data.
    XR/community/marketplace/public advanced 3D/microservices remain
    deferred until evidence supports them.

## Product-development rule

For major modules: HYPOTHESIS -\> PROTOTYPE -\> VALIDATION -\>
IMPLEMENTATION -\> MEASUREMENT.

## Agentic/operational extension

Forma Zieleni is not an application with AI sprinkled on top. It is an
operational system built on trusted data, rules, domain contracts and
auditable workflows. Agentic automation is progressively authorized,
least-privilege and bounded by blast radius, failure contracts,
provenance, evaluation and human gates. Critical workflows must
gracefully degrade without AI. Automation should remove repetitive
administration and information work, not erase valuable designer/client
professional judgment.

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
