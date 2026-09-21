# packages/domain

Warstwa reguł i modelu domenowego Forma Zieleni.

## Odpowiedzialność

- reguły biznesowe niezależne od UI i frameworków,
- egzekucja zasady **DATA → RULES → DOMAIN → AI**,
- AI nie jest źródłem prawdy — działa wyłącznie nad danymi i regułami domenowymi.

## Status

Lead capture and qualification rules are implemented in `src/lead.ts`. Persistence, other CRM modules and UI remain open.
