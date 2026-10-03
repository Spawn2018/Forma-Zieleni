# Staff project recorded instant

Status: contracted for `ADMIN-PROJECT-CREATED` / `FZ-REQ-ADMIN-041`.

## Surface

A staff project shows its recorded instant in Polish UTC words.
`2026-09-24T14:00:00.000Z` is shown as `24 września 2026, 14:00 UTC`.

A missing or unreadable instant fails the project list map. The raw
timestamp is not printed. The stored instant is not shifted into a local
zone. Extra staff fields, including `updatedAt` and `clientSubject`, stay
off the row.

## Out of scope

- A new timestamp field.
- Price, payment, and signing.
- DNS, Cloudflare, deploy, and live customer data.
