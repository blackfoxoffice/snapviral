import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import type { ProjectLanguage } from '@newsflow/shared';
import { useAiWrite } from '../../lib/queries';
import { toast } from '../ui/Toast';

interface Props {
  kind: 'headline' | 'context';
  topic: string;
  language: ProjectLanguage;
  onResult: (text: string) => void;
  /**
   * Disable when there's nothing for the AI to refine. For 'headline' this is
   * when topic is empty AND no headline is already typed; for 'context' this
   * is when no topic exists yet.
   */
  disabled?: boolean;
  label?: string;
  align?: 'right' | 'left';
}

export function AiWriteButton({
  kind,
  topic,
  language,
  onResult,
  disabled,
  label,
  align = 'right',
}: Props) {
  const [hover, setHover] = useState(false);
  const aiWrite = useAiWrite();
  const isPending = aiWrite.isPending;

  async function go() {
    if (!topic.trim()) {
      toast.error(
        'Type a topic first',
        kind === 'headline'
          ? 'AI needs a rough topic to refine into a headline.'
          : 'AI needs a topic to write context for.',
      );
      return;
    }
    try {
      const { text } = await aiWrite.mutateAsync({ kind, topic: topic.trim(), language });
      if (text) onResult(text);
    } catch (e) {
      toast.error(
        kind === 'headline' ? 'Could not write headline' : 'Could not write context',
        e instanceof Error ? e.message : undefined,
      );
    }
  }

  const text = label ?? (kind === 'headline' ? 'AI write headline' : 'AI fill context');
  const isDisabled = disabled || isPending;

  return (
    <View style={{ flexDirection: 'row', justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}>
      <Pressable
        onPress={go}
        onHoverIn={() => setHover(true)}
        onHoverOut={() => setHover(false)}
        disabled={isDisabled}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 10,
          height: 26,
          borderRadius: 999,
          backgroundColor: hover && !isDisabled ? 'rgba(225,29,44,0.08)' : 'rgba(225,29,44,0.04)',
          borderWidth: 1,
          borderColor: hover && !isDisabled ? 'rgba(225,29,44,0.35)' : 'rgba(225,29,44,0.18)',
          opacity: isDisabled ? 0.55 : 1,
          ...({ transition: 'all 160ms ease' } as any),
        }}
      >
        {isPending ? (
          <ActivityIndicator size="small" color="#E11D2C" />
        ) : (
          <Sparkles size={11} color="#E11D2C" strokeWidth={2.2} />
        )}
        <Text style={{ fontSize: 11, fontWeight: '600', color: '#E11D2C' }}>
          {isPending ? 'Writing…' : text}
        </Text>
      </Pressable>
    </View>
  );
}
