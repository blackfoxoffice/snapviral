import { Router, Request, Response } from 'express';
import { requireAuth, AuthedRequest } from '../middleware/auth.js';
import { getServiceClient } from '../services/supabase.js';

export const profileRouter = Router();

profileRouter.use(requireAuth);

profileRouter.get('/logo', async (req: Request, res: Response) => {
  const { user } = req as AuthedRequest;
  const supa = getServiceClient();
  const { data } = await supa
    .from('profiles')
    .select('logo_path')
    .eq('id', user.id)
    .single();
  if (!data?.logo_path) {
    res.json({ logo_url: null });
    return;
  }
  const { data: signed } = await supa.storage
    .from('project-assets')
    .createSignedUrl(data.logo_path, 60 * 60 * 24);
  res.json({ logo_url: signed?.signedUrl ?? null, logo_path: data.logo_path });
});

profileRouter.post('/logo', async (req: Request, res: Response) => {
  const { user } = req as AuthedRequest;
  const body = req.body as { image: string };

  if (!body.image || typeof body.image !== 'string') {
    res.status(400).json({ error: 'image (base64 data URL) is required' });
    return;
  }

  const match = body.image.match(/^data:image\/(png|jpeg|jpg|webp|svg\+xml);base64,(.+)$/);
  if (!match) {
    res.status(400).json({ error: 'Invalid image data URL format' });
    return;
  }

  const ext = match[1] === 'svg+xml' ? 'svg' : match[1] === 'jpeg' ? 'jpg' : match[1];
  const buf = Buffer.from(match[2]!, 'base64');

  if (buf.length > 2 * 1024 * 1024) {
    res.status(400).json({ error: 'Logo must be under 2 MB' });
    return;
  }

  const storagePath = `${user.id}/brand/logo.${ext}`;
  const supa = getServiceClient();

  const { error: upErr } = await supa.storage
    .from('project-assets')
    .upload(storagePath, buf, {
      contentType: `image/${match[1]}`,
      upsert: true,
    });
  if (upErr) {
    res.status(500).json({ error: `Upload failed: ${upErr.message}` });
    return;
  }

  await supa
    .from('profiles')
    .update({ logo_path: storagePath })
    .eq('id', user.id);

  const { data: signed } = await supa.storage
    .from('project-assets')
    .createSignedUrl(storagePath, 60 * 60 * 24);

  res.json({ logo_url: signed?.signedUrl ?? null, logo_path: storagePath });
});

profileRouter.get('/social', async (req: Request, res: Response) => {
  const { user } = req as AuthedRequest;
  const supa = getServiceClient();
  const { data } = await supa
    .from('profiles')
    .select('social_youtube, social_instagram, social_facebook, social_twitter, social_tiktok')
    .eq('id', user.id)
    .single();
  res.json({
    youtube: data?.social_youtube ?? null,
    instagram: data?.social_instagram ?? null,
    facebook: data?.social_facebook ?? null,
    twitter: data?.social_twitter ?? null,
    tiktok: data?.social_tiktok ?? null,
  });
});

profileRouter.put('/social', async (req: Request, res: Response) => {
  const { user } = req as AuthedRequest;
  const body = req.body as {
    youtube?: string | null;
    instagram?: string | null;
    facebook?: string | null;
    twitter?: string | null;
    tiktok?: string | null;
  };

  const supa = getServiceClient();
  const update: Record<string, string | null> = {};
  if ('youtube' in body) update.social_youtube = body.youtube?.trim() || null;
  if ('instagram' in body) update.social_instagram = body.instagram?.trim() || null;
  if ('facebook' in body) update.social_facebook = body.facebook?.trim() || null;
  if ('twitter' in body) update.social_twitter = body.twitter?.trim() || null;
  if ('tiktok' in body) update.social_tiktok = body.tiktok?.trim() || null;

  if (Object.keys(update).length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  await supa.from('profiles').update(update).eq('id', user.id);

  const { data } = await supa
    .from('profiles')
    .select('social_youtube, social_instagram, social_facebook, social_twitter, social_tiktok')
    .eq('id', user.id)
    .single();

  res.json({
    youtube: data?.social_youtube ?? null,
    instagram: data?.social_instagram ?? null,
    facebook: data?.social_facebook ?? null,
    twitter: data?.social_twitter ?? null,
    tiktok: data?.social_tiktok ?? null,
  });
});

profileRouter.delete('/logo', async (req: Request, res: Response) => {
  const { user } = req as AuthedRequest;
  const supa = getServiceClient();

  const { data } = await supa
    .from('profiles')
    .select('logo_path')
    .eq('id', user.id)
    .single();

  if (data?.logo_path) {
    await supa.storage.from('project-assets').remove([data.logo_path]);
  }

  await supa
    .from('profiles')
    .update({ logo_path: null })
    .eq('id', user.id);

  res.json({ logo_url: null });
});
