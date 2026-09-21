# Cursor integration instructions — FZ-SIGN-1

Status: slice procedure for 2026-09-21. **Not** a second lifecycle
definition. The canonical architecture is
[`../architecture/FZ-SIGN-1-CONTRACT-LIFECYCLE.md`](../architecture/FZ-SIGN-1-CONTRACT-LIFECYCLE.md).
The research record is
[`../architecture/OWNER-DECISION-PACKET-FZ-SIGN-1.md`](../architecture/OWNER-DECISION-PACKET-FZ-SIGN-1.md).

Integrate that architecture into the existing Canon without changing any
open FZ-A1–A7 decision or implementing a provider.

Required documentation updates:
1. Link FZ-SIGN-1 from the binding architecture/product roadmap locations that govern Offers → Contract → Payment → Project and Files.
2. Record that Contract Lifecycle Management is a Core API/domain responsibility and the signature engine is a replaceable adapter.
3. Preserve transactional outbox, private/versioned/checksummed files, server-side BOLA/BFLA/BOPLA, OpenAPI source of truth, auditability and tested restore.
4. Add FZ-SIGN-1 as a later Owner Decision Packet/research slice; do not make it an eighth Gate A blocker unless current Canon explicitly requires contract signing before the first Gate A implementation slice.
5. Ensure payment flow wording becomes compatible with: Offer → Accept/Contract → Signature when required → Deposit/Payment → Project activation. Do not invent a universal legal requirement for signature before every payment.
6. Record SES/AES/QES as a legal/technical classification to be verified per document; do not claim that an OSS engine itself supplies QES.
7. Record the zero-license-cost objective for ordinary self-hosted signing while separating infrastructure and qualified trust-service costs.
8. Add the future official-source/GitHub comparison requirement: Documenso, DocuSeal, OpenSign + stronger maintained OSS candidates; verify API/embedding/webhook feature gating and pricing, not just repo license.
9. Do not consume CodeRabbit quota for this docs-only integration.
10. No push. Run deterministic docs/repo checks and commit only coherent documentation changes if green.
