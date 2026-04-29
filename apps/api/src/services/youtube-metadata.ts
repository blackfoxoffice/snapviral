import type { ProjectLanguage, ScriptOutput } from '@newsflow/shared';

const LANG_NAME: Record<ProjectLanguage, string> = { ta: 'Tamil', en: 'English', hi: 'Hindi' };

export async function generateYouTubeMetadata(args: {
  script: ScriptOutput;
  language: ProjectLanguage;
  topic: string | null;
  socialHandles?: {
    youtube?: string | null;
    instagram?: string | null;
    facebook?: string | null;
    twitter?: string | null;
    tiktok?: string | null;
  };
}): Promise<{ title: string; description: string; tags: string[] }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set');

  const { script, language, topic, socialHandles } = args;
  const langName = LANG_NAME[language];

  const fullNarration = [script.hook, ...script.scenes.map((s) => s.narration), script.cta].join('\n\n');

  const socialSection = buildSocialSection(socialHandles);

  const systemPrompt = `You are a YouTube SEO expert specializing in ${langName} news Shorts. Given a video script, generate optimized YouTube metadata.

Output strict JSON:
{
  "title": string (max 100 chars, ${langName}, catchy, include key topic),
  "description": string (${langName}, 150-300 words, include transcript summary, relevant links section, social handles section if provided),
  "tags": string[] (15-25 tags, mix of ${langName} and English, include trending topics, news keywords)
}

Rules:
- Title must be attention-grabbing for YouTube Shorts, include emojis sparingly (1-2 max)
- Description must include: brief summary, full transcript excerpt (first 200 words), social handles section, relevant hashtags at the end
- Tags should include: topic keywords in ${langName} and English, "shorts", "${langName} news", trending related terms
- Output ONLY the JSON. No preamble, no markdown fences.`;

  const userPrompt = `Script title: ${script.title}
Topic: ${topic ?? '(infer from script)'}
Language: ${langName}

Full narration:
${fullNarration}

${socialSection ? `Social handles to include in description:\n${socialSection}` : ''}`;

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.OPENROUTER_REFERER ?? 'http://localhost:3000',
      'X-Title': process.env.OPENROUTER_TITLE ?? 'Newsflow Studio',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.6,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`YouTube metadata generation failed: ${res.status} ${errText}`);
  }

  const json = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  const content = json.choices[0]?.message.content;
  if (!content) throw new Error('YouTube metadata generation returned empty content');

  const parsed = JSON.parse(content) as { title: string; description: string; tags: string[] };

  if (!parsed.title || !parsed.description || !Array.isArray(parsed.tags)) {
    throw new Error('Invalid metadata format from AI');
  }

  return parsed;
}

function buildSocialSection(handles?: {
  youtube?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  twitter?: string | null;
  tiktok?: string | null;
}): string {
  if (!handles) return '';
  const lines: string[] = [];
  if (handles.youtube) lines.push(`YouTube: ${handles.youtube}`);
  if (handles.instagram) lines.push(`Instagram: ${handles.instagram}`);
  if (handles.facebook) lines.push(`Facebook: ${handles.facebook}`);
  if (handles.twitter) lines.push(`Twitter/X: ${handles.twitter}`);
  if (handles.tiktok) lines.push(`TikTok: ${handles.tiktok}`);
  return lines.join('\n');
}
