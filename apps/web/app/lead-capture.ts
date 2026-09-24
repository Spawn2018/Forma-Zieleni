import { leadPaths } from '@forma-zieleni/api-client';

export type LeadCaptureBody = {
  source: 'www';
  name: string;
  phone: string;
  email?: string;
  locality?: string;
  siteAnalysisRequested: boolean;
};

export type LeadFormFields = {
  name: string;
  phone: string;
  email: string;
  locality: string;
  siteAnalysisRequested: boolean;
};

export type LeadCaptureView =
  | { state: 'form'; fields: LeadFormFields; errors: Record<string, string>; notice: string | null }
  | { state: 'unconfigured'; fields: LeadFormFields; errors: Record<string, string>; notice: string | null }
  | { state: 'accepted'; fields: LeadFormFields; errors: Record<string, string>; notice: string | null };

export type LeadCapturePostResult =
  | { ok: true; leadId: string }
  | { ok: false; reason: 'unconfigured' | 'invalid' | 'unavailable' | 'rejected'; errors: Record<string, string>; message: string };

const EMPTY_FIELDS: LeadFormFields = {
  name: '',
  phone: '',
  email: '',
  locality: '',
  siteAnalysisRequested: false,
};

export function emptyLeadForm(): LeadFormFields {
  return { ...EMPTY_FIELDS };
}

export function leadCaptureCopy() {
  return {
    title: 'Kontakt',
    intro: 'Wyślij zapytanie o projekt ogrodu. Trafia bezpośrednio do studia Forma Zieleni — bez drugiej bazy leadów.',
    nameLabel: 'Imię i nazwisko',
    phoneLabel: 'Telefon',
    emailLabel: 'E-mail (opcjonalnie)',
    localityLabel: 'Miejscowość działki (opcjonalnie)',
    siteAnalysisLabel: 'Proszę o wstępną analizę działki',
    submitLabel: 'Wyślij zapytanie',
    submittingLabel: 'Wysyłanie zapytania…',
    acceptedNotice: 'Zapytanie zostało przyjęte. Studio odpowie w kolejności zgłoszeń.',
    unconfiguredNotice: 'Formularz kontaktu nie jest podłączony do API.',
    unavailableNotice: 'Nie udało się wysłać zapytania. Spróbuj ponownie później.',
  };
}

export function parseLeadForm(form: FormData): LeadFormFields {
  return {
    name: stringField(form, 'name'),
    phone: stringField(form, 'phone'),
    email: stringField(form, 'email'),
    locality: stringField(form, 'locality'),
    siteAnalysisRequested: form.get('siteAnalysisRequested') === 'on' || form.get('siteAnalysisRequested') === 'true',
  };
}

export function buildLeadCaptureBody(fields: LeadFormFields): { ok: true; body: LeadCaptureBody } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const name = fields.name.trim();
  const phone = fields.phone.trim();
  const email = fields.email.trim();
  const locality = fields.locality.trim();
  if (!name || name.length > 120) errors.name = 'Podaj imię i nazwisko (do 120 znaków).';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 9 || digits.length > 15) errors.phone = 'Podaj numer telefonu (9–15 cyfr).';
  if (email) {
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Podaj poprawny adres e-mail albo zostaw pole puste.';
    }
  }
  if (locality && locality.length > 200) errors.locality = 'Miejscowość może mieć najwyżej 200 znaków.';
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  const body: LeadCaptureBody = {
    source: 'www',
    name,
    phone,
    siteAnalysisRequested: fields.siteAnalysisRequested === true,
  };
  if (email) body.email = email.toLowerCase();
  if (locality) body.locality = locality;
  return { ok: true, body };
}

export async function postLeadCapture(input: {
  origin: string | undefined;
  fields: LeadFormFields;
  idempotencyKey: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}): Promise<LeadCapturePostResult> {
  if (!input.origin) {
    return { ok: false, reason: 'unconfigured', errors: {}, message: leadCaptureCopy().unconfiguredNotice };
  }
  const built = buildLeadCaptureBody(input.fields);
  if (!built.ok) {
    return { ok: false, reason: 'invalid', errors: built.errors, message: 'Sprawdź pola formularza.' };
  }
  let base: URL;
  try {
    base = publicOrigin(input.origin);
  } catch {
    return { ok: false, reason: 'unconfigured', errors: {}, message: leadCaptureCopy().unconfiguredNotice };
  }
  const url = new URL(leadPaths.leads, base);
  if (url.origin !== base.origin) {
    return { ok: false, reason: 'unconfigured', errors: {}, message: leadCaptureCopy().unconfiguredNotice };
  }
  const fetchImpl = input.fetchImpl ?? globalThis.fetch;
  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'idempotency-key': input.idempotencyKey,
      },
      body: JSON.stringify(built.body),
      redirect: 'error',
      signal: AbortSignal.timeout(input.timeoutMs ?? 5000),
    });
  } catch {
    return { ok: false, reason: 'unavailable', errors: {}, message: leadCaptureCopy().unavailableNotice };
  }
  if (response.status === 201 || response.status === 200) {
    let leadId = '';
    try {
      const body = (await response.json()) as { id?: unknown };
      if (typeof body.id === 'string') leadId = body.id.trim();
    } catch {
      leadId = '';
    }
    if (!/^[a-z][a-z0-9]{15,63}$/.test(leadId) || /^(?:lead|id)\d+$/i.test(leadId)) {
      return { ok: false, reason: 'unavailable', errors: {}, message: leadCaptureCopy().unavailableNotice };
    }
    return { ok: true, leadId };
  }
  if (response.status === 400) {
    const errors = await fieldErrorsFromProblem(response);
    return { ok: false, reason: 'invalid', errors, message: 'Sprawdź pola formularza.' };
  }
  if (response.status === 429) {
    return { ok: false, reason: 'rejected', errors: {}, message: 'Zbyt wiele zapytań. Spróbuj ponownie za chwilę.' };
  }
  return { ok: false, reason: 'unavailable', errors: {}, message: leadCaptureCopy().unavailableNotice };
}

export function leadCaptureView(input: {
  originConfigured: boolean;
  fields?: LeadFormFields;
  result?: LeadCapturePostResult | null;
}): LeadCaptureView {
  const fields = input.fields ?? emptyLeadForm();
  if (!input.originConfigured) {
    return {
      state: 'unconfigured',
      fields,
      errors: {},
      notice: leadCaptureCopy().unconfiguredNotice,
    };
  }
  if (input.result?.ok) {
    return {
      state: 'accepted',
      fields: emptyLeadForm(),
      errors: {},
      notice: leadCaptureCopy().acceptedNotice,
    };
  }
  if (input.result && !input.result.ok) {
    return {
      state: 'form',
      fields,
      errors: input.result.errors,
      notice: input.result.message,
    };
  }
  return { state: 'form', fields, errors: {}, notice: null };
}

function stringField(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === 'string' ? value : '';
}

function publicOrigin(value: string): URL {
  const url = new URL(value);
  if (url.username || url.password || (url.protocol !== 'https:' && url.protocol !== 'http:')) {
    throw new Error('ORIGIN_INVALID');
  }
  return url;
}

async function fieldErrorsFromProblem(response: Response): Promise<Record<string, string>> {
  try {
    const body = (await response.json()) as {
      error?: { details?: Array<{ field?: string; reason?: string }> };
    };
    const details = body.error?.details;
    if (!Array.isArray(details)) return {};
    const errors: Record<string, string> = {};
    for (const detail of details) {
      if (!detail || typeof detail.field !== 'string') continue;
      const field = detail.field.replace(/^contact\.|^property\./, '');
      if (field === 'name' || field === 'phone' || field === 'email' || field === 'locality') {
        errors[field] = 'Pole jest niepoprawne.';
      }
    }
    return errors;
  } catch {
    return {};
  }
}
