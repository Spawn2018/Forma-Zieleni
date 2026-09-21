# Database Engineering Standard

PostgreSQL is the selected persistence engine (ADR-014). Kysely is the typed SQL layer. These rules still apply: persistence follows the domain, and Kysely does not replace database constraints.

## Modeling
- Model business invariants first; persistence follows the domain rather than dictating it.
- Prefer normalized transactional schemas as the default starting point. Denormalization/read models require measured need and an explicit consistency strategy.
- Use stable identifiers and explicit foreign-key relationships where the selected database supports them.
- Encode uniqueness, required relationships and safe value constraints at the strongest appropriate layer; critical invariants should not depend solely on UI validation.
- Separate operational source-of-truth data from derived analytics/search/cache projections.

## Access
- All queries have ownership and a reason to exist.
- No query construction that permits injection.
- Authorization is enforced server-side before returning/mutating protected data; object-level authorization is explicit.
- Avoid unbounded reads/writes and offset strategies that become pathological at scale where cursor/keyset approaches are more appropriate.
- Batch intentionally; do not hide large fan-out behind generic abstractions.

## Indexes
Indexes are designed from workload: predicates, joins, sort/order, cardinality and write cost. Validate with execution plans and representative data. Remove redundant/unused indexes only after evidence and safety review.

## Transactions and concurrency
Define transaction boundaries around business invariants. Consider lost updates, duplicate submissions, deadlocks and retries. Financial/payment and webhook flows require idempotency. Outbox writes that represent domain events share the transaction with the state change.

## Migrations
Schema migrations are versioned code. Prefer expand -> migrate/backfill -> switch -> contract for risky changes. Large backfills are resumable, observable and rate-controlled. Destructive migrations are DANGEROUS and require owner approval.

## Data safety
Backups without restore tests do not count as a recovery system. Define RPO/RTO later as explicit decisions. Encrypt sensitive data in transit and at rest where supported; minimize PII; keep secrets out of rows/logs/code; audit privileged access and sensitive business operations.
