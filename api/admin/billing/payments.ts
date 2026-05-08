import { fail, requireAdmin, type VercelRequest, type VercelResponse } from '../../_lib';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return fail(res, 405, 'method_not_allowed');

  const r = await requireAdmin(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { supa } = r;

  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const userId = typeof req.query.user_id === 'string' ? req.query.user_id : null;
  let q = supa
    .from('payments')
    .select(
      'id, user_id, amount_minor, currency, status, plan, description, receipt_url, invoice_url, payment_method, failure_reason, occurred_at, dodo_payment_id, dodo_customer_id',
    )
    .order('occurred_at', { ascending: false })
    .limit(limit);
  if (userId) q = q.eq('user_id', userId);
  const { data, error } = await q;
  if (error) return fail(res, 500, error.message);

  const ids = Array.from(
    new Set(
      (data ?? [])
        .map((r) => (r as { user_id: string | null }).user_id)
        .filter((x): x is string => Boolean(x)),
    ),
  );
  const emailById = new Map<string, string>();
  if (ids.length > 0) {
    const { data: profs } = await supa
      .from('profiles')
      .select('id, email')
      .in('id', ids);
    for (const p of profs ?? []) {
      const row = p as { id: string; email: string };
      emailById.set(row.id, row.email);
    }
  }
  const out = (data ?? []).map((r) => {
    const row = r as Record<string, unknown> & { user_id: string | null };
    return {
      ...row,
      email: row.user_id ? emailById.get(row.user_id) ?? null : null,
    };
  });

  res.status(200).json({ payments: out });
}
