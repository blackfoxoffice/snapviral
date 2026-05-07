import type { ImageStyle, ProjectLanguage, ResearchResult, ScriptOutput } from '@newsflow/shared';
import type { SourceContext } from '../pipeline/steps/01-ingest.js';
import { requireSecret } from './secrets.js';

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
- visual_prompt describes a cinematic 9:16 photograph that illustrates the scene. Be specific: location, subject, mood, lighting, composition. Photorealistic, documentary-news style.
- ABSOLUTELY NO text in visual_prompt. Do NOT mention "signs", "captions", "headlines", "newspapers", "banners with text", "billboards", "name tags", "screens showing X", "papers reading Y", or any element that would cause the image model to render letters/words. If the scene needs signage to make sense, describe the surrounding context without the text — e.g. "a busy market street" not "a market street with shop signs reading X". All text in the final video lives in the subtitle layer; the image must contain zero written characters.
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
  const apiKey = await requireSecret('OPENROUTER_API_KEY');

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

/**
 * Use Perplexity Sonar to surface real, currently-trending news topics.
 * Returns a list of headline-style strings the user can drop into the
 * auto-publish queue. Topics are written in the requested language.
 */
export async function generateTopicSuggestions(args: {
  language: ProjectLanguage;
  niche?: string;
  count?: number;
}): Promise<string[]> {
  const apiKey = await requireSecret('OPENROUTER_API_KEY');
  const langName = LANG_NAME[args.language];
  const count = Math.max(3, Math.min(args.count ?? 12, 20));

  const niche = args.niche?.trim();
  const focus = niche ? ` focused on "${niche}"` : ' across general news, politics, tech, sports, entertainment, and India local';

  const systemPrompt = `You are a news editor helping a creator stock their content queue.
Search the live web for what's trending RIGHT NOW${focus}.

Return a JSON object with this exact shape:
{
  "topics": [
    "Concise headline #1, in ${langName}",
    "Concise headline #2, in ${langName}",
    ...
  ]
}

Rules:
- Exactly ${count} topics.
- Each topic = a single short news headline (8-15 words). Not a question, not "What is X" — declarative.
- Written in ${langName}. Native script, no transliteration.
- Verifiable, currently-trending stories. No speculation.
- No duplicates. No numbering. No quotes inside the strings.
- Output ONLY the JSON object. No preamble, no markdown.`;

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
        { role: 'user', content: niche ? `Trending topics in ${niche}` : 'Trending news topics' },
      ],
      temperature: 0.5,
      // Perplexity rejects response_format: json_object — only supports
      // text / json_schema / regex. Use json_schema for structured output.
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'topic_list',
          schema: {
            type: 'object',
            properties: {
              topics: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            required: ['topics'],
            additionalProperties: false,
          },
        },
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`generate-topics call failed: ${res.status} ${errText}`);
  }

  const json = (await res.json()) as { choices: { message: { content: string } }[] };
  const content = json.choices[0]?.message.content?.trim();
  if (!content) throw new Error('generate-topics returned empty content');

  // Parse defensively: most providers return clean JSON, but some wrap it in
  // a ```json fenced block. Strip fences before JSON.parse.
  const stripped = content
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  let parsed: { topics?: unknown };
  try {
    parsed = JSON.parse(stripped);
  } catch {
    throw new Error('generate-topics returned non-JSON: ' + content.slice(0, 200));
  }

  const topics = Array.isArray(parsed.topics)
    ? parsed.topics.filter((t): t is string => typeof t === 'string' && t.trim().length >= 3)
    : [];
  if (topics.length === 0) throw new Error('generate-topics returned no usable topics');
  return topics.map((t) => t.trim()).slice(0, count);
}

export async function callPerplexityResearch(args: {
  topic: string;
  extraContext?: string;
}): Promise<ResearchResult> {
  const apiKey = await requireSecret('OPENROUTER_API_KEY');

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
    'Cartoon illustration style, bold black outlines, flat vibrant colors, dark navy background, stylized characters, news poster aesthetic, hand-drawn comic feel. ',
  illustrated:
    'Digital editorial illustration, semi-realistic, vibrant palette, clean vector-like lines, professional news magazine style, detailed but stylized. ',
  realistic:
    'Cinematic 9:16 photograph, photorealistic, documentary-news style, natural lighting, editorial photography. ',
  ultra_realistic:
    'Ultra-realistic hyper-detailed photograph, 4K DSLR photography, shot on Canon EOS R5, shallow depth of field, dramatic cinematic lighting, photojournalism. ',
};

// Cultural/regional context tied to the script's language. Keeps subjects,
// locations, and visual references consistent with where the audience lives.
// We intentionally do NOT ask for language-specific signage — image models
// misspell almost any non-Latin text (especially in cartoon style). All text
// belongs in the subtitle/overlay layer, not in the pixels.
const IMAGE_LANGUAGE_CONTEXT: Record<ProjectLanguage, string> = {
  ta: 'South Indian / Tamil Nadu setting and aesthetic. Indian people, Indian streets and architecture (Chennai, Madurai, Kerala adjacent). ',
  hi: 'North Indian / Indian setting and aesthetic. Indian people, Indian streets and architecture (Delhi, Mumbai, Bengaluru). ',
  en: 'International / global newsroom aesthetic. Subjects appropriate to the headline. ',
};

// Hard-coded across every image, every style, every language: NO TEXT.
// Image models can't reliably spell — especially Tamil/Devanagari, but also
// frequently in English cartoon style. Subtitles handle all text.
const NO_TEXT_RULE =
  ' STRICT RULE: do not render any text, words, letters, numbers, captions, ' +
  'logos, headlines, signage, billboards, newspaper text, screen text, name ' +
  "tags, labels, or watermarks anywhere in the image. The image must be " +
  'completely free of any written characters in any language or script. ' +
  'Show people, places, objects, and scenes only. Any signs, screens, ' +
  'newspapers, or banners visible in the frame must appear blank, blurred, ' +
  'or out of focus. ';

export function getStyledVisualPrompt(
  visualPrompt: string,
  imageStyle: ImageStyle,
  language: ProjectLanguage,
): string {
  return (
    IMAGE_STYLE_PREFIX[imageStyle] +
    IMAGE_LANGUAGE_CONTEXT[language] +
    NO_TEXT_RULE +
    visualPrompt
  );
}

export async function callNanoBananaImage(visualPrompt: string): Promise<Buffer> {
  const apiKey = await requireSecret('OPENROUTER_API_KEY');

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
