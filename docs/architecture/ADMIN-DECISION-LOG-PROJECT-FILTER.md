# Admin decision-log project filter

Status: contracted for `ADMIN-DECISION-LOG-PROJECT-FILTER` / `FZ-REQ-ADMIN-026`.

## Surface

Staff can limit the decision log to one project. The form sends
`decisionProject` on the staff page. An empty value loads the full list.
A filled value must already be an opaque project id. That id is sent as
`projectId` on `GET /v1/decision-log`.

An invalid id is not sent. The panel says the id is wrong and does not
pretend the log is empty.

## Out of scope

- A new decision-log store or a second filter language.
- Payment, signing, and contact fields.
- DNS, Cloudflare, deploy, and live customer data.
