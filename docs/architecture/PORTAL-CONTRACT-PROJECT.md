# Portal contract project

Status: contracted for `PORTAL-CONTRACT-PROJECT` / `FZ-REQ-PORTAL-021`.

## Surface

A client contract names the projects already loaded for that contract.
One project is `Projekt: <id>`. More than one is `Projekty:` in id order.
Another contract’s project stays on that other contract.

No loaded project stays `Projekt: brak`. A failed project read says the
projects could not be read. A forbidden read says this account cannot
read projects. Neither is shown as no project.

## Out of scope

- A new contract or project store.
- A project title, a price, or a signature.
- DNS, Cloudflare, deploy, and live customer data.
