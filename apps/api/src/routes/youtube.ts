import { Router, Request, Response } from 'express';
import { requireAuth, AuthedRequest } from '../middleware/auth.js';
import { getServiceClient } from '../services/supabase.js';
import {
  getOAuthUrl,
  exchangeCode,
  getValidAccessToken,
  fetchChannelInfo,
  uploadVideoToYouTube,
} from '../services/youtube.js';
import { generateYouTubeMetadata } from '../services/youtube-metadata.js';
import type { ScriptOutput, ProjectLanguage } from '@newsflow/shared';

export const youtubeRouter = Router();

// PUBLIC route — Google's browser redirect lands here with no bearer token,
// only `code` and `state` (where state = the user id we passed in /auth-url).
// Must be registered BEFORE the requireAuth middleware below.
youtubeRouter.get('/callback', async (req: Request, res: Response) => {
  const { code, state: userId } = req.query as { code?: string; state?: string };
  if (!code || !userId) {
    res.status(400).send('Missing code or state');
    return;
  }

  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ??
    `${process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:4000'}/api/youtube/callback`;

  // Where the browser should land after the callback. WEB_BASE_URL takes precedence;
  // fall back to a sensible default (production app domain or localhost dev).
  const webUrl =
    process.env.WEB_BASE_URL ??
    (process.env.NODE_ENV === 'production' ? 'https://app.snapviral.in' : 'http://localhost:8081');

  try {
    const tokens = await exchangeCode(code, redirectUri);
    const channel = await fetchChannelInfo(tokens.access_token);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    const supa = getServiceClient();
    await supa
      .from('profiles')
      .update({
        yt_access_token: tokens.access_token,
        yt_refresh_token: tokens.refresh_token,
        yt_token_expires_at: expiresAt.toISOString(),
        yt_channel_id: channel.channelId,
        yt_channel_name: channel.channelName,
      })
      .eq('id', userId);

    res.redirect(`${webUrl}/settings?yt_connected=1`);
  } catch (e) {
    console.error('[youtube] OAuth callback error:', e);
    const message = e instanceof Error ? e.message : 'unknown error';
    let reason = 'unknown';
    if (/no youtube channel/i.test(message)) reason = 'no_channel';
    else if (/invalid_grant/i.test(message)) reason = 'invalid_grant';
    else if (/token exchange/i.test(message)) reason = 'token_exchange';
    res.redirect(`${webUrl}/settings?yt_error=${reason}&detail=${encodeURIComponent(message.slice(0, 200))}`);
  }
});

// All routes below this line require a bearer token.
youtubeRouter.use(requireAuth);

youtubeRouter.get('/auth-url', async (req: Request, res: Response) => {
  const { user } = req as AuthedRequest;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? `${process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:4000'}/api/youtube/callback`;
  const url = await getOAuthUrl(redirectUri, user.id);
  res.json({ url });
});

youtubeRouter.get('/status', async (req: Request, res: Response) => {
  const { user } = req as AuthedRequest;
  const supa = getServiceClient();
  const { data } = await supa
    .from('profiles')
    .select('yt_channel_id, yt_channel_name')
    .eq('id', user.id)
    .single();

  res.json({
    connected: !!(data?.yt_channel_id),
    channel_id: data?.yt_channel_id ?? null,
    channel_name: data?.yt_channel_name ?? null,
  });
});

youtubeRouter.delete('/disconnect', async (req: Request, res: Response) => {
  const { user } = req as AuthedRequest;
  const supa = getServiceClient();
  await supa
    .from('profiles')
    .update({
      yt_access_token: null,
      yt_refresh_token: null,
      yt_token_expires_at: null,
      yt_channel_id: null,
      yt_channel_name: null,
    })
    .eq('id', user.id);

  res.json({ connected: false });
});

youtubeRouter.post('/generate-metadata/:projectId', async (req: Request, res: Response) => {
  const { user } = req as AuthedRequest;
  const { projectId } = req.params;
  const supa = getServiceClient();

  const [projectResult, profileResult] = await Promise.all([
    supa.from('projects').select('*').eq('id', projectId).eq('user_id', user.id).single(),
    supa.from('profiles').select('social_youtube, social_instagram, social_facebook, social_twitter, social_tiktok').eq('id', user.id).single(),
  ]);

  if (projectResult.error || !projectResult.data) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const project = projectResult.data;
  const profile = profileResult.data;

  const scriptAsset = await supa
    .from('assets')
    .select('content')
    .eq('project_id', projectId)
    .eq('type', 'script')
    .single();

  if (!scriptAsset.data?.content) {
    res.status(400).json({ error: 'No script found for this project' });
    return;
  }

  const script = scriptAsset.data.content as ScriptOutput;

  const metadata = await generateYouTubeMetadata({
    script,
    language: project.language as ProjectLanguage,
    topic: project.topic,
    socialHandles: profile ? {
      youtube: profile.social_youtube,
      instagram: profile.social_instagram,
      facebook: profile.social_facebook,
      twitter: profile.social_twitter,
      tiktok: profile.social_tiktok,
    } : undefined,
  });

  await supa
    .from('projects')
    .update({
      yt_title: metadata.title,
      yt_description: metadata.description,
      yt_tags: metadata.tags,
    })
    .eq('id', projectId);

  res.json(metadata);
});

youtubeRouter.post('/publish/:projectId', async (req: Request, res: Response) => {
  const { user } = req as AuthedRequest;
  const { projectId } = req.params;
  const body = req.body as {
    title?: string;
    description?: string;
    tags?: string[];
    privacy?: 'public' | 'unlisted' | 'private';
    scheduled_at?: string | null;
  };

  const supa = getServiceClient();

  const { data: project, error } = await supa
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (error || !project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  if (project.status !== 'ready' || !project.final_video_path) {
    res.status(400).json({ error: 'Video is not ready yet' });
    return;
  }

  const title = body.title ?? project.yt_title ?? project.title;
  const description = body.description ?? project.yt_description ?? '';
  const tags = body.tags ?? project.yt_tags ?? [];
  const privacy = body.privacy ?? 'public';

  if (body.scheduled_at) {
    const scheduledDate = new Date(body.scheduled_at);
    if (scheduledDate <= new Date()) {
      res.status(400).json({ error: 'Scheduled time must be in the future' });
      return;
    }

    await supa
      .from('projects')
      .update({
        yt_title: title,
        yt_description: description,
        yt_tags: tags,
        yt_privacy: privacy,
        yt_scheduled_at: scheduledDate.toISOString(),
      })
      .eq('id', projectId);

    res.json({
      scheduled: true,
      scheduled_at: scheduledDate.toISOString(),
      message: `Video scheduled for ${scheduledDate.toISOString()}`,
    });
    return;
  }

  const accessToken = await getValidAccessToken(user.id);

  const { data: videoBlob, error: dlErr } = await supa.storage
    .from('project-assets')
    .download(project.final_video_path);

  if (dlErr || !videoBlob) {
    res.status(500).json({ error: 'Failed to download video for upload' });
    return;
  }

  const videoBuffer = Buffer.from(await videoBlob.arrayBuffer());

  const { videoId } = await uploadVideoToYouTube({
    accessToken,
    videoBuffer,
    title,
    description,
    tags,
    privacyStatus: privacy,
  });

  await supa
    .from('projects')
    .update({
      yt_video_id: videoId,
      yt_title: title,
      yt_description: description,
      yt_tags: tags,
      yt_privacy: privacy,
      yt_published_at: new Date().toISOString(),
      yt_scheduled_at: null,
    })
    .eq('id', projectId);

  res.json({
    video_id: videoId,
    url: `https://youtube.com/shorts/${videoId}`,
  });
});

youtubeRouter.post('/schedule/:projectId', async (req: Request, res: Response) => {
  const { user } = req as AuthedRequest;
  const { projectId } = req.params;
  const body = req.body as {
    scheduled_at: string;
    title?: string;
    description?: string;
    tags?: string[];
    privacy?: 'public' | 'unlisted' | 'private';
  };

  if (!body.scheduled_at) {
    res.status(400).json({ error: 'scheduled_at is required' });
    return;
  }

  const scheduledDate = new Date(body.scheduled_at);
  if (scheduledDate <= new Date()) {
    res.status(400).json({ error: 'Scheduled time must be in the future' });
    return;
  }

  const supa = getServiceClient();
  const { data: project, error } = await supa
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (error || !project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  if (project.status !== 'ready' || !project.final_video_path) {
    res.status(400).json({ error: 'Video is not ready yet' });
    return;
  }

  const update: Record<string, unknown> = {
    yt_scheduled_at: scheduledDate.toISOString(),
    yt_privacy: body.privacy ?? 'public',
  };
  if (body.title) update.yt_title = body.title;
  if (body.description) update.yt_description = body.description;
  if (body.tags) update.yt_tags = body.tags;

  await supa.from('projects').update(update).eq('id', projectId);

  res.json({
    scheduled: true,
    scheduled_at: scheduledDate.toISOString(),
  });
});

youtubeRouter.delete('/schedule/:projectId', async (req: Request, res: Response) => {
  const { user } = req as AuthedRequest;
  const { projectId } = req.params;
  const supa = getServiceClient();

  await supa
    .from('projects')
    .update({ yt_scheduled_at: null })
    .eq('id', projectId)
    .eq('user_id', user.id);

  res.json({ scheduled: false });
});
