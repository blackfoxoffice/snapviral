import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import type { ElevenLabsAlignment, ProjectLanguage, ScriptOutput } from '@newsflow/shared';
import { generateTtsWithAlignment } from '../../services/elevenlabs.js';
import { getServiceClient } from '../../services/supabase.js';
import { buildFullNarration } from '../utils.js';

interface GenerateVoiceoverArgs {
  projectId: string;
  userId: string;
  script: ScriptOutput;
  language: ProjectLanguage;
  voiceId?: string | null;
}

export interface VoiceoverResult {
  storagePath: string;
  localPath: string;
  alignment: ElevenLabsAlignment;
  fullText: string;
}

export async function generateVoiceover(
  args: GenerateVoiceoverArgs,
): Promise<VoiceoverResult> {
  const { projectId, userId, script, language, voiceId } = args;
  const fullText = buildFullNarration(script);

  const { audio, alignment } = await generateTtsWithAlignment({
    text: fullText,
    language,
    voiceId,
  });

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `newsflow-${projectId}-vo-`));
  const localPath = path.join(tmpDir, 'voiceover.mp3');
  await fs.writeFile(localPath, audio);

  const storagePath = `${userId}/${projectId}/audio/voiceover.mp3`;
  const supa = getServiceClient();
  const { error } = await supa.storage
    .from('project-assets')
    .upload(storagePath, audio, { contentType: 'audio/mpeg', upsert: true });
  if (error) throw new Error(`voiceover upload failed: ${error.message}`);

  await supa.from('assets').insert({
    project_id: projectId,
    type: 'audio',
    storage_path: storagePath,
    metadata: { alignment, text: fullText },
  });

  return { storagePath, localPath, alignment, fullText };
}
