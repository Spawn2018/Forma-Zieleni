# Test data

Ordinary tests do not copy a production or customer database.

Use deterministic synthetic inputs. Label business-like objects
`SYNTHETIC / TEST ONLY` when they could be mistaken for a client,
an offer, or a campaign result. `packages/domain/ecosystem.test.mjs`
does this for plans and offers.

Do not put real names, emails, phone numbers, or addresses in new
fixtures. The lead tests use an obviously fictional contact because the
capture contract requires those fields. Do not reuse that pattern for
analytics or marketing examples.

PostgreSQL integration tests build their own database when a URL or a
local binary is present. They skip, with a printed reason, when neither
exists. A skip is not a pass.
