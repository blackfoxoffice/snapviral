import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';

export const voicesRouter = Router();

voicesRouter.use(requireAuth);

voicesRouter.get('/', async (req: Request, res: Response) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'ELEVENLABS_API_KEY not configured' });
    return;
  }

  const language = (req.query.language as string) ?? 'ta';
  const pageSize = Math.min(Number(req.query.page_size) || 20, 50);

  const url = new URL('https://api.elevenlabs.io/v1/shared-voices');
  url.searchParams.set('language', language);
  url.searchParams.set('page_size', String(pageSize));

  const elRes = await fetch(url.toString(), {
    headers: { 'xi-api-key': apiKey },
  });

  if (!elRes.ok) {
    const text = await elRes.text();
    res.status(elRes.status).json({ error: `ElevenLabs API error: ${text}` });
    return;
  }

  const data = (await elRes.json()) as {
    voices: Array<{
      voice_id: string;
      name: string;
      gender: string;
      age: string;
      accent: string;
      use_case: string;
      description: string | null;
      preview_url: string | null;
      category: string;
    }>;
    has_more: boolean;
    total_count: number;
  };

  const voices = data.voices
    .filter((v) => v.preview_url)
    .map((v) => ({
      voice_id: v.voice_id,
      name: v.name,
      gender: v.gender,
      age: v.age,
      accent: v.accent,
      use_case: v.use_case,
      description: v.description,
      preview_url: v.preview_url,
      category: v.category,
    }));

  res.json({ voices, total_count: data.total_count });
});
