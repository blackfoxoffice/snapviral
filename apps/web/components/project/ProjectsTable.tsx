import { View, Text, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import type { Project } from '@newsflow/shared';
import { StatusBadge } from './StatusBadge';
import { LANGUAGE_LABEL as LANG_LABEL } from '../../lib/languages';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function ProjectsTable({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const { width } = useWindowDimensions();

  if (width < 640) {
    return (
      <View>
        {projects.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => router.push(`/projects/${p.id}`)}
            className="flex-row items-center justify-between border-b border-surface-border bg-surface-card px-4 py-3 active:bg-surface-raised"
          >
            <View className="flex-1 mr-3">
              <Text className="text-[13px] font-semibold text-ink" numberOfLines={1}>
                {p.title}
              </Text>
              <View className="flex-row items-center gap-2 mt-1">
                <StatusBadge status={p.status} />
                <Text className="text-[11px] text-ink-muted">
                  {LANG_LABEL[p.language] ?? p.language} · {p.duration_seconds}s · {formatDate(p.created_at)}
                </Text>
              </View>
            </View>
            <ChevronRight size={14} color="#546E7A" />
          </Pressable>
        ))}
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="min-w-[700px] w-full">
        <View className="flex-row items-center border-b border-surface-border bg-surface-raised px-5 py-2.5">
          <Text className="flex-[3] text-[10px] font-bold uppercase tracking-widest text-ink-subtle">Title</Text>
          <Text className="w-[88px] text-[10px] font-bold uppercase tracking-widest text-ink-subtle">Language</Text>
          <Text className="w-[88px] text-[10px] font-bold uppercase tracking-widest text-ink-subtle">Duration</Text>
          <Text className="w-[100px] text-[10px] font-bold uppercase tracking-widest text-ink-subtle">Status</Text>
          <Text className="w-[110px] text-[10px] font-bold uppercase tracking-widest text-ink-subtle">Created</Text>
          <View className="w-[28px]" />
        </View>
        {projects.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => router.push(`/projects/${p.id}`)}
            className="flex-row items-center border-b border-surface-border bg-surface-card px-5 py-3 hover:bg-surface-raised"
          >
            <View className="flex-[3]">
              <Text className="text-[13px] font-semibold text-ink" numberOfLines={1}>
                {p.title}
              </Text>
              {p.topic ? (
                <Text className="text-[11px] text-ink-muted mt-0.5" numberOfLines={1}>
                  {p.topic}
                </Text>
              ) : null}
            </View>
            <View className="w-[88px]">
              <Text className="text-[12px] text-ink-secondary">{LANG_LABEL[p.language] ?? p.language}</Text>
            </View>
            <Text
              className="w-[88px] text-[12px] text-ink-secondary"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {p.duration_seconds}s
            </Text>
            <View className="w-[100px]">
              <StatusBadge status={p.status} />
            </View>
            <Text className="w-[110px] text-[11px] text-ink-muted">{formatDate(p.created_at)}</Text>
            <View className="w-[28px] items-center">
              <ChevronRight size={14} color="#546E7A" />
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
