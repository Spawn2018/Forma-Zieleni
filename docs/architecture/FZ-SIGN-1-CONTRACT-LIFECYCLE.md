# FZ-SIGN-1 — Contract Lifecycle & Electronic Signature

Status: CURRENT binding definition for contract lifecycle and electronic
signature. Provider **Documenso Community self-host** (ADR-017, 2026-10-02).
This is not a Gate A decision. Gate A architecture is recorded separately
in ADR-014. This file does not implement the signing adapter. No QES.

Canonical file: this document. Other Canon locations link here. They do
not restate a second lifecycle.

Research packet: [`OWNER-DECISION-PACKET-FZ-SIGN-1.md`](./OWNER-DECISION-PACKET-FZ-SIGN-1.md).
Selected engine: Documenso Community self-host. Documenso Cloud is not
selected. The adapter is not implemented here.

## Goal

Forma Zieleni owns the business lifecycle and archive of offers,
contracts, amendments/change orders and signature evidence. An
e-signature engine is a replaceable adapter. It is not the source of
business truth.

## Responsibility boundary

### Core API owns

- `Contract` and `ContractVersion`
- parties and signers as domain references (not as the ACL)
- relations to Lead, Opportunity, Offer, Customer and Project
- approval state
- contract lifecycle and explicit transitions
- amendments and change orders
- deadlines
- audit events
- domain authorization (BOLA / BFLA / BOPLA)
- signed-artifact metadata, evidence references, hashes/checksums
- retention and archive metadata
- relationships that activate payment and project work

### Private object storage owns binaries

- source contract
- every issued version
- attachments
- final signed document
- provider evidence and audit artifacts
- other immutable contract artifacts

A public or predictable URL is never authorization. Downloads go through
Core API. Storage choice remains FZ-A4.

### Signing engine owns only provider operations

- envelope creation
- signature ceremony
- signer delivery
- provider-specific verification
- provider callback / webhook transport

Provider state is copied into Core API. Synchronization uses
authenticated, replay-safe, idempotent callbacks or polling, and the
transactional outbox (ADR-004) where Forma Zieleni publishes or consumes
the resulting domain event.

The engine must not become the project, file or contract ACL.

## Lifecycle baseline

Not every contract uses every state. Transitions are explicit and
audited. Skipping a state is a modeled transition, not an implicit
overwrite.

```text
DRAFT
→ INTERNAL_REVIEW
→ APPROVED
→ SENT
→ VIEWED
→ SIGNING
→ PARTIALLY_SIGNED
→ SIGNED
→ EFFECTIVE
→ PAYMENT_PENDING
→ ACTIVE
→ AMENDED
→ COMPLETED | TERMINATED | EXPIRED
→ ARCHIVED
```

Signed originals are immutable. A correction is a new version, an
amendment or a change order. `AMENDED` records that a later instrument
exists; it does not replace the signed bytes.

## Commercial flow

Compatible with Product Canon activation, with signature only when the
contract requires it:

```text
Lead
→ Opportunity
→ Offer
→ Acceptance
→ Contract
→ Signature when required
→ Deposit / Payment
→ Project activation
→ Project
→ later amendments / change orders
→ completion / archive
```

Electronic signature is **not** documented as legally mandatory for every
Forma Zieleni transaction. No production legal claim is made here.
Authoritative EU/Polish sources must be checked before any production
statement that a given document requires a particular signature level.

## Archive and evidence

Preserve at minimum:

- original / source
- every issued version
- final signed artifact
- attachments
- signature evidence / audit artifact
- cryptographic hash / checksum
- timestamps
- signer and actor references
- delivery, view, sign, reject and withdraw events
- lifecycle history
- retention metadata

Backups of this set require an off-site copy, a documented restore and
an actual restore test. The signing SaaS or self-hosted engine is not
the only archive. Contract artifacts are CUSTOMER / CONFIDENTIAL unless
a later classification says otherwise.

## SES / AES / QES

| Level | Meaning in this architecture |
|---|---|
| SES | Simple electronic signature. An OSS click-to-sign flow may be SES. It is not automatically anything stronger. |
| AES | Advanced electronic signature. Requires evidenced signer control and tamper evidence. Do not assume an OSS product supplies it. |
| QES | Qualified electronic signature. May require an external qualified trust service provider, qualified certificates and qualified timestamps. Per-certificate or per-transaction cost is expected. |

No OSS platform in the research packet is treated as a QES provider.
PAdES / CAdES / XAdES, timestamping and LTV are **UNKNOWN** until official
evidence for a chosen engine says otherwise. Legal wording for production
must be verified against current authoritative EU/Polish sources.

## Cost principle

For ordinary signing workflows, prefer maintained OSS / self-hosted
software with zero software-license fee where feasible, no per-signature
fee where feasible, and no forced paid API or embedding tier.

Infrastructure cost is separate. Qualified trust services may be paid
when actually required. Recurring spend is OWNER-ONLY.

## Security

- Domain BOLA / BFLA / BOPLA stays in Core API.
- Provider callbacks must be authenticated, replay-safe, idempotent and
  auditable (same bar as payment webhooks in `SECURITY.md`).
- Secrets, customer contracts and signed PDFs never enter git, prompts,
  fixtures or logs.
- No production or customer contract is sent to a lab, demo or SaaS free
  tier without explicit approval and a privacy review.
- Active security testing stays on local / lab / staging. Do not scan a
  third-party signing provider outside its permitted scope.

## After provider selection

Provider-neutral domain types stay the business truth. Do not add a
provider SDK, production credential, or customer contract send in order
to start signing. A later signing-adapter slice is required before any
ceremony. No QES claim.

## Gates

| Class | Examples |
|---|---|
| OWNER-DECISION | signing adapter scope after ADR-017; the engine name is already Documenso Community self-host |
| OWNER-ONLY | paid subscription, paid API/embedding, QES/TSP, customer-data processor, recurring spend |
| DANGEROUS | production DNS, Cloudflare, secrets, cutover — immediately before action |
