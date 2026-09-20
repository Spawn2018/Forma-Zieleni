# Forma Zieleni — F-RESET Master Plan

Status: CURRENT.

## A — Security + Infrastructure Lab
Repository foundation -> dev -> staging -> Cloudflare security/public ingress -> private-origin design/validation -> runtime candidate -> database candidate -> backup -> real restore -> monitoring/observability -> security suite -> webhook tests -> load tests.

Cloudflare is protection/ingress, not an automatic hosting/compute/database/storage decision. Target private origin must not accept direct public Internet traffic. Current CT8 remains legacy production until controlled cutover. Hosting/compute/DB/storage/ORM are open decisions. Initial cost objective is as close to 0 PLN/month as practical, subordinate to security/reliability.

## B — API Contract
OpenAPI 3.0.4 target/reference -> validation -> generated typed clients -> contract tests -> breaking-change checks -> CI. Same canonical contract serves web/portal/admin/mobile/integrations and later Ruby SketchUp adapter.

## C — Core Domain
Identity/Auth -> CRM -> Sales -> Capacity -> Projects -> Offers -> Payments -> Files -> Events -> Automation; then Site Intelligence -> Plant Knowledge -> Garden OS foundations.

Architecture: API-first modular monolith, event-driven core, transactional outbox, server-side authz, private files, signed/idempotent/replay-safe webhooks.

## D — Products
WWW -> Portal -> Admin/CRM UI -> Mobile -> SketchUp -> Garden OS extensions -> AI -> XR, subject to product validation and gates. Do not build all surfaces in parallel.
