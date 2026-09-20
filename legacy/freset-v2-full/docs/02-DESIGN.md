# Kierunek wizualny: „Plan nasadzeń”

<!-- FRESET-V2-SYNC-2026-09-20 -->
> **F-RESET v2 — 2026-09-20 · Status: ACTIVE INPUT / DEFERRED PRODUCT SPEC.** Wymagania zachowane, ale implementacja podlega kolejności a→b→c→d i decyzjom kanonicznym. Źródła nadrzędne: `00-MASTER-PLAN.md`, `25-MASTER-CONTEXT-2026-09-20.md`, `26-DECISION-REGISTER.md`, `30-F-RESET-EXECUTION-2026-09-20.md`, `31-IMPLEMENTATION-STATUS-MATRIX.md` oraz `contracts/openapi.yaml` dla API. Starsze F0–F33 i wskazania konkretnego hostingu są INPUT/LEGACY, nie kolejnością ani wyborem infrastruktury.

<!-- FRESET-SYNC-2026-09-20 -->
> **AKTUALIZACJA F-RESET — 2026-09-20:** Design zachowany jako input ETAPU D; UI nie może wprowadzać własnej logiki domenowej ani omijać Core API.  
> W razie konfliktu obowiązują `00-MASTER-PLAN.md`, `25-MASTER-CONTEXT-2026-09-20.md`, `26-DECISION-REGISTER.md` i `contracts/openapi.yaml`.


## Idea

Architekt krajobrazu patrzy na ogród z góry, w warstwach roślin, i nazywa rośliny po łacinie. Strona pożycza ten język. Główną rolę gra fotografia prawdziwych realizacji. Podpisem pracowni są cienka kreska planu i etykiety roślin z nazwą łacińską i polską, jak adnotacje na rysunku projektowym.

Śmiałość jest w jednym miejscu: w hero linia planu nasadzeń rysuje się raz na zdjęciu realizacji i prowadzi do trzech etykiet roślin widocznych na fotografii. Reszta strony jest cicha i uporządkowana, żeby nie konkurować ze zdjęciami [E1].

Czego unikamy świadomie: ciepłego kremowego tła z terakotowym akcentem, czarnego tła z kwaśną zielenią, siatki identycznych kart z cieniem, kapitalików z rozstrzeleniem nad nagłówkami, wielkich liczb ze statystykami w hero. To domyślne wzorce generowanych stron, a strona ma wyglądać jak pracownia, nie jak szablon [E2].

---

## Kolory

| Token | Hex | Rola | Kontrast |
|---|---|---|---|
| `--kamien` | `#EEF0EA` | tło stron (chłodny kamień, nie krem) | — |
| `--igliwie` | `#24392E` | tekst główny, ciemne sekcje, tekst na przyciskach CTA | 10,8:1 na `--kamien` |
| `--mech` | `#4E6B4F` | linki, obramowania pól formularza, ikony | 5,2:1 na `--kamien` |
| `--szalwia` | `#C5CFBF` | tło wyróżnionego pakietu i sekcji przerywających rytm | tylko tło |
| `--kreska` | `#8A968C` | linie planu i ozdobne podziały (nigdy tekst ani obramowanie pola) | dekoracja |
| `--rudbekia` | `#E0A526` | tło głównego CTA (tekst `--igliwie`) | 5,6:1 z `--igliwie` |

Zasady:
- Ciemne sekcje: tło `--igliwie`, tekst `--kamien`.
- Tekst na zdjęciu tylko na scrimie: gradient `--igliwie` 0% → 72% od dołu lub od lewej. Kontrast tekstu sprawdzany na najjaśniejszym fragmencie zdjęcia pod tekstem.
- Focus: obrys 3 px `--igliwie` z odstępem 2 px na jasnym tle, `--rudbekia` na ciemnym.
- `--rudbekia` wyłącznie na głównym CTA. Jeden akcent, jedno znaczenie.

---

## Typografia

| Rola | Krój | Ustawienia |
|---|---|---|
| Nagłówki | Newsreader (Google Fonts, oś optyczna) | 400–500, bez pogrubień; interlinia 1,05–1,15 |
| Tekst i interfejs | Schibsted Grotesk | 400 i 600; interlinia 1,6 |
| Nazwy łacińskie roślin | Newsreader italic | sygnatura: etykiety na zdjęciach, listy roślin |

- Przed wyborem sprawdź komplet polskich znaków: ą ć ę ł ń ó ś ź ż Ą Ć Ę Ł Ń Ó Ś Ź Ż. Jeśli któryś krój nie przejdzie, zamień na krój o podobnym charakterze i zapisz decyzję w tym pliku.
- Fonty przez Fonts API Astro 6: self-hosting, subset latin-ext, `font-display: swap`, preload tylko pliku nagłówka hero.
- Skala (px): 14, 16, 18, 21, 28, 36, 48, 64. H1 mobile 36–40, desktop 64. Tekst: 17 mobile, 18 desktop.
- Długość linii tekstu ≤ 68 znaków.
- Nie: akcentowanie jednego słowa w nagłówku kolorem lub kursywą, etykiety kapitalikami nad nagłówkami, strzałka „→” w przyciskach.

---

## Układ

- Siatka: 4 kolumny mobile, 12 desktop. Marginesy 20 / 32 / 64 px.
- Tekst wyrównany do lewej. Zdjęcia duże, często do krawędzi ekranu.
- Promienie według roli: zdjęcia 0 (jak odbitka), przyciski pigułka, pola formularza 6 px.
- Bez cieni. Hierarchię budują skala, odstęp i kolor tła sekcji.
- Numeracja tylko w „Jak pracujemy”, bo to prawdziwa sekwencja.
- Pasek dowodów to jedna linia zwykłego tekstu, nie bloki z wielkimi liczbami.

### Hero, desktop

```
┌──────────────────────────────────────────────────────────────────────┐
│ Forma Zieleni   Realizacje Usługi Cennik Jak pracujemy  (Zacznij projekt) │
├──────────────────────────────────────────────────────────────────────┤
│░░░░░░░░░░░░░░░░░░ ZDJĘCIE REALIZACJI NA CAŁĄ SZEROKOŚĆ ░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░╭── Miscanthus sinensis ░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░╭──────╯   miskant chiński ░░░░░░░░░░░░░│
│▓▓ scrim ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  linia planu rysowana raz ░░░░░░░░░░░░│
│▓ Ogród zaprojektowany pod to,  ╰───────╮ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│▓ jak naprawdę żyjesz                   ╰── Hydrangea paniculata ░░░░░│
│▓ Podtytuł: obszar + koncepcja od {{cena}} zł ░░░░░░░░░░░░░░░░░░░░░░░░│
│▓ (Sprawdź, jaki ogród do Ciebie pasuje)   Zobacz realizacje ░░░░░░░░│
│▓ Do 7 pytań, około minuty.  Ocena Google {{4,8}} ({{N}} opinii) ░░░░░│
└──────────────────────────────────────────────────────────────────────┘
```

### Strona główna, mobile

```
┌────────────────────────┐
│ Forma Zieleni   ☎  ≡   │  sticky, ≤ 64 px
├────────────────────────┤
│ ZDJĘCIE (4:5)          │  element LCP
│  ╭─ etykieta rośliny   │
│ H1 (2–3 linie)         │
│ podtytuł               │
│ (Sprawdź, jaki ogród…) │  CTA rudbekia, pełna szerokość
│ Zobacz realizacje      │
│ ocena Google           │
├────────────────────────┤
│ pasek dowodów (1 linia)│
│ Usługi ×3 (zdjęcie+cena)│
│ Realizacje ×3 + przed/po│
│ Jak pracujemy 1–5      │
│ Pakiety ×3 (przewijane)│
│ Opinie ×3              │
│ Kto projektuje         │
│ FAQ <details>          │
│ Formularz: krok 1      │
│ Stopka                 │
├────────────────────────┤
│ [ Zadzwoń ][ Quiz 60 s ]│  sticky dół, po hero
└────────────────────────┘
```

---

## Ruch

- **Jeden zaplanowany moment:** rysowanie linii planu w hero (`stroke-dashoffset`, 1200 ms, ease-out), start dopiero po załadowaniu obrazu LCP. Przy `prefers-reduced-motion: reduce` linia i etykiety widoczne od razu.
- **Ruch jako odpowiedź na akcję:** zmiana kroku quizu i formularza (150–200 ms), suwak przed/po, rozwijanie FAQ.
- **Przejścia między stronami:** natywne CSS View Transitions jako progresywne ulepszenie, 0 KB JS.
- **Nie:** pojawianie się każdej sekcji przy przewijaniu, parallax, karuzele przewijające się same, animowane liczniki.

---

## Fotografia (decyduje o wszystkim)

Wytyczne dla fotografa:
- Równe światło: pochmurny dzień albo godzina po wschodzie / przed zachodem.
- Seria dla każdej realizacji: plan szeroki, średni, detale roślin, ogród w użyciu (za zgodą), zdjęcie „przed” i „po” z tej samej perspektywy (statyw, zaznaczone miejsce, ta sama ogniskowa).
- Minimum 2400 px dłuższy bok, sRGB, bez filtrów.
- Na realizację: 1 kadr poziomy 3:2 (hero, OG), 1 pionowy 4:5 (mobile, social), 6–12 do galerii.
- Alt tekst: co widać i jakie rośliny, np. „Taras z deskami przy rabacie z miskantem i hortensją bukietową”.
- Nie: zdjęcia stockowe udające realizacje, wizualizacje podpisane jak zdjęcia.

---

## Komponenty

| Komponent | Uwagi |
|---|---|
| `Button` | primary: tło `--rudbekia`, tekst `--igliwie`; secondary: obrys `--mech`; tekstowy: podkreślenie. Cel dotyku ≥ 44×44 px |
| `Photo` | jedyny sposób wstawiania zdjęć: `srcset` z Sanity, `width`/`height`, LQIP w tle, `alt` wymagany |
| `PlantLabel` | kropka na zdjęciu + linia `--kreska` + nazwa łacińska (italic) i polska; pozycja w % względem zdjęcia |
| `HeroPlan` | SVG z linią planu i 3× `PlantLabel`; animacja opisana w „Ruch” |
| `BeforeAfter` | web component, `role="slider"`, klawiatura i dotyk |
| `ProcessStep` | numer, nazwa, czas trwania, co klient dostaje |
| `PackageColumn` | 3 kolumny; polecany: tło `--szalwia` i etykieta „Polecany” |
| `ReviewQuote` | treść, imię + inicjał, data, gwiazdki jako tekst liczbowy, link do Google |
| `ProofLine` | jedna linia tekstu z faktami; brakujący fakt znika, nie zostawia pustego miejsca |
| `StickyMobileBar` | „Zadzwoń”, „Quiz 60 s”; chowa się przy formularzu i otwartej klawiaturze |
| `FormStep`, `ProgressBar` | „Krok 2 z 3”, przyciski „Wstecz” i „Dalej” |
| `FaqItem` | natywny `<details>` |
| `SaveButton` (v2) | „Zapisz/Zapisano”, `aria-pressed` |
| `PlantCard`, `FilterBar` (v2) | karta rośliny z nazwą łacińską italic; filtry jako linki, bez przeładowania z JS |
| `ScopeBuilder`, `EligibilityChecker` (v2) | kroki jak `FormStep`, wynik z dopiskiem „widełki, nie oferta” |
| `ProjectTimeline`, `PinnedComment`, `ApprovalDialog` (v2) | portal: oś etapów, pinezki uwag w % obrazu, natywny `<dialog>` |
| `RealizationMap` (v2) | SVG ≤ 60 KB, punkty jako przyciski |
| `SearchDialog`, `AssistantPanel` (v2) | ładowane po otwarciu; oznaczenie „Asystent AI” |

---

## Dostępność (WCAG 2.2 AA)

- Kontrasty z tabeli kolorów; tekst na zdjęciach tylko na scrimie.
- Widoczny focus na każdym elemencie interaktywnym.
- Każde pole z `<label>`; błędy powiązane przez `aria-describedby` i ogłaszane przez `aria-live="polite"`.
- Pełna obsługa klawiatury: quiz, formularz, suwak, filtry, dialog galerii.
- `lang="pl"`, sensowna kolejność nagłówków, jeden H1 na stronę.
- Szacunek dla `prefers-reduced-motion`.

---

## Samokontrola przed akceptacją każdej strony

1. Czy ta strona mogłaby należeć do dowolnej firmy z dowolnej branży? Jeśli tak, wróć do zdjęć i etykiet roślin.
2. Czy jest więcej niż jeden „głośny” element? Zostaw jeden.
3. Czy każdy napis pomaga klientowi zrozumieć ofertę albo wykonać krok? Usuń resztę.
4. Zdejmij jeden element dekoracyjny i sprawdź, czy strona straciła coś ważnego.
