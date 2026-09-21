# ASVS 5.0.0 mapping — lead qualification slice

Baseline: OWASP Application Security Verification Standard 5.0.0. Chapter index cited from the official [ASVS 5.0.x cheat sheet index](https://cheatsheetseries.owasp.org/IndexASVS.html). Individual requirement IDs will be added when a numbered 5.0.0 export is pinned in-repo. No OWASP account is required.

| ASVS 5.0.x section | Slice acceptance | Evidence now | Evidence later |
|---|---|---|---|
| V2.2 Input Validation | Capture body allowlists fields; extras rejected | `packages/validation` tests | HTTP 400 contract tests |
| V2.3 Business Logic Security | Qualification uses domain rules, not client status | `packages/domain` tests | API qualify tests |
| V2.4 Anti-automation | Public POST is rate-limited | Documented on `POST /leads` | Runtime 429 test after FZ-A2 |
| V4.1 Generic Web Service Security | Shared `ApiError`; `/v1`; no stack traces in contract | `contracts/openapi.test.mjs` | ZAP API scan when runnable |
| V4.2 HTTP Message Structure Validation | JSON schemas, required headers | OpenAPI 3.0.4 | Runtime parser tests |
| V6 Authentication | Staff list/get/qualify require bearer | OpenAPI security arrays | Session tests after FZ-A5 |
| V7 Session Management | Opaque session bearer, not a guessable lead id | `OpaqueId` pattern | Logout/timeout tests after FZ-A5 |
| V8.2 General Authorization Design | Object GET is authorized; hidden IDs are not a control | Contract + `assertOpaqueLeadId` | BOLA tests after auth |
| V8.3 Operation Level Authorization | Qualify is staff-only | OpenAPI `bearerAuth` on qualify | BFLA tests after FZ-A5 |
| V13.3 Secret Management | No secrets in contract or fixtures | Review of this slice | Secret-store after FZ-A6 |
| V14.2 General Data Protection | PII only in contact fields; no PII in ids or query examples | Domain + OpenAPI | Log redaction after FZ-A6 |
| V15.2 Security Architecture and Dependencies | SCA after stack selection | Not applicable yet | Dependency-Check after FZ-A2/A3 |
| V16.5 Error Handling | Stable error codes; no provider dumps | `problem()` helper | Runtime error tests |

ZAP, Dependency-Check and live auth tests are not applicable until their preconditions exist. That state is NA or DEFERRED, never PASS.
