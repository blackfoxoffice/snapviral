import { fail, requireUser, type VercelRequest, type VercelResponse } from '../_lib.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const r = await requireUser(req);
  if ('error' in r) return fail(res, r.error.status, r.error.message);
  const { user, supa } = r;

  if (req.method === 'GET') {
    const { data, error } = await supa
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) return fail(res, 500, error.message);
    return res.status(200).json(data ?? []);
  }

  if (req.method === 'POST') {
    const body = (req.body ?? {}) as {
      title?: string;
      topic?: string | null;
      language?: string;
      duration_seconds?: number;
      input_mode?: 'urls' | 'script' | 'topic' | 'research';
      source_urls?: string[] | null;
      user_script?: string | null;
      voice_id?: string | null;
      image_style?: string;
    };

    if (!body.title || !body.language || !body.duration_seconds || !body.input_mode) {
      return fail(res, 400, 'missing_fields');
    }

    const { data: profile } = await supa
      .from('profiles')
      .select('logo_path')
      .eq('id', user.id)
      .single();

    const { data, error } = await supa
      .from('projects')
      .insert({
        user_id: user.id,
        title: body.title,
        topic: body.topic ?? null,
        language: body.language,
        duration_seconds: body.duration_seconds,
        input_mode: body.input_mode,
        source_urls: body.input_mode === 'urls' ? body.source_urls ?? null : null,
        user_script:
          body.input_mode === 'script'
            ? body.user_script ?? null
            : body.input_mode === 'research'
              ? body.user_script ?? null
              : null,
        voice_id: body.voice_id ?? null,
        image_style: body.image_style ?? 'realistic',
        logo_path: (profile as { logo_path?: string } | null)?.logo_path ?? null,
        status: 'draft',
      })
      .select()
      .single();

    if (error) return fail(res, 500, error.message);
    return res.status(201).json(data);
  }

  return fail(res, 405, 'method_not_allowed');
}
