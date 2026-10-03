# Admin milestone project filter

Status: contracted for `ADMIN-MILESTONE-PROJECT-FILTER` / `FZ-REQ-ADMIN-023`.

## Surface

The staff milestone section has a GET form, **Pokaż kamienie projektu**.
An empty field loads the existing unfiltered list. A filled opaque project
id is sent as `projectId` on `GET /v1/milestones`. The section then says
**Filtr projektu:** and offers **Pokaż wszystkie**.

A blank or whitespace value is the full list. A guessable or malformed id
does not call Core API. The panel says the id is invalid and does not
pretend the list is empty.

Other staff lists stay unfiltered.

## Out of scope

- A new milestone store or query language.
- Filtering the decision log, files, or gardens.
- Payment, signing, and a client-supplied subject.
- DNS, Cloudflare, deploy, and live customer data.
