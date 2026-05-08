import {
  WEB_BASE_URL,
  fail,
  registerWebhookIfMissing,
  requireAdmin,
  type VercelRequest,
  type VercelResponse,
} from '../_lib.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return fail(res, 405, 'method_not_allowed');

  const r = await requireAdmin(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);

  const body = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {})) as {
    webhook_url?: string;
  };
  const webhookUrl =
    body.webhook_url ?? `${WEB_BASE_URL.replace(/\/$/, '')}/api/billing/webhook`;

  try {
    const result = await registerWebhookIfMissing({ webhookUrl });
    res.status(200).json({
      ok: true,
      webhook_id: result.webhookId,
      created: result.created,
      secret: result.secret,
      url: webhookUrl,
      next_steps: [
        'Set DODO_PAYMENTS_WEBHOOK_KEY=<secret> on Vercel',
        'Trigger a redeploy',
      ],
    });
  } catch (e) {
    console.error('[admin] setup-dodo-webhook failed:', e);
    fail(res, 500, e instanceof Error ? e.message : 'webhook setup failed');
  }
}
