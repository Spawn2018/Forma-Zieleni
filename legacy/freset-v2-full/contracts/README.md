# ETAP B — API Contract

Źródłem prawdy jest `openapi.yaml` (OpenAPI 3.0.4). Zmiana endpointu zaczyna się od kontraktu, potem walidacja, test zgodności providera, regeneracja klientów i dopiero implementacja.

## Zasady
- `/v1` w URL; wersja dokumentu API niezależna od wersji OAS.
- Każda mutacja biznesowa przyjmuje `Idempotency-Key`.
- Błędy mają jeden envelope `Error` + `request_id`.
- Listy używają cursor pagination.
- Autoryzacja obiektowa (BOLA) jest obowiązkowa dla każdego `{id}`.
- Upload plików: intent + prywatny storage; API nie przyjmuje base64 dużych plików.
- Webhook: podpis, deduplikacja/replay protection, idempotencja.

## Generowanie
Docelowo TypeScript: `typescript-fetch`; SketchUp: cienki klient Ruby utrzymywany względem tego samego kontraktu. `scripts/validate-openapi.py` blokuje oczywiste rozjazdy.
