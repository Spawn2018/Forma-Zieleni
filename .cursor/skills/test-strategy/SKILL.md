---
name: test-strategy
description: Use when designing or reviewing tests for a slice, bug fix, refactor, contract or critical business rule.
---
# test-strategy
Test observable behavior and business invariants at the lowest useful level. Add regression tests for fixed bugs. Prefer risk-weighted coverage over chasing a raw percentage. Include failure/edge/concurrency/idempotency paths where relevant. Avoid brittle tests coupled to implementation details. Contract and authorization boundaries need explicit tests.
