import {
  dodoClient,
  fail,
  requireUser,
  type VercelRequest,
  type VercelResponse,
} from '../_lib.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return fail(res, 405, 'method_not_allowed');

  const r = await requireUser(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { user, supa } = r;

  const { data } = await supa
    .from('profiles')
    .select('dodo_customer_id')
    .eq('id', user.id)
    .single();
  const customerId = (data as any)?.dodo_customer_id as string | null;
  if (!customerId) return fail(res, 400, 'no_subscription');

  try {
    const client = dodoClient();
    const portal = await client.customers.customerPortal.create(customerId, { send_email: false });
    const a = portal as unknown as { link?: string; url?: string };
    const url = a.link ?? a.url;
    if (!url) return fail(res, 500, 'portal has no URL');
    res.status(200).json({ url });
  } catch (e) {
    console.error('[billing] portal error', e);
    fail(res, 500, e instanceof Error ? e.message : 'portal failed');
  }
}
