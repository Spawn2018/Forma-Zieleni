# FZ-CMS-1 lab

Status: isolated research + finalist validation lab. Not production.
Not a selected CMS. Outside `pnpm-workspace.yaml`.

## What ran

- `native` — draft/publish isolation, rollback, thirty synthetic
  assets, last-known-good published projection, crop math.
- `media` — sharp 0.34.5 WebP/AVIF bytes, synthetic GPS strip,
  CONTAIN / SMART_FILL / ADAPTIVE_LAYOUT.
- `www-proto` — React gallery/lightbox/before-after markup plus
  resolved `yet-another-react-lightbox@3.32.2` and
  `react-compare-slider@4.0.0`. Browser swipe/pinch remains deferred.
- `vendors` — wrappers that exercise gitignored trees under `tmp/`.
  Vendor source trees and `node_modules` must not enter Git.

AVIF/WebP encoding is executed in `media`, not deferred.

No Docker. No customer photos. No Cloudflare/DNS.

## Source-level schemas

`schemas/` remains the committed portable sketch of the shared types
for Payload, Apostrophe and Strapi.

Root `pnpm lint` / `pnpm test` call `scripts/cms-lab-gate.mjs`. That
script no-ops if this tree is deleted.

## Cleanup

1. Delete this directory, including gitignored `tmp/`.
2. Leave `scripts/cms-lab-gate.mjs` (it will skip) or remove that hook
   in a later tidy slice.
3. Do not copy this tree into `apps/` without a later authorized slice.
