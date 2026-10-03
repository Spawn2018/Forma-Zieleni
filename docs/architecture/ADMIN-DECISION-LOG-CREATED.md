# Staff decision-log recorded instant

Status: contracted for `ADMIN-DECISION-LOG-CREATED` / `FZ-REQ-ADMIN-039`.

## Surface

A staff decision-log entry shows its recorded instant in Polish UTC words.
`2026-09-24T12:00:00.000Z` is shown as `24 września 2026, 12:00 UTC`.

A missing or unreadable instant fails the list map. The raw timestamp is
not printed. The stored instant is not shifted into a local zone. The
recording actor id stays off the row.

## Out of scope

- A new timestamp field.
- Price, payment, signing, and contact data.
- A portal read of the decision log.
- DNS, Cloudflare, deploy, and live customer data.
