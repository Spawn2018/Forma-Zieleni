# Staff payment installment labels

Status: contracted for `ADMIN-PAYMENT-INSTALLMENT-LABELS` / `FZ-REQ-ADMIN-058`.

## Surface

A staff installment shows its status in Polish: zaplanowana, należna,
zapisana, zwolniona, or anulowana. An unknown status token rejects the
schedule list. The raw token is not shown. The transition post still
sends the machine token.

## Out of scope

- A new status, a provider, or a charge.
- Changing the stored minor amount.
- DNS, Cloudflare, deploy, and live customer data.
