import { fail, requireAdmin, type VercelRequest, type VercelResponse } from '../../_lib.js';

interface ComposePayload {
  title?: string;
  body?: string;
  kind?: 'announcement' | 'marketing' | 'promo' | 'update' | 'maintenance';
  audience?: 'all' | 'free' | 'paid' | 'admins';
  cta_label?: string | null;
  cta_url?: string | null;
  icon?: string | null;
  accent?: string | null;
  scheduled_at?: string | null;
  send_now?: boolean;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const r = await requireAdmin(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { user, supa } = r;

  if (req.method === 'GET') {
    const { data, error } = await supa
      .from('notifications')
      .select(
        'id, title, body, kind, audience, cta_label, cta_url, icon, accent, scheduled_at, sent_at, created_at',
      )
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) return fail(res, 500, error.message);

    const ids = (data ?? []).map((n) => (n as { id: string }).id);
    const counts = new Map<string, number>();
    if (ids.length > 0) {
      const { data: rows } = await supa
        .from('notification_reads')
        .select('notification_id')
        .in('notification_id', ids);
      for (const row of rows ?? []) {
        const id = (row as { notification_id: string }).notification_id;
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
    }

    const out = (data ?? []).map((n) => {
      const row = n as Record<string, unknown> & { id: string };
      return { ...row, read_count: counts.get(row.id) ?? 0 };
    });
    return res.status(200).json({ notifications: out });
  }

  if (req.method === 'POST') {
    const body = (req.body ?? {}) as ComposePayload;
    if (!body.title?.trim() || !body.body?.trim()) {
      return fail(res, 400, 'title and body are required');
    }

    const insert = {
      title: body.title.trim(),
      body: body.body.trim(),
      kind: body.kind ?? 'announcement',
      audience: body.audience ?? 'all',
      cta_label: body.cta_label?.trim() || null,
      cta_url: body.cta_url?.trim() || null,
      icon: body.icon?.trim() || null,
      accent: body.accent?.trim() || null,
      scheduled_at: body.scheduled_at ?? null,
      sent_at: body.send_now ? new Date().toISOString() : null,
      created_by: user.id,
    };

    const { data, error } = await supa
      .from('notifications')
      .insert(insert)
      .select()
      .single();
    if (error || !data) return fail(res, 500, error?.message ?? 'create failed');
    return res.status(200).json(data);
  }

  return fail(res, 405, 'method_not_allowed');
}
