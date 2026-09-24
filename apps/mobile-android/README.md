# Android client foundation

Slice: `MOBILE-ANDROID-FOUNDATION` / `FZ-REQ-MOBILE-002`.

## Boundary

- Core API is the only business truth.
- This package is an Android-surface client foundation: typed `/v1` health and ready probes via `@forma-zieleni/api-client`.
- It does **not** own commercial state (no on-device lead/opportunity store).
- Store signing, Play credentials, and Play uploads stay out of the tree.

## Out of scope

- Shipping a Play Store binary.
- Choosing a UI framework lock-in beyond this foundation contract.
- Production OAuth client secrets.

## Verify

```bash
pnpm --filter @forma-zieleni/mobile-android test
```
