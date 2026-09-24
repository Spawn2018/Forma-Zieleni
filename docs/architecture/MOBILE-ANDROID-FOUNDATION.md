# Mobile Android foundation

Status: contracted for `MOBILE-ANDROID-FOUNDATION` / `FZ-REQ-MOBILE-002`.

## Boundary

- Android is a Core API client surface, not a second business backend.
- Foundation lives in `apps/mobile-android` and calls `/v1/health` and `/v1/ready` through typed paths.
- Commercial state stays on Core API; the device must not present a local CRM truth.
- Play signing keys and store upload stay outside this repository.

## Out of scope

- Production Play credentials.
- Store publication.
- Inventing field-update commercial workflows before Core API exposes them.

Machine checks: `apps/mobile-android/foundation.test.mjs`.
