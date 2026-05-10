import { fail, requireUser, type VercelRequest, type VercelResponse } from '../_lib.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return fail(res, 405, 'method_not_allowed');

  const r = await requireUser(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { user, supa } = r;

  const { data: projects, error } = await supa
    .from('projects')
    .select(
      'id, status, duration_seconds, created_at, yt_video_id, yt_published_at, yt_scheduled_at, language, input_mode',
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return fail(res, 500, error.message);

  const all = (projects ?? []) as Array<{
    id: string;
    status: string;
    duration_seconds: number;
    created_at: string;
    yt_video_id: string | null;
    yt_scheduled_at: string | null;
    language: string;
    input_mode: string;
  }>;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const ready = all.filter((p) => p.status === 'ready');
  const failed = all.filter((p) => p.status === 'failed');
  const running = all.filter((p) => p.status === 'running' || p.status === 'queued');
  const published = all.filter((p) => p.yt_video_id);
  const scheduled = all.filter((p) => p.yt_scheduled_at && !p.yt_video_id);
  const thisMonth = all.filter((p) => new Date(p.created_at) >= monthStart);
  const thisWeek = all.filter((p) => new Date(p.created_at) >= weekStart);
  const readyThisMonth = thisMonth.filter((p) => p.status === 'ready');

  const byLanguage: Record<string, number> = {};
  const byInputMode: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  for (const p of all) {
    byLanguage[p.language] = (byLanguage[p.language] ?? 0) + 1;
    byInputMode[p.input_mode] = (byInputMode[p.input_mode] ?? 0) + 1;
    byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
  }

  res.status(200).json({
    total_projects: all.length,
    ready_projects: ready.length,
    failed_projects: failed.length,
    running_projects: running.length,
    published_to_youtube: published.length,
    scheduled_youtube: scheduled.length,
    created_this_month: thisMonth.length,
    created_this_week: thisWeek.length,
    ready_this_month: readyThisMonth.length,
    total_voiceover_seconds: ready.reduce((s, p) => s + (p.duration_seconds ?? 0), 0),
    by_language: byLanguage,
    by_input_mode: byInputMode,
    by_status: byStatus,
    recent_projects: all.slice(0, 5),
  });
}
