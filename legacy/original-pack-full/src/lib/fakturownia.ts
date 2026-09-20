// Klient API Fakturowni. Token: Ustawienia → Ustawienia konta → Integracja → Kod autoryzacyjny API.
// Idempotencja przez pole oid = identyfikator płatności: ta sama płatność nigdy nie da drugiej faktury.
export interface FakturowniaEnv { FAKTUROWNIA_DOMAIN?: string; FAKTUROWNIA_TOKEN?: string }

export interface InvoiceInput {
  paymentId: string;
  kind: 'vat' | 'proforma';
  buyer: { type: 'b2c' | 'b2b'; name: string; email?: string; taxNo?: string; city?: string; postCode?: string; street?: string };
  positions: { name: string; totalPriceGross: number; tax: number | 'zw'; quantity?: number }[];
  paymentToDays?: number;
}

export interface InvoiceResult { id: string; number: string | null; created: boolean }

const api = (env: FakturowniaEnv, path: string) => `https://${env.FAKTUROWNIA_DOMAIN}.fakturownia.pl${path}`;

export function isEnabled(env: FakturowniaEnv): boolean {
  return Boolean(env.FAKTUROWNIA_DOMAIN && env.FAKTUROWNIA_TOKEN);
}

async function call<T>(env: FakturowniaEnv, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(api(env, path), {
    ...init,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`Fakturownia ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return (await res.json()) as T;
}

/** Zwraca istniejącą fakturę dla płatności albo null. */
export async function findByPayment(env: FakturowniaEnv, paymentId: string): Promise<InvoiceResult | null> {
  const list = await call<{ id: number; number: string | null }[]>(
    env,
    `/invoices.json?oid=${encodeURIComponent(paymentId)}&api_token=${env.FAKTUROWNIA_TOKEN}`,
  );
  const first = Array.isArray(list) ? list[0] : undefined;
  return first ? { id: String(first.id), number: first.number ?? null, created: false } : null;
}

/** Tworzy fakturę tylko wtedy, gdy dla tej płatności jeszcze jej nie ma. */
export async function createForPayment(env: FakturowniaEnv, input: InvoiceInput): Promise<InvoiceResult> {
  if (!isEnabled(env)) throw new Error('Brak FAKTUROWNIA_DOMAIN lub FAKTUROWNIA_TOKEN');
  const existing = await findByPayment(env, input.paymentId);
  if (existing) return existing;

  if (input.buyer.type === 'b2b' && !input.buyer.taxNo) throw new Error('Faktura B2B wymaga NIP (KSeF)');

  const today = new Date().toISOString().slice(0, 10);
  const body = {
    api_token: env.FAKTUROWNIA_TOKEN,
    invoice: {
      kind: input.kind,
      oid: input.paymentId,
      issue_date: today,
      sell_date: today,
      payment_to_kind: input.paymentToDays ?? 7,
      buyer_name: input.buyer.name,
      buyer_email: input.buyer.email,
      buyer_tax_no: input.buyer.taxNo,
      buyer_city: input.buyer.city,
      buyer_post_code: input.buyer.postCode,
      buyer_street: input.buyer.street,
      positions: input.positions.map((p) => ({
        name: p.name,
        tax: p.tax,
        total_price_gross: p.totalPriceGross,
        quantity: p.quantity ?? 1,
      })),
    },
  };
  const created = await call<{ id: number; number: string | null }>(env, '/invoices.json', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return { id: String(created.id), number: created.number ?? null, created: true };
}

/** Wysyła fakturę e-mailem na adres z pola buyer_email. */
export async function sendByEmail(env: FakturowniaEnv, invoiceId: string): Promise<void> {
  await call(env, `/invoices/${invoiceId}/send_by_email.json?api_token=${env.FAKTUROWNIA_TOKEN}`, { method: 'POST' });
}

/** Link do PDF-a (do panelu; nie wysyłamy go klientom bez potrzeby). */
export const pdfUrl = (env: FakturowniaEnv, invoiceId: string): string =>
  api(env, `/invoices/${invoiceId}.pdf?api_token=${env.FAKTUROWNIA_TOKEN}`);
