import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, AuthedRequest } from '../middleware/auth.js';
import { getServiceClient } from '../services/supabase.js';
import { invalidateSecretCache } from '../services/secrets.js';
import { createProductsIfMissing, registerWebhookIfMissing } from '../services/billing.js';

export const adminRouter = Router();

// Bootstrap-only route — registered BEFORE requireAuth so it can be hit
// without a user JWT. Authenticated by knowledge of the Supabase service
// role key (highly privileged, already a secret) via X-Setup-Bootstrap header.
// Used once to provision Dodo products before any admin user exists.
function bootstrapAuth(req: Request): boolean {
  const provided = req.header('x-setup-bootstrap') ?? '';
  const expected = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  return !!expected && provided === expected;
}

adminRouter.post('/bootstrap/setup-dodo-products', async (req: Request, res: Response) => {
  if (!bootstrapAuth(req)) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  try {
    const result = await createProductsIfMissing();
    res.json({ ok: true, created: result.created, existed: result.existed, envVars: result.envVars });
  } catch (e) {
    console.error('[admin] bootstrap setup failed:', e);
    res.status(500).json({ error: e instanceof Error ? e.message : 'setup failed' });
  }
});

adminRouter.post('/bootstrap/setup-dodo-webhook', async (req: Request, res: Response) => {
  if (!bootstrapAuth(req)) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL ?? `https://newsflow-api-production-f402.up.railway.app`;
  const webhookUrl = `${apiBase.replace(/\/$/, '')}/api/billing/webhook`;
  try {
    const result = await registerWebhookIfMissing({ webhookUrl });
    res.json({
      ok: true,
      webhook_id: result.webhookId,
      created: result.created,
      // Returning the secret here is necessary for one-time bootstrap.
      // The caller MUST set DODO_PAYMENTS_WEBHOOK_KEY=<secret> on the server.
      secret: result.secret,
    });
  } catch (e) {
    console.error('[admin] bootstrap webhook failed:', e);
    res.status(500).json({ error: e instanceof Error ? e.message : 'webhook setup failed' });
  }
});

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
//
// Two ways to authenticate:
//   1. Logged-in admin user (default — gated by the requireAdmin middleware above)
//   2. Service-role key in `X-Setup-Bootstrap` header — for one-time provisioning
//      from outside any user session. Match against SUPABASE_SERVICE_ROLE_KEY.
adminRouter.post('/setup-dodo-products', async (_req: Request, res: Response) => {
  try {
    const result = await createProductsIfMissing();
    res.json({
      ok: true,
      created: result.created,
      existed: result.existed,
      next_steps: [
        'Copy the DODO_PRODUCT_* lines from Railway logs',
        'Add them as env vars on the Railway service',
        'Wait ~30s for Railway to redeploy',
        'Test checkout on /billing',
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
  const { data: profiles, error } = await supa
    .from('profiles')
    .select('id, email, full_name, phone, is_admin, created_at, updated_at')
    .order('created_at', { ascending: false });
  if (error) throw error;

  const ids = (profiles ?? []).map((p) => (p as { id: string }).id);

  // Per-user project counts in one round-trip.
  const counts = new Map<string, number>();
  if (ids.length > 0) {
    const { data: projRows } = await supa
      .from('projects')
      .select('user_id')
      .in('user_id', ids);
    for (const r of projRows ?? []) {
      const uid = (r as { user_id: string }).user_id;
      counts.set(uid, (counts.get(uid) ?? 0) + 1);
    }
  }

  // Per-user last sign-in timestamps from auth.users.
  const lastSignIn = new Map<string, string | null>();
  if (ids.length > 0) {
    const { data: authRows } = await supa
      .schema('auth')
      .from('users')
      .select('id, last_sign_in_at')
      .in('id', ids);
    for (const r of authRows ?? []) {
      const row = r as { id: string; last_sign_in_at: string | null };
      lastSignIn.set(row.id, row.last_sign_in_at);
    }
  }

  const out = (profiles ?? []).map((p) => {
    const row = p as Record<string, unknown> & { id: string };
    return {
      ...row,
      project_count: counts.get(row.id) ?? 0,
      last_sign_in_at: lastSignIn.get(row.id) ?? null,
    };
  });

  res.json(out);
});

// Toggle admin flag. Admins can promote / demote other accounts.
// Self-demotion is blocked to prevent locking the platform out of admins.
adminRouter.patch('/users/:id/admin', async (req: Request, res: Response) => {
  const { user } = req as AuthedRequest;
  const targetId = req.params.id;
  const isAdmin = Boolean((req.body as { is_admin?: boolean }).is_admin);

  if (targetId === user.id && !isAdmin) {
    res.status(400).json({ error: 'You cannot demote yourself.' });
    return;
  }

  const supa = getServiceClient();
  const { data, error } = await supa
    .from('profiles')
    .update({ is_admin: isAdmin })
    .eq('id', targetId)
    .select('id, email, is_admin')
    .single();
  if (error || !data) {
    res.status(500).json({ error: error?.message ?? 'update failed' });
    return;
  }
  res.json(data);
});

// =====================================================================
// Billing — admin overview of every user's subscription, usage, payments.
// Backed by the public.admin_user_billing rollup view + payments table.
// =====================================================================

adminRouter.get('/billing/overview', async (_req: Request, res: Response) => {
  const supa = getServiceClient();
  const { data: rows, error } = await supa
    .from('admin_user_billing')
    .select('*')
    .order('user_created_at', { ascending: false });
  if (error) throw error;

  let last30Usd = 0;
  let last30Inr = 0;
  let activePaid = 0;
  let pastDue = 0;
  let trialing = 0;
  let canceled = 0;
  for (const r of rows ?? []) {
    const row = r as { plan?: string; plan_status?: string };
    if (row.plan && row.plan !== 'free' && row.plan_status === 'active') activePaid++;
    if (row.plan_status === 'past_due') pastDue++;
    if (row.plan_status === 'trialing') trialing++;
    if (row.plan_status === 'canceled') canceled++;
  }

  // Sum of succeeded payments, grouped by currency, last 30 days.
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recent } = await supa
    .from('payments')
    .select('amount_minor, currency')
    .eq('status', 'succeeded')
    .gte('occurred_at', since);
  for (const r of recent ?? []) {
    const row = r as { amount_minor: number; currency: string };
    if (row.currency === 'USD') last30Usd += row.amount_minor;
    if (row.currency === 'INR') last30Inr += row.amount_minor;
  }

  res.json({
    rows: rows ?? [],
    totals: {
      users: (rows ?? []).length,
      activePaid,
      pastDue,
      trialing,
      canceled,
      last30dUsdMinor: last30Usd,
      last30dInrMinor: last30Inr,
    },
  });
});

adminRouter.get('/billing/payments', async (req: Request, res: Response) => {
  const supa = getServiceClient();
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const userId = typeof req.query.user_id === 'string' ? req.query.user_id : null;
  let q = supa
    .from('payments')
    .select(
      'id, user_id, amount_minor, currency, status, plan, description, receipt_url, invoice_url, payment_method, failure_reason, occurred_at, dodo_payment_id, dodo_customer_id',
    )
    .order('occurred_at', { ascending: false })
    .limit(limit);
  if (userId) q = q.eq('user_id', userId);
  const { data, error } = await q;
  if (error) throw error;

  const ids = Array.from(new Set((data ?? []).map((r) => (r as { user_id: string | null }).user_id).filter(Boolean))) as string[];
  const emailById = new Map<string, string>();
  if (ids.length > 0) {
    const { data: profs } = await supa
      .from('profiles')
      .select('id, email, full_name')
      .in('id', ids);
    for (const p of profs ?? []) {
      const row = p as { id: string; email: string; full_name: string | null };
      emailById.set(row.id, row.email);
    }
  }
  const out = (data ?? []).map((r) => {
    const row = r as Record<string, unknown> & { user_id: string | null };
    return {
      ...row,
      email: row.user_id ? emailById.get(row.user_id) ?? null : null,
    };
  });

  res.json({ payments: out });
});

// Hard-delete a user. Cascades through public.profiles + auth.users + every
// FK with on-delete cascade (projects, topic_queue, notification_reads, etc).
adminRouter.delete('/users/:id', async (req: Request, res: Response) => {
  const { user } = req as AuthedRequest;
  const targetId = req.params.id;

  if (targetId === user.id) {
    res.status(400).json({ error: 'You cannot delete your own account here.' });
    return;
  }

  const supa = getServiceClient();
  // Block deletion of other admins as a safety net — they must be demoted
  // first. Avoids "I clicked the wrong row" disasters.
  const { data: target } = await supa
    .from('profiles')
    .select('is_admin, email')
    .eq('id', targetId)
    .single();
  if ((target as { is_admin?: boolean } | null)?.is_admin) {
    res.status(400).json({ error: 'Demote this admin before deleting.' });
    return;
  }

  // Use the Supabase Auth admin API to remove the auth user. Cascades into
  // public.profiles via the FK on profiles.id.
  const { error } = await supa.auth.admin.deleteUser(targetId);
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(204).end();
});
