# Core API contract

`openapi.json` is the current OpenAPI 3.0.4 source of truth for the visitor lead-qualification slice.

- Versioning is `/v1`.
- Errors use the shared `ApiError` schema.
- List endpoints use cursor pagination, `limit`, `sort` and `status` filter.
- Create and qualify require `Idempotency-Key`.
- Legacy `legacy/freset-v2-full/contracts/openapi.yaml` remains reference only.
- The lead HTTP runtime is `apps/api`. This file remains the contract. Generated clients in `packages/api-client` are still typed paths, not an HTTP client.
