# v12: aplikacja mobilna dla klienta i zakładka GARDEN OS

Dowody E48–E49 w `01-SPEC.md` §4. Notatki: `docs/_research-mobile-2026-09-19.md`. Aplikacja nie zastępuje portalu, tylko daje to, czego przeglądarka nie potrafi: powiadomienia, aparat i dostęp bez logowania za każdym razem.

## 1. Po co aplikacja

| Powód | Co daje |
|---|---|
| Powiadomienia push | Przypomnienia o pielęgnacji, przymrozku, nowej wersji koncepcji, terminie wizyty [E39] |
| Aparat | Dziennik ogrodu i zdjęcia „rok później” bez wysyłania e-maili |
| Kontakt po realizacji | Klient wraca do nas co sezon, a nie raz na pięć lat [E12, E41] |
| Dowód profesjonalizmu | Żadna lokalna pracownia w regionie nie daje klientowi własnej aplikacji [wiedza: do sprawdzenia] |

## 2. Stack i koszt [E48]

- **Expo (React Native)**, jeden kod na iOS i Android. Sierpień 2026: SDK 57 odpowiada React Native 0.86. Expo jest darmowe, płatne jest EAS.
- **Plan darmowy EAS:** 15 buildów Android i 15 iOS miesięcznie, 60 minut workflow, 1 tys. użytkowników aktualizacji. To wystarcza dla kilkudziesięciu klientów.
- **Backend bez zmian:** te same Workers, D1, R2 i logowanie linkiem co w portalu. Aplikacja to druga skóra na tym samym API.
- **Koszty stałe:** Google Play 25 USD jednorazowo, Apple Developer 99 USD rocznie [wiedza]. To jedyny nowy koszt poza czasem.
- **Aktualizacje:** EAS Update pozwala wysyłać poprawki bez przechodzenia przez sklep, o ile nie zmieniasz kodu natywnego.

## 3. Wymagania sklepów, które blokują publikację [E49]

1. **DSA:** zadeklaruj status przedsiębiorcy w App Store Connect. Bez tego aplikacja znika ze sklepu w UE. Adres, telefon i e-mail firmy będą widoczne publicznie.
2. **Google Play:** formularz Bezpieczeństwo danych i aktualny target API; od 28.10.2026 nowe zasady dostępu do kontaktów (aplikacja ich nie potrzebuje, więc nie prosimy o to uprawnienie).
3. **Konto demo dla recenzenta** z przykładowym projektem, inaczej odrzucenie.
4. **Manifest prywatności i polityka** zgodna z tym, co realnie zbieramy.
5. Ok. 1 na 4 zgłoszenia jest odrzucane przy pierwszym podejściu, najczęściej przez awarie i prywatność. Planujemy dwa podejścia, nie jedno.

## 4. Zakładki aplikacji

| Zakładka | Zawartość |
|---|---|
| Projekt | To samo co portal: etapy, pliki, uwagi przypięte do wizualizacji, akceptacje, harmonogram płatności |
| **GARDEN OS** | System operacyjny ogrodu, opisany w §5 |
| Rośliny | Lista roślin z projektu, karta rośliny z atlasu, zdjęcia z Twojego ogrodu |
| Kontakt | Telefon, czat e-mailowy, umówienie przeglądu, polecenie znajomym |

## 5. GARDEN OS

Zasada: **wszystko pochodzi z projektu klienta**, nie z ogólnych porad z internetu.

| Moduł | Działanie |
|---|---|
| Dziś w ogrodzie | Jedno zadanie na wierzchu, z powodem („miskanty tniemy przed ruszeniem wegetacji”) |
| Kalendarz roku | 12 miesięcy zadań wygenerowanych z listy roślin i nawierzchni (`garden_tasks`) |
| Pogoda i alerty | Przymrozek, susza, wichura, upał; alert powstaje z prognozy dla lokalizacji ogrodu i dotyczy tylko roślin wrażliwych |
| Dziennik | Zdjęcie plus notatka, oś czasu ogrodu miesiąc po miesiącu (`care_log`) |
| Podlewanie | Rejestr i podpowiedź na podstawie opadów: „w tym tygodniu spadło {{x}} mm, podlej tylko nowe nasadzenia” |
| Zdrowie roślin | Zgłoszenie problemu ze zdjęciem trafia do pracowni. Bez automatycznej diagnozy AI, bo pomyłka kosztuje rośliny |
| Gwarancje | Terminy gwarancji na rośliny i materiały z przypomnieniem 30 dni wcześniej (`warranties`) |
| Zakupy | Lista z projektu z ceną i dostępnością u partnera (`plant_supply`) |
| Przegląd | Rezerwacja przeglądu sezonowego w dwóch kliknięciach |
| Ogród rok po roku | Porównanie zdjęć z dziennika z renderem i ze stanem sprzed roku |

**Generowanie zadań:** reguła = roślina lub element + miesiąc + czynność. Reguły trzymamy w CMS przy gatunku (atlas M14), a przy tworzeniu projektu kopiujemy je do `garden_tasks` klienta. Zmiana reguły w atlasie nie zmienia wstecz zadań klienta, więc nikt nie dostanie nagle innego kalendarza.

**Powiadomienia:** maksymalnie 4 w miesiącu, w tym 1 alert pogodowy. Klient wybiera kanał i porę. Wyłączenie push nie blokuje dostępu do aplikacji.

## 6. Etapy wdrożenia

| Etap | Zakres | Czas |
|---|---|---|
| MVP (P0) | Logowanie linkiem, zakładka Projekt, GARDEN OS z kalendarzem i dziennikiem, push, konto demo, zgodność ze sklepami | 3–4 tygodnie |
| P1 | Alerty pogodowe, gwarancje, lista zakupów, rezerwacja przeglądu, tryb offline dla plików | 2 tygodnie |
| P2 | Widżet na ekranie głównym, porównanie rok do roku, aplikacja dla wykonawcy, wersja dla klientów bez projektu (płatna, jako lejek) | później |

## 7. Automatyzacje

| ID | Wyzwalacz | Działanie |
|---|---|---|
| A47 | Pierwszy dzień miesiąca | Push „zadania na {{miesiąc}}” do właścicieli ogrodów |
| A48 | Prognoza przymrozku dla lokalizacji | Alert tylko dla projektów z roślinami wrażliwymi, raz na dzień (`weather_alerts`) |
| A49 | Brak wpisu w dzienniku przez 60 dni | Delikatne przypomnienie i propozycja przeglądu |
| A50 | 30 dni przed końcem gwarancji | Push i zadanie w panelu (`v_warranties_due`) |
| A51 | Nowa wersja koncepcji w portalu | Push zamiast e-maila, jeśli klient ma aplikację |

## 8. KPI

| Metryka | Cel |
|---|---|
| Instalacje wśród klientów z projektem | ≥ 60% |
| Klienci aktywni po 6 miesiącach | ≥ 40% |
| Wpisy w dzienniku na klienta rocznie | ≥ 6 |
| Przeglądy sezonowe zamówione z aplikacji | ≥ 30% klientów |
| Polecenia z aplikacji | ≥ 1 na 5 aktywnych klientów rocznie |

## 9. Czego nie robić

- Nie kopiować całego portalu do aplikacji. Na telefonie liczą się zadania, zdjęcia i powiadomienia.
- Nie diagnozować chorób roślin automatycznie.
- Nie wysyłać więcej niż 4 powiadomień miesięcznie.
- Nie prosić o uprawnienia, których nie używamy (kontakty, lokalizacja w tle).
- Nie publikować aplikacji bez konta demo i statusu przedsiębiorcy [E49].
