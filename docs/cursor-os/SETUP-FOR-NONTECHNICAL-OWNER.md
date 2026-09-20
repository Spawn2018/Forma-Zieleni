# Setup — instrukcja dla właściciela

## A. Pierwsze uruchomienie
1. Rozpakuj paczkę do `D:\Forma-zieleni` tak, aby foldery `.cursor`, `docs`, `apps`, `packages` były bezpośrednio w tym katalogu.
2. Otwórz Cursor.
3. W Cursor wybierz **File -> Open Folder** i otwórz `D:\Forma-zieleni`.
4. Jeżeli Cursor zapyta, czy ufasz temu workspace, potwierdź tylko jeśli ścieżka to Twoje repo Forma Zieleni.
5. Otwórz Agent (`Ctrl+I`).
6. Nie instaluj żadnych sekretów ani nie wklejaj haseł do czatu.

## B. Pierwsza wiadomość do Cursor Agent
Wklej dokładnie:

`Przeczytaj START-HERE-CURSOR.md oraz aktywną regułę .cursor/rules/00-forma-zieleni-core.mdc. Następnie wykonaj read-only bootstrap audit repozytorium. Nie implementuj aplikacji, nie wybieraj frameworka, hostingu, DB, ORM ani storage. Sprawdź spójność aktywnego repo z kanonem, wskaż konflikty i zaproponuj pierwszy najmniejszy bezpieczny krok. Nie commituj i nie pushuj.`

Poczekaj na raport.

## C. Grok Bot — opcjonalnie
Jeżeli Twój plan Cursor pokazuje Grok Bot, zaloguj się tym samym kontem Cursor w aplikacji/obszarze Grok Bot. Logowania do innych serwisów wykonuj samodzielnie, gdy Bot odda Ci kontrolę. Nie podawaj mu haseł w wiadomości.

Na start utwórz tylko rolę Researcher/Reviewer; nie dawaj jej praw do produkcji, DNS, płatności ani kasowania danych.

## D. Cursor Projects — po bootstrap audicie
Jeżeli w Cursor widzisz **Projects**, utwórz Project `Forma Zieleni`, wybierz repozytorium `Forma-Zieleni` i użyj go do wieloetapowych prac. Coordinator ma delegować pracę, ale obowiązuje go kanon z repo.

## E. Cursor CLI / My Machines — później, gdy potrzebne
CLI nie jest wymagane do pierwszego startu. Gdy będziemy chcieli uruchamiać agentów na Twoim komputerze, zainstalujemy Cursor CLI i skonfigurujemy My Machines świadomie. Nie rób tego teraz na ślepo.
