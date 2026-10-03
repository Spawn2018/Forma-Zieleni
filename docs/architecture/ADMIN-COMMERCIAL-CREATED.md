# Staff commercial recorded instant

Status: contracted for `ADMIN-COMMERCIAL-CREATED` / `FZ-REQ-ADMIN-037`.

## Surface

A staff offer and a staff contract show the recorded instant in Polish UTC
words. `2026-09-24T12:00:00.000Z` is shown as `24 września 2026, 12:00 UTC`.

A missing or unreadable instant fails that list map. The raw timestamp is
not printed. The stored instant is not shifted into a local zone. Extra
staff fields, including `updatedAt` and `clientSubject`, stay off the row.

## Out of scope

- A new timestamp field.
- Price, terms, payment, and signing.
- DNS, Cloudflare, deploy, and live customer data.
