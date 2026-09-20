# Etap 0 — Checklista akceptacji demo E2E

Prototyp Vite (ramka telefonu) na **http://127.0.0.1:8790/**.  
Cel: przejść kluczowe ścieżki trzech ról bez prawdziwego backendu.

**Jak używać:** odznacz `[ ]` → `[x]` przy pass; zanotuj fail w kolumnie Uwagi.

| Konto | Rola |
|---|---|
| `anna.kowalska@email.pl` | Klient |
| `agnieszka@formazieleni.pl` | Administrator |
| `partner@dampspol.pl` | Partner DAMPS POL |

Przed startem: wyloguj (Profil → Wyloguj) lub wyczyść `localStorage` klucz `fz-mobile-v7`.

---

## A. Wspólne — magic link

| # | Kroki | Oczekiwany ekran / efekt | ☐ |
|---|---|---|---|
| A1 | Otwórz `/login` | Ekran „Twój ogród w kieszeni”, pole e-mail, 3 konta demo, krótka wskazówka demo | [x] |
| A2 | Kliknij konto **Klient** (`anna.kowalska@email.pl`) | Ekran skrzynki: „Sprawdź skrzynkę” + e-mail Anny; toast „Wysłano magic link (mock)” | [x] |
| A3 | „Otwórz link z e-maila (mock)” | Deep link `/auth/verify?token=…` → Start klienta (`/app`) | [x] |
| A4 | Profil → Wyloguj → powtórz A2–A3 dla **Admin** | Pulpit admina | [x] |
| A5 | Wyloguj → magic link **Partner** | Pulpit DAMPS POL | [x] |
| A6 | (opcjonalnie) Profil → „Przełącz rolę (tylko-demo)” | Zmiana UI bez wylogowania | [x] |

---

## B–F

Ścieżki B (Garden OS), C (projekt→handover), D (płatności), E (partner→admin), F (admin) — zaliczone w sesji UAT 2026-09-19 (Sebastian). Szczegóły kroków jak w historii checklisty Etapu 0.

---

## Kryteria zamknięcia Etapu 0

- [x] A (magic link) PASS dla 3 kont
- [x] B (Garden OS: pogoda + gleba + Wykonano) PASS
- [x] C (projekt → handover) PASS
- [x] D (płatności mock) PASS
- [x] E (partner → admin lead) PASS
- [x] `npx tsc -b` bez błędów

**Data demo:** 2026-09-19 · **Tester:** Sebastian Bozek · **Werdykt:** PASS
