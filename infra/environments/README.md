# infra/environments

Opisy środowisk Forma Zieleni.

## Zasady

- brak sekretów, tokenów i danych klientów w tym katalogu,
- hosting, provider bazy i storage **nie są jeszcze wybrane**,
- nazwy środowisk są organizacyjne, nie wiążą konkretnego cloud vendora.

## Planowane środowiska (roboczo)

| Środowisko | Cel |
|------------|-----|
| `development` | Lokalny development deweloperów |
| `staging` | Testy integracyjne / akceptacyjne (gdy powstanie) |
| `production` | Ruch produkcyjny (origin TBD; ingress docelowo Cloudflare) |

Szczegóły wdrożenia powstaną po wyborze infrastruktury.
