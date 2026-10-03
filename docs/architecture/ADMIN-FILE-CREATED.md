# Staff file recorded instant

Status: contracted for `ADMIN-FILE-CREATED` / `FZ-REQ-ADMIN-043`.

## Surface

A staff file shows its recorded instant in Polish UTC words.
`2026-09-24T12:30:00.000Z` is shown as `24 września 2026, 12:30 UTC`.

A missing or unreadable instant fails the file list map. The raw
timestamp is not printed. The stored instant is not shifted into a local
zone. Storage keys and the client subject stay off the row.

## Out of scope

- A new timestamp field.
- File bytes, a storage provider, and payment.
- DNS, Cloudflare, deploy, and live customer data.
