# Milestone list order

Status: contracted for `MILESTONE-LIST-ORDER` / `FZ-REQ-PORTAL-022` and `FZ-REQ-ADMIN-032`.

## Surface

Staff and the client see a milestone list in the same order. An earlier
due instant comes first. A missing due comes last. The same due stays in
id order. A done row stays in the list.

The sort copies the loaded rows. It does not write a new order, shift the
instant into a local zone, or drop a row.

## Out of scope

- A new milestone field or a stored sort.
- Hiding done work.
- Payment, signing, and a calendar provider.
- DNS, Cloudflare, deploy, and live customer data.
