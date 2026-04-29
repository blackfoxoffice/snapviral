import type { ProjectLanguage, ScriptOutput } from '@newsflow/shared';
import { scriptOutputSchema } from '@newsflow/shared';
import { getServiceClient } from '../../services/supabase.js';
import { callGeminiScript } from '../../services/openrouter.js';
import type { SourceContext } from './01-ingest.js';

interface GenerateScriptArgs {
  source: SourceContext;
  title: string;
  topic: string;
  language: ProjectLanguage;
  durationSeconds: number;
  projectId: string;
}

export async function generateScript(args: GenerateScriptArgs): Promise<ScriptOutput> {
  const raw = await callGeminiScript(args);
  const parsed = scriptOutputSchema.parse(raw);

  const supa = getServiceClient();
  await supa.from('assets').insert({
    project_id: args.projectId,
    type: 'script',
    content: parsed as unknown as Record<string, unknown>,
  });
  return parsed;
}
