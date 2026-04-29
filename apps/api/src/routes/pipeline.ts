import { Router, Request, Response } from 'express';
import { requireAuth, AuthedRequest } from '../middleware/auth.js';
import { getServiceClient } from '../services/supabase.js';

export const pipelineRouter = Router();

pipelineRouter.use(requireAuth);

pipelineRouter.get('/:projectId/jobs', async (req: Request, res: Response) => {
  const { user } = req as AuthedRequest;
  const { projectId } = req.params;
  const supa = getServiceClient();
  const { data: project } = await supa
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();
  if (!project) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  const { data, error } = await supa
    .from('pipeline_jobs')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at');
  if (error) throw error;
  res.json(data);
});
