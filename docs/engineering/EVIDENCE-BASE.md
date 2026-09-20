# Engineering Evidence Base

This document records external evidence used to shape Forma Zieleni engineering policy. It is guidance, not a vendor/stack decision.

- Google Research, *Software Engineering at Google*: sustainable engineering depends on time, scale and explicit trade-offs.
- Google Research, *What Improves Developer Productivity at Google? Code Quality*: code quality and technical debt materially affect developer productivity.
- Google Research, *Modern Code Review: A Case Study at Google*: lightweight tool-supported review is a mature quality practice at very large scale.
- Google Research, *Productive Coverage*: raw coverage percentage is not enough; testing should focus on actionable/risky uncovered behavior.
- DORA, trunk-based development and delivery metrics: small batches, continuously healthy trunk and measuring throughput/stability support high software-delivery performance.
- Amazon Builders' Library, *Caching challenges and strategies*: caching can reduce latency/cost but creates failure modes; measure hit/miss, design for cold/unavailable cache, prevent thundering herd, treat TTL/invalidation/security deliberately.
- Google Cloud Well-Architected performance/reliability/security guidance: performance is continuous; define requirements, monitor, test capacity, design graceful degradation and security by design.
- Stripe Engineering, idempotency: network failures make safe retries/idempotency keys important for side-effecting APIs.
- Stripe Engineering, API versioning: API design review and minimizing unnecessary incompatible change reduce long-term complexity.
- 2026 Information Systems study on normalization: empirical TPC-H results caution against assuming fewer joins/denormalization automatically improves performance; schema decisions should be benchmarked.
- Systematic reviews on refactoring/code smells/technical debt: refactoring is linked to maintainability/testability/understandability; technical debt should be visible and managed rather than accumulated silently.

Re-check sources when a major engineering policy is revised.
