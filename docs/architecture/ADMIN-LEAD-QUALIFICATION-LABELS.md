# Staff lead qualification labels

Status: contracted for `ADMIN-LEAD-QUALIFICATION-LABELS` / `FZ-REQ-ADMIN-054`.

## Surface

A staff lead shows its qualification result in Polish:

- `pending` — oczekuje
- `qualified` — zakwalifikowana
- `unqualified` — niezakwalifikowana
- `needs_review` — wymaga przeglądu

An unknown result token rejects the list. A missing result stays `pending`.

## Out of scope

- A new qualification result, lead status, price, or signature.
- DNS, Cloudflare, deploy, and live customer data.
