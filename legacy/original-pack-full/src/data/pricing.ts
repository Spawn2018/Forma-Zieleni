// Widełki dla kreatora zakresu (M17) i kalkulatora (M3).
// Każda wartość '{{…}}' to decyzja właściciela. Dopóki zostaje, estimate() zwraca null
// (UI pokazuje „Wycena indywidualna”), a scripts/check-placeholders.mjs zatrzymuje build produkcyjny.
export const PRICE_FLOOR_PLN = 2500; // docs/00-DANE.md
export const PRICE_CEIL_PLN = 50000; // docs/00-DANE.md

export type Space = 'garden' | 'balcony_terrace' | 'flowerbed' | 'small_architecture' | 'estate_greenery' | 'public_space';
export type Scope = 'consultation' | 'concept' | 'comprehensive';
export type Zone = 'terrace' | 'lawn' | 'beds' | 'vegetables' | 'play' | 'pond_or_rain_garden' | 'privacy' | 'lighting' | 'irrigation';

type Value = number | `{{${string}}}`;
interface Rate { base: Value; perM2: Value }

const pair = (k: string): Rate => ({ base: `{{${k}_BAZA}}`, perM2: `{{${k}_ZA_M2}}` });

export const RATES: Record<Space, Partial<Record<Exclude<Scope, 'consultation'>, Rate>>> = {
  garden: { concept: pair('OGROD_KONCEPCJA'), comprehensive: pair('OGROD_KOMPLEKSOWY') },
  balcony_terrace: { concept: pair('BALKON_KONCEPCJA'), comprehensive: pair('BALKON_KOMPLEKSOWY') },
  flowerbed: { comprehensive: pair('RABATA') },
  small_architecture: { comprehensive: pair('MALA_ARCHITEKTURA') },
  estate_greenery: {}, // wycena indywidualna
  public_space: {}, // wycena indywidualna
};

export const CONSULTATION_PRICE: Value = '{{KONSULTACJA_CENA}}';
export const SPREAD: Value = '{{ROZPIETOSC_WIDELEK}}'; // np. 1.3 = górna granica o 30% wyżej

export const ZONE_SURCHARGE: Record<Zone, Value> = {
  terrace: '{{STREFA_TARAS}}', lawn: '{{STREFA_TRAWNIK}}', beds: '{{STREFA_RABATY}}',
  vegetables: '{{STREFA_WARZYWNIK}}', play: '{{STREFA_ZABAWA}}', pond_or_rain_garden: '{{STREFA_WODA}}',
  privacy: '{{STREFA_PRYWATNOSC}}', lighting: '{{STREFA_OSWIETLENIE}}', irrigation: '{{STREFA_NAWADNIANIE}}',
};

const num = (v: Value | undefined): number | null => (typeof v === 'number' ? v : null);
const clamp = (x: number) => Math.min(PRICE_CEIL_PLN, Math.max(PRICE_FLOOR_PLN, Math.round(x / 100) * 100));

export function estimate(space: Space, scope: Scope, areaM2: number, zones: Zone[] = []): { min: number; max: number } | null {
  if (scope === 'consultation') {
    const p = num(CONSULTATION_PRICE);
    return p === null ? null : { min: p, max: p };
  }
  const rate = RATES[space][scope];
  const base = num(rate?.base);
  const perM2 = num(rate?.perM2);
  const spread = num(SPREAD);
  if (base === null || perM2 === null || spread === null || !(areaM2 > 0)) return null;
  let sum = base + perM2 * areaM2;
  for (const z of zones) {
    const s = num(ZONE_SURCHARGE[z]);
    if (s === null) return null;
    sum += s;
  }
  return { min: clamp(sum), max: clamp(sum * spread) };
}
