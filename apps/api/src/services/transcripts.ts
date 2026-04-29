// Package has broken CJS/ESM config — import the ESM build directly
import { YoutubeTranscript } from 'youtube-transcript/dist/youtube-transcript.esm.js';

export async function fetchSourceTranscript(
  urlOrId: string,
  lang?: string,
): Promise<string | null> {
  try {
    const rows = await YoutubeTranscript.fetchTranscript(
      urlOrId,
      lang ? { lang } : undefined,
    );
    return rows
      .map((r) => r.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  } catch (e) {
    console.warn(
      '[transcripts] failed for',
      urlOrId,
      e instanceof Error ? e.message : String(e),
    );
    return null;
  }
}
