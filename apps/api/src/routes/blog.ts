import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, AuthedRequest } from '../middleware/auth.js';
import { getServiceClient } from '../services/supabase.js';

export const blogRouter = Router();

// =====================================================================
// PUBLIC routes (registered BEFORE requireAuth)
// =====================================================================

// List published posts, newest first.
blogRouter.get('/posts', async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const tag = typeof req.query.tag === 'string' ? req.query.tag : undefined;

  const supa = getServiceClient();
  let query = supa
    .from('blog_posts')
    .select('id, slug, title, excerpt, cover_image_url, tags, read_minutes, view_count, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit);
  if (tag) query = query.contains('tags', [tag]);

  const { data, error } = await query;
  if (error) throw error;
  res.json({ posts: data ?? [] });
});

// Get single published post by slug.
blogRouter.get('/posts/:slug', async (req: Request, res: Response) => {
  const slug = req.params.slug;
  const supa = getServiceClient();

  const { data, error } = await supa
    .from('blog_posts')
    .select('id, slug, title, excerpt, content_md, cover_image_url, tags, read_minutes, view_count, published_at')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !data) {
    res.status(404).json({ error: 'not_found' });
    return;
  }

  // Fire-and-forget view bump
  supa.rpc('blog_increment_view', { p_slug: slug }).then(
    () => {},
    () => {},
  );

  res.json(data);
});

// =====================================================================
// ADMIN routes (require auth + is_admin)
// =====================================================================
blogRouter.use(requireAuth);

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

blogRouter.use(requireAdmin);

// Admin: list ALL posts (drafts + published)
blogRouter.get('/admin/posts', async (_req: Request, res: Response) => {
  const supa = getServiceClient();
  const { data, error } = await supa
    .from('blog_posts')
    .select('id, slug, title, excerpt, status, tags, read_minutes, view_count, created_at, updated_at, published_at')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  res.json({ posts: data ?? [] });
});

blogRouter.get('/admin/posts/:id', async (req: Request, res: Response) => {
  const supa = getServiceClient();
  const { data, error } = await supa
    .from('blog_posts')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error || !data) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  res.json(data);
});

interface UpsertBody {
  slug?: string;
  title?: string;
  excerpt?: string | null;
  content_md?: string;
  cover_image_url?: string | null;
  status?: 'draft' | 'published';
  tags?: string[];
}

function readMinutes(md: string): number {
  // ~200 words/minute reading speed
  const words = md.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}

blogRouter.post('/admin/posts', async (req: Request, res: Response) => {
  const { user } = req as AuthedRequest;
  const body = req.body as UpsertBody;
  if (!body.title || !body.content_md) {
    res.status(400).json({ error: 'title and content_md required' });
    return;
  }

  const supa = getServiceClient();
  const slug = (body.slug && body.slug.trim()) || slugify(body.title);
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

  if (error) {
    if (error.code === '23505') {
      res.status(409).json({ error: 'slug_taken', message: 'A post with that slug already exists.' });
      return;
    }
    throw error;
  }
  res.json(data);
});

blogRouter.patch('/admin/posts/:id', async (req: Request, res: Response) => {
  const id = req.params.id;
  const body = req.body as UpsertBody;
  const supa = getServiceClient();

  // Get current state to know whether status is transitioning
  const { data: current } = await supa
    .from('blog_posts')
    .select('status, published_at')
    .eq('id', id)
    .single();
  if (!current) {
    res.status(404).json({ error: 'not_found' });
    return;
  }

  const update: Record<string, unknown> = {};
  if (body.slug !== undefined) update.slug = body.slug;
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
    // Set published_at the first time we go to published
    if (body.status === 'published' && current.status !== 'published') {
      update.published_at = new Date().toISOString();
    }
    if (body.status === 'draft') {
      // Keep published_at so we know the original publish time on re-publish
    }
  }

  const { data, error } = await supa
    .from('blog_posts')
    .update(update)
    .eq('id', id)
    .select()
    .single();
  if (error) {
    if (error.code === '23505') {
      res.status(409).json({ error: 'slug_taken' });
      return;
    }
    throw error;
  }
  res.json(data);
});

blogRouter.delete('/admin/posts/:id', async (req: Request, res: Response) => {
  const supa = getServiceClient();
  const { error } = await supa.from('blog_posts').delete().eq('id', req.params.id);
  if (error) throw error;
  res.status(204).end();
});
