# Learning records

Status: EVIDENCE. Not Canon.

`records.json` is the pre-production store for material learning
records. Raw rows do not change architecture, Owner gates, or product
policy. Promotion is a status on a record plus a separate change to
the smallest durable control. This file is not that change.

Commands: `node scripts/fz-cis/cli.mjs`. Contracts:
`contracts/learning-record.schema.json`.

Do not store secrets, tokens, customer content, or private contract
text. `RESTRICTED` and customer PII are rejected. Repeated `patternKey`
values increment `occurrences` instead of creating a second open
record.

Learning Debt is derived from open class-wide records that already
name an improvement. It is not a second roadmap. Product order stays
in `docs/architecture/NEXT-SLICES-CMS.md`.
