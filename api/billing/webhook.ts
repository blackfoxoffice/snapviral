import { Webhook } from 'standardwebhooks';
import { fail, supabaseAnon, type VercelRequest, type VercelResponse } from '../_lib.js';

// Vercel function config: keep raw body around for signature verification.
// If we let Vercel parse JSON, we lose the canonical bytes Dodo signed.
export const config = { api: { bodyParser: false } } as const;

async function readRawBody(req: VercelRequest): Promise<string> {
  // Vercel attaches a Node IncomingMessage we can stream from.
  return new Promise((resolve, reject) => {
    let data = '';
    const stream = req as unknown as NodeJS.ReadableStream;
    stream.on('data', (chunk) => {
      data += typeof chunk === 'string' ? chunk : chunk.toString('utf8');
    });
    stream.on('end', () => resolve(data));
    stream.on('error', reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return fail(res, 405, 'method_not_allowed');

  const secret = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
  if (!secret) {
    console.error('[webhook] DODO_PAYMENTS_WEBHOOK_KEY not configured');
    return fail(res, 500, 'webhook secret not configured');
  }

  let raw: string;
  try {
    raw = await readRawBody(req);
  } catch (e) {
    return fail(res, 400, 'could not read body');
  }

  const headers = {
    'webhook-id': String(req.headers['webhook-id'] ?? ''),
    'webhook-signature': String(req.headers['webhook-signature'] ?? ''),
    'webhook-timestamp': String(req.headers['webhook-timestamp'] ?? ''),
  };

  try {
    const wh = new Webhook(secret);
    wh.verify(raw, headers);
  } catch (e) {
    console.error('[webhook] signature verification failed:', e);
    return fail(res, 401, 'invalid_signature');
  }

  let event: unknown;
  try {
    event = JSON.parse(raw);
  } catch {
    return fail(res, 400, 'invalid_json');
  }

  // SECURITY DEFINER RPC bypasses RLS. We pass it the parsed event JSON
  // and the function handles all DB side-effects atomically:
  //   - subscription_events audit row
  //   - profiles update on subscription.* events
  //   - payments upsert on payment.* events
  const supa = supabaseAnon();
  const { error } = await supa.rpc('dodo_apply_event', { p_event: event as any });
  if (error) {
    console.error('[webhook] dodo_apply_event failed:', error.message);
    return fail(res, 500, 'apply_event_failed');
  }

  res.status(200).send('ok');
}
