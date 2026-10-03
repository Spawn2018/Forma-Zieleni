# Staff site project filter

Status: contracted for `ADMIN-SITE-PROJECT-FILTER` / `FZ-REQ-ADMIN-036`.

## Surface

Staff filter the site-intelligence list by an opaque project id. An empty
filter loads the full list. A valid id is sent as `projectId` on the
existing `GET /v1/site-intelligence` query.

An invalid id does not call Core API. The screen says the id is invalid
and does not show a site row.

## Out of scope

- A new site field or a second site store.
- A live invent or a third-party credential.
- Payment, signing, and an invented site conclusion.
- DNS, Cloudflare, deploy, and live customer data.
