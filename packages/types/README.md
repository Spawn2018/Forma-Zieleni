# packages/types

Współdzielone typy TypeScript wywodzące się z kontraktu API i modelu domenowego.

## Odpowiedzialność

- typy wspólne dla klientów i serwera,
- synchronizacja z OpenAPI 3.0.x (docelowo generacja),
- bez runtime side-effects.

## Status

Lead record and error types match `contracts/openapi.json`. Runtime codegen is later implementation work. The API framework is already Hono.
