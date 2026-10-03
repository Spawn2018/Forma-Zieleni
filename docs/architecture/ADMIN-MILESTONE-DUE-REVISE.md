# Admin milestone due revision

Status: contracted for `ADMIN-MILESTONE-DUE-REVISE` / `FZ-REQ-ADMIN-019`.

## Surface

Staff can correct a milestone due instant after create.
`POST /v1/milestones/{milestoneId}/due` accepts `dueAt` as a UTC
instant or `null`. An instant replaces the stored term. `null` clears
it. The status does not change. The same instant is stored once.

`apps/admin` shows **Zapisz termin** on every milestone and **Usuń
termin** only when a term is already set. An empty revision field does
not clear the term.

The portal reads the new instant, or `bez terminu` when it is cleared,
and still omits `updatedAt`.

## Out of scope

- A portal control that changes the date.
- Payment, signing, and price fields.
- An external calendar.
- DNS, Cloudflare, deploy, and live customer data.
