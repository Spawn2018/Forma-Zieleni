# ASVS 5.0.0 mapping — lead qualification slice

Baseline: OWASP Application Security Verification Standard 5.0.0. Chapter index cited from the official [ASVS 5.0.x cheat sheet index](https://cheatsheetseries.owasp.org/IndexASVS.html). Individual requirement IDs will be added when a numbered 5.0.0 export is pinned in-repo. No OWASP account is required. Gate A architecture is DECIDED. Rows below are not security acceptance until the named evidence exists.

| ASVS 5.0.x section | Slice acceptance | Evidence now | Evidence later |
|---|---|---|---|
| V2.2 Input Validation | Capture body allowlists fields; extras rejected; public `source` cannot be `portal` or `admin`; non-string fields are rejected | `packages/validation` tests and `apps/api` HTTP tests | — |
| V2.3 Business Logic Security | Qualification uses domain rules, not client status | `packages/domain` tests and qualify HTTP test | — |
| V2.4 Anti-automation | Public POST is rate-limited | `apps/api` returns 429 after the configured window | Not an edge or distributed limiter |
| V4.1 Generic Web Service Security | Shared `ApiError`; `/v1`; no stack traces in contract | `contracts/openapi.test.mjs` and HTTP error bodies | ZAP API scan when runnable |
| V4.2 HTTP Message Structure Validation | JSON schemas, required headers | OpenAPI 3.0.4 and HTTP malformed-JSON test | — |
| V6 Authentication | Staff list/get/qualify require bearer | HTTP tests against the test signer. Production mode is 401 for every CRM call | Better Auth production integration |
| V7 Session Management | Opaque session bearer, not a guessable lead id | Test HMAC session. Not a Better Auth session | Production session lifetime and logout |
| V8.2 General Authorization Design | Object GET is authorized; hidden IDs are not a control | Staff 200/404 and portal 403 HTTP tests | Production actor source |
| V8.3 Operation Level Authorization | Qualify is staff-only | Portal and anonymous qualify tests | Production actor source |
| V13.3 Secret Management | No secrets in contract or fixtures | HTTP log test rejects tokens | SOPS+age when encrypted material is needed |
| V14.2 General Data Protection | PII only in contact fields; no PII in ids or query examples | Domain, OpenAPI, and HTTP log redaction test | — |
| V15.2 Security Architecture and Dependencies | Direct dependencies reviewed in this slice | pnpm audit result recorded with the slice | OWASP Dependency-Check not run |
| V16.5 Error Handling | Stable error codes; no provider dumps | HTTP 400/401/403/404/409/429/503 bodies | — |

ZAP and OWASP Dependency-Check are not run. Production Better Auth is not wired. Those states are NA or DEFERRED, never PASS. The rows above are not Gate A security acceptance.
