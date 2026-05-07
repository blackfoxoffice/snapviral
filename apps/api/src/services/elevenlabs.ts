import type { ElevenLabsAlignment, ProjectLanguage } from '@newsflow/shared';
import { requireSecret } from './secrets.js';

// Optional per-language fallback voices. Set in env to provide a default
// when the user hasn't picked a voice. ElevenLabs voice IDs are global, so
// any voice can technically narrate any language — these envs let us bias
// toward a native-sounding voice per locale.
//
// Aligned with ElevenLabs multilingual v2 + v3. Any locale without an env
// entry will fall back to the multilingual v2 default (English voice).
const env = (k: string) => process.env[k];
const VOICE_ID_BY_LANG: Record<ProjectLanguage, string | undefined> = {
  // South Asian
  ta: env('ELEVENLABS_VOICE_ID_TAMIL'),
  hi: env('ELEVENLABS_VOICE_ID_HINDI'),
  kn: env('ELEVENLABS_VOICE_ID_KANNADA'),
  te: env('ELEVENLABS_VOICE_ID_TELUGU'),
  ml: env('ELEVENLABS_VOICE_ID_MALAYALAM'),
  bn: env('ELEVENLABS_VOICE_ID_BENGALI'),
  mr: env('ELEVENLABS_VOICE_ID_MARATHI'),
  gu: env('ELEVENLABS_VOICE_ID_GUJARATI'),
  pa: env('ELEVENLABS_VOICE_ID_PUNJABI'),
  ur: env('ELEVENLABS_VOICE_ID_URDU'),
  // Global
  en: env('ELEVENLABS_VOICE_ID_ENGLISH'),
  // European
  es: env('ELEVENLABS_VOICE_ID_SPANISH'),
  fr: env('ELEVENLABS_VOICE_ID_FRENCH'),
  de: env('ELEVENLABS_VOICE_ID_GERMAN'),
  it: env('ELEVENLABS_VOICE_ID_ITALIAN'),
  pt: env('ELEVENLABS_VOICE_ID_PORTUGUESE'),
  nl: env('ELEVENLABS_VOICE_ID_DUTCH'),
  pl: env('ELEVENLABS_VOICE_ID_POLISH'),
  sv: env('ELEVENLABS_VOICE_ID_SWEDISH'),
  da: env('ELEVENLABS_VOICE_ID_DANISH'),
  fi: env('ELEVENLABS_VOICE_ID_FINNISH'),
  no: env('ELEVENLABS_VOICE_ID_NORWEGIAN'),
  ro: env('ELEVENLABS_VOICE_ID_ROMANIAN'),
  hu: env('ELEVENLABS_VOICE_ID_HUNGARIAN'),
  cs: env('ELEVENLABS_VOICE_ID_CZECH'),
  sk: env('ELEVENLABS_VOICE_ID_SLOVAK'),
  hr: env('ELEVENLABS_VOICE_ID_CROATIAN'),
  bg: env('ELEVENLABS_VOICE_ID_BULGARIAN'),
  el: env('ELEVENLABS_VOICE_ID_GREEK'),
  tr: env('ELEVENLABS_VOICE_ID_TURKISH'),
  ru: env('ELEVENLABS_VOICE_ID_RUSSIAN'),
  uk: env('ELEVENLABS_VOICE_ID_UKRAINIAN'),
  // MENA
  ar: env('ELEVENLABS_VOICE_ID_ARABIC'),
  // East Asia
  zh: env('ELEVENLABS_VOICE_ID_CHINESE'),
  ja: env('ELEVENLABS_VOICE_ID_JAPANESE'),
  ko: env('ELEVENLABS_VOICE_ID_KOREAN'),
  // South-East Asia
  vi: env('ELEVENLABS_VOICE_ID_VIETNAMESE'),
  id: env('ELEVENLABS_VOICE_ID_INDONESIAN'),
  ms: env('ELEVENLABS_VOICE_ID_MALAY'),
  fil: env('ELEVENLABS_VOICE_ID_FILIPINO'),
};

export async function generateTtsWithAlignment(args: {
  text: string;
  language: ProjectLanguage;
  voiceId?: string | null;
}): Promise<{ audio: Buffer; alignment: ElevenLabsAlignment }> {
  const apiKey = await requireSecret('ELEVENLABS_API_KEY');
  const voiceId = args.voiceId || VOICE_ID_BY_LANG[args.language];
  if (!voiceId)
    throw new Error(
      `No ElevenLabs voice id configured for language "${args.language}". Set ELEVENLABS_VOICE_ID_* in the environment.`,
    );

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: args.text,
        model_id: 'eleven_multilingual_v2',
        language_code: args.language,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
        output_format: 'mp3_44100_128',
      }),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`elevenlabs tts failed: ${res.status} ${err}`);
  }

  const json = (await res.json()) as {
    audio_base64: string;
    alignment: ElevenLabsAlignment;
  };

  return {
    audio: Buffer.from(json.audio_base64, 'base64'),
    alignment: json.alignment,
  };
}
