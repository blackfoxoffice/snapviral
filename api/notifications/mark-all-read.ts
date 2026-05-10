import { fail, requireUser, type VercelRequest, type VercelResponse } from '../_lib.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return fail(res, 405, 'method_not_allowed');

  const r = await requireUser(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { user, supa } = r;

  const { data: notifs } = await supa
    .from('notifications')
    .select('id')
    .not('sent_at', 'is', null);
  const ids = (notifs ?? []).map((n) => (n as { id: string }).id);
  if (ids.length === 0) return res.status(200).json({ marked: 0 });

  const { data: existing } = await supa
    .from('notification_reads')
    .select('notification_id')
    .eq('user_id', user.id)
    .in('notification_id', ids);
  const already = new Set(
    (existing ?? []).map((r) => (r as { notification_id: string }).notification_id),
  );
  const toInsert = ids
    .filter((id) => !already.has(id))
    .map((id) => ({ notification_id: id, user_id: user.id }));

  if (toInsert.length > 0) {
    const { error } = await supa.from('notification_reads').insert(toInsert);
    if (error) return fail(res, 500, error.message);
  }
  res.status(200).json({ marked: toInsert.length });
}
