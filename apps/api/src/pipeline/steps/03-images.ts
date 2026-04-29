import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import pLimit from 'p-limit';
import type { ImageStyle, ScriptOutput } from '@newsflow/shared';
import { callNanoBananaImage, getStyledVisualPrompt } from '../../services/openrouter.js';
import { getServiceClient } from '../../services/supabase.js';

interface GenerateImagesArgs {
  projectId: string;
  userId: string;
  script: ScriptOutput;
  imageStyle: ImageStyle;
}

export interface SceneImagesResult {
  storagePaths: string[];
  localPaths: string[];
}

export async function generateSceneImages(
  args: GenerateImagesArgs,
): Promise<SceneImagesResult> {
  const { projectId, userId, script, imageStyle } = args;
  const supa = getServiceClient();
  const limit = pLimit(3);

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `newsflow-${projectId}-img-`));

  const tasks = script.scenes.map((scene, idx) =>
    limit(async () => {
      const styledPrompt = getStyledVisualPrompt(scene.visual_prompt, imageStyle);
      const buf = await callNanoBananaImage(styledPrompt);
      const filename = `scene-${String(idx).padStart(2, '0')}.png`;
      const storagePath = `${userId}/${projectId}/images/${filename}`;
      const localPath = path.join(tmpDir, filename);
      await fs.writeFile(localPath, buf);

      const { error: upErr } = await supa.storage
        .from('project-assets')
        .upload(storagePath, buf, { contentType: 'image/png', upsert: true });
      if (upErr) throw new Error(`image upload failed: ${upErr.message}`);

      await supa.from('assets').insert({
        project_id: projectId,
        type: 'image',
        storage_path: storagePath,
        scene_index: idx,
        metadata: { visual_prompt: scene.visual_prompt },
      });

      return { storagePath, localPath };
    }),
  );

  const results = await Promise.all(tasks);
  return {
    storagePaths: results.map((r) => r.storagePath),
    localPaths: results.map((r) => r.localPath),
  };
}
