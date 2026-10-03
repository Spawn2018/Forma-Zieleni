# Admin decision log milestone

Status: contracted for `ADMIN-DECISION-LOG-MILESTONE` / `FZ-REQ-ADMIN-030`.

## Surface

A decision-log entry that points at a milestone shows that milestone’s
title when the title is already in the loaded staff milestone list:
`kamień «Sadzenie»`. Another milestone’s title stays off the entry.

No related milestone stays `bez kamienia milowego`. An id that is not in
the loaded list stays `kamień poza wczytaną listą`, with the id. A failed
milestone read says the milestones could not be read. A forbidden read
says this account cannot read milestones. Neither is shown as no milestone.

## Out of scope

- A new decision or milestone store.
- A change to the recorded id, kind, or summary.
- Payment, signing, and the recording actor id.
- DNS, Cloudflare, deploy, and live customer data.
