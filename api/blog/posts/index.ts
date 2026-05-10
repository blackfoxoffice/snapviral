import { fail, supabaseAnon, type VercelRequest, type VercelResponse } from '../../_lib.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return fail(res, 405, 'method_not_allowed');

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
