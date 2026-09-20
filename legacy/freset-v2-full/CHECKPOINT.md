# CHECKPOINT — CURRENT

**2026-09-20: F-RESET obowiązuje.** Legacy v7–v14/F0–F33 poniżej jest historią, nie kolejką wdrożenia.


## F-RESET v2 — 2026-09-20
- [x] Ponowny pełny reset A→B→C→D wykonany.
- [x] Wszystkie dokumenty `.md` w `docs/` otrzymały jawny status F-RESET v2.
- [x] Dodano `30-F-RESET-EXECUTION-2026-09-20.md`.
- [x] Dodano `31-IMPLEMENTATION-STATUS-MATRIX.md` jako kanoniczny stan implementacji.
- [x] ADR-026 utrwala model statusów i zakaz sterowania przez legacy.
- [x] OpenAPI i audyt dokumentacji ponownie walidowane.
- [ ] Następna praca wykonawcza: ETAP A Security + Infrastructure Lab; Gate B i C pozostają otwarte.

## Current
- [x] Ustalenia z dwóch czatów skonsolidowane do MASTER CONTEXT/Decision Register.
- [~] ETAP B: OpenAPI 3.0.4 bazowy gotowy; TS client i SketchUp Ruby adapter są scaffoldami/partial. Gate B nadal otwarty.
- [x] ETAP C: addytywny fundament DB (`0014_core_domain_reset.sql`).
- [x] Dokumentacja skonsolidowana po audycie pełnotekstowym; stare warianty techniczne są jawnie oznaczone jako LEGACY/CANDIDATE i nie są decyzjami.
- [x] Google: konto Sebastiana testowe; docelowo Agnieszka OAuth; multi-account-ready.
- [ ] ETAP A: realna infrastruktura/security lab — hosting nadal do wyboru.
- [ ] ETAP B Gate: CI generation/lint/breaking-change/provider-contract/BOLA.
- [ ] ETAP C: implementacja serwera Auth→CRM→Sales→Capacity→Projects→Offers→Payments→Files→Events→Automation.
- [ ] ETAP D: zamrożony do Gate C.

## Reguła kolejnych zmian
Każda zmiana projektu aktualizuje dokumentację w tym samym change-set. Decyzje z czatu nie mogą pozostać wyłącznie w czacie.

---

# LEGACY CHECKPOINT (historyczny)
# CHECKPOINT

Wznowienie: „Kontynuuj od CHECKPOINT.md” + ZIP.

## Zadanie (v7, IX 2026)
Nowe obszary: redukcja nieobecności na konsultacjach, efekt gradientu celu, ustawienia domyślne, program poleceń (badania), wydajność 2026 (Speculation Rules, bfcache, INP), WCAG 2.2. Tryb oszczędny.

## Plan
- [x] S0. Postęp
- [x] S1. Research (4 obszary)
- [x] S2. docs/15-EFEKTYWNOSC.md (M43–M46, A30–A34)
- [x] S3. SPEC E39–E42 i F25, prompt F25, README
- [x] S4. ZIP + prezentacja

## Poprzednie części
K, P, V, C, R zakończone (docs 01–14, db 0001–0007, src/lib).

## Ostatni krok
Wszystkie kroki S0–S4 zakończone.

## v8 (17.09.2026)
- [x] docs/16-CO-BYM-ZMIENIL.md (W1–W6, S1–S7, K1–K6, U1–U6, B1–B10, P1–P9, top 10)
- [x] prompt F26, faza F26 w SPEC, README
- Następny krok: decyzje właściciela z §7 i 00-DANE.md

## v9 (17.09.2026)
- [x] db/0008_reliability.sql (outbox, idempotencja, duplikaty, flagi, waitlist, role, płatności etapami, design_assets) + test migracji 0001–0008
- [x] docs/17-CAD-3D.md (SketchUp, V-Ray, AutoCAD), E43–E44, prompt F27, portal M13a, dwie ścieżki w COPY
- Następny krok: decyzje z 16-CO-BYM-ZMIENIL §7 i 00-DANE.md

## v10 (19.09.2026)
- [x] sketchup-plugin/ (rośliny do CSV, eksport scen, wysyłka do portalu)
- [x] docs/18-SKETCHUP-CLAUDE.md, db/0009_studio.sql (obmiar, puls, RODO), E45, prompt F28
- Uwaga: składni Ruby nie dało się sprawdzić (brak ruby w kontenerze) — przetestuj wtyczkę w SketchUp

## v11 (19.09.2026)
- [x] docs/19-PRACOWNIA-IT.md (DORA, Land F/X i Vectorworks, czas i marża, WIP, sprzedaż z 3D)
- [x] db/0010_studio_ops.sql + test migracji 0001–0010, E46–E47, prompt F29
- Następny krok: stawka godzinowa pracowni i limit koncepcji w toku do 00-DANE.md

## v12 (w toku, 19.09.2026)
Zadanie: aplikacja mobilna iOS i Android dla klienta z zakładką GARDEN OS + lista dalszych usprawnień.
- [x] M0. Postęp
- [ ] M1. Research: Expo/EAS 2026, wymogi App Store i Google Play 2026 → docs/_research-mobile-2026-09-19.md
- [ ] M2. docs/20-APLIKACJA-GARDEN-OS.md
- [ ] M3. db/0011_app.sql + test
- [ ] M4. Prompty F30–F31, E48+, README
- [ ] M5. ZIP + prezentacja
- [x] M1–M5: docs/20-APLIKACJA-GARDEN-OS.md, db/0011_app.sql (test 0001–0011), E48–E49, prompty F30–F31, README
- Następny krok: konta deweloperskie (Apple, Google), status przedsiębiorcy DSA, reguły pielęgnacji przy gatunkach w atlasie

## v13 (19.09.2026)
- [x] docs/21-UPROSZCZENIE.md (plan 6 tygodni, ochrona marży, umowa i prawa autorskie, przepustowość, ryzyko jednej osoby, 5 materiałów z projektu)
- [x] db/0012_scope.sql + test migracji 0001–0012, prompt F32
- Następny krok: wzór umowy u prawnika, normy godzinowe z time_entries, biblioteka komponentów SketchUp

## v14 (19.09.2026)
- [x] docs/22-JEDEN-PROJEKTANT.md (sufit przychodu, cena jako regulator, terminy z kalendarza, tryb awaryjny)
- [x] db/0013_capacity.sql + test migracji 0001–0013, prompt F33, korekty w 00-DANE i 06-REKLAMY
- Następny krok: godziny tygodniowo i tygodnie pracy w roku, partner na przeciążenie, normy po 4–6 projektach
