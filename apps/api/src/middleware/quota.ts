import type { Response, NextFunction } from 'express';
import type { AuthedRequest } from './auth.js';
import { getServiceClient } from '../services/supabase.js';

/**
 * Block /generate when the user has hit their monthly video quota or
 * the project's duration exceeds their plan's max.
 *
 * Looks up `public.user_quota` (a view that joins profiles + monthly count).
 * Free → 2 videos / 30s; Creator → 30 / 60s; Studio → 100 / 90s.
 *
 * Bypass with QUOTA_DISABLED=1 env var (useful for local dev).
 */
export async function enforceVideoQuota(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (process.env.QUOTA_DISABLED === '1') {
    next();
    return;
  }

  const { user } = req;
  const projectId = req.params.id;
  if (!projectId) {
    next();
    return;
  }

  const supa = getServiceClient();

  const [quotaRes, projectRes, adminRes] = await Promise.all([
    supa
      .from('user_quota')
      .select('plan, plan_status, monthly_video_limit, max_duration_seconds, used_this_month')
      .eq('user_id', user.id)
      .single(),
    supa.from('projects').select('duration_seconds').eq('id', projectId).eq('user_id', user.id).single(),
    supa.from('profiles').select('is_admin').eq('id', user.id).single(),
  ]);

  const quota = quotaRes.data;
  const project = projectRes.data;
  const isAdmin = Boolean((adminRes.data as { is_admin?: boolean } | null)?.is_admin);

  // Admins bypass all quota + duration limits — unlimited generation.
  if (isAdmin) {
    next();
    return;
  }

  if (!quota || !project) {
    // Don't block — the route handler will return its own 404.
    next();
    return;
  }

  if (quota.plan_status === 'past_due') {
    res.status(402).json({
      error: 'subscription_past_due',
      message: 'Your subscription payment failed. Update your billing to continue generating videos.',
    });
    return;
  }

  if (quota.used_this_month >= quota.monthly_video_limit) {
    res.status(402).json({
      error: 'quota_exceeded',
      plan: quota.plan,
      used: quota.used_this_month,
      limit: quota.monthly_video_limit,
      message: `You've used ${quota.used_this_month} of ${quota.monthly_video_limit} videos on the ${quota.plan} plan this month. Upgrade to keep generating.`,
    });
    return;
  }

  if (project.duration_seconds > quota.max_duration_seconds) {
    res.status(402).json({
      error: 'duration_exceeded',
      plan: quota.plan,
      project_duration: project.duration_seconds,
      max_allowed: quota.max_duration_seconds,
      message: `${quota.plan} plan supports up to ${quota.max_duration_seconds}s videos; this project is ${project.duration_seconds}s. Upgrade or shorten the duration.`,
    });
    return;
  }

  next();
}
