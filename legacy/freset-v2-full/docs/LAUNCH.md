# Checklista startu (F9, rozszerzona)

<!-- FRESET-V2-SYNC-2026-09-20 -->
> **F-RESET v2 — 2026-09-20 · Status: CURRENT SUPPORTING DOC.** Dokument pomocniczy; w konflikcie wygrywa warstwa kanoniczna. Źródła nadrzędne: `00-MASTER-PLAN.md`, `25-MASTER-CONTEXT-2026-09-20.md`, `26-DECISION-REGISTER.md`, `30-F-RESET-EXECUTION-2026-09-20.md`, `31-IMPLEMENTATION-STATUS-MATRIX.md` oraz `contracts/openapi.yaml` dla API. Starsze F0–F33 i wskazania konkretnego hostingu są INPUT/LEGACY, nie kolejnością ani wyborem infrastruktury.

<!-- FRESET-SYNC-2026-09-20 -->
> **AKTUALIZACJA F-RESET — 2026-09-20:** Launch nie może nastąpić przed Gate A/B/C. Cloudflare-only ingress, restore test, security matrix i prod OAuth są blockerami.  
> W razie konfliktu obowiązują `00-MASTER-PLAN.md`, `25-MASTER-CONTEXT-2026-09-20.md`, `26-DECISION-REGISTER.md` i `contracts/openapi.yaml`.

> **INFRA F-RESET:** Wszystkie niższe wzmianki o Cloudflare Workers/D1/R2/Access/Pages/wrangler opisują **historyczny wariant/kandydata**, nie wybrany stack. Aktualna decyzja: Cloudflare = warstwa ochronna/public ingress; origin prywatny; hosting, compute, DB i storage wybieramy dopiero w ETAPIE A po labie, backup/restore/security/load. Nie implementować starego stacku bez nowego ADR.


Nie zmieniaj DNS bez przejścia punktów 1–4.

1. Zapisz obecne rekordy DNS: A/CNAME, MX, SPF, DKIM, DMARC. Poczta agnieszka@formazieleni.pl ma działać bez przerwy.
2. Eksport WordPressa (Narzędzia → Eksport → Wszystko) + kopia `wp-content/uploads`. Uruchom `scripts/import-wordpress.mjs`, sprawdź `import/pages.txt` i ostrzeżenia o pustej treści (Elementor).
3. Scal `import/redirects.csv` z `docs/redirects.csv` i zaimportuj do Cloudflare Bulk Redirects. Sprawdź 20 losowych starych adresów, w tym `/2026/08/19/elementor-1143/`.
4. Resend: jeden wspólny rekord SPF (scal, nie dodawaj drugiego), DKIM, sprawdzenie DMARC.
5. Podepnij domenę do Workera, HTTPS, jedno kanoniczne `formazieleni.pl` (www → 301).
6. Kotwice `#uslugi` i `#kontakt` działają na nowej stronie głównej.
7. Search Console: nowa sitemapa, inspekcja: strona główna, usługi, 3 artykuły.
8. Google Business Profile: link z UTM, kategorie, usługi z cenami, obszar obsługi.
9. Zgłoszenie testowe na produkcji (formularz, quiz): D1, e-mail, SMS; potem usuń rekord.
10. `npm run placeholders` = 0; Lighthouse CI zielone.
11. Mikroretencja: data weryfikacji warunków w CMS aktualna; linki do WFOŚiGW działają.
12. DAMPS POL: potwierdzone warunki rabatu i zgoda na publikację.
13. Cloudflare Web Analytics, alerty błędów Workera, D1 Time Travel, cotygodniowy eksport bazy do prywatnego R2 (usuwanie po 35 dniach).
14. 14 dni monitoringu: 404, Core Web Vitals, leady dziennie, czas do pierwszego kontaktu.
