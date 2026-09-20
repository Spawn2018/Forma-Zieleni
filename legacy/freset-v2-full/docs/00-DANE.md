# Dane potwierdzone (mają pierwszeństwo)

<!-- FRESET-V2-SYNC-2026-09-20 -->
> **F-RESET v2 — 2026-09-20 · Status: CURRENT SUPPORTING DOC.** Dokument pomocniczy; w konflikcie wygrywa warstwa kanoniczna. Źródła nadrzędne: `00-MASTER-PLAN.md`, `25-MASTER-CONTEXT-2026-09-20.md`, `26-DECISION-REGISTER.md`, `30-F-RESET-EXECUTION-2026-09-20.md`, `31-IMPLEMENTATION-STATUS-MATRIX.md` oraz `contracts/openapi.yaml` dla API. Starsze F0–F33 i wskazania konkretnego hostingu są INPUT/LEGACY, nie kolejnością ani wyborem infrastruktury.

<!-- FRESET-SYNC-2026-09-20 -->
> **AKTUALIZACJA F-RESET — 2026-09-20:** Dane nadal obowiązują, ale konto Google Sebastiana jest testowe; produkcyjne konto Agnieszki będzie łączone OAuth. Hosting pozostaje decyzją otwartą.  
> W razie konfliktu obowiązują `00-MASTER-PLAN.md`, `25-MASTER-CONTEXT-2026-09-20.md`, `26-DECISION-REGISTER.md` i `contracts/openapi.yaml`.


## Od właściciela (czat, IX 2026)
| Dane | Wartość |
|---|---|
| Obszar, etap 1 | Trójmiasto i województwo pomorskie |
| Obszar, etap 2 | województwo kujawsko-pomorskie |
| Cena projektu | od 2 500 do 25 000 zł, największe do 50 000 zł |
| Średnia wartość umowy | 8 000–15 000 zł |
| Marża | ok. 95% |
| Budżet reklam | maks. 300 zł miesięcznie, prowadzone samodzielnie |

## Z obecnej strony formazieleni.pl (odczyt 17.09.2026)
| Dane | Wartość | Źródło |
|---|---|---|
| Główny projektant | inż. arch. kraj. Agnieszka Pupiało | /o-nas/ |
| Wielkość zespołu projektowego | jedna osoba: właścicielka firmy (projektuje wszystko) | czat, 19.09.2026 |
| Doświadczenie | „od prawie 10 lat zajmujemy się projektowaniem zieleni” | /o-nas/ |
| Narracja | „my” | cała strona |
| Zakres | ogrody przydomowe (małe w zabudowie szeregowej i przyblokowej, duże), parki osiedlowe, roślinność przy ciągach pieszych i samochodowych, rabaty kwietne (ogrody i przestrzeń miejska: rekreacja, ścieżki piesze i rowerowe, drogi o dużym ruchu), dobór małej architektury, wzory kostki brukowej, balkony, tarasy (przydomowe i widokowe w apartamentach) | / i /o-nas/ |
| Wartości | szczerość, indywidualne podejście, szybkość i sumienność pracy, zadowolenie klientów | /o-nas/ |
| Partner | DAMPS POL (hurtownia budowlana i centrum ogrodnicze), rabat po powołaniu się na realizację z Forma Zieleni, www.dampspol.pl | /o-nas/ |
| Kontakt | 514 220 155, agnieszka@formazieleni.pl, facebook.com/FormaZieleni | / |
| Artykuły | 6 widocznych na /artykuly/ (lista w `09-AUDYT.md` §E); na stronie jest przycisk „Więcej”, więc może ich być więcej | /artykuly/ |

## Nadal brakuje (blokuje wskazane części)
- Ceny i zawartość pakietów, stawki do `src/data/pricing.ts` (kreator, kalkulator, sekcja pakietów).
- Terminy etapów i liczba rund poprawek (proces, FAQ, portal).
- Czy pracownia zakłada ogrody, czy tylko projektuje (FAQ, proces).
- Dokładny rok startu i liczba projektów (pasek dowodów). Na stronie jest tylko „od prawie 10 lat”.
- Zdjęcia realizacji i zgody właścicieli posesji; czy 4 projekty z artykułów (nowoczesny, szeregowy, skarpa, strefa relaksu) to realizacje klientów.
- Godziny kontaktu (SLA, e-maile). Kto dzwoni do leadów: projektantka czy właściciel (tekst SMS).
- Płatna konsultacja (tak/nie, cena, czy odliczana od projektu), bony (tak/nie), okres przechowywania plików projektu.
- Dane rejestrowe firmy do polityki prywatności; zgoda A. Pupiało na wizerunek w sekcji „Kto projektuje”.
- Zgoda DAMPS POL na opisanie współpracy i warunki rabatu (aktualne?).

## Decyzje do v3 (`10-UX-AUTOMATYZACJA.md`)
- Operator telefonii z webhookami dla nieodebranych połączeń (M34) i numer, który ma być na stronie.
- Budżet miesięczny na AI podgląd stylu (M27) i zgoda na tę funkcję.
- Czy budujemy sieć wykonawców (M30); pierwsi kandydaci.
- Czy oferujecie opiekę po projekcie (M29) i nadzór realizacji (M33).
- Dostęp do Google Business Profile API (A11), jeśli ma działać powiadamianie o opiniach.

## Decyzje do platform (`11-PLATFORMY.md`)
- Czy testujemy Oferteo i jaką kwotą w sezonie (limit 300 zł obejmuje też Google i Meta).
- Minimalna wartość zlecenia, przy której warto kupić kontakt (`{{MIN_WARTOSC_ZLECENIA}}`).
- Adres skrzynki na powiadomienia z platform (automatyzacja A23).
- Czy mamy już profile: Oferteo, Bing Places, Apple Business Connect, katalogi firm.

## Decyzje i dane do v4 (`12-ZGODNOSC-I-AGENCI.md`)
- Liczba osób w firmie i obrót (próg mikroprzedsiębiorstwa z ustawy o dostępności).
- Status VAT i termin KSeF, który Was obejmuje; kto wystawia faktury i w jakim programie.
- Subdomeny do wysyłki poczty (transakcyjna i marketingowa) oraz zgoda na zmiany w DNS.
- Czy wchodzimy w poziom 3 gotowości na agentów (serwer MCP) i kto zatwierdza zapytania od agentów.
- Dostawca modelu obrazowego i to, czy daje oznaczenia maszynowe (C2PA lub IPTC).

## Dane do wariantu darmowego (`13-KOSZTY-I-REPOZYTORIA.md`)
- Domena konta w Fakturowni i token API (Ustawienia → Integracja).
- Czy zaliczki mają iść jako proforma, czy faktura VAT.
- Kanał powiadomień o leadzie: Telegram czy ntfy (zamiast płatnych SMS-ów).
- Czy włączamy płatności online od razu, czy zostajemy przy przelewie.

## Dane do przepustowości (`22-JEDEN-PROJEKTANT.md`)
- Godziny projektowe tygodniowo po odjęciu sprzedaży i administracji.
- Tygodnie pracy w roku (urlop, święta, sezon).
- Normy godzinowe etapów dla czterech przedziałów metrażu (po 4–6 projektach z ewidencji czasu).
- Partner na przeciążenie: druga pracownia lub podwykonawca dokumentacji i stawka.
- Próg podwyżki cen przy wypełnieniu kalendarza powyżej 85%.
