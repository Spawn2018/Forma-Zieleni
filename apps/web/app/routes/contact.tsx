import { randomUUID } from 'node:crypto';
import { Form, useActionData, useNavigation } from 'react-router';
import type { Route } from './+types/contact';
import {
  emptyLeadForm,
  leadCaptureCopy,
  leadCaptureView,
  parseLeadForm,
  postLeadCapture,
  type LeadCaptureView,
} from '../lead-capture.ts';
import { publicHead, seoEnv } from '../technical-seo.ts';
import '../lead-capture.css';

const IDEMPOTENCY_KEY = /^[\x21-\x7e]{8,128}$/;

export type ContactPageView = LeadCaptureView & { idempotencyKey: string };

export function meta() {
  const copy = leadCaptureCopy();
  return publicHead({
    title: copy.title,
    description: copy.intro,
    path: '/kontakt',
    indexable: true,
    env: seoEnv(process.env.FZ_PUBLIC_ENV),
    origin: process.env.FZ_PUBLIC_ORIGIN,
  });
}

export async function loader(): Promise<ContactPageView> {
  return {
    ...leadCaptureView({
      originConfigured: Boolean(process.env.FZ_API_ORIGIN),
    }),
    idempotencyKey: randomUUID(),
  };
}

export async function action({ request }: Route.ActionArgs): Promise<ContactPageView> {
  const origin = process.env.FZ_API_ORIGIN;
  const form = await request.formData();
  const fields = parseLeadForm(form);
  const submittedKey = form.get('idempotencyKey');
  const idempotencyKey = typeof submittedKey === 'string' && IDEMPOTENCY_KEY.test(submittedKey)
    ? submittedKey
    : randomUUID();
  const result = await postLeadCapture({
    origin,
    fields,
    idempotencyKey,
  });
  return {
    ...leadCaptureView({
      originConfigured: Boolean(origin),
      fields: result.ok ? emptyLeadForm() : fields,
      result,
    }),
    // Fresh key after accept; keep the same key on validation/API errors for safe retry.
    idempotencyKey: result.ok ? randomUUID() : idempotencyKey,
  };
}

export default function ContactRoute({ loaderData }: Route.ComponentProps) {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const view = actionData ?? loaderData;
  return leadCaptureShell(view, { submitting: navigation.state === 'submitting' });
}

export function leadCaptureShell(view: ContactPageView, options: { submitting?: boolean } = {}) {
  const copy = leadCaptureCopy();
  const submitting = options.submitting === true;
  const disabled = view.state === 'unconfigured' || submitting;
  const noticeRole = view.state === 'accepted' ? 'status' : 'alert';
  return (
    <main className="site lead-capture" aria-busy={submitting ? 'true' : undefined}>
      <h1>{copy.title}</h1>
      <p>{copy.intro}</p>
      {view.notice ? (
        <p className={view.state === 'accepted' ? 'lead-capture__notice' : 'lead-capture__error'} role={noticeRole}>
          {view.notice}
        </p>
      ) : null}
      {view.state === 'accepted' ? null : (
        <Form method="post" className="lead-capture__form" replace>
          <input type="hidden" name="idempotencyKey" value={view.idempotencyKey} />
          <div className="lead-capture__field">
            <label htmlFor="lead-name">{copy.nameLabel}</label>
            <input id="lead-name" name="name" type="text" autoComplete="name" required maxLength={120} defaultValue={view.fields.name} disabled={disabled} aria-invalid={Boolean(view.errors.name)} aria-describedby={view.errors.name ? 'lead-name-error' : undefined} />
            {view.errors.name ? <span id="lead-name-error" className="lead-capture__field-error">{view.errors.name}</span> : null}
          </div>
          <div className="lead-capture__field">
            <label htmlFor="lead-phone">{copy.phoneLabel}</label>
            <input id="lead-phone" name="phone" type="tel" autoComplete="tel" required maxLength={32} defaultValue={view.fields.phone} disabled={disabled} aria-invalid={Boolean(view.errors.phone)} aria-describedby={view.errors.phone ? 'lead-phone-error' : undefined} />
            {view.errors.phone ? <span id="lead-phone-error" className="lead-capture__field-error">{view.errors.phone}</span> : null}
          </div>
          <div className="lead-capture__field">
            <label htmlFor="lead-email">{copy.emailLabel}</label>
            <input id="lead-email" name="email" type="email" autoComplete="email" maxLength={254} defaultValue={view.fields.email} disabled={disabled} aria-invalid={Boolean(view.errors.email)} aria-describedby={view.errors.email ? 'lead-email-error' : undefined} />
            {view.errors.email ? <span id="lead-email-error" className="lead-capture__field-error">{view.errors.email}</span> : null}
          </div>
          <div className="lead-capture__field">
            <label htmlFor="lead-locality">{copy.localityLabel}</label>
            <input id="lead-locality" name="locality" type="text" autoComplete="address-level2" maxLength={200} defaultValue={view.fields.locality} disabled={disabled} aria-invalid={Boolean(view.errors.locality)} aria-describedby={view.errors.locality ? 'lead-locality-error' : undefined} />
            {view.errors.locality ? <span id="lead-locality-error" className="lead-capture__field-error">{view.errors.locality}</span> : null}
          </div>
          <label className="lead-capture__check">
            <input name="siteAnalysisRequested" type="checkbox" value="true" defaultChecked={view.fields.siteAnalysisRequested} disabled={disabled} />
            <span>{copy.siteAnalysisLabel}</span>
          </label>
          <button type="submit" disabled={disabled} aria-busy={submitting ? 'true' : undefined}>
            {submitting ? copy.submittingLabel : copy.submitLabel}
          </button>
        </Form>
      )}
    </main>
  );
}
