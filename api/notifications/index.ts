import { fail, requireUser, type VercelRequest, type VercelResponse } from '../_lib.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return fail(res, 405, 'method_not_allowed');

  const r = await requireUser(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { user, supa } = r;

  const { data, error } = await supa
    .from('notifications')
    .select(
      'id, title, body, kind, audience, cta_label, cta_url, icon, accent, sent_at, created_at',
    )
    .not('sent_at', 'is', null)
    .order('sent_at', { ascending: false })
    .limit(50);

  if (error) return fail(res, 500, error.message);

  const ids = (data ?? []).map((n) => (n as { id: string }).id);
  let readSet = new Set<string>();
  if (ids.length > 0) {
    const { data: reads } = await supa
      .from('notification_reads')
      .select('notification_id')
      .eq('user_id', user.id)
      .in('notification_id', ids);
    readSet = new Set(
      (reads ?? []).map((r) => (r as { notification_id: string }).notification_id),
    );
  }

  const { data: profile } = await supa
    .from('profiles')
    .select('is_admin, plan')
    .eq('id', user.id)
    .single();
  const isAdmin = Boolean((profile as { is_admin?: boolean } | null)?.is_admin);
  const plan = String((profile as { plan?: string } | null)?.plan ?? 'free');

  const list = (data ?? [])
    .map((n) => {
      const row = n as Record<string, unknown> & { id: string; audience: string };
      return { ...row, read: readSet.has(row.id) };
    })
    .filter((n) => {
      const a = (n as { audience: string }).audience;
      if (a === 'all') return true;
      if (a === 'admins') return isAdmin;
      if (a === 'free') return plan === 'free';
      if (a === 'paid') return plan !== 'free';
      return false;
    });

  res.status(200).json({ notifications: list, unread: list.filter((n) => !n.read).length });
}
