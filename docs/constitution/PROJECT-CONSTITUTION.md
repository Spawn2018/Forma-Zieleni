# Forma Zieleni — Project Constitution

Status: CURRENT / highest stable engineering principles. Explicit later owner decisions and ADRs may amend it; amendments must be recorded.

## Mission
Build Forma Zieleni as one coherent business/product/engineering platform, not a collection of disconnected apps. The platform must support the full lifecycle from acquisition and site understanding through sale, design, delivery and long-term Garden OS relationship.

## Non-negotiable engineering principles
- Security and privacy by default; least privilege; server-side authorization; no secrets, client data or unnecessary PII in source control/logs.
- Accessibility target WCAG 2.2 AA for user-facing products.
- API-first modular monolith until evidence justifies another architecture.
- Core API + canonical domain data store are the system of record; external providers are adapters, not business truth.
- HTTP contract is OpenAPI 3.0.x; current target/reference 3.0.4. Generate clients from contract where appropriate and detect breaking changes.
- Event-driven core uses a transactional outbox for reliable domain-event publication; consumers are idempotent where required.
- AI architecture is DATA -> RULES -> DOMAIN -> AI. AI may interpret/propose/automate but cannot become botanical, financial, authorization or domain truth.
- External data is normalized/cached behind adapters when runtime dependency would reduce reliability or portability.
- Files are private by default, authorized, versioned/integrity checked, and never exposed through guessable public URLs. Contract artifacts follow the same rule; the binding lifecycle is `docs/architecture/FZ-SIGN-1-CONTRACT-LIFECYCLE.md`.
- Observability and auditability are designed in: logs, metrics, traces/errors, audit events and business events, without unnecessary PII.
- Backups are not considered complete until restore is tested.
- Dependencies are minimized and selected on value, maintenance, licence, security, portability and removability.
- Code is strongly typed where the chosen stack permits, testable and documented with the system.
- Never invent business facts, testimonials, awards, project outcomes, prices or company facts. Unverified historical values remain explicitly unverified.
- Production, DNS, secrets, destructive data operations, destructive migrations, real payment operations and other irreversible actions require explicit owner approval.
- Legacy material is evidence/reference. Preserve intent/business/domain/UX/security knowledge, not obsolete implementation assumptions.
