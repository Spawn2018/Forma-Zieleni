# Admin file project filter

Status: contracted for `ADMIN-FILE-PROJECT-FILTER` / `FZ-REQ-ADMIN-027`.

## Surface

Staff can limit the file list to one project. The form sends `fileProject`
on the staff page. An empty value loads the full list. A filled value must
already be an opaque project id. That id is sent as `projectId` on
`GET /v1/files`.

An invalid id is not sent. The panel says the id is wrong and does not
pretend the list is empty.

## Out of scope

- A new file store or a byte upload change.
- Payment, signing, and storage keys.
- DNS, Cloudflare, deploy, and live customer data.
