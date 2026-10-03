# Milestone due labels

Status: contracted for `MILESTONE-DUE-LABELS` / `FZ-REQ-PORTAL-019` and `FZ-REQ-ADMIN-029`.

## Surface

Staff and the client read a milestone due instant in the same Polish UTC
words. `2026-10-03T08:00:00.000Z` is shown as `3 października 2026, 08:00 UTC`.
A missing due stays `bez terminu`. The project card’s next-milestone line
uses the same words.

An unreadable instant fails the list map. It is not printed as a raw token.
The words do not shift the instant into a local zone.

The staff revise field still posts the UTC instant.

## Out of scope

- A new due field or a calendar provider.
- A local-time conversion.
- Payment, signing, and a change to milestone status.
- DNS, Cloudflare, deploy, and live customer data.
