# Portal contract view

Status: contracted for `PORTAL-CONTRACT-VIEW` / `FZ-REQ-PORTAL-008`.

## Routes

- `GET /v1/portal/contracts` — portal list. Capability `contracts:portal-read`.
  Caller `clientId` must be `portal`.
- `GET /v1/portal/contracts/{contractId}` — one projection. A missing
  contract and another client's contract are both 404.

The projection is `id`, `offerId`, `status`, and `createdAt`. Visibility
follows the linked offer's `clientSubject`. Staff contracts with no
client subject stay hidden.

Persistence stays the existing `contract` and `offer` tables. Migration
`021_portal_contract_projection` adds `contracts:portal-read` to the
capability check. It does not add a table.

`apps/portal` lists the status on the signed-in home. It does not import
`@forma-zieleni/domain`.

## Out of scope

- Price, amount, payment, signing, QES, and provider fields.
- Lifecycle advance from the portal.
- A written promise or a signature request.
- Live Documenso, Przelewy24 charges, DNS, Cloudflare, and deploy.

## Relation

Builds on `CRM-CONTRACT-DOMAIN` and `PORTAL-PROJECT-VIEW`. ADR-019
authorized this slice while DANGEROUS actions stay unchanged.
