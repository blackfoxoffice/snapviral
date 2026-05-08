import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, AuthedRequest } from '../middleware/auth.js';
import { getServiceClient } from '../services/supabase.js';

export const notificationsRouter = Router();

// All notification endpoints require auth.
notificationsRouter.use(requireAuth);

async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { user } = req as AuthedRequest;
  const supa = getServiceClient();
  const { data, error } = await supa
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  if (error || !(data as { is_admin?: boolean } | null)?.is_admin) {
    res.status(403).json({ error: 'admin_required' });
    return;
  }
  next();
}

// =====================================================================
// USER routes
// =====================================================================

// Inbox: my visible notifications, with read state.
notificationsRouter.get('/', async (req, res) => {
  const { user } = req as AuthedRequest;
  const supa = getServiceClient();

  // Pull every visible notification + LEFT JOIN read state via RPC.
  // RLS on notifications table already filters by audience for the user.
  const userClient = getServiceClient(); // service role for the join
  const { data, error } = await userClient
    .from('notifications')
    .select('id, title, body, kind, audience, cta_label, cta_url, icon, accent, sent_at, created_at')
    .not('sent_at', 'is', null)
    .order('sent_at', { ascending: false })
    .limit(50);
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const ids = (data ?? []).map((n) => (n as { id: string }).id);
  let readSet = new Set<string>();
  if (ids.length > 0) {
    const { data: reads } = await userClient
      .from('notification_reads')
      .select('notification_id')
      .eq('user_id', user.id)
      .in('notification_id', ids);
    readSet = new Set((reads ?? []).map((r) => (r as { notification_id: string }).notification_id));
  }

  const notifications = (data ?? []).map((n) => {
    const row = n as Record<string, unknown> & { id: string };
    return {
      ...row,
      read: readSet.has(row.id),
    };
  });

  // Filter by audience here too, since the service-role client bypasses RLS.
  const { data: profile } = await userClient
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  const isAdmin = Boolean((profile as { is_admin?: boolean } | null)?.is_admin);

  const filtered = notifications.filter((n) => {
    const a = n.audience;
    if (a === 'all') return true;
    if (a === 'admins') return isAdmin;
    if (a === 'free' || a === 'paid') return true; // refine when plan info lands here
    return false;
  });

  res.json({ notifications: filtered, unread: filtered.filter((n) => !n.read).length });
});

notificationsRouter.post('/:id/read', async (req, res) => {
  const { user } = req as AuthedRequest;
  const supa = getServiceClient();
  const { error } = await supa
    .from('notification_reads')
    .upsert(
      { notification_id: req.params.id, user_id: user.id },
      { onConflict: 'notification_id,user_id' },
    );
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(204).end();
});

notificationsRouter.post('/mark-all-read', async (req, res) => {
  const { user } = req as AuthedRequest;
  const supa = getServiceClient();
  // Insert a read row for every sent notification not yet read.
  const { data: notifs } = await supa
    .from('notifications')
    .select('id')
    .not('sent_at', 'is', null);
  const ids = (notifs ?? []).map((n) => (n as { id: string }).id);
  if (ids.length === 0) {
    res.json({ marked: 0 });
    return;
  }
  const { data: existing } = await supa
    .from('notification_reads')
    .select('notification_id')
    .eq('user_id', user.id)
    .in('notification_id', ids);
  const already = new Set((existing ?? []).map((r) => (r as { notification_id: string }).notification_id));
  const toInsert = ids.filter((id) => !already.has(id)).map((id) => ({
    notification_id: id,
    user_id: user.id,
  }));
  if (toInsert.length === 0) {
    res.json({ marked: 0 });
    return;
  }
  const { error } = await supa.from('notification_reads').insert(toInsert);
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ marked: toInsert.length });
});

// =====================================================================
// ADMIN routes
// =====================================================================

notificationsRouter.use('/admin', requireAdmin);

// List ALL notifications (sent + drafts), newest first.
notificationsRouter.get('/admin', async (_req, res) => {
  const supa = getServiceClient();
  const { data, error } = await supa
    .from('notifications')
    .select('id, title, body, kind, audience, cta_label, cta_url, icon, accent, scheduled_at, sent_at, created_at')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  // Per-row read counts, so admins can see reach.
  const ids = (data ?? []).map((n) => (n as { id: string }).id);
  const counts = new Map<string, number>();
  if (ids.length > 0) {
    const { data: rows } = await supa
      .from('notification_reads')
      .select('notification_id')
      .in('notification_id', ids);
    for (const r of rows ?? []) {
      const id = (r as { notification_id: string }).notification_id;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }

  const out = (data ?? []).map((n) => {
    const row = n as Record<string, unknown> & { id: string };
    return { ...row, read_count: counts.get(row.id) ?? 0 };
  });

  res.json({ notifications: out });
});

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

// Create a draft (or send immediately if send_now=true).
notificationsRouter.post('/admin', async (req, res) => {
  const { user } = req as AuthedRequest;
  const body = req.body as ComposePayload;

  if (!body.title?.trim() || !body.body?.trim()) {
    res.status(400).json({ error: 'title and body are required' });
    return;
  }

  const supa = getServiceClient();
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
  if (error || !data) {
    res.status(500).json({ error: error?.message ?? 'create failed' });
    return;
  }
  res.json(data);
});

// Send / re-broadcast an existing notification.
notificationsRouter.post('/admin/:id/send', async (req, res) => {
  const supa = getServiceClient();
  const { data, error } = await supa
    .from('notifications')
    .update({ sent_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error || !data) {
    res.status(500).json({ error: error?.message ?? 'send failed' });
    return;
  }
  res.json(data);
});

// Update a draft.
notificationsRouter.patch('/admin/:id', async (req, res) => {
  const body = req.body as Partial<ComposePayload>;
  const supa = getServiceClient();
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
    .eq('id', req.params.id)
    .select()
    .single();
  if (error || !data) {
    res.status(500).json({ error: error?.message ?? 'update failed' });
    return;
  }
  res.json(data);
});

notificationsRouter.delete('/admin/:id', async (req, res) => {
  const supa = getServiceClient();
  const { error } = await supa.from('notifications').delete().eq('id', req.params.id);
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(204).end();
});
