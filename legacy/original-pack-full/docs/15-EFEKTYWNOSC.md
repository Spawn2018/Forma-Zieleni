# v7: skuteczność. Nowe funkcje oparte na badaniach

Dowody E39–E42 w `01-SPEC.md` §4. Źródła: `docs/_research-v7-2026-09-17.md`.

## 1. Mniej nieobecności na konsultacjach (M43) [E39]

Nieobecność na umówionej rozmowie albo wizycie to stracony slot i stracony lead. Badania z ochrony zdrowia dają trzy wnioski: przypomnienia działają (iloraz szans obecności 1,62; spadek nieobecności o ok. 25%), telefon od człowieka działa lepiej niż automat (13,6% wobec 17,3% nieobecności), a łatwe odwołanie jest tak samo ważne jak samo przypomnienie, bo zamienia ciche nieobecności w zwolnione terminy.

Wdrożenie:
1. Potwierdzenie od razu po rezerwacji (e-mail plus dodanie do kalendarza).
2. Przypomnienie 24 h wcześniej i drugie 2 h wcześniej, kanałem wybranym przez klienta.
3. W każdej wiadomości dwa przyciski: **Potwierdzam** i **Zmieniam termin**. Zmiana terminu w dwóch kliknięciach, bez kontaktu telefonicznego.
4. Odwołanie zwalnia termin i automatycznie proponuje go osobom z listy oczekujących.
5. Przy wizycie płatnej: zaliczka lub zasada odwołania do 24 h (decyzja właściciela).
6. Pomiar: `no_show_rate` przed i po, odsetek potwierdzeń, liczba zwolnionych terminów.

## 2. Postęp, który motywuje do końca (M44) [E40]

Ludzie przyspieszają, gdy widzą, że są blisko celu, a sztucznie „darowany” postęp zwiększa szansę dokończenia (34% wobec 19% w eksperymencie z kartami lojalnościowymi).

Wdrożenie, zawsze uczciwie:
- **Quiz:** pierwszy krok zaliczony przez sam wybór zdjęcia w hero, więc quiz startuje od stanu „1 z 7 gotowe”, bo ten wybór naprawdę jest odpowiedzią.
- **Formularz:** wybór typu projektu z hero przenosi się do `/wycena/` i pasek pokazuje realny postęp „krok 1 z 3 gotowy”.
- **Portal klienta:** oś etapów pokazuje, ile zostało do odbioru projektu, a nie tylko co się wydarzyło.
- **Program opinii:** „2 z 3 kroków za Tobą: projekt odebrany, zdjęcia zrobione, zostaje opinia”.
- Zakaz: fałszywy postęp, na przykład pasek startujący od 30% bez powodu.

## 3. Program poleceń oparty na danych (M45) [E41]

Badanie na ok. 10 tys. klientów banku: klienci z polecenia mają o 16–25% wyższą wartość życiową i o ok. 18% wolniejsze odejścia, a efekt zależy od segmentu, więc program ma być selektywny.

Wdrożenie:
1. Prosimy o polecenie tych klientów, którzy w ankiecie (M35) dali 4 lub 5, i to 30 dni po odbiorze.
2. Nagroda po stronie obu osób, na przykład przegląd ogrodu dla polecającego i rabat na konsultację dla nowego klienta (kwoty w `00-DANE.md`).
3. Kod polecenia trafia do `referrals`, a wartość umów z poleceń liczy widok `v_referrals_summary`.
4. Co kwartał sprawdzamy, czy klienci z poleceń rzeczywiście mają wyższą wartość niż reszta. Jeśli nie, zmieniamy segment, do którego kierujemy program, zamiast podnosić nagrodę.

## 4. Natychmiastowe przejścia między stronami (M46) [E42]

Speculation Rules pozwalają przeglądarce pobrać albo w całości przygotować następną stronę. Przy prerenderze LCP jest bliski zeru, CLS mniejszy, a INP lepszy. Obsługa: Chrome i Edge od 109, Firefox nie obsługuje, Safari za flagą, więc to ulepszenie dla części ruchu, nie zamiennik optymalizacji.

Wdrożenie:
- `prefetch` dla wszystkich linków wewnętrznych przy średniej gotowości,
- `prerender` tylko dla 3 najczęstszych ścieżek: `/realizacje/`, `/cennik/`, `/wycena/`,
- wykluczenia: `/panel/`, `/portal/`, `/api/`, linki z parametrami, wylogowanie,
- kod, który liczy wejście (analityka, zdarzenia), uruchamiamy dopiero po aktywacji strony, żeby prerender nie zawyżał statystyk,
- pomiar: LCP p75 przed i po wdrożeniu.

## 5. Automatyzacje

| ID | Wyzwalacz | Działanie |
|---|---|---|
| A30 | Rezerwacja terminu | Potwierdzenie + wpis do kalendarza |
| A31 | 24 h i 2 h przed terminem | Przypomnienie z przyciskami Potwierdzam i Zmieniam termin |
| A32 | Odwołanie terminu | Zwolnienie slotu i propozycja dla listy oczekujących |
| A33 | Ankieta z wynikiem 4–5 i 30 dni po odbiorze | Zaproszenie do programu poleceń z kodem |
| A34 | Kwartał | Raport: wartość klientów z poleceń wobec pozostałych |

## 6. KPI

| Metryka | Cel |
|---|---|
| Nieobecności na konsultacjach | pomiar 60 dni, potem cel −25% [E39] |
| Odsetek potwierdzeń terminu | ≥ 70% |
| Ukończenie quizu po zmianie paska postępu | test A/B, hipoteza H9 |
| Udział umów z poleceń | ≥ 20% umów w 12 miesięcy |
| LCP p75 po Speculation Rules | ≤ 1,2 s dla ruchu z Chrome i Edge |

## 7. Czego nie robić

- Nie udawać postępu, którego nie ma [E40].
- Nie wysyłać więcej niż dwóch przypomnień o jednym terminie.
- Nie nagradzać opinii; nagradzamy tylko polecenia [E12].
- Nie prerenderować stron, które zmieniają stan (płatności, wylogowanie, panel).
