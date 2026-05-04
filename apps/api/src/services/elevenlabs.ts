import type { ElevenLabsAlignment, ProjectLanguage } from '@newsflow/shared';
import { requireSecret } from './secrets.js';

const VOICE_ID_BY_LANG: Record<ProjectLanguage, string | undefined> = {
  ta: process.env.ELEVENLABS_VOICE_ID_TAMIL,
  en: process.env.ELEVENLABS_VOICE_ID_ENGLISH,
  hi: process.env.ELEVENLABS_VOICE_ID_HINDI,
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
