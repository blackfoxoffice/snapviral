// Catch-all router for all SnapViral API endpoints — consolidated into a
// single Vercel serverless function to stay under the Hobby plan's 12-function
// limit. Static files in api/billing/, api/admin/billing/, api/admin/setup-*
// take precedence; everything else lands here.
import {
  fail,
  requireUser,
  requireAdmin,
  supabaseAnon,
  type VercelRequest,
  type VercelResponse,
} from './_lib.js';

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
  // Pull the path from the URL — req.query.path can be empty depending on
  // how Vercel resolves the catch-all + rewrites.
  const fullUrl = (req as any).url ?? '';
  const pathOnly = fullUrl.split('?')[0] ?? '';
  // Strip leading `/api/` (or `/api`) so we work with just the route.
  const stripped = pathOnly.replace(/^\/api\/?/, '');
  const segments = stripped ? stripped.split('/').filter(Boolean) : [];
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

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return fail(res, 500, 'ELEVENLABS_API_KEY not configured');

  const language = (req.query.language as string) ?? 'ta';
  const pageSize = Math.min(Number(req.query.page_size) || 20, 50);

  const url = new URL('https://api.elevenlabs.io/v1/shared-voices');
  url.searchParams.set('language', language);
  url.searchParams.set('page_size', String(pageSize));

  const elRes = await fetch(url.toString(), { headers: { 'xi-api-key': apiKey } });
  if (!elRes.ok) {
    const text = await elRes.text();
    return fail(res, elRes.status, `ElevenLabs error: ${text}`);
  }

  const data = (await elRes.json()) as {
    voices: Array<{
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
    total_count: number;
  };

  const voices = data.voices
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

  res.status(200).json({ voices, total_count: data.total_count });
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
