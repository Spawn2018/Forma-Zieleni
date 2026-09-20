# v9: SketchUp, V-Ray i AutoCAD w procesie sprzedaży i w portalu

Dowody E43–E44 w `01-SPEC.md` §4. Zasada: ciężkie pliki zostają w narzędziach producenta, a na stronie i w portalu trzymamy tylko lekkie pochodne.

## 1. Co powstaje w jakim programie

| Etap | Program | Wynik | Gdzie trafia |
|---|---|---|---|
| Inwentaryzacja i podkład | AutoCAD | DWG z granicami, budynkiem, poziomami, przyłączami | archiwum pracowni, nie do klienta |
| Koncepcja 3D | SketchUp | model `.skp`, sceny widokowe | Trimble Connect (link do przeglądania) |
| Wizualizacje | V-Ray for SketchUp | rendery, panoramy 360, krótka animacja | portal jako pliki lekkie |
| Dokumentacja | AutoCAD lub LayOut | plan nasadzeń, plan nawierzchni, zestawienia, PDF | portal jako PDF |
| Lista roślin | AutoCAD (zestawienie z bloków) lub SketchUp | CSV z nazwami, ilościami, rozstawą | atlas roślin i lista zakupów (M31) |

## 2. Co dostaje klient i kiedy

1. **Po wizycie:** moodboard i szkic koncepcji (JPG, znak wodny).
2. **Koncepcja:** 3–5 renderów, 1 panorama 360, link do modelu w SketchUp do obejrzenia w przeglądarce [E43].
3. **Po akceptacji:** PDF planu nasadzeń i nawierzchni, lista roślin, zestawienie materiałów.
4. **Dla wykonawcy:** DWG i PDF w skali, udostępniane przez portal z rolą `contractor` (tabela `project_access`).

## 3. Model 3D dla klienta bez instalowania programu [E43]

SketchUp 2026 ma pasek współpracy: model zapisany w Trimble Connect można udostępnić prywatnym zaproszeniem albo publicznym linkiem, który otwiera się w przeglądarkowej przeglądarce SketchUp. Oglądający nawigują, mierzą, zostawiają komentarze i widzą aktualizacje na żywo. Każda subskrypcja SketchUp daje dostęp do Trimble Connect z nieograniczoną przestrzenią.

Zasady u nas:
- link zapisujemy w `design_assets` jako `skp_link` i pokazujemy w portalu przy właściwej wersji koncepcji,
- link prywatny dla klienta, publiczny tylko dla realizacji z podpisaną zgodą,
- komentarze z SketchUp zostają w modelu, ale **decyzje** przenosimy do portalu, żeby jedna rzecz miała jedno miejsce.

## 4. Wizualizacje z V-Ray [E44]

V-Ray 7 dla SketchUp (Update 2) działa z SketchUp 2026, ma kamery VR w trybie stereo do treści 360, bibliotekę Chaos Cosmos, renderowanie w chmurze i narzędzia AI do materiałów i poprawy obrazu (beta).

Ustalenia produkcyjne:
- **Presety:** „koncepcja” (szybki, 1600 px), „prezentacja” (2560 px), „druk” (3500 px). Trzy presety, nie więcej.
- **Panorama 360** z kamery stereo lub sferycznej: w portalu pokazujemy ją w lekkiej przeglądarce (np. Pannellum), a nie jako ciężki plik do pobrania.
- **Znak wodny** na każdym renderze przed akceptacją koncepcji; po akceptacji wersja bez znaku.
- **Treści AI z V-Ray** (poprawa obrazu, generowanie materiałów) oznaczamy w `ai_content_log`, bo to treść zmodyfikowana przez AI [E32].
- **Rendery na stronie:** zawsze podpisane „wizualizacja”, nigdy w galerii realizacji obok zdjęć [E32].

## 5. Nazewnictwo i wersje

`RRRR-MM_gmina_nazwisko_typ_wersja`, na przykład `2026-09_zukowo_kowalski_render_v2.jpg`.
- wersja rośnie przy każdej prezentacji klientowi,
- w portalu widać tylko wersje z `visible_to_client = 1`,
- stare wersje zostają w bazie do porównania (P3 z `16-CO-BYM-ZMIENIL.md`).

## 6. Rozmiary i koszty

| Plik | Limit u nas | Gdzie |
|---|---|---|
| Render JPG | ≤ 600 kB (2560 px, jakość 80) | R2 |
| Panorama | ≤ 4 MB | R2 |
| Animacja | ≤ 20 MB albo link do YouTube jako niepublicznego | R2 lub YouTube |
| PDF planu | ≤ 10 MB | R2 |
| `.skp`, `.dwg` | bez limitu | Trimble Connect i dysk pracowni, do portalu tylko link |

To trzyma nas w darmowych 10 GB R2 [E37] i nie zmusza klienta do pobierania setek megabajtów.

## 7. Automatyzacje

| ID | Wyzwalacz | Działanie |
|---|---|---|
| A35 | Nowa wersja renderu lub planu w `design_assets` | Wpis do outboxu: e-mail do klienta „nowa wersja koncepcji”, wpis w portalu, termin odpowiedzi |
| A36 | Panorama oznaczona jako publiczna | Szkic wpisu na stronę realizacji i do mediów społecznościowych |
| A37 | Lista roślin CSV wgrana | Uzupełnienie listy zakupów (M31) i dopasowanie do atlasu po nazwie łacińskiej |
| A38 | Projekt odebrany | Zadanie „zrób zdjęcia po realizacji i porównaj z renderem” do case study [E7] |

## 8. Czego nie robić

- Nie wysyłać klientowi plików `.skp` ani `.dwg` przed pełną zapłatą, chyba że umowa mówi inaczej.
- Nie publikować renderów jako zdjęć realizacji.
- Nie trzymać ciężkich plików źródłowych w R2.
- Nie robić więcej niż trzech wersji koncepcji bez zamknięcia rundy poprawek (M13).
