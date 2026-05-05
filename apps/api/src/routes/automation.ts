import { Router, Request, Response } from 'express';
import { requireAuth, AuthedRequest } from '../middleware/auth.js';
import { getServiceClient } from '../services/supabase.js';
import { generateTopicSuggestions } from '../services/openrouter.js';
import type { ProjectLanguage } from '@newsflow/shared';

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
  const body = req.body as {
    topics?: Array<string | { topic: string; scheduled_at?: string }>;
  };
  if (!Array.isArray(body.topics) || body.topics.length === 0) {
    res.status(400).json({ error: 'topics array required' });
    return;
  }
  if (body.topics.length > 100) {
    res.status(400).json({ error: 'max 100 topics per request' });
    return;
  }

  // Normalise both shapes (string[] | {topic, scheduled_at}[]) into one
  const items: Array<{ topic: string; scheduled_at?: string }> = body.topics
    .map((t) => {
      if (typeof t === 'string') return { topic: t };
      if (t && typeof t === 'object' && typeof t.topic === 'string') {
        return { topic: t.topic, scheduled_at: t.scheduled_at };
      }
      return null;
    })
    .filter((x): x is { topic: string; scheduled_at?: string } => !!x)
    .map((x) => ({ ...x, topic: x.topic.trim() }))
    .filter((x) => x.topic.length >= 3 && x.topic.length <= 500);

  if (items.length === 0) {
    res.status(400).json({ error: 'no valid topics (each must be 3-500 chars)' });
    return;
  }

  const supa = getServiceClient();

  // For topics without an explicit time, auto-distribute across the user's
  // configured publish_times, starting from the next future slot.
  const { data: profile } = await supa
    .from('profiles')
    .select('publish_times')
    .eq('id', user.id)
    .single();
  const publishTimes = ((profile as { publish_times?: string[] } | null)?.publish_times ?? [
    '09:00',
    '15:00',
    '21:00',
  ]).filter((t) => /^\d{2}:\d{2}$/.test(t));

  const autoTimes = autoDistributeSlots(
    items.filter((t) => !t.scheduled_at).length,
    publishTimes,
  );
  let autoIdx = 0;

  // Append to end of the user's existing queue
  const { data: maxRow } = await supa
    .from('topic_queue')
    .select('position')
    .eq('user_id', user.id)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();
  let pos = (maxRow as { position?: number } | null)?.position ?? -1;

  const rows = items.map((it) => {
    pos += 1;
    const scheduled = it.scheduled_at ? new Date(it.scheduled_at) : autoTimes[autoIdx++];
    return {
      user_id: user.id,
      topic: it.topic,
      position: pos,
      scheduled_at: scheduled?.toISOString() ?? null,
    };
  });

  const { error, data } = await supa
    .from('topic_queue')
    .insert(rows)
    .select('id, topic, position, scheduled_at, used, used_at, project_id, created_at');
  if (error) throw error;
  res.json({ added: data?.length ?? 0, topics: data });
});

// Edit a topic's scheduled_at (and/or text) — used for rescheduling
automationRouter.patch('/topics/:id', async (req: Request, res: Response) => {
  const { user } = req as AuthedRequest;
  const { id } = req.params;
  const body = req.body as { topic?: string; scheduled_at?: string | null };

  const update: Record<string, unknown> = {};
  if (typeof body.topic === 'string') {
    const t = body.topic.trim();
    if (t.length < 3 || t.length > 500) {
      res.status(400).json({ error: 'topic must be 3-500 chars' });
      return;
    }
    update.topic = t;
  }
  if (body.scheduled_at !== undefined) {
    if (body.scheduled_at === null) {
      update.scheduled_at = null;
    } else {
      const d = new Date(body.scheduled_at);
      if (Number.isNaN(d.getTime())) {
        res.status(400).json({ error: 'invalid scheduled_at' });
        return;
      }
      update.scheduled_at = d.toISOString();
    }
  }
  if (Object.keys(update).length === 0) {
    res.status(400).json({ error: 'nothing to update' });
    return;
  }

  const supa = getServiceClient();
  const { data, error } = await supa
    .from('topic_queue')
    .update(update)
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('used', false) // can't reschedule already-used topics
    .select('id, topic, scheduled_at')
    .single();
  if (error) {
    res.status(404).json({ error: 'not found or already used' });
    return;
  }
  res.json(data);
});

/**
 * Spread N topics across the user's daily slots starting from the next
 * future slot in IST. Returns N timestamps (UTC) in chronological order.
 *
 * Example: publish_times = ['09:00','15:00','21:00'], 5 new topics, current
 * time 14:30 IST → returns [today 15:00 IST, today 21:00 IST, tomorrow
 * 09:00 IST, tomorrow 15:00 IST, tomorrow 21:00 IST] as UTC ISO strings.
 */
function autoDistributeSlots(count: number, publishTimes: string[]): Date[] {
  if (count <= 0 || publishTimes.length === 0) return [];

  // Sort slots chronologically (HH:MM)
  const slots = [...publishTimes].sort();
  const out: Date[] = [];

  // Walk forward day-by-day, slot-by-slot, until we have `count` future ones.
  // We compute slot times in IST then store as Date (UTC under the hood).
  const IST_OFFSET_MIN = 330; // +5:30
  const nowMs = Date.now();
  let dayOffset = 0;

  while (out.length < count) {
    for (const slot of slots) {
      if (out.length >= count) break;
      const [h, m] = slot.split(':').map((s) => parseInt(s, 10));
      // Build "today + dayOffset @ h:m IST" → Date
      const istNow = new Date(nowMs + IST_OFFSET_MIN * 60 * 1000);
      const istDay = new Date(
        Date.UTC(
          istNow.getUTCFullYear(),
          istNow.getUTCMonth(),
          istNow.getUTCDate() + dayOffset,
          h ?? 0,
          m ?? 0,
          0,
          0,
        ),
      );
      // Convert that IST instant back to UTC for storage
      const utcMs = istDay.getTime() - IST_OFFSET_MIN * 60 * 1000;
      // Skip slots in the past (only a concern on the first day)
      if (utcMs <= nowMs + 60 * 1000) continue; // require >= 1 min in future
      out.push(new Date(utcMs));
    }
    dayOffset++;
    if (dayOffset > 60) break; // safety
  }
  return out;
}

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

// AI topic suggestions — Perplexity Sonar grounded in live web search.
automationRouter.post('/generate-topics', async (req: Request, res: Response) => {
  const body = req.body as {
    language?: ProjectLanguage;
    niche?: string;
    count?: number;
  };

  const language = body.language ?? 'ta';
  if (language !== 'ta' && language !== 'en' && language !== 'hi') {
    res.status(400).json({ error: 'language must be ta, en, or hi' });
    return;
  }

  try {
    const topics = await generateTopicSuggestions({
      language,
      niche: body.niche,
      count: body.count,
    });
    res.json({ topics });
  } catch (e) {
    console.error('[automation] generate-topics failed:', e);
    res.status(500).json({ error: e instanceof Error ? e.message : 'generation failed' });
  }
});
