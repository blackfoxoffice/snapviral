import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import type { ElevenLabsAlignment, ProjectLanguage, Scene } from '@newsflow/shared';
import { composeFinalVideoFiles, computeSceneDurations } from '../../services/composer.js';
import { getServiceClient } from '../../services/supabase.js';

interface ComposeArgs {
  projectId: string;
  userId: string;
  scenes: Scene[];
  imagePaths: string[];
  alignment: ElevenLabsAlignment;
  audioPath: string;
  srtPath: string;
  durationSeconds: number;
  logoPath?: string | null;
  title?: string;
  language: ProjectLanguage;
}

export async function composeFinalVideo(args: ComposeArgs): Promise<string> {
  const {
    projectId,
    userId,
    scenes,
    imagePaths,
    alignment,
    audioPath,
    srtPath,
    durationSeconds,
    logoPath,
    title,
    language,
  } = args;

  if (imagePaths.length !== scenes.length) {
    throw new Error(
      `scene/image count mismatch: ${scenes.length} scenes vs ${imagePaths.length} images`,
    );
  }

  const sceneDurations = computeSceneDurations({
    scenes,
    alignment,
    targetTotalSeconds: durationSeconds,
  });

  const tmpDir = await fs.mkdtemp(
    path.join(os.tmpdir(), `newsflow-${projectId}-compose-`),
  );
  const outputPath = path.join(tmpDir, 'final.mp4');

  let localLogoPath: string | undefined;
  if (logoPath) {
    const supa = getServiceClient();
    const { data: logoBuf, error: logoErr } = await supa.storage
      .from('project-assets')
      .download(logoPath);
    if (!logoErr && logoBuf) {
      const ext = path.extname(logoPath) || '.png';
      localLogoPath = path.join(tmpDir, `logo${ext}`);
      await fs.writeFile(localLogoPath, Buffer.from(await logoBuf.arrayBuffer()));
    }
  }

  await composeFinalVideoFiles({
    imagePaths,
    sceneDurations,
    audioPath,
    srtPath,
    outputPath,
    tmpDir,
    logoPath: localLogoPath,
    title,
    language,
  });

  const buf = await fs.readFile(outputPath);
  const storagePath = `${userId}/${projectId}/final.mp4`;
  const supa = getServiceClient();
  const { error } = await supa.storage
    .from('project-assets')
    .upload(storagePath, buf, { contentType: 'video/mp4', upsert: true });
  if (error) throw new Error(`final video upload failed: ${error.message}`);

  await supa.from('assets').insert({
    project_id: projectId,
    type: 'video',
    storage_path: storagePath,
    metadata: { sceneDurations, durationSeconds },
  });

  return storagePath;
}
