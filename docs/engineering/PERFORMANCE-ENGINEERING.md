# Performance Engineering Standard

Performance is a product requirement, not a cleanup phase.

## Performance budgets
Every product slice must identify the relevant latency/throughput/resource budget before optimization. Budgets are measured at user-visible boundaries and critical backend/database paths. Exact numeric SLOs are DECISION items until product/runtime baselines exist; agents must not invent them.

## Web/mobile
- Ship the minimum code/data needed for the current interaction.
- Avoid waterfalls; parallelize independent I/O and defer non-critical work.
- Treat images, fonts, JavaScript, hydration, third-party scripts and API round trips as budgeted resources.
- Measure real-user performance when production telemetry exists; use reproducible lab tests before then.
- Track user-centric responsiveness and loading stability; do not optimize a synthetic score while harming UX.
- Mobile: account for startup time, memory, battery, network variability, offline/retry behavior and image/upload cost.

## API/backend
- Define latency-sensitive paths and isolate slow external dependencies.
- Bound concurrency, retries, payload sizes and work per request.
- Use timeouts, cancellation, backpressure/load shedding where applicable.
- Prevent N+1 queries and accidental sequential I/O.
- Pagination is required for unbounded collections.
- Expensive work moves out of synchronous request paths when domain semantics permit it.

## Database
- Start from integrity and normalized domain data; denormalize only with measured justification.
- Constraints enforce invariants that belong in the database.
- Index from actual query shapes and plans, not intuition; indexes have write/storage cost.
- Inspect query plans for important/slow queries.
- Avoid SELECT * on hot paths when the data is not needed.
- Bound transactions; keep them short; understand isolation/concurrency implications.
- Migrations must be forward-safe, observable, rollback/roll-forward aware and tested on representative data volumes.
- Prevent table scans on known hot paths unless measured and accepted.
- Establish slow-query visibility and query-level telemetry once a DB is selected.

## Caching
Cache is an optimization, never the source of truth.
Before adding cache document: source of truth, key, scope, consistency tolerance, TTL/invalidation, negative caching, stampede strategy, failure behavior, security/privacy, metrics, and cold-cache behavior.
Test with cache disabled/unavailable. Avoid cache dependency that can collapse the source system during cold start/outage. Use request coalescing/single-flight where useful. TTL values are measured decisions, not magic constants.

## Performance review
For material changes capture baseline, workload, measurement method, p50/p95/p99 where meaningful, throughput/error rate/resource use, result, regression threshold, and decision.
