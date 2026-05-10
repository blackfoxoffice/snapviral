import { fail, requireAdmin, type VercelRequest, type VercelResponse } from '../../../_lib.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return fail(res, 405, 'method_not_allowed');

  const r = await requireAdmin(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { supa } = r;

  const id = (Array.isArray(req.query.id) ? req.query.id[0] : req.query.id) ?? '';
  if (!id) return fail(res, 400, 'missing_id');

  const { data, error } = await supa
    .from('notifications')
    .update({ sent_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error || !data) return fail(res, 500, error?.message ?? 'send failed');
  res.status(200).json(data);
}
