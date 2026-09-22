# Core API contract

`openapi.json` is the current OpenAPI 3.0.4 source of truth for the visitor lead-qualification slice, staff Opportunity create/list/get, and staff Offer create/list/get.

- Versioning is `/v1`.
- Errors use the shared `ApiError` schema.
- List endpoints use cursor pagination, `limit`, `sort` and `status` filter.
- Lead create/qualify, Opportunity create, and Offer create require `Idempotency-Key`.
- Opportunity create accepts only `leadId`; callers cannot supply status.
- Offer create accepts only `opportunityId`; callers cannot supply status or price.
- Legacy `legacy/freset-v2-full/contracts/openapi.yaml` remains reference only.
- The HTTP runtime is `apps/api`. This file remains the contract. Generated clients in `packages/api-client` are still typed paths, not an HTTP client.

Engineering learning contracts, which are not the Core API, live beside this file: `learning-record.schema.json`, `experiment.schema.json`, `engineering-event.schema.json`, and `dora-event.schema.json`. The runtime check is `scripts/fz-cis/policy.mjs`.
