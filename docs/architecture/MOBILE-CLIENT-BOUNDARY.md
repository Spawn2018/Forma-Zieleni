# Mobile client boundary

Status: contracted for `MOBILE-CLIENT-BOUNDARY` / `FZ-REQ-MOBILE-001`.

## Boundary

- Core API remains the only business truth for commercial state.
- Android/iOS must not invent a separate mobile domain or second authz path.
- Typed client paths only when apps exist later.

## Out of scope

- Shipping Android/iOS apps in this slice.
- Production credentials or a second authorization stack.

Machine checks: `mobileClientBoundary()` in `@forma-zieleni/domain`.
