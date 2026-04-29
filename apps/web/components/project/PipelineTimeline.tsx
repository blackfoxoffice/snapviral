import { View, Text } from 'react-native';
import type { PipelineJob } from '@newsflow/shared';
import { Check, Loader2, XCircle } from 'lucide-react-native';
import { MotiView } from 'moti';

const STEPS: { id: string; label: string; description: string }[] = [
  { id: 'ingest', label: 'Ingesting source', description: 'Fetching input / transcripts' },
  { id: 'script', label: 'Writing script', description: 'Gemini 3 Flash' },
  { id: 'images', label: 'Generating visuals', description: 'Nano Banana 2 · 9:16' },
  { id: 'voice', label: 'Narrating', description: 'ElevenLabs Tamil voice' },
  { id: 'align', label: 'Aligning subtitles', description: 'Character-level timing' },
  { id: 'compose', label: 'Composing video', description: 'FFmpeg · 1080×1920' },
];

interface Props {
  jobs: PipelineJob[];
  currentStep: string | null;
  status: string;
}

export function PipelineTimeline({ jobs, currentStep, status }: Props) {
  function resolveStatus(stepId: string): 'pending' | 'running' | 'done' | 'failed' {
    const job = jobs.find((j) => j.step === stepId);
    if (job) {
      if (job.status === 'done') return 'done';
      if (job.status === 'failed') return 'failed';
      return 'running';
    }
    if (currentStep === stepId && status === 'running') return 'running';
    return 'pending';
  }

  return (
    <View className="gap-0">
      {STEPS.map((step, idx) => {
        const state = resolveStatus(step.id);
        return (
          <View key={step.id} className="flex-row items-start gap-3">
            <View className="items-center">
              <StatusIcon state={state} />
              {idx < STEPS.length - 1 ? (
                <View
                  className={`w-px ${state === 'done' ? 'bg-accent' : 'bg-surface-border'}`}
                  style={{ minHeight: 28 }}
                />
              ) : null}
            </View>
            <View className="flex-1 pb-4">
              <Text
                className={`text-[13px] font-semibold ${
                  state === 'pending' ? 'text-ink-subtle' : state === 'done' ? 'text-ink-secondary' : 'text-ink'
                }`}
              >
                {step.label}
              </Text>
              <Text className="text-[11px] text-ink-muted mt-0.5">{step.description}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function StatusIcon({ state }: { state: 'pending' | 'running' | 'done' | 'failed' }) {
  if (state === 'done')
    return (
      <View className="h-6 w-6 items-center justify-center rounded-full bg-accent">
        <Check size={12} color="#0A0A0A" strokeWidth={3} />
      </View>
    );
  if (state === 'failed')
    return (
      <View className="h-6 w-6 items-center justify-center rounded-full bg-state-error">
        <XCircle size={12} color="#fff" />
      </View>
    );
  if (state === 'running')
    return (
      <View className="h-6 w-6 items-center justify-center rounded-full bg-surface-raised">
        <MotiView
          from={{ rotate: '0deg' }}
          animate={{ rotate: '360deg' }}
          transition={{ type: 'timing', duration: 900, loop: true, repeatReverse: false }}
        >
          <Loader2 size={12} color="#E53935" />
        </MotiView>
      </View>
    );
  return (
    <View className="h-6 w-6 items-center justify-center rounded-full border border-surface-border bg-surface-card">
      <View className="h-1.5 w-1.5 rounded-full bg-ink-faint" />
    </View>
  );
}
