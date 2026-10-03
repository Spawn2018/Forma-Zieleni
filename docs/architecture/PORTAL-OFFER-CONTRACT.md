# Portal offer contract

Status: contracted for `PORTAL-OFFER-CONTRACT` / `FZ-REQ-PORTAL-026`.

## Surface

A portal offer names the contracts already loaded for that offer. Another
offer’s contract stays off the row. More than one contract is listed in
id order.

A failed or forbidden contract read is not shown as no contract. An empty
contract list is `Umowa: brak`. A blank offer id fails the contract map.

## Out of scope

- A new offer or contract field.
- Price, terms, payment, and signing.
- DNS, Cloudflare, deploy, and live customer data.
