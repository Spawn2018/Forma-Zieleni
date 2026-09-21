# FZ-CMS-1 lab

Status: isolated research lab. Not production. Not a selected CMS.

This directory is outside `pnpm-workspace.yaml`. It must not become
`apps/web` or the Core API.

## What ran

`labs/fz-cms-1/native` is an executable proof of the shared content
model: draft/publish isolation, rollback, thirty synthetic gallery
assets, CONTAIN / SMART_FILL / ADAPTIVE_LAYOUT crop math, gallery
markup, and a JSON export that omits binary pixels and GPS.

AVIF/WebP encoding is planned, not executed. No Docker. No customer
photos.

## Source-level schemas

The same conceptual types are sketched for Payload, ApostropheCMS and
Strapi under `schemas/`. Those files are not installed applications.

Root `pnpm lint` / `pnpm test` call `scripts/cms-lab-gate.mjs`. That
script no-ops if this tree is deleted, so the lab is removable.

## Cleanup

1. Delete this directory.
2. Leave `scripts/cms-lab-gate.mjs` (it will skip) or remove that hook
   in a later tidy slice.
3. Do not copy this tree into `apps/` without a later authorized slice.
