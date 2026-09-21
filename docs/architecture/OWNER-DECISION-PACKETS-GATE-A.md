# Gate A Owner Decision Packets

Status: OPEN. These packets do not implement infrastructure. Reply with `DECISION FZ-A#: OPTION X` plus optional constraints. Silence is not consent. Prices not cited from an official current page are marked unknown.

Official sources reviewed 2026-09-21:
- [CodeRabbit plans](https://docs.coderabbit.ai/management/plans)
- [Hetzner Cloud price adjustment](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/)
- [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
- [PostgreSQL](https://www.postgresql.org/)
- [SQLite](https://www.sqlite.org/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Prisma](https://www.prisma.io/docs)
- [Fastify](https://fastify.dev/)
- [Hono](https://hono.dev/)
- [NestJS](https://nestjs.com/)
- [OpenTelemetry](https://opentelemetry.io/)
- [MinIO](https://min.io/)
- [Better Auth](https://www.better-auth.com/)
- [OWASP ASVS project](https://owasp.org/www-project-application-security-verification-standard/)

---

## FZ-A1 — Lab/staging compute and CI/deploy target

- **question:** Where should isolated lab/staging compute and CI run? Production cutover is out of scope.
- **why_blocked:** Hosting/compute and deploy provider are undecided (POST-V2 §4, ADR-007).
- **options:**
  - **A** — Keep compute local on this Windows workstation. Add GitHub Actions later only as a check runner, not as production hosting.
  - **B** — Hetzner Cloud EU VM for lab/staging. Official FSN/NBG/HEL CX23 monthly cap after 15 June 2026 is €5.49 excl. IPv4 ([Hetzner docs](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/)). VAT, IPv4, backups and traffic extras are unknown here.
  - **C** — Fly.io Machines for lab/staging. Current list price unknown in this packet; confirm on [fly.io/docs](https://fly.io/docs) before spend.
  - **D** — Remain local-only until a later packet. No remote lab.
- **cost:** Target remains as close to 0 PLN/month as practical. A is lowest cash outlay. B has a documented euro cap. C unknown. Any recurring spend is OWNER-ONLY.
- **security/privacy:** EU region preferred. No customer data in lab. Secrets stay off git.
- **reversibility:** A and D are reversible. B and C can be deleted; data portability depends on later DB/storage choices.
- **blocks:** Remote staging, CI deploy, restore-on-remote, private-origin validation against a non-local host.
- **safe work continuing:** Local contracts, domain, tests, CodeRabbit setup, ASVS mapping.
- **reply:** `DECISION FZ-A1: OPTION A|B|C|D`

## FZ-A2 — API runtime and application frameworks

- **question:** Which HTTP runtime implements Core API, and which framework implements web, portal and admin?
- **why_blocked:** Application and API frameworks are undecided (POST-V2 §3).
- **options:**
  - **A** — Fastify on Node 24 for `apps/api`. web/portal/admin stay TypeScript apps with a later UI-library decision if needed.
  - **B** — Hono on Node 24 for API and shared fetch handlers; web/portal/admin as separate Hono or HTML apps.
  - **C** — NestJS API plus Next.js for web/portal/admin.
  - **D** — Express API plus Astro for public web. This resembles legacy shape and is not inherited.
- **cost:** All four are open-source. Hosting cost follows FZ-A1. Nest/Next have higher operational surface.
- **security/privacy:** Server-side authz is required in every option. Framework choice does not replace ASVS/BOLA tests.
- **reversibility:** A and B are smaller runtimes and easier to replace. C and D couple UI and API more tightly.
- **blocks:** HTTP server, generated runtime clients, WWW/Portal/Admin implementation, ZAP against a live process.
- **safe work continuing:** OpenAPI, domain types, validation, ASVS mapping.
- **reply:** `DECISION FZ-A2: OPTION A|B|C|D`

## FZ-A3 — Database engine and data access

- **question:** Which database and data-access style should the modular monolith use?
- **why_blocked:** Database and ORM are undecided (POST-V2 §4, ADR-007).
- **options:**
  - **A** — PostgreSQL with explicit SQL migrations, no ORM.
  - **B** — PostgreSQL with Drizzle.
  - **C** — SQLite for local/dev and PostgreSQL for lab, same SQL migrations.
  - **D** — PostgreSQL with Prisma.
- **cost:** PostgreSQL and SQLite are free software. Hosted Postgres price is unknown until a provider is chosen.
- **security/privacy:** EU hosting once remote. Migrations must be reversible in lab. No customer dumps.
- **reversibility:** A and C keep SQL portable. B and D add generated clients that must be replaced on exit.
- **blocks:** Persistence, outbox tables, backup/restore of real schema, CRM visibility beyond in-memory fixtures.
- **safe work continuing:** Domain invariants, contract tests.
- **reply:** `DECISION FZ-A3: OPTION A|B|C|D`

## FZ-A4 — Private object/file storage

- **question:** Where do private, versioned, checksummed files live in lab?
- **why_blocked:** Object storage is undecided. Legacy R2 is not a current choice.
- **options:**
  - **A** — Local disk under ignored `private/` with checksums and non-guessable keys. Sufficient for first file slice later.
  - **B** — MinIO (S3 API) in lab only.
  - **C** — Cloudflare R2. Present as a candidate only; ADR-007 forbids assuming it.
  - **D** — Hetzner Object Storage. Current euro price unknown here; confirm on official Hetzner pages.
- **cost:** A is free. B is free software plus VM cost. C and D unknown until official quotes.
- **security/privacy:** Files stay private, authorized, versioned and non-guessable. No public predictable URLs.
- **reversibility:** A and B are easiest to leave. C and D are S3-shaped and portable if keys/metadata are owned.
- **blocks:** File module, authenticated downloads, some Portal/Admin file UI.
- **safe work continuing:** Lead slice has no file binaries.
- **reply:** `DECISION FZ-A4: OPTION A|B|C|D`

## FZ-A5 — Auth foundation

- **question:** How do staff, client portal and later mobile authenticate?
- **why_blocked:** Auth library is undecided. Server-side authz is already accepted.
- **options:**
  - **A** — First-party opaque sessions and magic link, no auth framework.
  - **B** — Better Auth on the chosen API runtime.
  - **C** — Auth.js, practical mainly if FZ-A2 is Next.js.
  - **D** — External IdP (Ory or similar) later. Current SaaS price unknown.
- **cost:** A–C are software. D may be recurring OWNER-ONLY spend.
- **security/privacy:** Sessions, magic links, CSRF and logout are ASVS V6/V7. Customer PII stays out of logs.
- **reversibility:** A is most portable. B and C can be replaced if identity records stay in Core API.
- **blocks:** Authorized list/get/qualify, Portal, Admin, Mobile sessions.
- **safe work continuing:** Public lead capture contract, domain rules, BOLA test fixtures without a live IdP.
- **reply:** `DECISION FZ-A5: OPTION A|B|C|D`

## FZ-A6 — Observability, secrets and backup/restore

- **question:** What is the lab observability, secret and backup baseline?
- **why_blocked:** Observability backend and secret management are undecided. OpenTelemetry-compatible telemetry is an accepted requirement, not a vendor pick.
- **options:**
  - **A** — JSON logs, OpenTelemetry SDK later, gitignored local secret files, filesystem backup plus a real restore test.
  - **B** — Self-hosted Grafana/Loki/Tempo or an OTel collector on the FZ-A1 host.
  - **C** — Vendor SaaS (Sentry, Axiom or similar). Price unknown; recurring spend is OWNER-ONLY.
  - **D** — OS secret store plus A, without a metrics backend yet.
- **cost:** A and D are closest to 0 PLN. B needs the FZ-A1 host. C unknown.
- **security/privacy:** Secrets never in git or prompts. Logs must not contain CUSTOMER/SECRET class data.
- **reversibility:** A and D are local. B is moveable. C is vendor lock-in risk.
- **blocks:** Monitoring PASS, backup/restore PASS, lab secret rotation runbooks.
- **safe work continuing:** Failure-contract text, audit fields on leads.
- **reply:** `DECISION FZ-A6: OPTION A|B|C|D`

## FZ-A7 — Private-origin implementation

- **question:** How does the lab origin stay off the public Internet? Ingress direction is already accepted.
- **why_blocked:** Tunnel/private origin is not implemented (POST-V2 §7). Live Cloudflare mutation is DANGEROUS.
- **options:**
  - **A** — Cloudflare Tunnel to a private lab origin after explicit DANGEROUS approval for the Cloudflare change.
  - **B** — Tailscale or another private overlay first; Cloudflare proxy later.
  - **C** — Localhost-only origin. No remote ingress until staging exists.
  - **D** — Authenticated origin pull / mTLS. Current Cloudflare feature cost unknown.
- **cost:** C is free. A uses existing Cloudflare zone; extra product cost unknown. B client is free software; coordination cost unknown.
- **security/privacy:** Origin must not accept bypass traffic. Never point a tunnel at CT8. No customer data through the lab origin.
- **reversibility:** C is safest now. A and D touch live DNS/Cloudflare and need DANGEROUS approval immediately before action.
- **blocks:** Remote private-origin validation. Local product work does not wait.
- **safe work continuing:** Local API/UI once FZ-A2 exists; ZAP against localhost.
- **reply:** `DECISION FZ-A7: OPTION A|B|C|D`
