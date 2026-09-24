# iOS client foundation

Slice: `MOBILE-IOS-FOUNDATION` / `FZ-REQ-MOBILE-003`.

## Boundary

- Core API is the only business truth.
- This package is an iOS-surface client foundation: typed `/v1` health and ready probes via `@forma-zieleni/api-client`.
- It does **not** own commercial state (no on-device lead/opportunity store).
- App Store signing credentials and store uploads stay out of the tree.

## Out of scope

- Shipping an App Store binary.
- Choosing a UI framework lock-in beyond this foundation contract.
- Production OAuth client secrets.

## Verify

```bash
pnpm --filter @forma-zieleni/mobile-ios test
```
