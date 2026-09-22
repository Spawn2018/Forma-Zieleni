# packages/domain

Warstwa reguł i modelu domenowego Forma Zieleni.

## Odpowiedzialność

- reguły biznesowe niezależne od UI i frameworków,
- egzekucja zasady **DATA → RULES → DOMAIN → AI**,
- AI nie jest źródłem prawdy — działa wyłącznie nad danymi i regułami domenowymi.

## Status

Lead capture and qualification rules are implemented in `src/lead.ts`.
Opportunity creation from a qualified Lead is in `src/opportunity.ts`.
Persistence and UI for later CRM stages remain open.
