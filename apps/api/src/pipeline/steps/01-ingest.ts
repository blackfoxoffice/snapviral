import type { Project, ResearchResult } from '@newsflow/shared';
import { fetchSourceTranscript } from '../../services/transcripts.js';
import { callPerplexityResearch } from '../../services/openrouter.js';
import { getServiceClient } from '../../services/supabase.js';

export type SourceContext = {
  mode: 'urls' | 'script' | 'topic' | 'research';
  transcripts?: { url: string; text: string; failed: boolean }[];
  userScript?: string;
  topic?: string;
  research?: ResearchResult;
};

export async function ingest(project: Project): Promise<SourceContext> {
  let ctx: SourceContext;
  switch (project.input_mode) {
    case 'urls': {
      const urls = project.source_urls ?? [];
      const transcripts = await Promise.all(
        urls.map(async (url) => {
          const text = await fetchSourceTranscript(url);
          return { url, text: text ?? '', failed: text === null };
        }),
      );
      ctx = { mode: 'urls', transcripts };
      break;
    }
    case 'script':
      ctx = { mode: 'script', userScript: project.user_script ?? '' };
      break;
    case 'topic':
      ctx = { mode: 'topic', topic: project.topic ?? '' };
      break;
    case 'research': {
      const topic = project.topic ?? '';
      // `user_script` is reused as the "extra context" field on the research tab.
      const extraContext = project.user_script ?? undefined;
      const research = await callPerplexityResearch({ topic, extraContext });
      ctx = { mode: 'research', topic, research };
      break;
    }
  }

  const supa = getServiceClient();
  await supa.from('assets').insert({
    project_id: project.id,
    type: 'transcript',
    content: ctx as unknown as Record<string, unknown>,
  });
  return ctx;
}
