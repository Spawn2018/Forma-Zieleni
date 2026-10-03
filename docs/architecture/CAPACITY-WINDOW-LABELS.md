# Capacity window labels

Status: contracted for `CAPACITY-WINDOW-LABELS` / `FZ-REQ-ADMIN-031`.

## Surface

Staff read a capacity window in the same Polish UTC words as a milestone
due. `2026-06-01T08:00:00.000Z` is shown as `1 czerwca 2026, 08:00 UTC`.
A closed window shows when it closed. An open window still offers close.

An unreadable instant fails the list map. It is not printed as a raw token.
The words do not shift the instant into a local zone.

Create and close still post the UTC instant. There is no external calendar.

## Out of scope

- A new window field or a calendar provider.
- A local-time conversion.
- A change to who may promise a date.
- DNS, Cloudflare, deploy, and live customer data.
