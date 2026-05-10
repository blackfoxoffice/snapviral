import { fail, requireUser, type VercelRequest, type VercelResponse } from '../_lib.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const r = await requireUser(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { user, supa } = r;

  const id = (Array.isArray(req.query.id) ? req.query.id[0] : req.query.id) ?? '';
  if (!id) return fail(res, 400, 'missing_id');

  if (req.method === 'GET') {
    const [projectResult, jobsResult, assetsResult] = await Promise.all([
      supa.from('projects').select('*').eq('id', id).eq('user_id', user.id).single(),
      supa.from('pipeline_jobs').select('*').eq('project_id', id).order('created_at'),
      supa.from('assets').select('*').eq('project_id', id).order('created_at'),
    ]);

    if (projectResult.error) return fail(res, 404, 'not_found');

    return res.status(200).json({
      ...projectResult.data,
      jobs: jobsResult.data ?? [],
      assets: assetsResult.data ?? [],
    });
  }

  if (req.method === 'DELETE') {
    const { error } = await supa
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) return fail(res, 500, error.message);
    return res.status(204).end();
  }

  return fail(res, 405, 'method_not_allowed');
}
