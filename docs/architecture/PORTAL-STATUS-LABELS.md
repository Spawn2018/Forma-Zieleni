# Portal status labels

Status: contracted for `PORTAL-STATUS-LABELS` / `FZ-REQ-PORTAL-015`.

## Surface

The portal shows a Polish label instead of the machine token:

- Offer `draft` is **szkic**.
- Contract `draft` is **szkic**, `internal_review` is **w przeglądzie**,
  `approved` is **zatwierdzona**, and `sent` is **wysłana**.
- Project `planned` is **zaplanowany** and `delivered` is **dostarczony**.

An unknown status fails the list map. The portal does not print the
token and does not invent a label.

## Out of scope

- A new status or a lifecycle change.
- Price, signing, and payment fields.
- DNS, Cloudflare, deploy, and live customer data.
