import { fail, requireAdmin, type VercelRequest, type VercelResponse } from '../../_lib';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return fail(res, 405, 'method_not_allowed');

  const r = await requireAdmin(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { supa } = r;

  const { data: rows, error } = await supa
    .from('admin_user_billing')
    .select('*')
    .order('user_created_at', { ascending: false });
  if (error) return fail(res, 500, error.message);

  let activePaid = 0;
  let pastDue = 0;
  let trialing = 0;
  let canceled = 0;
  for (const row of rows ?? []) {
    const r2 = row as { plan?: string; plan_status?: string };
    if (r2.plan && r2.plan !== 'free' && r2.plan_status === 'active') activePaid++;
    if (r2.plan_status === 'past_due') pastDue++;
    if (r2.plan_status === 'trialing') trialing++;
    if (r2.plan_status === 'canceled') canceled++;
  }

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recent } = await supa
    .from('payments')
    .select('amount_minor, currency')
    .eq('status', 'succeeded')
    .gte('occurred_at', since);
  let last30Usd = 0;
  let last30Inr = 0;
  for (const p of recent ?? []) {
    const x = p as { amount_minor: number; currency: string };
    if (x.currency === 'USD') last30Usd += x.amount_minor;
    if (x.currency === 'INR') last30Inr += x.amount_minor;
  }

  res.status(200).json({
    rows: rows ?? [],
    totals: {
      users: (rows ?? []).length,
      activePaid,
      pastDue,
      trialing,
      canceled,
      last30dUsdMinor: last30Usd,
      last30dInrMinor: last30Inr,
    },
  });
}
