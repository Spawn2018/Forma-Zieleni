# Mobile iOS foundation

Status: contracted for `MOBILE-IOS-FOUNDATION` / `FZ-REQ-MOBILE-003`.

## Boundary

- iOS is a Core API client surface, not a second business backend.
- Foundation lives in `apps/mobile-ios` and calls `/v1/health` and `/v1/ready` through typed paths.
- Commercial state stays on Core API; the device must not present a local CRM truth.
- App Store signing keys and store upload stay outside this repository.

## Out of scope

- Production App Store credentials.
- Store publication.
- Inventing field-update commercial workflows before Core API exposes them.

Machine checks: `apps/mobile-ios/foundation.test.mjs`.
