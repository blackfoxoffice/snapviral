import { fail, requireUser, type VercelRequest, type VercelResponse } from './_lib.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return fail(res, 405, 'method_not_allowed');

  const r = await requireUser(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return fail(res, 500, 'ELEVENLABS_API_KEY not configured');

  const language = (req.query.language as string) ?? 'ta';
  const pageSize = Math.min(Number(req.query.page_size) || 20, 50);

  const url = new URL('https://api.elevenlabs.io/v1/shared-voices');
  url.searchParams.set('language', language);
  url.searchParams.set('page_size', String(pageSize));

  const elRes = await fetch(url.toString(), { headers: { 'xi-api-key': apiKey } });
  if (!elRes.ok) {
    const text = await elRes.text();
    return fail(res, elRes.status, `ElevenLabs error: ${text}`);
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

  res.status(200).json({ voices, total_count: data.total_count });
}
