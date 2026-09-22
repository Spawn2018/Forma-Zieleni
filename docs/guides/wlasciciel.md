# Dla właściciela

Ten plik jest dla decyzji. Szczegóły implementacji są w architekturze,
nie tutaj.

## Co jest wiążące

Architektura: `docs/architecture/CURRENT-ARCHITECTURE.md`.
Cursor wykonuje pracę AUTO i REVIEW. Nie zamyka bramek Ownera.

## Czego ten plik nie pozwala

Nie pozwala wypchnąć kodu, wdrożyć produkcji, zmienić DNS ani Cloudflare,
wydać pieniędzy na reklamy, uruchomić śledzenia klientów ani wybrać
dostawcy płatności, podpisu albo hostingu.

## Otwarte bramki

- FZ-SIGN-1, dostawca podpisu: brak decyzji
- FZ-SEARCH-CRAWL-1, polityka crawlerów treningowych: otwarta
- CMS-ACCEPT: otwarte, bo nie ma dowodu z prawdziwego panelu Apostrophe i PostgreSQL
- dostawca płatności: brak decyzji
- hosting produkcji: brak decyzji

## Co jest zrobione lokalnie

Działa kontrakt leadów, prywatne pliki mediów, reguły publikacji szkicu
oraz syntetyczny plan marketingowy. Plan ma etykietę `SYNTHETIC / TEST ONLY`
i nie upoważnia do wydatku.

Panel administratora, portal klienta i aplikacje mobilne nie są zbudowane.
Nie oceniaj ich po tym pliku jako gotowych.

## Następna bezpieczna praca produktowa

Po `PORTAL-APP` kolejny READY na `docs/architecture/NEXT-SLICES-MAIN.md`
to `CRM-OPPORTUNITY-CONTRACT` (oraz osobno odblokowanie
`LEAD-SEC-SESSION`, jeśli sesja go zablokowała). CMS-ACCEPT i akceptacja
bezpieczeństwa Lead pozostają otwarte. To nie jest prośba o wdrożenie.
