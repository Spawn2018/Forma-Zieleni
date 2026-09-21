# API reference pointer

`contracts/openapi.json` is the machine contract for the Core API paths
it contains. Do not keep a second handwritten list of those paths.

The local server base is `http://127.0.0.1:{port}/v1`. That host is not
a production hosting decision.

`POST /growth/plans` requires `growth:plan`. The response schema requires
`synthetic: true`, the label `SYNTHETIC / TEST ONLY`, and
`authorizesSpend: false`. A body that asks to spend is rejected by the
route. The behavioral test is `apps/api/src/http.test.mjs`.

Lead capture, qualification, and draft content reads are in the same
OpenAPI file. Authorization rules for drafts are implemented in
`packages/domain/src/content-auth.ts` and checked by
`packages/domain/content-auth.test.mjs`.
