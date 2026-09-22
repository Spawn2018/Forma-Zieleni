# ASVS 5.0.0 mapping — lead qualification slice

Baseline: OWASP Application Security Verification Standard 5.0.0. Chapter index cited from the official [ASVS 5.0.x cheat sheet index](https://cheatsheetseries.owasp.org/IndexASVS.html). Individual requirement IDs will be added when a numbered 5.0.0 export is pinned in-repo. No OWASP account is required. Gate A architecture is DECIDED. Rows below are not security acceptance until the named evidence exists.

| ASVS 5.0.x section | Slice acceptance | Evidence now | Evidence later |
|---|---|---|---|
| V2.2 Input Validation | Capture body allowlists fields; extras rejected; public `source` cannot be `portal` or `admin`; non-string fields are rejected | `packages/validation` tests and `apps/api` HTTP tests | — |
| V2.3 Business Logic Security | Qualification uses domain rules, not client status | `packages/domain` tests and qualify HTTP test | — |
| V2.4 Anti-automation | Public POST is rate-limited by direct peer, or by the last forwarded hop when the TCP peer is an explicit trusted proxy | HTTP tests for separate peers, ignored spoofed `X-Forwarded-For`, and bounded windows | Distributed enforcement is a later replacement of the same key abstraction |
| V4.1 Generic Web Service Security | Shared `ApiError`; `/v1`; no stack traces in contract | `contracts/openapi.test.mjs` and HTTP error bodies | ZAP baseline/API scan. Java and ZAP are not installed here |
| V4.2 HTTP Message Structure Validation | JSON schemas, required headers | OpenAPI 3.0.4 and HTTP malformed-JSON test | — |
| V6 Authentication | Staff list/get/qualify require a server-derived session | Better Auth email/password session, signed bearer, and explicit `AUTH_MODE=test` HMAC. Sign-up is disabled on the mounted handler | Operator provisioning UI, MFA, and an authenticated ZAP scan |
| V7 Session Management | Opaque signed session, expiry, cookie origin check, staff logout invalidates list/get/qualify | PostgreSQL session test, expired session 401, CSRF origin 403, logout invalidation test | Session rotation beyond Better Auth defaults; MFA |
| V8.2 General Authorization Design | Object GET is authorized before existence is revealed to an unauthorized caller | Anonymous 401 and ungranted 403 for existing and missing ids | — |
| V8.3 Operation Level Authorization | Qualify requires `leads:qualify` from `actor_capability` | Reader 403 and staff 200 tests | — |
| V13.3 Secret Management | No secrets in contract or fixtures | HTTP log test rejects tokens | SOPS+age when encrypted material is needed |
| V14.2 General Data Protection | PII only in contact fields; no PII in ids or query examples | Domain, OpenAPI, and HTTP log redaction test | — |
| V15.2 Security Architecture and Dependencies | Direct dependencies reviewed. `pnpm audit --audit-level=moderate` reported no known vulnerabilities on 2026-09-21 | `apps/api/package.json` and the audit command | OWASP Dependency-Check is not installed |
| V16.5 Error Handling | Stable error codes; no provider dumps | HTTP 400/401/403/404/409/429/503 bodies | — |

ZAP did not run: Java and the ZAP installer are not on this machine. Future local procedure: [ZAP-LEAD-LOCAL.md](./ZAP-LEAD-LOCAL.md). Dependency-Check did not run. Those states are DEFERRED, never PASS. The rows above are not Gate A security acceptance. FZ-CMS-1 is a separate OPEN Owner decision and is not covered by this lead mapping.
