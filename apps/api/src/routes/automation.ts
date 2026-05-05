import { Router, Request, Response } from 'express';
import { requireAuth, AuthedRequest } from '../middleware/auth.js';
import { getServiceClient } from '../services/supabase.js';

export const automationRouter = Router();
automationRouter.use(requireAuth);

interface AutomationSettings {
  auto_publish_enabled: boolean;
  publish_times: string[];
  automation_language: string;
  automation_image_style: string;
  automation_voice_id: string | null;
  automation_duration_seconds: number;
  automation_input_mode: 'topic' | 'research';
  automation_privacy: 'public' | 'unlisted' | 'private';
}

const SETTINGS_FIELDS: (keyof AutomationSettings)[] = [
  'auto_publish_enabled',
  'publish_times',
  'automation_language',
  'automation_image_style',
  'automation_voice_id',
  'automation_duration_seconds',
  'automation_input_mode',
  'automation_privacy',
];

automationRouter.get('/status', async (req: Request, res: Response) => {
  const { user } = req as AuthedRequest;
  const supa = getServiceClient();

  const [profileRes, limitsRes, queueRes] = await Promise.all([
    supa
      .from('profiles')
      .select(SETTINGS_FIELDS.join(','))
      .eq('id', user.id)
      .single(),
    supa
      .from('plan_automation_limits')
      .select('plan, daily_video_limit, used_today')
      .eq('user_id', user.id)
      .single(),
    supa
      .from('topic_queue')
      .select('id, topic, position, used, used_at, project_id, created_at')
      .eq('user_id', user.id)
      .order('used', { ascending: true })
      .order('position', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(200),
  ]);

  const profile = (profileRes.data ?? {}) as Partial<AutomationSettings>;
  const limits = limitsRes.data ?? { plan: 'free', daily_video_limit: 0, used_today: 0 };
  const queue = queueRes.data ?? [];

  const unusedCount = queue.filter((t) => !t.used).length;

  res.json({
    settings: {
      auto_publish_enabled: profile.auto_publish_enabled ?? false,
      publish_times: profile.publish_times ?? ['09:00', '15:00', '21:00'],
      automation_language: profile.automation_language ?? 'ta',
      automation_image_style: profile.automation_image_style ?? 'realistic',
      automation_voice_id: profile.automation_voice_id ?? null,
      automation_duration_seconds: profile.automation_duration_seconds ?? 30,
      automation_input_mode: profile.automation_input_mode ?? 'topic',
      automation_privacy: profile.automation_privacy ?? 'public',
    },
    plan: limits.plan,
    daily_video_limit: limits.daily_video_limit,
    used_today: limits.used_today,
    queue,
    queue_unused_count: unusedCount,
  });
});

automationRouter.put('/settings', async (req: Request, res: Response) => {
  const { user } = req as AuthedRequest;
  const supa = getServiceClient();
  const body = req.body as Partial<AutomationSettings>;

  const update: Record<string, unknown> = {};
  for (const k of SETTINGS_FIELDS) {
    if (body[k] !== undefined) update[k] = body[k];
  }

  // Validate publish_times — at most 5 entries, HH:MM 24h format
  if (Array.isArray(body.publish_times)) {
    const re = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (body.publish_times.length > 5) {
      res.status(400).json({ error: 'max 5 publish times' });
      return;
    }
    for (const t of body.publish_times) {
      if (typeof t !== 'string' || !re.test(t)) {
        res.status(400).json({ error: `invalid time: ${t}` });
        return;
      }
    }
  }

  // Block enabling on free plan (admins are exempt — they get unlimited)
  if (body.auto_publish_enabled) {
    const { data: profile } = await supa
      .from('profiles')
      .select('plan, is_admin')
      .eq('id', user.id)
      .single();
    const p = profile as { plan?: string; is_admin?: boolean } | null;
    if (p?.plan === 'free' && !p?.is_admin) {
      res.status(402).json({
        error: 'plan_required',
        message: 'Auto-publish requires a paid plan. Upgrade on /billing.',
      });
      return;
    }
  }

  const { error } = await supa.from('profiles').update(update).eq('id', user.id);
  if (error) throw error;
  res.json({ ok: true });
});

automationRouter.post('/topics', async (req: Request, res: Response) => {
  const { user } = req as AuthedRequest;
  const body = req.body as { topics?: string[] };
  if (!Array.isArray(body.topics) || body.topics.length === 0) {
    res.status(400).json({ error: 'topics array required' });
    return;
  }
  if (body.topics.length > 100) {
    res.status(400).json({ error: 'max 100 topics per request' });
    return;
  }

  const cleaned = body.topics
    .map((t) => (typeof t === 'string' ? t.trim() : ''))
    .filter((t) => t.length >= 3 && t.length <= 500);

  if (cleaned.length === 0) {
    res.status(400).json({ error: 'no valid topics (each must be 3-500 chars)' });
    return;
  }

  const supa = getServiceClient();

  // Append to end of the user's existing queue
  const { data: maxRow } = await supa
    .from('topic_queue')
    .select('position')
    .eq('user_id', user.id)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();
  let pos = (maxRow as { position?: number } | null)?.position ?? -1;

  const rows = cleaned.map((topic) => {
    pos += 1;
    return { user_id: user.id, topic, position: pos };
  });

  const { error, data } = await supa.from('topic_queue').insert(rows).select('id, topic, position');
  if (error) throw error;
  res.json({ added: data?.length ?? 0, topics: data });
});

automationRouter.delete('/topics/:id', async (req: Request, res: Response) => {
  const { user } = req as AuthedRequest;
  const { id } = req.params;
  const supa = getServiceClient();

  const { error } = await supa
    .from('topic_queue')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
  if (error) throw error;
  res.status(204).end();
});

automationRouter.delete('/topics', async (req: Request, res: Response) => {
  // Clear all unused topics
  const { user } = req as AuthedRequest;
  const supa = getServiceClient();

  const { error } = await supa
    .from('topic_queue')
    .delete()
    .eq('user_id', user.id)
    .eq('used', false);
  if (error) throw error;
  res.status(204).end();
});
