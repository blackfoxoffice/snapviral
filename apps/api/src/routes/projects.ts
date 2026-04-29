import { Router, Request, Response } from 'express';
import { createProjectSchema } from '@newsflow/shared';
import { requireAuth, AuthedRequest } from '../middleware/auth.js';
import { getServiceClient } from '../services/supabase.js';
import { runPipeline } from '../pipeline/runner.js';

export const projectsRouter = Router();

projectsRouter.use(requireAuth);

projectsRouter.get('/', async (req: Request, res: Response) => {
  const { user } = req as AuthedRequest;
  const supa = getServiceClient();
  const { data, error } = await supa
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  res.json(data);
});

projectsRouter.post('/', async (req: Request, res: Response) => {
  const { user } = req as AuthedRequest;
  const input = createProjectSchema.parse(req.body);
  const supa = getServiceClient();
  const { data: profile } = await supa
    .from('profiles')
    .select('logo_path')
    .eq('id', user.id)
    .single();
  const { data, error } = await supa
    .from('projects')
    .insert({
      user_id: user.id,
      title: input.title,
      topic: input.topic ?? null,
      language: input.language,
      duration_seconds: input.duration_seconds,
      input_mode: input.input_mode,
      source_urls: input.input_mode === 'urls' ? input.source_urls : null,
      user_script:
        input.input_mode === 'script'
          ? input.user_script
          : input.input_mode === 'research'
            ? (input.user_script ?? null)
            : null,
      voice_id: input.voice_id ?? null,
      image_style: input.image_style ?? 'realistic',
      logo_path: profile?.logo_path ?? null,
      status: 'draft',
    })
    .select()
    .single();
  if (error) throw error;
  res.status(201).json(data);
});

projectsRouter.get('/:id', async (req: Request, res: Response) => {
  const { user } = req as AuthedRequest;
  const { id } = req.params;
  const supa = getServiceClient();
  const [projectResult, jobsResult, assetsResult] = await Promise.all([
    supa.from('projects').select('*').eq('id', id).eq('user_id', user.id).single(),
    supa.from('pipeline_jobs').select('*').eq('project_id', id).order('created_at'),
    supa.from('assets').select('*').eq('project_id', id).order('created_at'),
  ]);
  if (projectResult.error) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  res.json({
    ...projectResult.data,
    jobs: jobsResult.data ?? [],
    assets: assetsResult.data ?? [],
  });
});

projectsRouter.post('/:id/generate', async (req: Request, res: Response) => {
  const { user } = req as AuthedRequest;
  const { id } = req.params;
  const supa = getServiceClient();
  const { data: project, error } = await supa
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  if (error || !project) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  if (project.status === 'running') {
    res.status(409).json({ error: 'already_running' });
    return;
  }
  await supa
    .from('projects')
    .update({ status: 'queued', error: null, progress_pct: 0, current_step: null })
    .eq('id', id);

  setImmediate(() => {
    runPipeline(id).catch((e) => {
      console.error('[pipeline] unhandled failure', e);
    });
  });

  res.status(202).json({ projectId: id });
});

projectsRouter.get('/:id/download', async (req: Request, res: Response) => {
  const { user } = req as AuthedRequest;
  const { id } = req.params;
  const supa = getServiceClient();
  const { data: project, error } = await supa
    .from('projects')
    .select('final_video_path, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  if (error || !project?.final_video_path) {
    res.status(404).json({ error: 'video_not_ready' });
    return;
  }
  const { data: signed, error: signErr } = await supa.storage
    .from('project-assets')
    .createSignedUrl(project.final_video_path, 60 * 60);
  if (signErr || !signed) {
    res.status(500).json({ error: 'sign_failed' });
    return;
  }
  res.json({ url: signed.signedUrl });
});

projectsRouter.delete('/:id', async (req: Request, res: Response) => {
  const { user } = req as AuthedRequest;
  const { id } = req.params;
  const supa = getServiceClient();
  const { error } = await supa.from('projects').delete().eq('id', id).eq('user_id', user.id);
  if (error) throw error;
  res.status(204).end();
});
