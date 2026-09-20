# KANON — aplikacja mobilna Forma Zieleni

**Źródło prawdy UI:** makieta Vite w `mobile-app` (podgląd w ramce telefonu) oraz APK **0.2.1** (WebView ładujący ten sam bundel).

**Zakaz:** wymyślania nowych ekranów, zmiany layoutu Garden OS / Start / Projekt, zmiany kolorów brandu (igliwie `#24392E`, mech, szałwia, rudbekia, kamień), usuwania flow lead→wizyta→projekt→płatności→Garden OS.

## Brand (tokeny)
- igliwie / needle: `#24392E`
- mech / moss, szałwia / sage, rudbekia / amber, kamień / stone, kreska / line
- Copy: wyłącznie PL

## Ekrany kanoniczne (patrz `mobile-screens/`)
1. Portal / start (mobile)
2. Projekt (timeline, pliki, poprawki — ukryte w Garden OS)
3. Garden OS: Pogoda → Gleba → Sugestie opieki → kalendarz / cykl 12 mies. → rośliny → artykuły (bez zbędnego PageHeader)
4. Logowanie magic link (3 konta demo)

## Stack
- UI makiety: Vite + React + TS + Tailwind (`mobile-app`)
- APK: Expo shell + WebView → `assets/www` (IIFE, `file:///android_asset/www/index.html`)
- API: Cloudflare Worker + D1 (`api/`), lokalnie `:8787`
- Persist demo Vite: `fz-mobile-v7` (gdy mock)

## Dokumenty obowiązkowe
- `SCHEMA-MOBILE.md` — model danych
- `WORKFLOW-MOBILE.md` — ścieżki 3 ról
- `PRODUKCJA.md` / `CHECKPOINT-MOBILE-PROD.md` — mapa produkcji
- `links/APK-0.2.1.txt` — instalacja

## Reguła dla ChatGPT / Chatty
Każda odpowiedź o UI lub flow musi cytować ten kanon albo załączony screen. Jeśli czegoś nie ma w kanonie — **zapytaj**, nie zgaduj.
