# packages/validation

Współdzielone schematy i walidacja wejścia/wyjścia.

## Odpowiedzialność

- walidacja payloadów zgodnie z kontraktem API,
- ponowne użycie reguł walidacji tam, gdzie jest to bezpieczne (UI + API),
- ostateczna weryfikacja zawsze po stronie serwera.

## Status

Lead capture validation is implemented without a third-party schema library. Replacing it is an implementation choice inside a later slice, not an open Gate A decision.
