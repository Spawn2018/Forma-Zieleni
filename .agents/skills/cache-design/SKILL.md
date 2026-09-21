---
name: cache-design
description: Use whenever proposing, adding, changing or debugging application, HTTP, CDN or data caching.
---
# cache-design
Read the caching section in docs/engineering/PERFORMANCE-ENGINEERING.md. Before implementation document source of truth, key, scope, consistency tolerance, TTL/invalidation, negative-cache behavior, stampede protection, cold-cache behavior, failure fallback, security and telemetry. Test cache-disabled/unavailable behavior. Cache must never become an undocumented correctness dependency.
