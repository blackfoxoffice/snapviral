import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, AuthedRequest } from '../middleware/auth.js';
import { getServiceClient } from '../services/supabase.js';
import { invalidateSecretCache } from '../services/secrets.js';
import { createProductsIfMissing } from '../services/billing.js';

export const adminRouter = Router();

adminRouter.use(requireAuth);

// Gate every admin route on the is_admin flag in profiles
async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { user } = req as AuthedRequest;
  const supa = getServiceClient();
  const { data, error } = await supa
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  if (error || !data?.is_admin) {
    res.status(403).json({ error: 'admin_required' });
    return;
  }
  next();
}

adminRouter.use(requireAdmin);

// ===== Overview =====
adminRouter.get('/overview', async (_req: Request, res: Response) => {
  const supa = getServiceClient();

  const [usersRes, projectsRes, jobsRes] = await Promise.all([
    supa.from('profiles').select('id', { count: 'exact', head: true }),
    supa
      .from('projects')
      .select('status, duration_seconds, yt_video_id, yt_scheduled_at', { count: 'exact' }),
    supa.from('pipeline_jobs').select('status', { count: 'exact', head: true }).in('status', ['pending', 'running']),
  ]);

  const projects = projectsRes.data ?? [];
  const ready = projects.filter((p) => p.status === 'ready');
  const failed = projects.filter((p) => p.status === 'failed');
  const published = projects.filter((p) => p.yt_video_id);
  const scheduled = projects.filter((p) => p.yt_scheduled_at && !p.yt_video_id);
  const totalSeconds = ready.reduce((s, p) => s + (p.duration_seconds ?? 0), 0);

  res.json({
    user_count: usersRes.count ?? 0,
    project_count: projectsRes.count ?? 0,
    ready_videos: ready.length,
    published_videos: published.length,
    scheduled_videos: scheduled.length,
    failed_videos: failed.length,
    active_jobs: jobsRes.count ?? 0,
    total_storage_seconds: totalSeconds,
  });
});

// ===== Secrets =====

adminRouter.get('/secrets', async (_req: Request, res: Response) => {
  const supa = getServiceClient();
  const { data, error } = await supa
    .from('app_secrets')
    .select('key_name, description, last4, created_at, rotated_at')
    .order('key_name');
  if (error) throw error;
  res.json(data ?? []);
});

adminRouter.post('/secrets', async (req: Request, res: Response) => {
  const { key_name, value, description } = req.body as {
    key_name?: string;
    value?: string;
    description?: string;
  };
  if (!key_name || !value) {
    res.status(400).json({ error: 'key_name and value are required' });
    return;
  }
  const supa = getServiceClient();
  const { error } = await supa.rpc('admin_create_secret', {
    p_key_name: key_name,
    p_value: value,
    p_description: description ?? null,
  });
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  invalidateSecretCache(key_name);
  res.json({ ok: true });
});

adminRouter.post('/secrets/:key/rotate', async (req: Request, res: Response) => {
  const key = req.params.key;
  const { value } = req.body as { value?: string };
  if (!key || !value) {
    res.status(400).json({ error: 'value is required' });
    return;
  }
  const supa = getServiceClient();
  const { error } = await supa.rpc('admin_rotate_secret', {
    p_key_name: key,
    p_new_value: value,
  });
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  invalidateSecretCache(key);
  res.json({ ok: true });
});

adminRouter.delete('/secrets/:key', async (req: Request, res: Response) => {
  const key = req.params.key;
  if (!key) {
    res.status(400).json({ error: 'key is required' });
    return;
  }
  const supa = getServiceClient();
  const { error } = await supa.rpc('admin_delete_secret', { p_key_name: key });
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  invalidateSecretCache(key);
  res.status(204).end();
});

// ===== Dodo Payments setup (one-shot) =====
adminRouter.post('/setup-dodo-products', async (_req: Request, res: Response) => {
  try {
    const result = await createProductsIfMissing();
    res.json({
      ok: true,
      created: result.created,
      existed: result.existed,
      next_steps: [
        'Copy the env var lines printed above to Railway',
        'Restart the API service',
        'Test checkout from /billing page',
      ],
    });
  } catch (e) {
    console.error('[admin] setup-dodo-products failed:', e);
    res.status(500).json({ error: e instanceof Error ? e.message : 'setup failed' });
  }
});

// ===== Audit log =====
adminRouter.get('/audit-log', async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 50, 500);
  const supa = getServiceClient();
  const { data, error } = await supa
    .from('secret_access_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  res.json(data ?? []);
});

// ===== Users =====
adminRouter.get('/users', async (_req: Request, res: Response) => {
  const supa = getServiceClient();
  const { data, error } = await supa
    .from('profiles')
    .select('id, email, full_name, is_admin, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  res.json(data ?? []);
});
