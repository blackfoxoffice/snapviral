import type { ImageStyle, Project, ScriptOutput, ElevenLabsAlignment } from '@newsflow/shared';
import { getServiceClient } from '../services/supabase.js';
import { ingest, type SourceContext } from './steps/01-ingest.js';
import { generateScript } from './steps/02-script.js';
import { generateSceneImages } from './steps/03-images.js';
import { generateVoiceover } from './steps/04-voice.js';
import { buildSubtitles } from './steps/05-align.js';
import { composeFinalVideo } from './steps/06-compose.js';
export { buildFullNarration } from './utils.js';

export async function runPipeline(projectId: string): Promise<void> {
  const supa = getServiceClient();

  const { data: project, error } = await supa
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();
  if (error || !project) {
    console.error('[pipeline] project not found', projectId);
    return;
  }
  const typed = project as Project;

  await supa
    .from('projects')
    .update({ status: 'running', progress_pct: 0, error: null })
    .eq('id', projectId);

  const step = async <T>(name: string, fn: () => Promise<T>, pct: number): Promise<T> => {
    const { data: job } = await supa
      .from('pipeline_jobs')
      .insert({
        project_id: projectId,
        step: name,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();
    await supa.from('projects').update({ current_step: name }).eq('id', projectId);
    try {
      const out = await fn();
      await supa
        .from('pipeline_jobs')
        .update({
          status: 'done',
          output: toJson(out),
          finished_at: new Date().toISOString(),
        })
        .eq('id', job!.id);
      await supa.from('projects').update({ progress_pct: pct }).eq('id', projectId);
      return out;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await supa
        .from('pipeline_jobs')
        .update({ status: 'failed', error: msg, finished_at: new Date().toISOString() })
        .eq('id', job!.id);
      throw e;
    }
  };

  try {
    const source: SourceContext = await step('ingest', () => ingest(typed), 15);
    const script: ScriptOutput = await step(
      'script',
      () =>
        generateScript({
          source,
          title: typed.title,
          topic: typed.topic ?? '',
          language: typed.language,
          durationSeconds: typed.duration_seconds,
          projectId,
        }),
      30,
    );
    const images = await step(
      'images',
      () => generateSceneImages({ projectId, userId: typed.user_id, script, imageStyle: (typed.image_style ?? 'realistic') as ImageStyle }),
      55,
    );
    const voice = await step(
      'voice',
      () =>
        generateVoiceover({
          projectId,
          userId: typed.user_id,
          script,
          language: typed.language,
          voiceId: typed.voice_id,
        }),
      75,
    );
    const subtitles = await step(
      'align',
      () =>
        buildSubtitles({
          projectId,
          userId: typed.user_id,
          script,
          alignment: voice.alignment,
        }),
      85,
    );
    const finalPath = await step(
      'compose',
      () =>
        composeFinalVideo({
          projectId,
          userId: typed.user_id,
          scenes: script.scenes,
          imagePaths: images.localPaths,
          alignment: voice.alignment,
          audioPath: voice.localPath,
          srtPath: subtitles.localPath,
          durationSeconds: typed.duration_seconds,
          logoPath: typed.logo_path,
          title: typed.title,
        }),
      100,
    );

    await supa
      .from('projects')
      .update({
        status: 'ready',
        final_video_path: finalPath,
        progress_pct: 100,
        current_step: 'done',
      })
      .eq('id', projectId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supa
      .from('projects')
      .update({ status: 'failed', error: msg })
      .eq('id', projectId);
  }
}

function toJson(v: unknown): unknown {
  try {
    return JSON.parse(JSON.stringify(v));
  } catch {
    return { note: 'unserializable' };
  }
}

export type { SourceContext, ElevenLabsAlignment };
