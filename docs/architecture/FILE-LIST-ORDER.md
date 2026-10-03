# File list order

Status: contracted for `FILE-LIST-ORDER` / `FZ-REQ-PORTAL-027` and `FZ-REQ-ADMIN-038`.

## Surface

Portal and staff file lists order files by Polish name. Numbers compare as
numbers, so `plan 2.pdf` comes before `plan 10.pdf`. `Łąka.pdf` comes
before `plan 2.pdf`. The same name stays in id order.

A portal project card uses that order for the files already loaded for
that project. A file hidden from the client stays on the staff list. No
file is dropped.

## Out of scope

- A new file field or a stored sort.
- Payment, signing, and a calendar provider.
- DNS, Cloudflare, deploy, and live customer data.
