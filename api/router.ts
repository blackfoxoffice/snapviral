// Catch-all router for all SnapViral API endpoints — consolidated into a
// single Vercel serverless function to stay under the Hobby plan's 12-function
// limit. Static files in api/billing/, api/admin/billing/, api/admin/setup-*
// take precedence; everything else lands here.
import {
  fail,
  requireUser,
  requireAdmin,
  supabaseAnon,
  WEB_BASE_URL,
  SUPABASE_URL,
  type VercelRequest,
  type VercelResponse,
} from './_lib.js';
import { createClient } from '@supabase/supabase-js';

// Allow up to 60s — needed for the Sonar Pro Search path (live web research).
// Hobby plan's hard cap. Fast paths (gpt-4o-mini) return in 2-5s.
export const config = { maxDuration: 60 };

// Long-running pipeline routes proxy to the Railway worker (apps/api) that
// runs FFmpeg + the full ingest→compose pipeline. Vercel functions can't
// run that work themselves (60s cap, no FFmpeg binary).
const WORKER_BASE = (
  process.env.PIPELINE_WORKER_URL ?? 'https://newsflow-api-production.up.railway.app'
).replace(/\/$/, '');

async function proxyToWorker(
  req: VercelRequest,
  res: VercelResponse,
  upstreamPath: string,
): Promise<void> {
  const url = WORKER_BASE + upstreamPath;
  const method = (req.method ?? 'GET').toUpperCase();
  const auth = (req.headers.authorization ?? req.headers.Authorization) as string | undefined;
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (auth) headers.authorization = auth;

  const body =
    method === 'GET' || method === 'HEAD'
      ? undefined
      : typeof req.body === 'string'
        ? req.body
        : JSON.stringify(req.body ?? {});

  const upstream = await fetch(url, { method, headers, body });
  const text = await upstream.text();
  res.status(upstream.status);
  const ct = upstream.headers.get('content-type');
  if (ct) res.setHeader('content-type', ct);
  res.send(text);
}

// =====================================================================
// Helpers
// =====================================================================
function readMinutes(md: string): number {
  const words = md.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function uniqueSlug(supa: any, base: string, ignoreId?: string): Promise<string> {
  const { data } = await supa.from('blog_posts').select('id, slug').ilike('slug', `${base}%`);
  const taken = new Set(
    (data ?? [])
      .filter((r: { id: string }) => !ignoreId || r.id !== ignoreId)
      .map((r: { slug: string }) => r.slug),
  );
  if (!taken.has(base)) return base;
  for (let i = 2; i < 10_000; i++) {
    const next = `${base}-${i}`;
    if (!taken.has(next)) return next;
  }
  return `${base}-${Math.random().toString(36).slice(2, 8)}`;
}

// =====================================================================
// Main handler — pulls the URL path, dispatches to the right route.
// =====================================================================
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // The vercel.json rewrite carries the original path in `_p`. Fall back to
  // the request URL for direct hits.
  const rawP = (req.query as Record<string, string | string[] | undefined>)._p;
  const fromQuery = Array.isArray(rawP) ? rawP.join('/') : rawP;
  let routePath: string = fromQuery ?? '';
  if (!routePath) {
    const fullUrl = (req as any).url ?? '';
    const pathOnly = fullUrl.split('?')[0] ?? '';
    routePath = pathOnly.replace(/^\/api\/?/, '');
  }
  const segments = routePath ? routePath.split('/').filter(Boolean) : [];
  const path = '/' + segments.join('/');
  const method = (req.method ?? 'GET').toUpperCase();

  try {
    // ---- Public endpoints (no auth) ----
    if (path === '/blog/posts' && method === 'GET') return await listPublishedPosts(req, res);
    if (path.startsWith('/blog/posts/') && method === 'GET') {
      const slug = segments[2] ?? '';
      return await getPublishedPost(req, res, slug);
    }

    // ---- Auth-required endpoints ----
    if (path === '/voices' && method === 'GET') return await getVoices(req, res);
    if (path === '/projects' && method === 'GET') return await listProjects(req, res);
    if (path === '/projects' && method === 'POST') return await createProject(req, res);
    if (path.startsWith('/projects/') && segments.length === 2) {
      const id = segments[1] ?? '';
      if (method === 'GET') return await getProject(req, res, id);
      if (method === 'DELETE') return await deleteProject(req, res, id);
    }
    if (
      path.startsWith('/projects/') &&
      segments.length === 3 &&
      segments[2] === 'download' &&
      method === 'GET'
    ) {
      return await getDownloadUrl(req, res, segments[1] ?? '');
    }
    if (
      path.startsWith('/projects/') &&
      segments.length === 3 &&
      segments[2] === 'generate' &&
      method === 'POST'
    ) {
      // Forward to the Railway worker which runs the full pipeline.
      return await proxyToWorker(req, res, `/api/projects/${segments[1]}/generate`);
    }

    // Pipeline status / job inspection lives on the worker too.
    if (path.startsWith('/pipeline/')) {
      return await proxyToWorker(req, res, `/api${path}`);
    }

    // ---- YouTube OAuth Connection (Vercel) ----
    if (path === '/youtube/auth-url' && method === 'GET') return await getYouTubeAuthUrlRoute(req, res);
    if (path === '/youtube/callback' && method === 'GET') return await youtubeCallbackRoute(req, res);
    if (path === '/youtube/status' && method === 'GET') return await youtubeStatusRoute(req, res);
    if (path === '/youtube/disconnect' && method === 'DELETE') return await youtubeDisconnectRoute(req, res);

    // YouTube upload endpoint still needs the worker (it downloads video and pushes to YT)
    if (path.startsWith('/youtube/')) {
      return await proxyToWorker(req, res, `/api${path}`);
    }
    // Automation + scheduling endpoints we haven't ported to Vercel.
    if (path.startsWith('/automation/') &&
        path !== '/automation/topic-categories' &&
        path !== '/automation/generate-topics' &&
        path !== '/automation/ai-write') {
      return await proxyToWorker(req, res, `/api${path}`);
    }
    if (path === '/dashboard/stats' && method === 'GET') return await dashboardStats(req, res);

    // ---- Notifications (user) ----
    if (path === '/notifications' && method === 'GET') return await listNotifications(req, res);
    if (path === '/notifications/mark-all-read' && method === 'POST')
      return await markAllRead(req, res);
    if (path.startsWith('/notifications/') && segments[2] === 'read' && method === 'POST') {
      return await markRead(req, res, segments[1] ?? '');
    }

    // ---- Notifications (admin) ----
    if (path === '/notifications/admin' && method === 'GET')
      return await listAdminNotifications(req, res);
    if (path === '/notifications/admin' && method === 'POST')
      return await createAdminNotification(req, res);
    if (
      path.startsWith('/notifications/admin/') &&
      segments.length === 3
    ) {
      const id = segments[2] ?? '';
      if (method === 'PATCH') return await updateAdminNotification(req, res, id);
      if (method === 'DELETE') return await deleteAdminNotification(req, res, id);
    }
    if (
      path.startsWith('/notifications/admin/') &&
      segments[3] === 'send' &&
      method === 'POST'
    ) {
      return await sendAdminNotification(req, res, segments[2] ?? '');
    }

    // ---- Automation (topic ideation) ----
    if (path === '/automation/topic-categories' && method === 'GET')
      return await getTopicCategories(req, res);
    if (path === '/automation/generate-topics' && method === 'POST')
      return await generateTopicsRoute(req, res);
    if (path === '/automation/ai-write' && method === 'POST')
      return await aiWriteRoute(req, res);

    // ---- Admin secrets (vault-backed) ----
    if (path === '/admin/secrets' && method === 'GET') return await listAdminSecretsRoute(req, res);
    if (path === '/admin/secrets' && method === 'POST') return await createAdminSecretRoute(req, res);
    if (
      path.startsWith('/admin/secrets/') &&
      segments[3] === 'rotate' &&
      method === 'POST'
    ) {
      return await rotateAdminSecretRoute(req, res, decodeURIComponent(segments[2] ?? ''));
    }
    if (path.startsWith('/admin/secrets/') && segments.length === 3 && method === 'DELETE') {
      return await deleteAdminSecretRoute(req, res, decodeURIComponent(segments[2] ?? ''));
    }

    // ---- Blog (admin) ----
    if (path === '/blog/admin/posts' && method === 'GET') return await listAdminPosts(req, res);
    if (path === '/blog/admin/posts' && method === 'POST') return await createBlogPost(req, res);
    if (path.startsWith('/blog/admin/posts/') && segments.length === 4) {
      const id = segments[3] ?? '';
      if (method === 'GET') return await getAdminPost(req, res, id);
      if (method === 'PATCH') return await patchBlogPost(req, res, id);
      if (method === 'DELETE') return await deleteBlogPost(req, res, id);
    }

    return fail(res, 404, `route_not_found: ${method} ${path}`);
  } catch (e: any) {
    return fail(res, 500, e?.message ?? 'internal_error');
  }
}

// =====================================================================
// Voices — proxy ElevenLabs shared-voices
// =====================================================================
async function getVoices(req: VercelRequest, res: VercelResponse) {
  const r = await requireUser(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { supa } = r;

  const language = (req.query.language as string) ?? 'ta';
  const pageSize = Math.min(Number(req.query.page_size) || 20, 50);

  // The ElevenLabs API key lives encrypted in vault (app_secrets WHERE
  // key_name='ELEVENLABS_API_KEY'). The RPC reads the decrypted value,
  // calls ElevenLabs via the http extension, returns the JSON.
  const { data, error } = await supa.rpc('el_get_shared_voices', {
    p_language: language,
    p_page_size: pageSize,
  });
  if (error) {
    if (error.message?.includes('elevenlabs_key_not_set')) {
      return fail(
        res,
        503,
        'elevenlabs_key_not_set: ask an admin to set ELEVENLABS_API_KEY at /admin/secrets',
      );
    }
    return fail(res, 500, error.message ?? 'voices_fetch_failed');
  }

  const json = (data ?? {}) as {
    voices?: Array<{
      voice_id: string;
      name: string;
      gender: string;
      age: string;
      accent: string;
      use_case: string;
      description: string | null;
      preview_url: string | null;
      category: string;
    }>;
    total_count?: number;
  };

  const voices = (json.voices ?? [])
    .filter((v) => v.preview_url)
    .map((v) => ({
      voice_id: v.voice_id,
      name: v.name,
      gender: v.gender,
      age: v.age,
      accent: v.accent,
      use_case: v.use_case,
      description: v.description,
      preview_url: v.preview_url,
      category: v.category,
    }));

  res.status(200).json({ voices, total_count: json.total_count ?? 0 });
}

// =====================================================================
// Projects
// =====================================================================
async function listProjects(req: VercelRequest, res: VercelResponse) {
  const r = await requireUser(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { user, supa } = r;
  const { data, error } = await supa
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) return fail(res, 500, error.message);
  res.status(200).json(data ?? []);
}

async function createProject(req: VercelRequest, res: VercelResponse) {
  const r = await requireUser(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { user, supa } = r;

  const body = (req.body ?? {}) as {
    title?: string;
    topic?: string | null;
    language?: string;
    duration_seconds?: number;
    input_mode?: 'urls' | 'script' | 'topic' | 'research';
    source_urls?: string[] | null;
    user_script?: string | null;
    voice_id?: string | null;
    image_style?: string;
  };

  if (!body.title || !body.language || !body.duration_seconds || !body.input_mode) {
    return fail(res, 400, 'missing_fields');
  }

  const { data: profile } = await supa
    .from('profiles')
    .select('logo_path')
    .eq('id', user.id)
    .single();

  const { data, error } = await supa
    .from('projects')
    .insert({
      user_id: user.id,
      title: body.title,
      topic: body.topic ?? null,
      language: body.language,
      duration_seconds: body.duration_seconds,
      input_mode: body.input_mode,
      source_urls: body.input_mode === 'urls' ? body.source_urls ?? null : null,
      user_script:
        body.input_mode === 'script'
          ? body.user_script ?? null
          : body.input_mode === 'research'
            ? body.user_script ?? null
            : null,
      voice_id: body.voice_id ?? null,
      image_style: body.image_style ?? 'realistic',
      logo_path: (profile as { logo_path?: string } | null)?.logo_path ?? null,
      status: 'draft',
    })
    .select()
    .single();

  if (error) return fail(res, 500, error.message);
  res.status(201).json(data);
}

async function getProject(req: VercelRequest, res: VercelResponse, id: string) {
  if (!id) return fail(res, 400, 'missing_id');
  const r = await requireUser(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { user, supa } = r;

  const [projectResult, jobsResult, assetsResult] = await Promise.all([
    supa.from('projects').select('*').eq('id', id).eq('user_id', user.id).single(),
    supa.from('pipeline_jobs').select('*').eq('project_id', id).order('created_at'),
    supa.from('assets').select('*').eq('project_id', id).order('created_at'),
  ]);
  if (projectResult.error) return fail(res, 404, 'not_found');

  res.status(200).json({
    ...projectResult.data,
    jobs: jobsResult.data ?? [],
    assets: assetsResult.data ?? [],
  });
}

async function deleteProject(req: VercelRequest, res: VercelResponse, id: string) {
  if (!id) return fail(res, 400, 'missing_id');
  const r = await requireUser(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { user, supa } = r;

  const { error } = await supa.from('projects').delete().eq('id', id).eq('user_id', user.id);
  if (error) return fail(res, 500, error.message);
  res.status(204).end();
}

async function getDownloadUrl(req: VercelRequest, res: VercelResponse, id: string) {
  if (!id) return fail(res, 400, 'missing_id');
  const r = await requireUser(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { user, supa } = r;

  const { data: project, error } = await supa
    .from('projects')
    .select('final_video_path, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !project?.final_video_path) {
    return fail(res, 404, 'video_not_ready');
  }

  const { data: signed, error: signErr } = await supa.storage
    .from('project-assets')
    .createSignedUrl(project.final_video_path, 60 * 60);

  if (signErr || !signed) {
    return fail(res, 500, 'sign_failed');
  }

  res.status(200).json({ url: signed.signedUrl });
}

/**
 * POST /projects/[id]/generate — kicks off the script → images → voice →
 * compose pipeline. The full pipeline does FFmpeg video assembly which
 * cannot run inside a Vercel serverless function (no FFmpeg binary, 60s
 * runtime cap on Hobby). Until a worker host is connected, mark the
 * project as failed with an explanatory error so the UI shows something
 * meaningful instead of a silent timeout.
 */
async function generateProjectStub(req: VercelRequest, res: VercelResponse, id: string) {
  if (!id) return fail(res, 400, 'missing_id');
  const r = await requireUser(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { user, supa } = r;

  const errorMessage =
    'Video generation worker is not deployed. The script + image + voice pipeline ' +
    'requires FFmpeg + a long-running host (5-15 min per video) which Vercel ' +
    'serverless functions cannot run. An admin needs to deploy apps/api to a ' +
    'worker host (Render / Fly / Railway) and wire it up.';

  await supa
    .from('projects')
    .update({
      status: 'failed',
      error: errorMessage,
      finished_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id);

  return fail(res, 501, errorMessage);
}

// =====================================================================
// Dashboard stats
// =====================================================================
async function dashboardStats(req: VercelRequest, res: VercelResponse) {
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

// =====================================================================
// Notifications — user
// =====================================================================
async function listNotifications(req: VercelRequest, res: VercelResponse) {
  const r = await requireUser(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { user, supa } = r;

  const { data, error } = await supa
    .from('notifications')
    .select(
      'id, title, body, kind, audience, cta_label, cta_url, icon, accent, sent_at, created_at',
    )
    .not('sent_at', 'is', null)
    .order('sent_at', { ascending: false })
    .limit(50);
  if (error) return fail(res, 500, error.message);

  const ids = (data ?? []).map((n) => (n as { id: string }).id);
  let readSet = new Set<string>();
  if (ids.length > 0) {
    const { data: reads } = await supa
      .from('notification_reads')
      .select('notification_id')
      .eq('user_id', user.id)
      .in('notification_id', ids);
    readSet = new Set(
      (reads ?? []).map((row) => (row as { notification_id: string }).notification_id),
    );
  }

  const { data: profile } = await supa
    .from('profiles')
    .select('is_admin, plan')
    .eq('id', user.id)
    .single();
  const isAdmin = Boolean((profile as { is_admin?: boolean } | null)?.is_admin);
  const plan = String((profile as { plan?: string } | null)?.plan ?? 'free');

  const list = (data ?? [])
    .map((n) => {
      const row = n as Record<string, unknown> & { id: string; audience: string };
      return { ...row, read: readSet.has(row.id) };
    })
    .filter((n) => {
      const a = (n as { audience: string }).audience;
      if (a === 'all') return true;
      if (a === 'admins') return isAdmin;
      if (a === 'free') return plan === 'free';
      if (a === 'paid') return plan !== 'free';
      return false;
    });

  res.status(200).json({ notifications: list, unread: list.filter((n) => !n.read).length });
}

async function markRead(req: VercelRequest, res: VercelResponse, id: string) {
  if (!id) return fail(res, 400, 'missing_id');
  const r = await requireUser(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { user, supa } = r;
  const { error } = await supa
    .from('notification_reads')
    .upsert(
      { notification_id: id, user_id: user.id },
      { onConflict: 'notification_id,user_id' },
    );
  if (error) return fail(res, 500, error.message);
  res.status(204).end();
}

async function markAllRead(req: VercelRequest, res: VercelResponse) {
  const r = await requireUser(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { user, supa } = r;
  const { data: notifs } = await supa
    .from('notifications')
    .select('id')
    .not('sent_at', 'is', null);
  const ids = (notifs ?? []).map((n) => (n as { id: string }).id);
  if (ids.length === 0) return res.status(200).json({ marked: 0 });

  const { data: existing } = await supa
    .from('notification_reads')
    .select('notification_id')
    .eq('user_id', user.id)
    .in('notification_id', ids);
  const already = new Set(
    (existing ?? []).map((row) => (row as { notification_id: string }).notification_id),
  );
  const toInsert = ids
    .filter((id) => !already.has(id))
    .map((id) => ({ notification_id: id, user_id: user.id }));

  if (toInsert.length > 0) {
    const { error } = await supa.from('notification_reads').insert(toInsert);
    if (error) return fail(res, 500, error.message);
  }
  res.status(200).json({ marked: toInsert.length });
}

// =====================================================================
// Notifications — admin
// =====================================================================
async function listAdminNotifications(req: VercelRequest, res: VercelResponse) {
  const r = await requireAdmin(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { supa } = r;

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
  res.status(200).json({ notifications: out });
}

async function createAdminNotification(req: VercelRequest, res: VercelResponse) {
  const r = await requireAdmin(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { user, supa } = r;

  const body = (req.body ?? {}) as {
    title?: string;
    body?: string;
    kind?: string;
    audience?: string;
    cta_label?: string | null;
    cta_url?: string | null;
    icon?: string | null;
    accent?: string | null;
    scheduled_at?: string | null;
    send_now?: boolean;
  };

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
  res.status(200).json(data);
}

async function updateAdminNotification(
  req: VercelRequest,
  res: VercelResponse,
  id: string,
) {
  if (!id) return fail(res, 400, 'missing_id');
  const r = await requireAdmin(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { supa } = r;

  const body = (req.body ?? {}) as Record<string, any>;
  const update: Record<string, unknown> = {};
  for (const k of [
    'title',
    'body',
    'kind',
    'audience',
    'cta_label',
    'cta_url',
    'icon',
    'accent',
    'scheduled_at',
  ] as const) {
    if (body[k] !== undefined) {
      const v = body[k];
      update[k] = typeof v === 'string' ? v.trim() || null : v;
    }
  }
  const { data, error } = await supa
    .from('notifications')
    .update(update)
    .eq('id', id)
    .select()
    .single();
  if (error || !data) return fail(res, 500, error?.message ?? 'update failed');
  res.status(200).json(data);
}

async function deleteAdminNotification(
  req: VercelRequest,
  res: VercelResponse,
  id: string,
) {
  if (!id) return fail(res, 400, 'missing_id');
  const r = await requireAdmin(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { supa } = r;
  const { error } = await supa.from('notifications').delete().eq('id', id);
  if (error) return fail(res, 500, error.message);
  res.status(204).end();
}

async function sendAdminNotification(
  req: VercelRequest,
  res: VercelResponse,
  id: string,
) {
  if (!id) return fail(res, 400, 'missing_id');
  const r = await requireAdmin(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { supa } = r;
  const { data, error } = await supa
    .from('notifications')
    .update({ sent_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error || !data) return fail(res, 500, error?.message ?? 'send failed');
  res.status(200).json(data);
}

// =====================================================================
// Blog — public
// =====================================================================
async function listPublishedPosts(req: VercelRequest, res: VercelResponse) {
  const supa = supabaseAnon();
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const tag = typeof req.query.tag === 'string' ? req.query.tag : undefined;

  let q = supa
    .from('blog_posts')
    .select(
      'id, slug, title, excerpt, cover_image_url, tags, read_minutes, view_count, published_at',
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit);
  if (tag) q = q.contains('tags', [tag]);

  const { data, error } = await q;
  if (error) return fail(res, 500, error.message);
  res.status(200).json({ posts: data ?? [] });
}

async function getPublishedPost(req: VercelRequest, res: VercelResponse, slug: string) {
  if (!slug) return fail(res, 400, 'missing_slug');
  const supa = supabaseAnon();
  const { data, error } = await supa
    .from('blog_posts')
    .select(
      'id, slug, title, excerpt, content_md, cover_image_url, tags, read_minutes, view_count, published_at',
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .single();
  if (error || !data) return fail(res, 404, 'not_found');

  supa.rpc('blog_increment_view', { p_slug: slug }).then(
    () => {},
    () => {},
  );

  res.status(200).json(data);
}

// =====================================================================
// Blog — admin
// =====================================================================
async function listAdminPosts(req: VercelRequest, res: VercelResponse) {
  const r = await requireAdmin(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { supa } = r;

  const { data, error } = await supa
    .from('blog_posts')
    .select(
      'id, slug, title, excerpt, status, tags, read_minutes, view_count, created_at, updated_at, published_at',
    )
    .order('updated_at', { ascending: false });
  if (error) return fail(res, 500, error.message);
  res.status(200).json({ posts: data ?? [] });
}

async function getAdminPost(req: VercelRequest, res: VercelResponse, id: string) {
  if (!id) return fail(res, 400, 'missing_id');
  const r = await requireAdmin(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { supa } = r;
  const { data, error } = await supa.from('blog_posts').select('*').eq('id', id).single();
  if (error || !data) return fail(res, 404, 'not_found');
  res.status(200).json(data);
}

async function createBlogPost(req: VercelRequest, res: VercelResponse) {
  const r = await requireAdmin(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { user, supa } = r;

  const body = (req.body ?? {}) as {
    slug?: string;
    title?: string;
    excerpt?: string | null;
    content_md?: string;
    cover_image_url?: string | null;
    status?: 'draft' | 'published';
    tags?: string[];
  };

  if (!body.title || !body.content_md) {
    return fail(res, 400, 'title and content_md required');
  }

  const desired = (body.slug && body.slug.trim()) || slugify(body.title);
  const slug = await uniqueSlug(supa, desired);
  const status = body.status === 'published' ? 'published' : 'draft';

  const { data, error } = await supa
    .from('blog_posts')
    .insert({
      slug,
      title: body.title,
      excerpt: body.excerpt ?? null,
      content_md: body.content_md,
      cover_image_url: body.cover_image_url ?? null,
      status,
      tags: body.tags ?? [],
      author_id: user.id,
      read_minutes: readMinutes(body.content_md),
      published_at: status === 'published' ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) return fail(res, 500, error.message);
  res.status(200).json(data);
}

async function patchBlogPost(req: VercelRequest, res: VercelResponse, id: string) {
  if (!id) return fail(res, 400, 'missing_id');
  const r = await requireAdmin(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { supa } = r;

  const body = (req.body ?? {}) as Record<string, any>;
  const { data: current } = await supa
    .from('blog_posts')
    .select('status, published_at')
    .eq('id', id)
    .single();
  if (!current) return fail(res, 404, 'not_found');

  const update: Record<string, unknown> = {};
  if (body.slug !== undefined) {
    const wanted = body.slug.trim() ? slugify(body.slug) : slugify(body.title ?? 'untitled');
    update.slug = await uniqueSlug(supa, wanted, id);
  }
  if (body.title !== undefined) update.title = body.title;
  if (body.excerpt !== undefined) update.excerpt = body.excerpt;
  if (body.content_md !== undefined) {
    update.content_md = body.content_md;
    update.read_minutes = readMinutes(body.content_md);
  }
  if (body.cover_image_url !== undefined) update.cover_image_url = body.cover_image_url;
  if (body.tags !== undefined) update.tags = body.tags;
  if (body.status !== undefined) {
    update.status = body.status;
    if (body.status === 'published' && (current as { status?: string }).status !== 'published') {
      update.published_at = new Date().toISOString();
    }
  }

  const { data, error } = await supa
    .from('blog_posts')
    .update(update)
    .eq('id', id)
    .select()
    .single();
  if (error) {
    if ((error as { code?: string }).code === '23505') return fail(res, 409, 'slug_taken');
    return fail(res, 500, error.message);
  }
  res.status(200).json(data);
}

async function deleteBlogPost(req: VercelRequest, res: VercelResponse, id: string) {
  if (!id) return fail(res, 400, 'missing_id');
  const r = await requireAdmin(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { supa } = r;
  const { error } = await supa.from('blog_posts').delete().eq('id', id);
  if (error) return fail(res, 500, error.message);
  res.status(204).end();
}

// =====================================================================
// Automation — Topic categories + AI topic generation (OpenRouter)
// =====================================================================
type TopicCategoryKey =
  | 'trending_news'
  | 'bible_stories'
  | 'random_ai_story'
  | 'travel_destinations'
  | 'what_if'
  | 'scary_stories'
  | 'bedtime_stories'
  | 'interesting_history'
  | 'urban_legends'
  | 'motivational'
  | 'fun_facts'
  | 'long_form_jokes'
  | 'life_pro_tips'
  | 'eli5'
  | 'mythology'
  | 'philosophy'
  | 'finance_tips';

interface CategorySpec {
  label: string;
  systemFraming: string;
  userPrompt: string;
  formHint: string;
  isLive: boolean;
}

const CATEGORIES: Record<TopicCategoryKey, CategorySpec> = {
  trending_news: {
    label: 'Trending news',
    systemFraming:
      "You are a news editor helping a creator stock their content queue. Search the live web for what's trending RIGHT NOW across general news, politics, tech, sports, entertainment, and India local.",
    userPrompt: 'Trending news topics',
    formHint: 'a single short news headline (8-15 words). Declarative. No question marks.',
    isLive: true,
  },
  bible_stories: {
    label: 'Bible stories',
    systemFraming:
      'You are a content strategist for a creator who tells classic Bible stories in short-form video. Pick well-known and lesser-known stories that teach a moral or have dramatic narrative tension.',
    userPrompt: 'Bible story topics for short-form video',
    formHint: 'a story title and angle',
    isLive: false,
  },
  random_ai_story: {
    label: 'Random AI story',
    systemFraming:
      'You are a creative writer who invents original short-form video story premises. Mix genres — sci-fi, mystery, drama, magical realism. Each premise should hook a viewer in the first sentence.',
    userPrompt: 'Random original story premises',
    formHint: 'a one-line story premise (8-18 words) that opens with a hook',
    isLive: false,
  },
  travel_destinations: {
    label: 'Travel destinations',
    systemFraming:
      'You are a travel editor helping a creator who covers underrated and famous destinations. Mix budget gems, hidden spots, and bucket-list places.',
    userPrompt: 'Travel destination topics for short-form video',
    formHint: 'a destination + one-line angle',
    isLive: true,
  },
  what_if: {
    label: 'What if?',
    systemFraming:
      'You are a creative writer specializing in "What if" thought experiments — counterfactuals about history, science, society, technology. Each prompt should make a viewer want to know the answer.',
    userPrompt: '"What if" thought-experiment topics',
    formHint: 'a "What if..." question (10-18 words)',
    isLive: false,
  },
  scary_stories: {
    label: 'Scary stories',
    systemFraming:
      'You are a horror writer who pitches short-form scary story ideas. Real-feeling, unsettling, no gore — atmospheric dread. Mix urban legends, paranormal encounters, and unexplained mysteries.',
    userPrompt: 'Scary / horror story topics for short-form video',
    formHint: 'a story title with a chilling hook',
    isLive: false,
  },
  bedtime_stories: {
    label: 'Bedtime stories',
    systemFraming:
      "You are a children's author. Pitch calming, kind bedtime story ideas — animals, gentle moral lessons, magical worlds, no scares. Suitable for ages 4-10.",
    userPrompt: 'Calming bedtime story ideas for kids',
    formHint: 'a gentle story title with a one-line summary',
    isLive: false,
  },
  interesting_history: {
    label: 'Interesting history',
    systemFraming:
      'You are a history nerd who pitches under-the-radar historical stories that read like a thriller. Avoid the obvious greatest-hits — find the strange, specific, surprising stories.',
    userPrompt: 'Fascinating but lesser-known history topics',
    formHint: 'a historical event + angle',
    isLive: false,
  },
  urban_legends: {
    label: 'Urban legends',
    systemFraming:
      'You are a folklorist who collects regional urban legends from around the world — especially South Asia, Latin America, East Asia. Real folklore, not internet creepypasta.',
    userPrompt: 'Real urban legend topics from world folklore',
    formHint: 'a legend name + one-line hook',
    isLive: false,
  },
  motivational: {
    label: 'Motivational',
    systemFraming:
      'You are a content strategist for a motivational creator. Pitch sharp, specific topics — not platitudes. Stories of resilience, useful frames, lessons from real lives.',
    userPrompt: 'Motivational topics with a specific angle',
    formHint: 'a punchy headline (no clichés like "follow your dreams")',
    isLive: false,
  },
  fun_facts: {
    label: 'Fun facts',
    systemFraming:
      'You are a science communicator pitching genuinely surprising facts that most people do not know. Verifiable, specific, counterintuitive. No "did you know" pre-amble.',
    userPrompt: 'Surprising and verifiable fun facts',
    formHint: 'a one-line fact that ends with the surprise',
    isLive: false,
  },
  long_form_jokes: {
    label: 'Long-form jokes',
    systemFraming:
      'You are a stand-up writer pitching long-form joke setups for short-form video. The setup should land in 30-45 seconds with a clean punchline. PG-13. No edgy/offensive humor.',
    userPrompt: 'Long-form joke setups',
    formHint: 'a joke title or one-line setup',
    isLive: false,
  },
  life_pro_tips: {
    label: 'Life pro tips',
    systemFraming:
      'You are a productivity / life-hack writer. Pitch specific, useful, non-obvious tips. Each should be actionable today. No generic advice.',
    userPrompt: 'Life pro tips that are non-obvious',
    formHint: 'a sharp tip',
    isLive: false,
  },
  eli5: {
    label: 'ELI5',
    systemFraming:
      "You are an explainer writer pitching \"Explain Like I'm 5\" topics. Pick complex concepts that beg a clear, simple explanation — economics, physics, biology, computing, geopolitics.",
    userPrompt: 'ELI5 explainer topics',
    formHint: 'a topic phrased as "ELI5: how does X work?"',
    isLive: false,
  },
  mythology: {
    label: 'Mythology',
    systemFraming:
      'You are a comparative-mythology writer. Pitch stories from Indian, Greek, Norse, Egyptian, Japanese, African and Mesoamerican myth. Mix famous and obscure.',
    userPrompt: 'Mythology story topics from world traditions',
    formHint: 'a myth title + tradition',
    isLive: false,
  },
  philosophy: {
    label: 'Philosophy',
    systemFraming:
      'You are a philosophy explainer pitching big ideas in accessible ways. Cover ethics, metaphysics, eastern + western thought. Each topic should provoke.',
    userPrompt: 'Philosophy topics for short-form video',
    formHint: 'a philosophical question or idea',
    isLive: false,
  },
  finance_tips: {
    label: 'Finance tips',
    systemFraming:
      'You are a financial-literacy writer pitching specific, useful tips for individual investors and savers. India + global context. No get-rich-quick. No specific stock picks.',
    userPrompt: 'Personal finance topics',
    formHint: 'a sharp finance tip or concept',
    isLive: true,
  },
};

const LANG_NAME: Record<string, string> = {
  ta: 'Tamil', hi: 'Hindi', kn: 'Kannada', te: 'Telugu', ml: 'Malayalam',
  bn: 'Bengali', mr: 'Marathi', gu: 'Gujarati', pa: 'Punjabi', ur: 'Urdu',
  en: 'English',
  es: 'Spanish', fr: 'French', de: 'German', it: 'Italian', pt: 'Portuguese',
  nl: 'Dutch', pl: 'Polish', sv: 'Swedish', da: 'Danish', fi: 'Finnish',
  no: 'Norwegian', ro: 'Romanian', hu: 'Hungarian', cs: 'Czech', sk: 'Slovak',
  hr: 'Croatian', bg: 'Bulgarian', el: 'Greek', tr: 'Turkish', ru: 'Russian',
  uk: 'Ukrainian',
  ar: 'Arabic',
  zh: 'Chinese', ja: 'Japanese', ko: 'Korean',
  vi: 'Vietnamese', id: 'Indonesian', ms: 'Malay', fil: 'Filipino',
};

async function getTopicCategories(_req: VercelRequest, res: VercelResponse) {
  const categories = (Object.entries(CATEGORIES) as [TopicCategoryKey, CategorySpec][])
    .map(([key, spec]) => ({ key, label: spec.label }));
  res.status(200).json({ categories });
}

/**
 * All OpenRouter calls run through the `ai_call_openrouter(jsonb)` SECURITY
 * DEFINER RPC. The OpenRouter API key lives encrypted in Supabase Vault
 * (referenced by public.app_secrets WHERE key_name='OPENROUTER_API_KEY').
 * The key never leaves Postgres — we send it the request body, it makes the
 * outbound HTTP call, and returns the decoded JSON response.
 */
async function callOpenRouter(
  reqExpress: VercelRequest,
  args: {
    systemPrompt: string;
    userPrompt: string;
    jsonSchema?: Record<string, unknown>;
    model?: string;
    temperature?: number;
  },
): Promise<string> {
  const r = await requireUser(reqExpress);
  if ('error' in r) throw new Error(r.error.message);
  const { supa } = r;

  const body: Record<string, unknown> = {
    model: args.model ?? 'perplexity/sonar-pro-search',
    messages: [
      { role: 'system', content: args.systemPrompt },
      { role: 'user', content: args.userPrompt },
    ],
    temperature: args.temperature ?? 0.5,
  };
  if (args.jsonSchema) {
    body.response_format = {
      type: 'json_schema',
      json_schema: { name: 'out', schema: args.jsonSchema },
    };
  }

  const { data, error } = await supa.rpc('ai_call_openrouter', { p_body: body });
  if (error) {
    if (error.message?.includes('openrouter_key_not_set')) {
      throw new Error(
        'openrouter_key_not_set: ask an admin to set OPENROUTER_API_KEY at /admin/secrets',
      );
    }
    throw new Error(error.message ?? 'openrouter rpc failed');
  }

  const json = data as { choices?: { message?: { content?: string } }[] };
  const content = json?.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('openrouter returned empty content');
  return content;
}

function stripJsonFences(s: string): string {
  return s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
}

async function generateTopicsRoute(req: VercelRequest, res: VercelResponse) {
  const r = await requireUser(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);

  const body = (req.body ?? {}) as {
    language?: string;
    niche?: string;
    count?: number;
    category?: TopicCategoryKey;
  };
  const language = body.language ?? 'ta';
  if (!LANG_NAME[language]) return fail(res, 400, 'invalid_language');

  const langName = LANG_NAME[language];
  const count = Math.max(3, Math.min(body.count ?? 12, 30));
  const niche = body.niche?.trim();
  const category = (body.category ?? 'trending_news') as TopicCategoryKey;
  const spec = CATEGORIES[category];
  if (!spec) return fail(res, 400, 'invalid_category');

  const nicheClause = niche ? ` focused on "${niche}".` : '';

  // Inject a random twist on every call so the model branches differently
  // each time the user taps the same category pill. Without this, the
  // identical prompt + low temperature = same 3 topics on repeat.
  const TWISTS = [
    'pick something most people have never heard of',
    'take a contrarian angle — challenge the conventional wisdom',
    'lead with a specific number, date, or statistic',
    'focus on the personal/human side of the story',
    'find a surprising historical parallel',
    'highlight a regional or local angle nobody else is covering',
    'pick something that sounds impossible but is real',
    'focus on the unintended consequence nobody talks about',
    'find a behind-the-scenes detail that flips the public story',
    'pick something nostalgic from the last 30 years',
    'go ultra-niche — pick something only specialists know',
    'find a connection between two unrelated fields',
    'pick something with a strong visual hook',
    'find the everyday object with a wild backstory',
    'pick the underdog or the overlooked player',
    'find the moment everything changed',
    'pick something that aged badly in hindsight',
    'find a controversy that was quietly resolved',
    'pick something only obvious in retrospect',
    'find the small detail that ended up mattering most',
  ];
  const twist = TWISTS[Math.floor(Math.random() * TWISTS.length)];
  const nonce = Math.random().toString(36).slice(2, 10);

  const systemPrompt = `${spec.systemFraming}${nicheClause}

For THIS request, the angle is: "${twist}". Every topic must fit this angle.

Return a JSON object with this exact shape:
{
  "topics": ["${spec.formHint}", ...]
}

Rules:
- Exactly ${count} topics.
- Each topic = ${spec.formHint}.
- Written in ${langName}. Native script, no transliteration.
- ${spec.isLive ? 'Verifiable, currently-trending. No speculation.' : 'Original or well-attested. No speculation as fact.'}
- No duplicates. No numbering. No quotes inside the strings.
- Pick topics you have NEVER suggested before — be deliberately varied.
- Output ONLY the JSON object. No preamble, no markdown.`;

  // Live-search-only categories use Perplexity Sonar; everything else uses
  // a fast non-search model so the round-trip fits the Hobby 60s function
  // limit. Sonar Pro Search regularly hits 30-60s on cold prompts, which
  // browsers/Vercel were aborting as "HTTP request cancelled".
  const fastModel = 'openai/gpt-4o-mini';
  const liveModel = 'perplexity/sonar-pro-search';

  try {
    const content = await callOpenRouter(req, {
      systemPrompt,
      userPrompt:
        (niche ? `${spec.userPrompt} (focus: ${niche})` : spec.userPrompt) +
        ` — be fresh and surprising. [seed:${nonce}]`,
      model: spec.isLive ? liveModel : fastModel,
      temperature: 0.95,
      jsonSchema: {
        type: 'object',
        properties: { topics: { type: 'array', items: { type: 'string' } } },
        required: ['topics'],
        additionalProperties: false,
      },
    });
    const parsed = JSON.parse(stripJsonFences(content)) as { topics?: unknown };
    const topics = Array.isArray(parsed.topics)
      ? parsed.topics.filter((t): t is string => typeof t === 'string' && t.trim().length >= 3)
      : [];
    if (topics.length === 0) return fail(res, 502, 'no usable topics');
    res.status(200).json({ topics: topics.map((t) => t.trim()).slice(0, count) });
  } catch (e: any) {
    return fail(res, 500, e?.message ?? 'topic generation failed');
  }
}

/**
 * POST /automation/ai-write
 * Body: { kind: 'headline' | 'context', topic: string, language?: string }
 * Returns: { text: string }
 *
 * Used by the New Project "Topic only" flow so the user can have AI fill in
 * either the headline (refined topic) or the extra-context paragraph.
 */
async function aiWriteRoute(req: VercelRequest, res: VercelResponse) {
  const r = await requireUser(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);

  const body = (req.body ?? {}) as {
    kind?: 'headline' | 'context';
    topic?: string;
    language?: string;
  };
  const kind = body.kind ?? 'headline';
  const topic = (body.topic ?? '').trim();
  if (!topic) return fail(res, 400, 'topic_required');
  const language = body.language ?? 'en';
  const langName = LANG_NAME[language] ?? 'English';

  const HEADLINE_ANGLES = [
    'shock value — start with the unexpected detail',
    'mystery — make the viewer need to know what happens next',
    'authority — frame it like an expert just learned this',
    'contrast — set up an expectation, then break it',
    'urgency — make it feel like news that just broke',
    'curiosity gap — hint at the answer without giving it',
    'specificity — lead with a name, place, or number',
    'controversy — surface the disagreement people care about',
    'human stakes — what does this mean for one person',
    'transformation — what changed or is changing',
  ];
  const angle = HEADLINE_ANGLES[Math.floor(Math.random() * HEADLINE_ANGLES.length)];
  const nonce = Math.random().toString(36).slice(2, 10);

  const systemPrompt =
    kind === 'headline'
      ? `You are a viral short-form video editor. Given a rough topic, write ONE final video headline in ${langName} that hooks the viewer. 8-14 words. Declarative or dramatic. No question marks unless essential. Native script, no transliteration. For THIS headline use the angle: "${angle}". Write a fresh headline — do not reuse phrasing you've used before. Output the headline ONLY — no quotes, no explanation, no markdown.`
      : `You are a senior video editor. Given a video topic, write a single short paragraph (40-80 words) of EXTRA CONTEXT — the specific facts, angles, names, numbers, or perspectives the AI scriptwriter should weave into the script. Concrete and useful, not generic. Pick a fresh angle each call. Plain English. No bullet points. Output the paragraph ONLY — no preamble, no markdown.`;

  try {
    const content = await callOpenRouter(req, {
      systemPrompt,
      userPrompt: `Topic: ${topic} [seed:${nonce}]`,
      model: 'openai/gpt-4o-mini',
      temperature: 0.95,
    });
    const cleaned = content.replace(/^["']|["']$/g, '').trim();
    res.status(200).json({ text: cleaned });
  } catch (e: any) {
    return fail(res, 500, e?.message ?? 'ai write failed');
  }
}

// =====================================================================
// Admin secrets — vault-backed
// =====================================================================
async function listAdminSecretsRoute(req: VercelRequest, res: VercelResponse) {
  const r = await requireAdmin(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { supa } = r;
  // RLS on app_secrets gates this to admins.
  const { data, error } = await supa
    .from('app_secrets')
    .select('key_name, description, last4, created_at, rotated_at')
    .order('key_name');
  if (error) return fail(res, 500, error.message);
  res.status(200).json(data ?? []);
}

async function createAdminSecretRoute(req: VercelRequest, res: VercelResponse) {
  const r = await requireAdmin(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { supa } = r;
  const body = (req.body ?? {}) as { key_name?: string; value?: string; description?: string };
  if (!body.key_name || !body.value) return fail(res, 400, 'key_name_and_value_required');
  const { error } = await supa.rpc('admin_create_secret', {
    p_key_name: body.key_name,
    p_value: body.value,
    p_description: body.description ?? null,
  });
  if (error) return fail(res, 500, error.message);
  res.status(200).json({ ok: true });
}

async function rotateAdminSecretRoute(
  req: VercelRequest,
  res: VercelResponse,
  keyName: string,
) {
  const r = await requireAdmin(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { supa } = r;
  if (!keyName) return fail(res, 400, 'missing_key');
  const body = (req.body ?? {}) as { value?: string };
  if (!body.value) return fail(res, 400, 'value_required');
  const { error } = await supa.rpc('admin_rotate_secret', {
    p_key_name: keyName,
    p_new_value: body.value,
  });
  if (error) return fail(res, 500, error.message);
  res.status(200).json({ ok: true });
}

async function deleteAdminSecretRoute(
  req: VercelRequest,
  res: VercelResponse,
  keyName: string,
) {
  const r = await requireAdmin(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { supa } = r;
  if (!keyName) return fail(res, 400, 'missing_key');
  const { error } = await supa.rpc('admin_delete_secret', { p_key_name: keyName });
  if (error) return fail(res, 500, error.message);
  res.status(204).end();
}

// =====================================================================
// YouTube OAuth Connection
// =====================================================================
function getSupaService() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing in Vercel');
  return createClient(SUPABASE_URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

async function getClientCredentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  let clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!clientSecret) {
    try {
      const supa = getSupaService();
      const { data } = await supa.rpc('read_secret', { secret_name: 'GOOGLE_CLIENT_SECRET' });
      clientSecret = data;
    } catch (e) {
      // Ignore and throw main error below
    }
  }
  
  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required. Make sure they are set in Vercel.');
  }
  return { clientId, clientSecret };
}

async function getYouTubeAuthUrlRoute(req: VercelRequest, res: VercelResponse) {
  const r = await requireUser(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { user } = r;

  try {
    const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? `${WEB_BASE_URL}/api/youtube/callback`;
    const { clientId } = await getClientCredentials();

    const scopes = [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly',
    ].join(' ');

    const stateData = { userId: user.id };
    const stateStr = Buffer.from(JSON.stringify(stateData)).toString('base64');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      access_type: 'offline',
      prompt: 'consent',
      state: stateStr,
    });

    res.status(200).json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
  } catch (e: any) {
    return fail(res, 500, e.message);
  }
}

async function youtubeCallbackRoute(req: VercelRequest, res: VercelResponse) {
  const code = Array.isArray(req.query.code) ? req.query.code[0] : req.query.code;
  const stateB64 = Array.isArray(req.query.state) ? req.query.state[0] : req.query.state;
  const webUrl = WEB_BASE_URL;

  if (!code || !stateB64) {
    return res.setHeader('Location', `${webUrl}/dashboard?error=youtube_auth_failed`).status(302).end();
  }

  let stateObj: { userId: string };
  try {
    stateObj = JSON.parse(Buffer.from(stateB64, 'base64').toString('utf8'));
  } catch (e) {
    return res.setHeader('Location', `${webUrl}/dashboard?error=invalid_state`).status(302).end();
  }
  
  const userId = stateObj.userId;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? `${webUrl}/api/youtube/callback`;

  try {
    const supa = getSupaService();
    const { clientId, clientSecret } = await getClientCredentials();
    
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    
    if (!tokenRes.ok) throw new Error(await tokenRes.text());
    const tokenData = (await tokenRes.json()) as any;

    const access_token = tokenData.access_token;
    const refresh_token = tokenData.refresh_token;
    const expires_in = tokenData.expires_in;

    const chRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!chRes.ok) throw new Error('Failed to fetch channel info');
    const chJson = (await chRes.json()) as any;
    const channelName = chJson.items?.[0]?.snippet?.title ?? 'YouTube Channel';

    const newExpiry = new Date(Date.now() + expires_in * 1000);

    const updateData: Record<string, any> = {
      yt_access_token: access_token,
      yt_token_expires_at: newExpiry.toISOString(),
      yt_channel_name: channelName,
    };
    if (refresh_token) {
      updateData.yt_refresh_token = refresh_token;
    }

    const { error } = await supa
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (error) throw new Error(error.message);

    return res.setHeader('Location', `${webUrl}/dashboard?success=youtube_connected`).status(302).end();
  } catch (e: any) {
    console.error('YouTube callback error:', e);
    return res.setHeader('Location', `${webUrl}/dashboard?error=youtube_auth_failed`).status(302).end();
  }
}

async function youtubeStatusRoute(req: VercelRequest, res: VercelResponse) {
  const r = await requireUser(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { user, supa } = r;

  const { data, error } = await supa
    .from('profiles')
    .select('yt_refresh_token, yt_channel_name')
    .eq('id', user.id)
    .single();

  if (error) return fail(res, 500, error.message);

  const isConnected = !!data?.yt_refresh_token;
  res.status(200).json({
    connected: isConnected,
    channelName: isConnected ? data.yt_channel_name : null,
  });
}

async function youtubeDisconnectRoute(req: VercelRequest, res: VercelResponse) {
  const r = await requireUser(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { user, supa } = r;

  const { error } = await supa
    .from('profiles')
    .update({
      yt_access_token: null,
      yt_refresh_token: null,
      yt_token_expires_at: null,
      yt_channel_name: null,
    })
    .eq('id', user.id);

  if (error) return fail(res, 500, error.message);

  res.status(200).json({ success: true });
}
