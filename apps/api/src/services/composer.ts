import path from 'node:path';
import ffmpeg from 'fluent-ffmpeg';
import type { ElevenLabsAlignment, ProjectLanguage, Scene } from '@newsflow/shared';

// Per-language font face. The Dockerfile installs `fonts-noto-extra` (Tamil),
// `fonts-noto` (Latin), and `fonts-noto-cjk` — all of which provide the
// Noto family. libass / libfribidi look up by family name.
const SUBTITLE_FONT_BY_LANG: Record<ProjectLanguage, string> = {
  ta: 'Noto Sans Tamil',     // Tamil shaping
  hi: 'Noto Sans Devanagari', // Hindi shaping
  en: 'Noto Sans',            // Latin
};

if (process.env.FFMPEG_PATH) ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
if (process.env.FFPROBE_PATH) ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);

const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1920;

export function computeSceneDurations(args: {
  scenes: Scene[];
  alignment: ElevenLabsAlignment;
  targetTotalSeconds: number;
}): number[] {
  const { scenes, alignment, targetTotalSeconds } = args;
  const { characters, character_end_times_seconds } = alignment;
  const totalAudio =
    character_end_times_seconds[character_end_times_seconds.length - 1] ?? targetTotalSeconds;

  const fullText = characters.join('');
  const markers = scenes.map((s) => s.narration.trim());

  const boundaries: number[] = [];
  let cursor = 0;
  for (const marker of markers) {
    const idx = fullText.indexOf(marker, cursor);
    if (idx < 0) {
      boundaries.push(-1);
      continue;
    }
    const endCharIdx = idx + marker.length - 1;
    const endTime =
      character_end_times_seconds[endCharIdx] ??
      character_end_times_seconds[character_end_times_seconds.length - 1] ??
      totalAudio;
    boundaries.push(endTime);
    cursor = idx + marker.length;
  }

  const fallbackPerScene = totalAudio / scenes.length;
  const durations: number[] = [];
  let prevEnd = 0;
  for (let i = 0; i < scenes.length; i++) {
    const end = boundaries[i];
    if (end && end > prevEnd) {
      durations.push(Number((end - prevEnd).toFixed(3)));
      prevEnd = end;
    } else {
      durations.push(Number(fallbackPerScene.toFixed(3)));
      prevEnd = (i + 1) * fallbackPerScene;
    }
  }

  const sum = durations.reduce((a, b) => a + b, 0);
  const last = durations[durations.length - 1] ?? 0;
  if (sum < totalAudio) {
    durations[durations.length - 1] = Number((last + (totalAudio - sum)).toFixed(3));
  }

  return durations;
}

export async function composeFinalVideoFiles(args: {
  imagePaths: string[];
  sceneDurations: number[];
  audioPath: string;
  srtPath: string;
  outputPath: string;
  tmpDir: string;
  logoPath?: string;
  title?: string;
  language: ProjectLanguage;
}): Promise<void> {
  const { imagePaths, sceneDurations, audioPath, srtPath, outputPath, tmpDir, logoPath, title, language } = args;

  const sceneClips: string[] = [];
  for (let i = 0; i < imagePaths.length; i++) {
    const img = imagePaths[i]!;
    const dur = Math.max(0.8, sceneDurations[i] ?? 2);
    const clipPath = path.join(tmpDir, `scene-${String(i).padStart(2, '0')}.mp4`);
    await makeSceneClip(img, dur, clipPath, logoPath);
    sceneClips.push(clipPath);
  }

  const listFilePath = path.join(tmpDir, 'concat.txt');
  const concatBody = sceneClips.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n');
  const fs = await import('node:fs/promises');
  await fs.writeFile(listFilePath, concatBody, 'utf8');

  const silentConcatPath = path.join(tmpDir, 'silent-concat.mp4');
  await concatClips(listFilePath, silentConcatPath);

  await finalMux({
    silentVideoPath: silentConcatPath,
    audioPath,
    srtPath,
    outputPath,
    title,
    language,
  });
}

async function makeSceneClip(
  imagePath: string,
  durationS: number,
  outPath: string,
  logoPath?: string,
): Promise<void> {
  const frames = Math.max(2, Math.ceil(durationS * FPS));
  const LOGO_H = 80;
  const LOGO_PAD = 30;

  let fc: string;
  if (logoPath) {
    fc =
      `[0:v]scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,` +
      `crop=${WIDTH}:${HEIGHT},` +
      `zoompan=z='min(zoom+0.0015,1.15)':d=${frames}:s=${WIDTH}x${HEIGHT}:fps=${FPS}[bg];` +
      `[1:v]scale=-1:${LOGO_H}[logo];` +
      `[bg][logo]overlay=W-w-${LOGO_PAD}:${LOGO_PAD}[v]`;
  } else {
    fc =
      `[0:v]scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,` +
      `crop=${WIDTH}:${HEIGHT},` +
      `zoompan=z='min(zoom+0.0015,1.15)':d=${frames}:s=${WIDTH}x${HEIGHT}:fps=${FPS}[v]`;
  }

  return new Promise<void>((resolve, reject) => {
    const cmd = ffmpeg()
      .input(imagePath)
      .inputOptions(['-loop 1']);

    if (logoPath) {
      cmd.input(logoPath);
    }

    cmd
      .complexFilter(fc)
      .outputOptions([
        '-map', '[v]',
        '-t', String(durationS),
        '-pix_fmt', 'yuv420p',
        '-c:v', 'libx264',
        // Memory-conscious encoding: ultrafast preset + capped threads.
        // libx264 allocates per-thread state, so on a 512MB-2GB container
        // 'fast' + auto-threads OOMs. ultrafast cuts encoder memory ~3x.
        '-preset', 'ultrafast',
        '-threads', '2',
        '-tune', 'zerolatency',
        '-r', String(FPS),
        '-an',
      ])
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .save(outPath);
  });
}

async function concatClips(listFilePath: string, outPath: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(listFilePath)
      .inputOptions(['-f concat', '-safe 0'])
      .outputOptions(['-c copy'])
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .save(outPath);
  });
}

let _filterCaps: { subtitles: boolean; drawtext: boolean } | null = null;
async function checkFilterCaps(): Promise<{ subtitles: boolean; drawtext: boolean }> {
  if (_filterCaps) return _filterCaps;
  const { execSync } = await import('node:child_process');
  try {
    const ffmpegBin = process.env.FFMPEG_PATH ?? 'ffmpeg';
    const out = execSync(`${ffmpegBin} -filters 2>/dev/null`, { encoding: 'utf8' });
    _filterCaps = {
      subtitles: out.includes(' subtitles '),
      drawtext: out.includes(' drawtext '),
    };
  } catch {
    _filterCaps = { subtitles: false, drawtext: false };
  }
  return _filterCaps;
}

async function finalMux(args: {
  silentVideoPath: string;
  audioPath: string;
  srtPath: string;
  outputPath: string;
  title?: string;
  language: ProjectLanguage;
}): Promise<void> {
  const caps = await checkFilterCaps();
  const filters: string[] = [];

  if (caps.subtitles) {
    // Movie-style captions, bottom of frame, language-aware font.
    //
    // CRITICAL: original_size=${WIDTH}x${HEIGHT} — without this libass uses its
    // default 384×288 canvas, so any FontSize/Outline/Margin values get scaled
    // up ~6.7× on a 1080×1920 frame (which is why FontSize=22 was producing
    // ~150px-tall text in the middle of the screen). With original_size set,
    // every numeric value below is in real video pixels.
    //
    //   FontName       — Noto Sans Tamil / Devanagari / Sans (installed in Docker)
    //   FontSize=22    — 22px on 1920 ≈ 1.15% frame height; tiny subtitle
    //   PrimaryColour  — pure white
    //   OutlineColour  — black, thin stroke for legibility
    //   BorderStyle=1  — outline + shadow (vs 3 = boxed background)
    //   Outline=1.5    — thin black stroke
    //   Shadow=0       — none at this small size
    //   Alignment=2    — bottom-center (also reinforced per-line via {\an2})
    //   MarginV=50     — only 50px from bottom edge, true subtitle anchor
    //   MarginL/R=60   — horizontal padding for wrap
    //   WrapStyle=2    — smart wrap
    const fontName = SUBTITLE_FONT_BY_LANG[args.language] ?? 'Noto Sans';
    const subs =
      `subtitles=${escapeForFilter(args.srtPath)}:original_size=${WIDTH}x${HEIGHT}:force_style='` +
      `FontName=${fontName},FontSize=22,` +
      `PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,BackColour=&H00000000&,` +
      `BorderStyle=1,Outline=1.5,Shadow=0,Alignment=2,` +
      `MarginV=50,MarginL=60,MarginR=60,WrapStyle=2'`;
    filters.push(subs);
  }

  // Headline banner (drawtext) intentionally disabled. The title was a
  // top-of-frame Latin-only overlay that:
  //   1. Couldn't render Tamil/Devanagari (drawtext doesn't shape complex scripts)
  //   2. Competed with the bottom subtitle layer for attention
  //   3. Misspelled words when the title was non-English
  // All text now lives in the bottom subtitle layer, language-aware.
  void args.title;

  const hasBurn = filters.length > 0;

  return new Promise<void>((resolve, reject) => {
    const cmd = ffmpeg()
      .input(args.silentVideoPath)
      .input(args.audioPath);

    if (hasBurn) {
      cmd.videoFilters(filters);
    }

    cmd
      .outputOptions([
        '-map', '0:v:0',
        '-map', '1:a:0',
        '-c:v', hasBurn ? 'libx264' : 'copy',
        // Subtitle burn-in is memory heavy (libass holds glyph caches).
        // Cap threads + use a faster preset so we don't OOM on small containers.
        ...(hasBurn
          ? ['-preset', 'fast', '-crf', '23', '-pix_fmt', 'yuv420p', '-threads', '2']
          : []),
        '-c:a', 'aac',
        '-b:a', '192k',
        '-movflags', '+faststart',
        '-shortest',
      ])
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .save(args.outputPath);
  });
}

function escapeForFilter(p: string): string {
  return p.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\'");
}
