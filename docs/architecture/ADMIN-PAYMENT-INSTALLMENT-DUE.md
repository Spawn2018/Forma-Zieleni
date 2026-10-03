# Staff installment due instant

Status: contracted for `ADMIN-PAYMENT-INSTALLMENT-DUE` / `FZ-REQ-ADMIN-059`.

## Surface

A staff installment shows its due instant in Polish UTC words. No due
stays „bez terminu”. An unreadable or missing instant rejects the
schedule list. The raw timestamp is not shown.

## Out of scope

- A new due field or a stored clock.
- Changing the stored minor amount, a provider, or a charge.
- DNS, Cloudflare, deploy, and live customer data.
