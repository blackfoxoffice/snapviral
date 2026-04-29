import { Router, Request, Response } from 'express';
import { requireAuth, AuthedRequest } from '../middleware/auth.js';
import { getServiceClient } from '../services/supabase.js';

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get('/stats', async (req: Request, res: Response) => {
  const { user } = req as AuthedRequest;
  const supa = getServiceClient();

  const { data: projects, error } = await supa
    .from('projects')
    .select('id, status, duration_seconds, created_at, yt_video_id, yt_published_at, yt_scheduled_at, language, input_mode')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const all = projects ?? [];
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const total = all.length;
  const ready = all.filter((p) => p.status === 'ready');
  const failed = all.filter((p) => p.status === 'failed');
  const running = all.filter((p) => p.status === 'running' || p.status === 'queued');
  const published = all.filter((p) => p.yt_video_id);
  const scheduled = all.filter((p) => p.yt_scheduled_at && !p.yt_video_id);

  const thisMonth = all.filter((p) => new Date(p.created_at) >= monthStart);
  const thisWeek = all.filter((p) => new Date(p.created_at) >= weekStart);
  const readyThisMonth = thisMonth.filter((p) => p.status === 'ready');

  const totalVoiceoverSeconds = ready.reduce((s, p) => s + (p.duration_seconds ?? 0), 0);

  const byLanguage: Record<string, number> = {};
  for (const p of all) {
    byLanguage[p.language] = (byLanguage[p.language] ?? 0) + 1;
  }

  const byInputMode: Record<string, number> = {};
  for (const p of all) {
    byInputMode[p.input_mode] = (byInputMode[p.input_mode] ?? 0) + 1;
  }

  const byStatus: Record<string, number> = {};
  for (const p of all) {
    byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
  }

  const recentProjects = all.slice(0, 5);

  res.json({
    total_projects: total,
    ready_projects: ready.length,
    failed_projects: failed.length,
    running_projects: running.length,
    published_to_youtube: published.length,
    scheduled_youtube: scheduled.length,
    created_this_month: thisMonth.length,
    created_this_week: thisWeek.length,
    ready_this_month: readyThisMonth.length,
    total_voiceover_seconds: totalVoiceoverSeconds,
    by_language: byLanguage,
    by_input_mode: byInputMode,
    by_status: byStatus,
    recent_projects: recentProjects,
  });
});
