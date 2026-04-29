import type { ScriptOutput } from '@newsflow/shared';

export function buildFullNarration(script: ScriptOutput): string {
  const parts = [script.hook, ...script.scenes.map((s) => s.narration), script.cta];
  return parts
    .filter(Boolean)
    .map((p) => p.trim())
    .join('\n\n');
}
