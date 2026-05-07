import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import type { ElevenLabsAlignment, ScriptOutput } from '@newsflow/shared';
import { getServiceClient } from '../../services/supabase.js';

interface BuildSubtitlesArgs {
  projectId: string;
  userId: string;
  script: ScriptOutput;
  alignment: ElevenLabsAlignment;
}

export interface SubtitlesResult {
  storagePath: string;
  localPath: string;
  cues: { start: number; end: number; text: string }[];
}

const MAX_CHARS_PER_CUE = 40;

export async function buildSubtitles(args: BuildSubtitlesArgs): Promise<SubtitlesResult> {
  const cues = chunkAlignment(args.alignment, MAX_CHARS_PER_CUE);
  const srt = cuesToSrt(cues);

  const tmpDir = await fs.mkdtemp(
    path.join(os.tmpdir(), `newsflow-${args.projectId}-srt-`),
  );
  const localPath = path.join(tmpDir, 'captions.srt');
  await fs.writeFile(localPath, srt, 'utf8');

  const storagePath = `${args.userId}/${args.projectId}/subtitles/captions.srt`;
  const supa = getServiceClient();
  const { error } = await supa.storage
    .from('project-assets')
    .upload(storagePath, Buffer.from(srt, 'utf8'), {
      contentType: 'application/x-subrip',
      upsert: true,
    });
  if (error) throw new Error(`subtitles upload failed: ${error.message}`);

  await supa.from('assets').insert({
    project_id: args.projectId,
    type: 'subtitle',
    storage_path: storagePath,
    content: { cues },
  });

  return { storagePath, localPath, cues };
}

export function chunkAlignment(
  alignment: ElevenLabsAlignment,
  maxChars: number,
): { start: number; end: number; text: string }[] {
  const cues: { start: number; end: number; text: string }[] = [];
  const { characters, character_start_times_seconds, character_end_times_seconds } =
    alignment;

  let buf = '';
  let start = 0;

  for (let i = 0; i < characters.length; i++) {
    const ch = characters[i] ?? '';
    if (buf.length === 0) start = character_start_times_seconds[i] ?? 0;
    buf += ch;
    const endHere = character_end_times_seconds[i] ?? start;
    const atBreak = (ch === ' ' || ch === '\n') && buf.trim().length >= maxChars;
    const atEnd = i === characters.length - 1;
    if (atBreak || atEnd) {
      const text = buf.trim();
      if (text) cues.push({ start, end: endHere, text });
      buf = '';
    }
  }
  return cues;
}

/**
 * Build SRT subtitle file from per-cue narration text + start/end timestamps.
 *
 * The cues array comes from the alignment step — it walks ElevenLabs's
 * character-level timing data over the joined scene narrations and groups
 * adjacent characters into timed cues. So each subtitle line corresponds
 * to a slice of an actual scene.narration string from the script.
 *
 * We prefix every line with {\an2} — ASS override tag for "bottom-center
 * alignment". libass parses these tags when converting SRT to ASS at render
 * time. This is a per-line position lock that overrides any default style.
 *
 * Subtitles are a SEPARATE OVERLAY layer in the final video composition —
 * they do not pass through the image generation model. The image model
 * (called by 03-images.ts) is forbidden from rendering any text.
 */
export function cuesToSrt(
  cues: { start: number; end: number; text: string }[],
): string {
  return cues
    .map(
      (c, i) =>
        `${i + 1}\n${formatSrtTime(c.start)} --> ${formatSrtTime(c.end)}\n{\\an2}${c.text}\n`,
    )
    .join('\n');
}

function formatSrtTime(t: number): string {
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = Math.floor(t % 60);
  const ms = Math.round((t - Math.floor(t)) * 1000);
  return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)},${pad(ms, 3)}`;
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, '0');
}
