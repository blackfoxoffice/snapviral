import { fail, supabaseAnon, type VercelRequest, type VercelResponse } from '../../_lib.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return fail(res, 405, 'method_not_allowed');

  const slug = (Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug) ?? '';
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

  // fire-and-forget view bump
  supa.rpc('blog_increment_view', { p_slug: slug }).then(
    () => {},
    () => {},
  );

  res.status(200).json(data);
}
