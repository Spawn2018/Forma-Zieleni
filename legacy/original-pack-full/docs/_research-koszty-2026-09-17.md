# Notatki: koszty i narzędzia (17.09.2026, C1)

1. **Fakturownia i KSeF.** Integracja z KSeF 2.0 jest dostępna bezpłatnie w każdym abonamencie: wysyłka faktur sprzedażowych i pobieranie kosztowych bez logowania do systemu MF.
   https://fakturownia.pl/komunikaty/krajowy-system-e-faktur-czym-jest-i-jak-wyglada-integracja-z-fakturownia ; https://fakturownia.pl/ksef-dla-biur
2. **API Fakturowni.** Token z „Ustawienia → Ustawienia konta → Integracja → Kod autoryzacyjny API”. Endpointy: `POST /invoices.json` (tworzenie), `GET /invoices/{id}.json`, `GET /invoices/{id}.pdf`, `POST /invoices/{id}/send_by_email.json`, wyszukiwanie po zewnętrznym identyfikatorze `oid`. Oficjalne repozytorium dokumentacji: github.com/fakturownia/API.
   https://fakturownia.pl/api ; https://github.com/fakturownia/API
3. **Darmowy plan Cloudflare (stan 2026).** Workers: 100 000 żądań dziennie, limit CPU na żądanie i rozmiar skryptu. R2: 10 GB, 1 mln operacji klasy A i 10 mln klasy B miesięcznie, bez opłat za ruch wychodzący. Pages: 500 buildów miesięcznie. CDN, SSL i ochrona DDoS bez opłat.
   https://costbench.com/software/cdn-edge/cloudflare/free-plan/ ; https://eastondev.com/blog/en/posts/dev/20260526-cloudflare-free-limits/
4. **Limity D1, Turnstile, Web Analytics, Access** – nie sprawdzone w tym czacie, oznaczone w dokumencie jako [wiedza] do potwierdzenia w cennikach Cloudflare.
