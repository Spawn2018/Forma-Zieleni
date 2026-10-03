# Admin status labels

Status: contracted for `ADMIN-STATUS-LABELS` / `FZ-REQ-ADMIN-025`.

## Surface

The staff panel shows the same Polish words as the portal:

- Offer `draft` is **szkic**.
- Contract `draft` is **szkic**, `internal_review` is **w przeglądzie**,
  `approved` is **zatwierdzona**, and `sent` is **wysłana**.
- Project `planned` is **zaplanowany** and `delivered` is **dostarczony**.

An unknown status fails the list map. The panel does not print the token
and does not invent a label. A lifecycle button still posts the machine
status.

## Out of scope

- A new status or a lifecycle change.
- Price, signing, and payment fields.
- DNS, Cloudflare, deploy, and live customer data.
