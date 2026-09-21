# packages/api-client

Typowany klient HTTP do Core API.

## Odpowiedzialność

- jednolity dostęp do API dla `web`, `portal`, `admin` oraz przyszłych klientów (mobile, SketchUp),
- typy i operacje zgodne z OpenAPI,
- bez reguł autoryzacji biznesowej (authz zawsze po stronie serwera).

## Status

Typed `/v1` lead paths are implemented. HTTP transport is the next lead slice ([`NEXT-SLICE-LEAD-VERTICAL.md`](../../docs/architecture/NEXT-SLICE-LEAD-VERTICAL.md)). Hono is selected; this package does not implement it yet.
