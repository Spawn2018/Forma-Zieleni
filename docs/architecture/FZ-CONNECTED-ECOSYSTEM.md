# FZ Connected Ecosystem

Status: CURRENT subordinate Canon. The only architecture entrypoint
remains [`CURRENT-ARCHITECTURE.md`](./CURRENT-ARCHITECTURE.md). This
file does not create a second execution loop or a second backlog. The
execution graph remains [`NEXT-SLICES-CMS.md`](./NEXT-SLICES-CMS.md).

## Rule

Verified information has one owner, a stable id, provenance, a
version, a visibility, and typed relations. A projection may read that
owner. It may not become a second owner.

PostgreSQL remains the database. There is no graph database. The
domain contract is `packages/domain/src/connected.ts`. Relations are
stored once. The inverse is derived.

## Human review

Agnieszka is the studio reviewer for design, content and marketing
semantics. The capabilities are `semantic:review`, `design:review`,
`content:review` and `marketing:review`. They do not override
OWNER-DECISION, OWNER-ONLY, DANGEROUS, price, legal terms, live
publication or spend.

A semantic proposal moves through edit, approve all, approve
selected, partial approve, reject or defer. Apply runs only after
approval. A human-locked field rejects an AI write. A stale source
version rejects apply. Two open proposals for the same field conflict
and are not auto-resolved.

Deterministic fields update after approval. Article prose stays a new
proposal. External text is data. It cannot write Canon or emit a
command.

## Visibility

`PRIVATE_CUSTOMER` is visible only to that customer scope. A public
reader does not receive it. A public view of a concept or illustrative
project has `realization: false`. Private fields (address, customer
name, price, quote, phone, email) are not copied into a public view.

## Connectivity

The coverage list is `CONNECTIVITY` in the domain module. Every row
has a state and a reason. An empty reason is an unexplained orphan.
The current list is the audit. A new surface is added there, not in a
side document that nothing checks.

## What this is not

Admin, Portal, Android, iOS, Garden OS and SketchUp do not gain a
runtime in this contract. Their rows say `FUTURE_DEPENDENCY` or
`LOCAL_BY_DESIGN` with the reason. CMS-ACCEPT, FZ-SIGN-1,
FZ-SEARCH-CRAWL-1, the payment provider and production hosting stay
open.
