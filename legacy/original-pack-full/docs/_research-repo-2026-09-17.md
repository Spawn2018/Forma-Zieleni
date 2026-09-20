# Notatki: repozytoria (17.09.2026, R1)

Sprawdzone wyszukiwaniem w tym czacie:
1. **better-auth** – uwierzytelnianie w TypeScript; od wersji 1.5 obsługuje D1 natywnie (`database: env.DB`), wcześniej wymagał Drizzle albo Kysely; od 1.4 pakiet jest ESM-only; instancję trzeba tworzyć wewnątrz obsługi żądania, bo binding D1 nie istnieje poza nią.
2. **drizzle-orm + drizzle-kit** – typowany dostęp do D1 i migracje (`drizzle-orm/d1`, `drizzle-kit generate`, `wrangler d1 migrations apply`).
3. **wojtekmaj/is-valid-nip** – walidacja NIP w TypeScripcie.
4. **nip24pl/nip24-javascript-client** – walidacja i sprawdzanie firm (NIP, REGON, KRS, VAT UE, IBAN), licencja Apache 2.0, wymaga konta w NIP24.
5. **pawel-id/bir1** – klient BIR1 (wyszukiwarka REGON GUS) w TypeScripcie.
6. **cloudflare/ai (katalog demos)** – oficjalne szablony zdalnych serwerów MCP (`remote-mcp-authless`, warianty z OAuth), tworzone przez `npm create cloudflare@latest -- <nazwa> --template=cloudflare/ai/demos/remote-mcp-authless`.
7. **cloudflare/mcp-server-cloudflare** – produkcyjne przykłady serwerów MCP.
8. **Agents SDK Cloudflare** – od lipca 2026 rozdzielone API `agents/mcp/server` i `agents/mcp/client` (MCP SDK v2).

Repozytoria wymienione w `14-REPOZYTORIA-PLUS.md` bez potwierdzenia w tym czacie są oznaczone „nie” w kolumnie „Sprawdzone”.
