# Forma Zieleni — Agent Instructions

1. Czytaj najpierw `docs/00-MASTER-PLAN.md`, `docs/25-MASTER-CONTEXT-2026-09-20.md`, `docs/26-DECISION-REGISTER.md`.
2. Kolejność: A Security/Infra → B OpenAPI/clients → C Core → D products. Nie cofaj do legacy F0–F33.
3. OpenAPI jest source of truth dla API. Nie duplikuj DTO.
4. Modular monolith; event/outbox; idempotency; authorization per object; private files.
5. Cloudflare-only ingress/private origin jest hard requirement przed production.
6. Nie wkładaj prod secrets/client data do agentów/background environments.
7. Google/Meta są adapterami. Sebastian Google = test; Agnieszka prod via OAuth; no hard-coded account IDs.
8. Każda zmiana architektury/funkcji/roadmapy MUSI w tym samym change-set zaktualizować: dotknięte docs + Decision Register, a gdy zmienia całość także MASTER/CONTEXT.
9. Jeśli kod i dokumentacja się różnią, zatrzymaj zmianę i zsynchronizuj oba.
10. ETAP D nie może tworzyć własnej domeny przed Gate C.
