import { fail, requireAdmin, type VercelRequest, type VercelResponse } from '../../../_lib.js';

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

async function uniqueSlug(supa: any, base: string): Promise<string> {
  const { data } = await supa.from('blog_posts').select('slug').ilike('slug', `${base}%`);
  const taken = new Set((data ?? []).map((r: { slug: string }) => r.slug));
  if (!taken.has(base)) return base;
  for (let i = 2; i < 10_000; i++) {
    const next = `${base}-${i}`;
    if (!taken.has(next)) return next;
  }
  return `${base}-${Math.random().toString(36).slice(2, 8)}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const r = await requireAdmin(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { user, supa } = r;

  if (req.method === 'GET') {
    const { data, error } = await supa
      .from('blog_posts')
      .select(
        'id, slug, title, excerpt, status, tags, read_minutes, view_count, created_at, updated_at, published_at',
      )
      .order('updated_at', { ascending: false });
    if (error) return fail(res, 500, error.message);
    return res.status(200).json({ posts: data ?? [] });
  }

  if (req.method === 'POST') {
    const body = (req.body ?? {}) as UpsertBody;
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
    return res.status(200).json(data);
  }

  return fail(res, 405, 'method_not_allowed');
}
