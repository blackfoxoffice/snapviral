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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const r = await requireAdmin(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { supa } = r;

  const id = (Array.isArray(req.query.id) ? req.query.id[0] : req.query.id) ?? '';
  if (!id) return fail(res, 400, 'missing_id');

  if (req.method === 'GET') {
    const { data, error } = await supa.from('blog_posts').select('*').eq('id', id).single();
    if (error || !data) return fail(res, 404, 'not_found');
    return res.status(200).json(data);
  }

  if (req.method === 'PATCH') {
    const body = (req.body ?? {}) as UpsertBody;

    const { data: current } = await supa
      .from('blog_posts')
      .select('status, published_at')
      .eq('id', id)
      .single();
    if (!current) return fail(res, 404, 'not_found');

    const update: Record<string, unknown> = {};
    if (body.slug !== undefined) {
      update.slug = body.slug.trim() ? slugify(body.slug) : slugify(body.title ?? 'untitled');
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
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { error } = await supa.from('blog_posts').delete().eq('id', id);
    if (error) return fail(res, 500, error.message);
    return res.status(204).end();
  }

  return fail(res, 405, 'method_not_allowed');
}
