import { useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import {
  Sparkles,
  BookOpen,
  Wand2,
  Plane,
  HelpCircle,
  Skull,
  Moon,
  Landmark,
  Ghost,
  Trophy,
  Zap,
  Lightbulb,
  Mic,
  type LucideIcon,
  Newspaper,
  GraduationCap,
  TrendingUp,
} from 'lucide-react-native';
import type { ProjectLanguage } from '@newsflow/shared';
import { useGenerateTopicSuggestions, useTopicCategories } from '../../lib/queries';
import { toast } from '../ui/Toast';

// Visual decoration per category. Keeps the rail readable without
// sending a payload of icons from the server.
const ICON_BY_KEY: Record<string, { Icon: LucideIcon; accent: string }> = {
  trending_news:        { Icon: Newspaper,    accent: '#E11D2C' },
  bible_stories:        { Icon: BookOpen,     accent: '#7C3AED' },
  random_ai_story:      { Icon: Wand2,        accent: '#EC4899' },
  travel_destinations:  { Icon: Plane,        accent: '#0EA5E9' },
  what_if:              { Icon: HelpCircle,   accent: '#F59E0B' },
  scary_stories:        { Icon: Skull,        accent: '#DC2626' },
  bedtime_stories:      { Icon: Moon,         accent: '#6366F1' },
  interesting_history:  { Icon: Landmark,     accent: '#A16207' },
  urban_legends:        { Icon: Ghost,        accent: '#475569' },
  motivational:         { Icon: Trophy,       accent: '#F59E0B' },
  fun_facts:            { Icon: Zap,          accent: '#10B981' },
  long_form_jokes:      { Icon: Mic,          accent: '#0EA5E9' },
  life_pro_tips:        { Icon: Lightbulb,    accent: '#16A34A' },
  eli5:                 { Icon: GraduationCap,accent: '#8B5CF6' },
  mythology:            { Icon: Sparkles,     accent: '#9F0617' },
  philosophy:           { Icon: BookOpen,     accent: '#1F2937' },
  finance_tips:         { Icon: TrendingUp,   accent: '#0F766E' },
};

interface Props {
  language: ProjectLanguage;
  selected?: string;
  onPick: (topic: string) => void;
}

export function TopicSuggestions({ language, selected, onPick }: Props) {
  const { data: categoriesResp } = useTopicCategories();
  const generateMut = useGenerateTopicSuggestions();
  const [pending, setPending] = useState<string | null>(null);

  const categories = categoriesResp?.categories ?? [];

  async function handlePick(key: string, label: string) {
    setPending(key);
    try {
      const { topics } = await generateMut.mutateAsync({
        language,
        category: key,
        count: 3,
      });
      const first = topics[0];
      if (!first) {
        toast.error('No topics returned', `Try ${label} again or pick another category.`);
        return;
      }
      onPick(first);
    } catch (e) {
      toast.error('Could not generate topic', e instanceof Error ? e.message : undefined);
    } finally {
      setPending(null);
    }
  }

  return (
    <View>
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-[12px] font-semibold text-ink-secondary uppercase tracking-wide">
          Popular topics
        </Text>
        <View className="flex-row items-center gap-1.5">
          <Sparkles size={11} color="#E11D2C" />
          <Text className="text-[10px] text-ink-subtle">AI picks one for you</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 8, gap: 8 }}
      >
        {categories.length === 0
          ? // Skeletons while categories load
            [1, 2, 3, 4, 5].map((i) => (
              <View
                key={i}
                style={{
                  height: 36,
                  width: 120,
                  borderRadius: 999,
                  backgroundColor: '#F4F4F5',
                  borderWidth: 1,
                  borderColor: '#E4E4E7',
                }}
              />
            ))
          : categories.map((c) => {
              const meta = ICON_BY_KEY[c.key] ?? { Icon: Sparkles, accent: '#52525B' };
              const Icon = meta.Icon;
              const isPending = pending === c.key;
              const isPicked = selected != null && selected !== '' && pending === null && false;
              // (Selection state is handled by the parent text input — the
              // chip itself doesn't track which generated topic is "current".)
              return (
                <Pressable
                  key={c.key}
                  onPress={() => handlePick(c.key, c.label)}
                  disabled={generateMut.isPending}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    paddingHorizontal: 12,
                    height: 36,
                    borderRadius: 999,
                    backgroundColor: isPicked ? `${meta.accent}1A` : '#FFFFFF',
                    borderWidth: 1,
                    borderColor: isPicked ? meta.accent : '#E4E4E7',
                    opacity: generateMut.isPending && !isPending ? 0.5 : 1,
                  }}
                >
                  {isPending ? (
                    <ActivityIndicator size="small" color={meta.accent} />
                  ) : (
                    <Icon size={13} color={meta.accent} />
                  )}
                  <Text
                    style={{
                      fontSize: 12,
                      color: isPicked ? meta.accent : '#334155',
                      fontWeight: isPicked ? '600' : '500',
                    }}
                  >
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
      </ScrollView>

      <Text className="text-[10px] text-ink-subtle mt-2">
        Tap a category — AI generates a fresh topic in your chosen language. Tap again for a new one.
      </Text>
    </View>
  );
}
