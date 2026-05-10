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
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const r = await requireAdmin(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { supa } = r;

  const id = (Array.isArray(req.query.id) ? req.query.id[0] : req.query.id) ?? '';
  if (!id) return fail(res, 400, 'missing_id');

  if (req.method === 'PATCH') {
    const body = (req.body ?? {}) as Partial<ComposePayload>;
    const update: Record<string, unknown> = {};
    if (body.title !== undefined) update.title = body.title.trim();
    if (body.body !== undefined) update.body = body.body.trim();
    if (body.kind !== undefined) update.kind = body.kind;
    if (body.audience !== undefined) update.audience = body.audience;
    if (body.cta_label !== undefined) update.cta_label = body.cta_label?.trim() || null;
    if (body.cta_url !== undefined) update.cta_url = body.cta_url?.trim() || null;
    if (body.icon !== undefined) update.icon = body.icon?.trim() || null;
    if (body.accent !== undefined) update.accent = body.accent?.trim() || null;
    if (body.scheduled_at !== undefined) update.scheduled_at = body.scheduled_at;

    const { data, error } = await supa
      .from('notifications')
      .update(update)
      .eq('id', id)
      .select()
      .single();
    if (error || !data) return fail(res, 500, error?.message ?? 'update failed');
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { error } = await supa.from('notifications').delete().eq('id', id);
    if (error) return fail(res, 500, error.message);
    return res.status(204).end();
  }

  return fail(res, 405, 'method_not_allowed');
}
