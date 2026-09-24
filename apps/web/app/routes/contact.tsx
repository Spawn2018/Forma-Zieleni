import { randomUUID } from 'node:crypto';
import { Form, useActionData } from 'react-router';
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

export async function loader(): Promise<LeadCaptureView> {
  return leadCaptureView({
    originConfigured: Boolean(process.env.FZ_API_ORIGIN),
  });
}

export async function action({ request }: Route.ActionArgs): Promise<LeadCaptureView> {
  const origin = process.env.FZ_API_ORIGIN;
  const form = await request.formData();
  const fields = parseLeadForm(form);
  const result = await postLeadCapture({
    origin,
    fields,
    idempotencyKey: randomUUID(),
  });
  return leadCaptureView({
    originConfigured: Boolean(origin),
    fields: result.ok ? emptyLeadForm() : fields,
    result,
  });
}

export default function ContactRoute({ loaderData }: Route.ComponentProps) {
  const actionData = useActionData<typeof action>();
  const view = actionData ?? loaderData;
  return leadCaptureShell(view);
}

export function leadCaptureShell(view: LeadCaptureView) {
  const copy = leadCaptureCopy();
  const disabled = view.state === 'unconfigured';
  return (
    <main className="site lead-capture">
      <h1>{copy.title}</h1>
      <p>{copy.intro}</p>
      {view.notice ? <p className={view.state === 'accepted' ? 'lead-capture__notice' : 'lead-capture__error'} role="status">{view.notice}</p> : null}
      {view.state === 'accepted' ? null : (
        <Form method="post" className="lead-capture__form" replace>
          <label>
            <span>{copy.nameLabel}</span>
            <input name="name" type="text" autoComplete="name" required maxLength={120} defaultValue={view.fields.name} disabled={disabled} aria-invalid={Boolean(view.errors.name)} />
            {view.errors.name ? <span className="lead-capture__field-error">{view.errors.name}</span> : null}
          </label>
          <label>
            <span>{copy.phoneLabel}</span>
            <input name="phone" type="tel" autoComplete="tel" required maxLength={32} defaultValue={view.fields.phone} disabled={disabled} aria-invalid={Boolean(view.errors.phone)} />
            {view.errors.phone ? <span className="lead-capture__field-error">{view.errors.phone}</span> : null}
          </label>
          <label>
            <span>{copy.emailLabel}</span>
            <input name="email" type="email" autoComplete="email" maxLength={254} defaultValue={view.fields.email} disabled={disabled} aria-invalid={Boolean(view.errors.email)} />
            {view.errors.email ? <span className="lead-capture__field-error">{view.errors.email}</span> : null}
          </label>
          <label>
            <span>{copy.localityLabel}</span>
            <input name="locality" type="text" autoComplete="address-level2" maxLength={200} defaultValue={view.fields.locality} disabled={disabled} aria-invalid={Boolean(view.errors.locality)} />
            {view.errors.locality ? <span className="lead-capture__field-error">{view.errors.locality}</span> : null}
          </label>
          <label className="lead-capture__check">
            <input name="siteAnalysisRequested" type="checkbox" value="true" defaultChecked={view.fields.siteAnalysisRequested} disabled={disabled} />
            <span>{copy.siteAnalysisLabel}</span>
          </label>
          <button type="submit" disabled={disabled}>{copy.submitLabel}</button>
        </Form>
      )}
    </main>
  );
}
