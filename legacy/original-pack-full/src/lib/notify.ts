// Powiadomienia o leadzie bez kosztów: Telegram albo ntfy, z e-mailem jako kanałem awaryjnym.
// SMS zostaje tylko dla klienta, który sam wybrał taki kontakt (13-KOSZTY-I-REPOZYTORIA.md §2).
export interface NotifyEnv {
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  NTFY_TOPIC_URL?: string;      // np. https://ntfy.sh/forma-zieleni-<losowy-ciag>
  RESEND_API_KEY?: string;
  NOTIFY_EMAIL?: string;
  NOTIFY_FROM?: string;         // np. "Forma Zieleni <alerty@formazieleni.pl>"
}

export type Channel = 'telegram' | 'ntfy' | 'email';
export interface NotifyResult { channel: Channel | null; ok: boolean; error?: string }

const post = async (url: string, init: RequestInit): Promise<void> => {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${res.status}: ${(await res.text()).slice(0, 200)}`);
};

/** Wysyła alert pierwszym działającym kanałem. Telefon podajemy tylko po to, żeby dało się oddzwonić. */
export async function notifyOwner(env: NotifyEnv, title: string, message: string): Promise<NotifyResult> {
  const attempts: [Channel, () => Promise<void>][] = [];

  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    attempts.push([
      'telegram',
      () =>
        post(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: `${title}\n${message}`, disable_web_page_preview: true }),
        }),
    ]);
  }
  if (env.NTFY_TOPIC_URL) {
    const topic = env.NTFY_TOPIC_URL;
    attempts.push(['ntfy', () => post(topic, { method: 'POST', headers: { Title: encodeURIComponent(title), Priority: 'high' }, body: message })]);
  }
  if (env.RESEND_API_KEY && env.NOTIFY_EMAIL && env.NOTIFY_FROM) {
    attempts.push([
      'email',
      () =>
        post('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: env.NOTIFY_FROM, to: [env.NOTIFY_EMAIL], subject: title, text: message }),
        }),
    ]);
  }

  let lastError = 'brak skonfigurowanego kanalu';
  for (const [channel, send] of attempts) {
    try {
      await send();
      return { channel, ok: true };
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }
  }
  return { channel: null, ok: false, error: lastError };
}

/** Treść alertu o nowym zgłoszeniu, bez polskich znaków, żeby działała też w SMS-ie. */
export const leadAlert = (lead: { projectType: string; location?: string | null; area?: string | null; phone: string; source: string }): string =>
  `Nowe zgloszenie: ${lead.projectType}, ${lead.location ?? 'brak lokalizacji'}, ${lead.area ?? 'brak metrazu'}. Tel ${lead.phone}. Zrodlo: ${lead.source}.`
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
