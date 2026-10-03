# Admin milestone due date

Status: contracted for `ADMIN-MILESTONE-DUE` / `FZ-REQ-ADMIN-018`.

## Surface

`apps/admin` can set an optional UTC due instant when creating a
milestone. The field is `dueAt`. An empty field is omitted, and the
milestone stays without a due date. A filled field must be a UTC
instant. The existing `POST /v1/milestones` route remains the
authority.

The portal already shows that instant, or `bez terminu` when it is
absent.

## Out of scope

- Changing a due date after create.
- Payment, signing, and price fields.
- A portal control that sets the date.
- An external calendar.
- DNS, Cloudflare, deploy, and live customer data.
