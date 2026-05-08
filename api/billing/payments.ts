import { fail, requireUser, type VercelRequest, type VercelResponse } from '../_lib';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return fail(res, 405, 'method_not_allowed');

  const r = await requireUser(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { user, supa } = r;

  const { data, error } = await supa
    .from('payments')
    .select(
      'id, amount_minor, currency, status, plan, description, receipt_url, invoice_url, payment_method, failure_reason, occurred_at, dodo_payment_id',
    )
    .eq('user_id', user.id)
    .order('occurred_at', { ascending: false })
    .limit(100);
  if (error) return fail(res, 500, error.message);
  res.status(200).json({ payments: data ?? [] });
}
