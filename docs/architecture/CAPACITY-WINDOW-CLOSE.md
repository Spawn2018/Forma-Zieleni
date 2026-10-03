# Capacity window close

Status: contracted for `CAPACITY-WINDOW-CLOSE` / `FZ-REQ-CRM-CAPACITY-003`.

## Surface

Staff can withdraw a capacity window.
`POST /v1/capacity-windows/{windowId}/close` accepts an empty body.
The row stays. `closedAt` is the close instant. A second close keeps
that instant. Actor, kind, start, and end stay unchanged.

`decidePromisedDate` ignores a closed window. When no open window
remains, the promised instant is refused as empty capacity.

`apps/admin` shows **Zamknij okno** on an open window and **zamknięte**
after the close. A closed window has no second close control.

Migration `023_capacity_window_close` adds nullable `closed_at`.

## Out of scope

- Deleting the window.
- Moving the range on this route.
- Calendar SaaS, customer fields, and spend.
- DNS, Cloudflare, deploy, and live customer data.
