import type { ImageStyle, ProjectLanguage, ResearchResult, ScriptOutput } from '@newsflow/shared';
import type { SourceContext } from '../pipeline/steps/01-ingest.js';
import { requireSecret } from './secrets.js';

const LANG_NAME: Record<ProjectLanguage, string> = {
  // South Asian
  ta: 'Tamil', hi: 'Hindi', kn: 'Kannada', te: 'Telugu', ml: 'Malayalam',
  bn: 'Bengali', mr: 'Marathi', gu: 'Gujarati', pa: 'Punjabi', ur: 'Urdu',
  // Global
  en: 'English',
  // European
  es: 'Spanish', fr: 'French', de: 'German', it: 'Italian', pt: 'Portuguese',
  nl: 'Dutch', pl: 'Polish', sv: 'Swedish', da: 'Danish', fi: 'Finnish',
  no: 'Norwegian', ro: 'Romanian', hu: 'Hungarian', cs: 'Czech', sk: 'Slovak',
  hr: 'Croatian', bg: 'Bulgarian', el: 'Greek', tr: 'Turkish', ru: 'Russian',
  uk: 'Ukrainian',
  // MENA
  ar: 'Arabic',
  // East Asia
  zh: 'Chinese', ja: 'Japanese', ko: 'Korean',
  // South-East Asia
  vi: 'Vietnamese', id: 'Indonesian', ms: 'Malay', fil: 'Filipino',
};

// Words per second of voiceover, language-dependent. CJK scripts trend
// faster (compact glyphs), Indic slower (compound consonants).
const LANG_WPS: Record<ProjectLanguage, number> = {
  // South Asian — slower due to compound consonants
  ta: 2.5, hi: 2.7, kn: 2.5, te: 2.5, ml: 2.4,
  bn: 2.6, mr: 2.7, gu: 2.7, pa: 2.7, ur: 2.6,
  // Global
  en: 2.8,
  // European (Latin / Cyrillic / Greek)
  es: 2.9, fr: 2.7, de: 2.6, it: 2.9, pt: 2.8,
  nl: 2.7, pl: 2.6, sv: 2.7, da: 2.7, fi: 2.5,
  no: 2.7, ro: 2.7, hu: 2.5, cs: 2.6, sk: 2.6,
  hr: 2.7, bg: 2.6, el: 2.7, tr: 2.6, ru: 2.6,
  uk: 2.6,
  // MENA
  ar: 2.6,
  // East Asia — character-dense
  zh: 4.0, ja: 3.5, ko: 3.2,
  // South-East Asia
  vi: 2.8, id: 2.8, ms: 2.8, fil: 2.8,
};

function buildScriptSystemPrompt(
  mode: 'urls' | 'script' | 'topic' | 'research',
  language: ProjectLanguage,
  durationSeconds: number,
): string {
  const langName = LANG_NAME[language];
  const wpm = LANG_WPS[language];
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

// =====================================================================
// Popular topic categories — preset content angles a user can tap to
// seed topic generation. Inspired by the AutoShorts.ai "popular topics"
// chip rail. Each category gets a tailored prompt.
// =====================================================================
export type TopicCategory =
  | 'trending_news'
  | 'bible_stories'
  | 'random_ai_story'
  | 'travel_destinations'
  | 'what_if'
  | 'scary_stories'
  | 'bedtime_stories'
  | 'interesting_history'
  | 'urban_legends'
  | 'motivational'
  | 'fun_facts'
  | 'long_form_jokes'
  | 'life_pro_tips'
  | 'eli5'
  | 'mythology'
  | 'philosophy'
  | 'finance_tips';

interface CategorySpec {
  label: string;
  systemFraming: string; // becomes the first line of the system prompt
  userPrompt: string;    // user message
  formHint: string;      // shape of each topic
  isLive: boolean;       // does this category benefit from live web search?
}

const CATEGORIES: Record<TopicCategory, CategorySpec> = {
  trending_news: {
    label: 'Trending news',
    systemFraming:
      "You are a news editor helping a creator stock their content queue. Search the live web for what's trending RIGHT NOW across general news, politics, tech, sports, entertainment, and India local.",
    userPrompt: 'Trending news topics',
    formHint: 'a single short news headline (8-15 words). Declarative. No question marks.',
    isLive: true,
  },
  bible_stories: {
    label: 'Bible stories',
    systemFraming:
      'You are a content strategist for a creator who tells classic Bible stories in short-form video. Pick well-known and lesser-known stories that teach a moral or have dramatic narrative tension.',
    userPrompt: 'Bible story topics for short-form video',
    formHint: 'a story title and angle (e.g. "Daniel in the lion\'s den — the night God shut the mouths of beasts")',
    isLive: false,
  },
  random_ai_story: {
    label: 'Random AI story',
    systemFraming:
      'You are a creative writer who invents original short-form video story premises. Mix genres — sci-fi, mystery, drama, magical realism. Each premise should hook a viewer in the first sentence.',
    userPrompt: 'Random original story premises',
    formHint: 'a one-line story premise (8-18 words) that opens with a hook',
    isLive: false,
  },
  travel_destinations: {
    label: 'Travel destinations',
    systemFraming:
      'You are a travel editor helping a creator who covers underrated and famous destinations. Mix budget gems, hidden spots, and bucket-list places.',
    userPrompt: 'Travel destination topics for short-form video',
    formHint: 'a destination + one-line angle (e.g. "Spiti Valley — the cold desert nobody talks about")',
    isLive: true,
  },
  what_if: {
    label: 'What if?',
    systemFraming:
      'You are a creative writer specializing in "What if" thought experiments — counterfactuals about history, science, society, technology. Each prompt should make a viewer want to know the answer.',
    userPrompt: '"What if" thought-experiment topics',
    formHint: 'a "What if..." question (10-18 words)',
    isLive: false,
  },
  scary_stories: {
    label: 'Scary stories',
    systemFraming:
      'You are a horror writer who pitches short-form scary story ideas. Real-feeling, unsettling, no gore — atmospheric dread. Mix urban legends, paranormal encounters, and unexplained mysteries.',
    userPrompt: 'Scary / horror story topics for short-form video',
    formHint: 'a story title with a chilling hook (e.g. "The hitchhiker who knew my name")',
    isLive: false,
  },
  bedtime_stories: {
    label: 'Bedtime stories',
    systemFraming:
      'You are a children\'s author. Pitch calming, kind bedtime story ideas — animals, gentle moral lessons, magical worlds, no scares. Suitable for ages 4-10.',
    userPrompt: 'Calming bedtime story ideas for kids',
    formHint: 'a gentle story title with a one-line summary',
    isLive: false,
  },
  interesting_history: {
    label: 'Interesting history',
    systemFraming:
      'You are a history nerd who pitches under-the-radar historical stories that read like a thriller. Avoid the obvious greatest-hits — find the strange, specific, surprising stories.',
    userPrompt: 'Fascinating but lesser-known history topics',
    formHint: 'a historical event + angle (e.g. "The Dancing Plague of 1518 — a town that danced itself to death")',
    isLive: false,
  },
  urban_legends: {
    label: 'Urban legends',
    systemFraming:
      'You are a folklorist who collects regional urban legends from around the world — especially South Asia, Latin America, East Asia. Real folklore, not internet creepypasta.',
    userPrompt: 'Real urban legend topics from world folklore',
    formHint: 'a legend name + one-line hook',
    isLive: false,
  },
  motivational: {
    label: 'Motivational',
    systemFraming:
      'You are a content strategist for a motivational creator. Pitch sharp, specific topics — not platitudes. Stories of resilience, useful frames, lessons from real lives.',
    userPrompt: 'Motivational topics with a specific angle',
    formHint: 'a punchy headline (no clichés like "follow your dreams")',
    isLive: false,
  },
  fun_facts: {
    label: 'Fun facts',
    systemFraming:
      'You are a science communicator pitching genuinely surprising facts that most people do not know. Verifiable, specific, counterintuitive. No "did you know" pre-amble.',
    userPrompt: 'Surprising and verifiable fun facts',
    formHint: 'a one-line fact that ends with the surprise (e.g. "Bananas are berries; strawberries are not.")',
    isLive: false,
  },
  long_form_jokes: {
    label: 'Long-form jokes',
    systemFraming:
      'You are a stand-up writer pitching long-form joke setups for short-form video. The setup should land in 30-45 seconds with a clean punchline. PG-13. No edgy/offensive humor.',
    userPrompt: 'Long-form joke setups',
    formHint: 'a joke title or one-line setup',
    isLive: false,
  },
  life_pro_tips: {
    label: 'Life pro tips',
    systemFraming:
      'You are a productivity / life-hack writer. Pitch specific, useful, non-obvious tips. Each should be actionable today. No generic advice.',
    userPrompt: 'Life pro tips that are non-obvious',
    formHint: 'a sharp tip (e.g. "Email subject lines starting with [Action] get replies 2x faster")',
    isLive: false,
  },
  eli5: {
    label: 'ELI5',
    systemFraming:
      'You are an explainer writer pitching "Explain Like I\'m 5" topics. Pick complex concepts that beg a clear, simple explanation — economics, physics, biology, computing, geopolitics.',
    userPrompt: 'ELI5 explainer topics',
    formHint: 'a topic phrased as "ELI5: how does X work?"',
    isLive: false,
  },
  mythology: {
    label: 'Mythology',
    systemFraming:
      'You are a comparative-mythology writer. Pitch stories from Indian, Greek, Norse, Egyptian, Japanese, African and Mesoamerican myth. Mix famous and obscure.',
    userPrompt: 'Mythology story topics from world traditions',
    formHint: 'a myth title + tradition (e.g. "Karna\'s armor — the curse hidden in his birth")',
    isLive: false,
  },
  philosophy: {
    label: 'Philosophy',
    systemFraming:
      'You are a philosophy explainer pitching big ideas in accessible ways. Cover ethics, metaphysics, eastern + western thought. Each topic should provoke.',
    userPrompt: 'Philosophy topics for short-form video',
    formHint: 'a philosophical question or idea (e.g. "The trolley problem — would you pull the lever?")',
    isLive: false,
  },
  finance_tips: {
    label: 'Finance tips',
    systemFraming:
      'You are a financial-literacy writer pitching specific, useful tips for individual investors and savers. India + global context. No get-rich-quick. No specific stock picks.',
    userPrompt: 'Personal finance topics',
    formHint: 'a sharp finance tip or concept (e.g. "Why your SIP returns lag your fund\'s return")',
    isLive: true,
  },
};

export function listTopicCategories(): Array<{ key: TopicCategory; label: string }> {
  return (Object.entries(CATEGORIES) as [TopicCategory, CategorySpec][]).map(([key, spec]) => ({
    key,
    label: spec.label,
  }));
}

/**
 * Use Perplexity Sonar to generate topic ideas for a creator's queue.
 * Topics are tailored to the chosen category and language. For news /
 * travel / finance categories the model will search the live web; for
 * evergreen categories (Bible, mythology, ELI5, etc.) it draws from its
 * own knowledge.
 */
export async function generateTopicSuggestions(args: {
  language: ProjectLanguage;
  niche?: string;
  count?: number;
  category?: TopicCategory;
}): Promise<string[]> {
  const apiKey = await requireSecret('OPENROUTER_API_KEY');
  const langName = LANG_NAME[args.language];
  const count = Math.max(3, Math.min(args.count ?? 12, 20));

  const niche = args.niche?.trim();
  const category = args.category ?? 'trending_news';
  const spec = CATEGORIES[category];
  const nicheClause = niche ? ` focused on "${niche}".` : '';

  const systemPrompt = `${spec.systemFraming}${nicheClause}

Return a JSON object with this exact shape:
{
  "topics": [
    "${spec.formHint} #1, in ${langName}",
    "${spec.formHint} #2, in ${langName}",
    ...
  ]
}

Rules:
- Exactly ${count} topics.
- Each topic = ${spec.formHint}.
- Written in ${langName}. Native script, no transliteration.
- ${spec.isLive ? 'Verifiable, currently-trending. No speculation.' : 'Original or well-attested. No speculation as fact.'}
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
        { role: 'user', content: niche ? `${spec.userPrompt} (focus: ${niche})` : spec.userPrompt },
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
  // South Asian
  ta: 'South Indian / Tamil Nadu setting. Tamil people, Chennai / Madurai / Coimbatore streets and Dravidian architecture. ',
  hi: 'North Indian / Hindi-belt setting. Indian people, Delhi / Lucknow / Mumbai streets and architecture. ',
  kn: 'Karnataka setting. South Indian people, Bengaluru / Mysuru / Mangaluru streets and Hoysala-era temples. ',
  te: 'Andhra Pradesh & Telangana setting. South Indian people, Hyderabad / Vijayawada streets and architecture. ',
  ml: 'Kerala setting. South Indian people, Kochi / Thiruvananthapuram / Kozhikode streets, backwaters and coastal architecture. ',
  bn: 'Bengali setting. West Bengal / Bangladesh, Kolkata trams and Dhaka streets, colonial-era and traditional architecture. ',
  mr: 'Maharashtra setting. Marathi people, Mumbai / Pune streets, fort architecture, Konkan coast. ',
  gu: 'Gujarat setting. Gujarati people, Ahmedabad / Surat streets, stepwells and Indo-Saracenic architecture, vibrant textiles. ',
  pa: 'Punjab setting. Punjabi people, Amritsar / Chandigarh / Lahore, Sikh-temple architecture, mustard fields. ',
  ur: 'Urdu / Pakistani / Indian Muslim setting. Lahore / Karachi / Lucknow streets, Mughal-era architecture, calligraphy aesthetic. ',
  // Global
  en: 'International / global newsroom aesthetic. Subjects appropriate to the headline. ',
  // European — Western
  es: 'Spanish / Latin American setting. Madrid, Barcelona, Mexico City, Buenos Aires streets and architecture. ',
  fr: 'French setting. Parisian / Lyonnais streets, Haussmann buildings, café culture. ',
  de: 'German setting. Berlin / Munich streets, modernist and traditional architecture. ',
  it: 'Italian setting. Rome / Milan / Naples streets, Renaissance and Roman architecture. ',
  pt: 'Portuguese / Brazilian setting. Lisbon / São Paulo / Rio streets, azulejo tile aesthetic. ',
  nl: 'Dutch setting. Amsterdam / Rotterdam canals, gabled houses, bicycle culture. ',
  // European — Northern / Central / Eastern
  pl: 'Polish setting. Warsaw / Kraków streets, post-war modernist and old-town architecture. ',
  sv: 'Swedish setting. Stockholm / Gothenburg streets, Scandinavian minimalism. ',
  da: 'Danish setting. Copenhagen streets, Hygge interiors, cycling culture. ',
  fi: 'Finnish setting. Helsinki streets, lake landscapes, modernist architecture. ',
  no: 'Norwegian setting. Oslo / Bergen streets, fjords, wood-clad architecture. ',
  ro: 'Romanian setting. Bucharest / Cluj streets, Brutalist and Belle-Époque mix. ',
  hu: 'Hungarian setting. Budapest streets, Art Nouveau architecture, Danube riverfront. ',
  cs: 'Czech setting. Prague streets, Gothic and Baroque architecture. ',
  sk: 'Slovak setting. Bratislava streets, Carpathian villages and Tatra mountains. ',
  hr: 'Croatian setting. Zagreb / Split / Dubrovnik streets, Adriatic coastal towns. ',
  bg: 'Bulgarian setting. Sofia / Plovdiv streets, Orthodox church domes and Black-Sea coast. ',
  el: 'Greek setting. Athens / Thessaloniki / Cyclades, ancient ruins, white-and-blue island towns. ',
  tr: 'Turkish setting. Istanbul / Ankara streets, mosques, bazaars and Bosphorus skyline. ',
  ru: 'Russian setting. Moscow / Saint Petersburg streets, Orthodox cathedrals, Soviet-era apartment blocks. ',
  uk: 'Ukrainian setting. Kyiv / Lviv streets, post-Soviet plus Habsburg-era architecture. ',
  // MENA
  ar: 'Arab / Middle Eastern setting. Cairo / Dubai / Riyadh streets, mosques, souks, desert landscapes. ',
  // East Asia
  zh: 'Chinese setting. Shanghai / Beijing / Hong Kong streets, neon hutongs, modern skyscrapers and traditional roofs. ',
  ja: 'Japanese setting. Tokyo / Kyoto / Osaka streets, neon districts, shrines, suburban density. ',
  ko: 'Korean setting. Seoul / Busan streets, hanok rooftops alongside neon high-rises. ',
  // South-East Asia
  vi: 'Vietnamese setting. Hanoi / Ho Chi Minh City streets, scooters, French-colonial buildings. ',
  id: 'Indonesian setting. Jakarta / Bali streets, tropical greenery, traditional and modern mix. ',
  ms: 'Malaysian setting. Kuala Lumpur / Penang streets, mosques, modern skyline. ',
  fil: 'Filipino setting. Manila / Cebu streets, Spanish-colonial churches and tropical neighborhoods. ',
};

// Hard-coded across every image, every style, every language: NO TEXT.
//
// Subtitles are NOT generated by the image model. They are a separate
// overlay layer burned in by FFmpeg in the compose step, sourced from
// the script's per-scene narration + ElevenLabs character-level timing.
// The image model ONLY produces the visual backdrop — never any text.
//
// Image models can't reliably spell, especially Tamil/Devanagari but
// also frequently in English cartoon style. Forbidding text entirely is
// the only way to guarantee clean output.
const NO_TEXT_RULE =
  ' ABSOLUTE RULE — NO TEXT: do not render any text, words, letters, numbers, ' +
  'captions, subtitles, logos, headlines, signage, billboards, newspapers, ' +
  'newspaper headlines, screen text, TV chyrons, name tags, labels, ' +
  'watermarks, banners, posters with text, scrolling tickers, or speech ' +
  'bubbles anywhere in the image. The image must be 100% free of any ' +
  'written characters in any language or script. Show only people, ' +
  'places, objects, and scenes. Any sign, screen, newspaper, or banner ' +
  'visible in the frame must appear completely blank, defocused, or with ' +
  'its surface obscured. Do NOT include any caption layer or subtitle ' +
  'inside the image — captions are handled outside this image, in a ' +
  'separate subtitle layer. ';

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
