import type { ImageStyle, ProjectLanguage, ResearchResult, ScriptOutput } from '@newsflow/shared';
import type { SourceContext } from '../pipeline/steps/01-ingest.js';

const LANG_NAME: Record<ProjectLanguage, string> = { ta: 'Tamil', en: 'English', hi: 'Hindi' };

function buildScriptSystemPrompt(
  mode: 'urls' | 'script' | 'topic' | 'research',
  language: ProjectLanguage,
  durationSeconds: number,
): string {
  const langName = LANG_NAME[language];
  const wpm = language === 'ta' ? 2.5 : 2.8;
  const targetWords = Math.round(durationSeconds * wpm);

  const commonTail = `
Output strict JSON matching this schema:
{
  "title": string,
  "hook": string,
  "scenes": [
    { "narration": string (in ${langName}), "visual_prompt": string (in English) }
  ],
  "cta": string
}

Rules for every scene:
- 4–7 scenes total, one focused thought each, 1–3 sentences of narration.
- Target total spoken duration: ~${durationSeconds} seconds (~${targetWords} words across all scenes).
- visual_prompt describes a cinematic 9:16 photograph that illustrates the scene. Be specific: location, subject, mood, lighting, composition. Photorealistic, documentary-news style. No text overlays in the image — text goes in the subtitle layer.
- Output ONLY the JSON. No preamble, no markdown fences.`;

  if (mode === 'urls') {
    return `You are a senior news video scriptwriter. You will be given RAW TRANSCRIPTS from multiple competitor news videos as research input only.

YOUR HARD RULES — VIOLATING THESE IS A FAILURE:
1. You MUST write a 100% ORIGINAL ${langName} news script. Do NOT copy, mirror, or closely paraphrase any sentence from the input transcripts.
2. Rewrite every idea in your own wording and your own sentence structure. Change verb choices, sentence order, and rhythm so the output would not trigger any plagiarism or copyright detection.
3. Treat the input as factual research only. Extract WHAT happened (facts, names, places, numbers) and discard HOW the sources phrased it. Re-narrate from scratch.
4. If the sources contradict each other, acknowledge the uncertainty ("reports vary…") rather than picking a side.
5. No direct quotes, no proper-noun phrases that are clearly a source's catchphrase.
${commonTail}`;
  }

  if (mode === 'script') {
    return `You are a senior news video scriptwriter. The user has provided THEIR OWN story, article, or draft. This is their content — your job is to FORMAT it for video, not rewrite it.

YOUR RULES:
1. Preserve the user's voice, facts, and narrative order.
2. Lightly polish grammar and flow if needed, but do not change the meaning or add opinions.
3. Translate / adapt into fluent natural ${langName} if the input is in another language.
4. Structure into scenes with strong visual hooks per scene.
${commonTail}`;
  }

  if (mode === 'research') {
    return `You are a senior news video scriptwriter. You will be given a FRESH, LIVE WEB-RESEARCHED factual summary (in English) produced by a web-search model, along with citations. Your job is to turn it into an original ${langName} news script.

YOUR RULES:
1. The research summary is a reliable, up-to-date snapshot. Use its facts (names, places, numbers, dates).
2. Write a 100% ORIGINAL ${langName} news script — do not copy English phrasing directly, and do not mechanically translate sentence-by-sentence. Re-narrate in natural, native-sounding ${langName} phrasing.
3. Preserve factual accuracy. If the research hedges ("reports suggest…"), preserve that hedge.
4. Do NOT add facts that aren't in the research summary. Do NOT include citation URLs in the narration — those live outside the script.
5. Structure into scenes with strong visual hooks per scene.
${commonTail}`;
  }

  return `You are a senior news video scriptwriter. The user has given you a topic only. Use your general knowledge to write an original ${langName} news explainer.

YOUR RULES:
1. Write a factually careful, balanced original script. Hedge when you're uncertain ("according to widely reported accounts…").
2. Do NOT fabricate specific numbers, names, or quotes. If a concrete detail is needed, keep it general.
3. Structure into scenes with strong visual hooks per scene.
${commonTail}`;
}

function buildUserPrompt(args: {
  source: SourceContext;
  title: string;
  topic: string;
}): string {
  const { source, title, topic } = args;
  if (source.mode === 'urls') {
    const valid = (source.transcripts ?? []).filter((t) => !t.failed && t.text);
    const body =
      valid.length > 0
        ? valid
            .map((t, i) => `=== Source ${i + 1} (${t.url}) ===\n${t.text}`)
            .join('\n\n')
        : '(no usable source transcripts — lean on the title/topic hint)';
    return `Title: ${title}\nTopic hint: ${topic || '(none — infer from sources)'}\n\nSource transcripts (research only — DO NOT PLAGIARISE):\n${body}`;
  }
  if (source.mode === 'script') {
    return `Title: ${title}\nTopic hint: ${topic || '(none)'}\n\nUser's own script / story:\n\n${source.userScript ?? ''}`;
  }
  if (source.mode === 'research') {
    const r = source.research;
    const cites = r?.citations?.length
      ? `\n\nCitations (context only — DO NOT include URLs in the narration):\n${r.citations.map((u, i) => `[${i + 1}] ${u}`).join('\n')}`
      : '';
    return `Title: ${title}\nTopic: ${source.topic ?? topic}\n\nLive web-research summary (English, factual):\n\n${r?.summary ?? ''}${cites}`;
  }
  return `Title: ${title}\nTopic: ${source.topic ?? topic}`;
}

export async function callGeminiScript(args: {
  source: SourceContext;
  title: string;
  topic: string;
  language: ProjectLanguage;
  durationSeconds: number;
}): Promise<ScriptOutput> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set');

  const systemPrompt = buildScriptSystemPrompt(
    args.source.mode,
    args.language,
    args.durationSeconds,
  );
  const userPrompt = buildUserPrompt(args);

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
      temperature: args.source.mode === 'script' ? 0.4 : 0.7,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`openrouter script call failed: ${res.status} ${errText}`);
  }

  const json = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  const content = json.choices[0]?.message.content;
  if (!content) throw new Error('openrouter script returned empty content');
  return JSON.parse(content) as ScriptOutput;
}

export async function callPerplexityResearch(args: {
  topic: string;
  extraContext?: string;
}): Promise<ResearchResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set');

  const systemPrompt = `You are a news researcher. Given a topic, search the web for the most current, reliable reporting and return a factual English briefing for a downstream scriptwriter.

REQUIREMENTS:
- Focus on verifiable facts: who, what, when, where, how many.
- Prefer recent, mainstream sources. Cross-check numbers where possible.
- If reporting is contested or preliminary, say so ("reports vary", "preliminary estimates indicate…").
- Do NOT speculate beyond what sources say.
- Keep the briefing tight: 180–350 words. No bullet lists, no markdown — prose paragraphs.
- Do NOT include citation URLs inline. They will be surfaced separately by the search system.`;

  const userPrompt = args.extraContext
    ? `Topic: ${args.topic}\n\nExtra context from the user:\n${args.extraContext}`
    : `Topic: ${args.topic}`;

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.OPENROUTER_REFERER ?? 'http://localhost:3000',
      'X-Title': process.env.OPENROUTER_TITLE ?? 'Newsflow Studio',
    },
    body: JSON.stringify({
      model: 'perplexity/sonar-pro-search',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`perplexity research call failed: ${res.status} ${errText}`);
  }

  const json = (await res.json()) as {
    choices: { message: { content: string } }[];
    citations?: string[];
  };
  const summary = json.choices[0]?.message.content?.trim();
  if (!summary) throw new Error('perplexity research returned empty content');

  const citations = Array.isArray(json.citations)
    ? json.citations.filter((u): u is string => typeof u === 'string')
    : [];

  return { summary, citations };
}

const IMAGE_STYLE_PREFIX: Record<ImageStyle, string> = {
  cartoon:
    'Indian cartoon illustration style, bold black outlines, flat vibrant colors, dark navy background, stylized characters, Tamil news poster aesthetic, hand-drawn comic feel. ',
  illustrated:
    'Digital editorial illustration, semi-realistic, vibrant palette, clean vector-like lines, professional news magazine style, detailed but stylized. ',
  realistic:
    'Cinematic 9:16 photograph, photorealistic, documentary-news style, natural lighting, editorial photography. ',
  ultra_realistic:
    'Ultra-realistic hyper-detailed photograph, 4K DSLR photography, shot on Canon EOS R5, shallow depth of field, dramatic cinematic lighting, photojournalism. ',
};

export function getStyledVisualPrompt(visualPrompt: string, imageStyle: ImageStyle): string {
  return IMAGE_STYLE_PREFIX[imageStyle] + visualPrompt;
}

export async function callNanoBananaImage(visualPrompt: string): Promise<Buffer> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set');

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.OPENROUTER_REFERER ?? 'http://localhost:3000',
      'X-Title': process.env.OPENROUTER_TITLE ?? 'Newsflow Studio',
    },
    body: JSON.stringify({
      model: 'google/gemini-3.1-flash-image-preview',
      messages: [{ role: 'user', content: visualPrompt }],
      modalities: ['image', 'text'],
      image_config: { aspect_ratio: '9:16', image_size: '2K' },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`openrouter image call failed: ${res.status} ${errText}`);
  }

  const json = (await res.json()) as {
    choices: {
      message: { images?: { image_url: { url: string } }[] };
    }[];
  };
  const dataUrl = json.choices[0]?.message.images?.[0]?.image_url.url;
  if (!dataUrl) throw new Error('openrouter image returned no image');
  const comma = dataUrl.indexOf(',');
  const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  return Buffer.from(base64, 'base64');
}
