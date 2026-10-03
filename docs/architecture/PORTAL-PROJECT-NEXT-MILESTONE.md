# Portal project next milestone

Status: contracted for `PORTAL-PROJECT-NEXT-MILESTONE` / `FZ-REQ-PORTAL-012`.

## Surface

Each portal project card names the earliest open milestone already loaded
for that project. Open means planned or in progress. A done milestone and
a milestone of another project stay off that line. A dated milestone comes
before one without a date.

When the milestone list is empty or every milestone of the project is done,
the card says **Otwarte kamienie milowe: brak**. When the milestone read
fails or is forbidden, the card says so and does not pretend the list is empty.

## Out of scope

- A new milestone store or route.
- Payment, signing, and decision-log fields.
- Staff mutation from the portal.
- DNS, Cloudflare, deploy, and live customer data.
