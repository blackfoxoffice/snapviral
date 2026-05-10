import { fail, requireUser, type VercelRequest, type VercelResponse } from '../../_lib.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return fail(res, 405, 'method_not_allowed');

  const r = await requireUser(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { user, supa } = r;

  const id = (Array.isArray(req.query.id) ? req.query.id[0] : req.query.id) ?? '';
  if (!id) return fail(res, 400, 'missing_id');

  const { error } = await supa
    .from('notification_reads')
    .upsert(
      { notification_id: id, user_id: user.id },
      { onConflict: 'notification_id,user_id' },
    );
  if (error) return fail(res, 500, error.message);
  res.status(204).end();
}
