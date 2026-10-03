# Recorded instant labels

Status: contracted for `RECORD-CREATED-LABELS` / `FZ-REQ-PORTAL-024` and `FZ-REQ-ADMIN-034`.

## Surface

A portal offer, contract, project, file, garden, and site record shows its
recorded instant in Polish UTC words. A staff garden uses the same words.
`2026-09-24T12:00:00.000Z` is shown as `24 września 2026, 12:00 UTC`.

An unreadable instant fails that list map. The raw timestamp is not
printed. The stored instant is not shifted into a local zone.

## Out of scope

- A new timestamp field.
- Milestone due times, which already use these words.
- Payment, signing, and a calendar provider.
- DNS, Cloudflare, deploy, and live customer data.
