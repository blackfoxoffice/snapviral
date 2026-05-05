import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  TextInput,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
// (TextInput is used in the AddTimePicker for HH:MM minute-precise input)
import {
  Zap,
  Trash2,
  Plus,
  Clock,
  Lock,
  Calendar,
  CheckCircle2,
  Wand2,
  AlertTriangle,
  ListChecks,
  Sparkles,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import type {
  AutomationSettings,
  ImageStyle,
  ProjectLanguage,
  TopicQueueItem,
} from '@newsflow/shared';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { toast } from '../../components/ui/Toast';
import { VoicePicker } from '../../components/project/VoicePicker';
import {
  useAutomationStatus,
  useUpdateAutomationSettings,
  useAddTopics,
  useUpdateTopic,
  useDeleteTopic,
  useClearTopics,
  useAutoScheduleTopics,
  useGenerateTopicSuggestions,
  useYouTubeStatus,
} from '../../lib/queries';

const LANG_OPTS: { value: ProjectLanguage; label: string }[] = [
  { value: 'ta', label: 'Tamil' },
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
];

const STYLE_OPTS: { value: ImageStyle; label: string }[] = [
  { value: 'realistic', label: 'Realistic' },
  { value: 'ultra_realistic', label: 'Ultra Realistic' },
  { value: 'illustrated', label: 'Digital Art' },
  { value: 'cartoon', label: 'Cartoon' },
];

const PRIVACY_OPTS = [
  { value: 'public', label: 'Public' },
  { value: 'unlisted', label: 'Unlisted' },
  { value: 'private', label: 'Private' },
];

const INPUT_MODE_OPTS = [
  { value: 'topic', label: 'Topic only (fast, AI from knowledge)' },
  { value: 'research', label: 'Web research (slower, cited sources)' },
];

export default function AutomationPage() {
  const router = useRouter();
  const { data: status, isLoading } = useAutomationStatus();
  const { data: ytStatus } = useYouTubeStatus();
  const updateMut = useUpdateAutomationSettings();
  const addMut = useAddTopics();
  const updateTopicMut = useUpdateTopic();
  const deleteMut = useDeleteTopic();
  const clearMut = useClearTopics();
  const autoScheduleMut = useAutoScheduleTopics();
  const generateMut = useGenerateTopicSuggestions();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [topicsInput, setTopicsInput] = useState('');
  const [niche, setNiche] = useState('');
  const [generatedTopics, setGeneratedTopics] = useState<string[]>([]);
  const [selectedGenerated, setSelectedGenerated] = useState<Set<number>>(new Set());

  async function handleGenerateTopics() {
    setGeneratedTopics([]);
    setSelectedGenerated(new Set());
    try {
      const result = await generateMut.mutateAsync({
        language: (local?.automation_language as 'ta' | 'en' | 'hi') ?? 'ta',
        niche: niche.trim() || undefined,
        count: 12,
      });
      setGeneratedTopics(result.topics);
      // Pre-select all so the common case is "add all"
      setSelectedGenerated(new Set(result.topics.map((_, i) => i)));
    } catch (e) {
      toast.error('Topic generation failed', e instanceof Error ? e.message : undefined);
    }
  }

  async function handleAddSelectedGenerated() {
    const picked = generatedTopics.filter((_, i) => selectedGenerated.has(i));
    if (picked.length === 0) return;
    try {
      const result = await addMut.mutateAsync(picked);
      toast.success(`Added ${result.added} topic${result.added === 1 ? '' : 's'}`);
      setGeneratedTopics([]);
      setSelectedGenerated(new Set());
      setNiche('');
    } catch (e) {
      toast.error('Add failed', e instanceof Error ? e.message : undefined);
    }
  }

  function toggleGenerated(i: number) {
    setSelectedGenerated((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  // Local mirror so users can edit settings without thrashing the network
  const [local, setLocal] = useState<AutomationSettings | null>(null);
  useEffect(() => {
    if (status?.settings && !local) setLocal(status.settings);
  }, [status, local]);

  const dirty = useMemo(() => {
    if (!status?.settings || !local) return false;
    return JSON.stringify(status.settings) !== JSON.stringify(local);
  }, [status, local]);

  if (isLoading || !status || !local) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="#E53935" />
      </View>
    );
  }

  // Admin users get daily_video_limit=999 from the view, so this also covers them.
  const isPaid = status.daily_video_limit > 0;
  const ytConnected = ytStatus?.connected ?? false;
  const queue = status.queue ?? [];
  const unused = queue.filter((q) => !q.used);
  const used = queue.filter((q) => q.used);
  const remainingToday = Math.max(0, status.daily_video_limit - status.used_today);

  async function handleSaveSettings() {
    if (!local) return;
    try {
      await updateMut.mutateAsync(local);
      toast.success('Settings saved');
    } catch (e) {
      toast.error('Save failed', e instanceof Error ? e.message : undefined);
    }
  }

  async function handleAddTopics() {
    const lines = topicsInput
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length >= 3);
    if (lines.length === 0) {
      toast.error('Add one topic per line', '3+ characters each');
      return;
    }
    try {
      const result = await addMut.mutateAsync(lines);
      toast.success(`Added ${result.added} topic${result.added === 1 ? '' : 's'}`);
      setTopicsInput('');
    } catch (e) {
      toast.error('Add failed', e instanceof Error ? e.message : undefined);
    }
  }

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View
        className="mx-auto w-full max-w-[1100px] pb-20"
        style={{ paddingHorizontal: isMobile ? 16 : 32, paddingTop: isMobile ? 20 : 32 }}
      >
        {/* Header */}
        <View className="mb-6">
          <View className="flex-row items-center gap-2">
            <Zap size={20} color="#E53935" />
            <Text
              className={`font-bold text-ink ${isMobile ? 'text-[22px]' : 'text-[26px]'}`}
              style={{ letterSpacing: -0.5 }}
            >
              Auto-publish
            </Text>
          </View>
          <Text className="text-[13px] text-ink-muted mt-1">
            Drop in 10–100 topics. We generate and publish videos to your YouTube channel
            automatically — up to {status.daily_video_limit || 'X'} per day on your plan.
          </Text>
        </View>

        {/* Plan / YouTube gate banners */}
        {!isPaid ? (
          <PaidPlanRequired
            currentPlan={status.plan}
            onUpgrade={() => router.push('/billing' as any)}
          />
        ) : null}
        {isPaid && !ytConnected ? (
          <YouTubeRequired onConnect={() => router.push('/youtube' as any)} />
        ) : null}

        {/* Daily progress */}
        {isPaid && ytConnected ? (
          <DailyProgress
            limit={status.daily_video_limit}
            used={status.used_today}
            queueSize={unused.length}
            enabled={local.auto_publish_enabled}
          />
        ) : null}

        {/* Settings card */}
        <Card className="mt-5">
          <Card.Header>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-[14px] font-semibold text-ink">Automation settings</Text>
                <Text className="text-[12px] text-ink-muted mt-0.5">
                  How your videos get generated and posted.
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="text-[12px] text-ink-secondary">
                  {local.auto_publish_enabled ? 'On' : 'Off'}
                </Text>
                <Switch
                  value={local.auto_publish_enabled}
                  onValueChange={(v) => {
                    if (!isPaid && v) {
                      toast.error('Paid plan required', 'Upgrade to enable auto-publish');
                      return;
                    }
                    setLocal({ ...local, auto_publish_enabled: v });
                  }}
                  trackColor={{ false: '#E4E4E7', true: '#E53935' }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          </Card.Header>
          <Card.Body className="gap-4">
            {/* Publish times */}
            <View>
              <Text className="text-[12px] font-semibold text-ink-secondary mb-2 uppercase tracking-wide">
                Publish times (IST)
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {local.publish_times.map((t, i) => (
                  <View
                    key={`${t}-${i}`}
                    className="flex-row items-center gap-1.5 rounded-md px-2.5 py-1.5"
                    style={{ backgroundColor: '#F4F4F5', borderWidth: 1, borderColor: '#E4E4E7' }}
                  >
                    <Clock size={11} color="#64748B" />
                    <Text className="text-[12px] font-mono text-ink-secondary">{t}</Text>
                    <Pressable
                      onPress={() => {
                        setLocal({
                          ...local,
                          publish_times: local.publish_times.filter((_, idx) => idx !== i),
                        });
                      }}
                      className="ml-1"
                    >
                      <Trash2 size={10} color="#94A3B8" />
                    </Pressable>
                  </View>
                ))}
                {local.publish_times.length < 5 ? (
                  <AddTimePicker
                    onAdd={(t) =>
                      setLocal({ ...local, publish_times: [...local.publish_times, t].sort() })
                    }
                  />
                ) : null}
              </View>
              <Text className="text-[10px] text-ink-subtle mt-1.5">
                Times in IST. Worker fires within ±5 min of each slot. Max 5 slots.
              </Text>
            </View>

            {/* Per-video defaults */}
            <View className={isMobile ? 'gap-3' : 'flex-row gap-3'}>
              <View style={{ flex: 1 }}>
                <Select<ProjectLanguage>
                  label="Language"
                  value={local.automation_language as ProjectLanguage}
                  onChange={(v) => setLocal({ ...local, automation_language: v })}
                  options={LANG_OPTS}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Select<ImageStyle>
                  label="Image style"
                  value={local.automation_image_style as ImageStyle}
                  onChange={(v) => setLocal({ ...local, automation_image_style: v })}
                  options={STYLE_OPTS}
                />
              </View>
            </View>

            <View className={isMobile ? 'gap-3' : 'flex-row gap-3'}>
              <View style={{ flex: 1 }}>
                <Select
                  label="Source mode"
                  value={local.automation_input_mode}
                  onChange={(v) =>
                    setLocal({ ...local, automation_input_mode: v as 'topic' | 'research' })
                  }
                  options={INPUT_MODE_OPTS}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Select
                  label="YouTube privacy"
                  value={local.automation_privacy}
                  onChange={(v) =>
                    setLocal({
                      ...local,
                      automation_privacy: v as 'public' | 'unlisted' | 'private',
                    })
                  }
                  options={PRIVACY_OPTS}
                />
              </View>
            </View>

            <Input
              label="Voice ID (optional)"
              value={local.automation_voice_id ?? ''}
              onChangeText={(v) => setLocal({ ...local, automation_voice_id: v || null })}
              placeholder="Leave blank to use language default"
            />

            <View>
              <Text className="text-[12px] font-semibold text-ink-secondary mb-1.5 uppercase tracking-wide">
                Duration: {local.automation_duration_seconds}s
              </Text>
              <View className="flex-row gap-2">
                {[20, 30, 45, 60].map((d) => {
                  const isSel = local.automation_duration_seconds === d;
                  return (
                    <Pressable
                      key={d}
                      onPress={() => setLocal({ ...local, automation_duration_seconds: d })}
                      className="flex-1 rounded-md py-2 items-center"
                      style={{
                        backgroundColor: isSel ? '#E53935' : '#F4F4F5',
                        borderWidth: 1,
                        borderColor: isSel ? '#E53935' : '#E4E4E7',
                      }}
                    >
                      <Text
                        className="text-[12px] font-semibold"
                        style={{ color: isSel ? '#fff' : '#334155' }}
                      >
                        {d}s
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {dirty ? (
              <View className="flex-row justify-end gap-2 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={() => setLocal(status.settings)}
                  disabled={updateMut.isPending}
                >
                  Discard
                </Button>
                <Button
                  size="sm"
                  onPress={handleSaveSettings}
                  loading={updateMut.isPending}
                >
                  Save
                </Button>
              </View>
            ) : null}
          </Card.Body>
        </Card>

        {/* Topic queue */}
        <Card className="mt-5">
          <Card.Header>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-[14px] font-semibold text-ink">Topic queue</Text>
                <Text className="text-[12px] text-ink-muted mt-0.5">
                  Worker pops one topic per slot, in order. Empty queue = nothing publishes.
                </Text>
              </View>
              <Badge variant="neutral">
                {unused.length} pending · {used.length} published
              </Badge>
            </View>
          </Card.Header>
          <Card.Body className="gap-4">
            {/* AI topic generator */}
            <View
              className="rounded-xl p-4"
              style={{
                backgroundColor: 'rgba(229,57,53,0.04)',
                borderWidth: 1,
                borderColor: 'rgba(229,57,53,0.18)',
              }}
            >
              <View className="flex-row items-center gap-2 mb-2">
                <Sparkles size={14} color="#E53935" />
                <Text className="text-[12px] font-bold uppercase tracking-wide text-brand">
                  Generate with AI
                </Text>
              </View>
              <Text className="text-[12px] text-ink-secondary mb-3 leading-relaxed">
                Perplexity Sonar searches the live web and writes 12 trending news headlines in your
                automation language. Pick the ones you like and add them in one click.
              </Text>
              <View className={isMobile ? 'gap-2' : 'flex-row gap-2'}>
                <View style={{ flex: 1 }}>
                  <Input
                    value={niche}
                    onChangeText={setNiche}
                    placeholder="Optional niche (e.g. Tamil cinema, IPL, tech)"
                  />
                </View>
                <Button
                  leftIcon={<Sparkles size={12} color="#fff" />}
                  onPress={handleGenerateTopics}
                  loading={generateMut.isPending}
                >
                  Generate 12 topics
                </Button>
              </View>

              {generatedTopics.length > 0 ? (
                <View className="mt-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-[11px] font-semibold text-ink-secondary uppercase tracking-wide">
                      {selectedGenerated.size} of {generatedTopics.length} selected
                    </Text>
                    <View className="flex-row items-center gap-2">
                      <Pressable
                        onPress={() =>
                          setSelectedGenerated(new Set(generatedTopics.map((_, i) => i)))
                        }
                      >
                        <Text className="text-[11px] text-brand font-semibold">Select all</Text>
                      </Pressable>
                      <Text className="text-ink-faint">·</Text>
                      <Pressable onPress={() => setSelectedGenerated(new Set())}>
                        <Text className="text-[11px] text-ink-muted">Clear</Text>
                      </Pressable>
                    </View>
                  </View>

                  <View
                    className="rounded-lg overflow-hidden"
                    style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4E4E7' }}
                  >
                    {generatedTopics.map((t, i) => {
                      const selected = selectedGenerated.has(i);
                      return (
                        <Pressable
                          key={i}
                          onPress={() => toggleGenerated(i)}
                          className="flex-row items-center px-3 py-2.5"
                          style={{
                            borderBottomWidth: i < generatedTopics.length - 1 ? 1 : 0,
                            borderBottomColor: '#E4E4E7',
                            backgroundColor: selected ? 'rgba(229,57,53,0.04)' : '#FFFFFF',
                          }}
                        >
                          <View
                            className="items-center justify-center rounded-md mr-3"
                            style={{
                              width: 18,
                              height: 18,
                              borderWidth: 1.5,
                              borderColor: selected ? '#E53935' : '#94A3B8',
                              backgroundColor: selected ? '#E53935' : 'transparent',
                            }}
                          >
                            {selected ? <CheckCircle2 size={11} color="#fff" /> : null}
                          </View>
                          <Text className="flex-1 text-[13px] text-ink leading-relaxed">{t}</Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View className="flex-row justify-end gap-2 mt-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      onPress={() => {
                        setGeneratedTopics([]);
                        setSelectedGenerated(new Set());
                      }}
                    >
                      Discard
                    </Button>
                    <Button
                      size="sm"
                      leftIcon={<Plus size={12} color="#fff" />}
                      onPress={handleAddSelectedGenerated}
                      loading={addMut.isPending}
                      disabled={selectedGenerated.size === 0}
                    >
                      Add {selectedGenerated.size > 0 ? `${selectedGenerated.size} ` : ''}to queue
                    </Button>
                  </View>
                </View>
              ) : null}
            </View>

            {/* Manual add (paste your own topics) */}
            <View>
              <Text className="text-[12px] font-semibold text-ink-secondary mb-1.5 uppercase tracking-wide">
                Or add your own (one per line)
              </Text>
              <Textarea
                rows={5}
                value={topicsInput}
                onChangeText={setTopicsInput}
                placeholder={
                  'Chennai weather alert\n' +
                  "Today's IPL match\n" +
                  'New Tamil Nadu government scheme\n' +
                  'Vijay\'s upcoming film'
                }
              />
              <View className="flex-row justify-between items-center mt-2">
                <Text className="text-[10px] text-ink-subtle">
                  {topicsInput.split('\n').filter((s) => s.trim().length >= 3).length} ready to add
                </Text>
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={<Plus size={12} color="#475569" />}
                  onPress={handleAddTopics}
                  loading={addMut.isPending}
                  disabled={topicsInput.trim().length === 0}
                >
                  Add to queue
                </Button>
              </View>
            </View>

            {/* Bulk reschedule banner: surfaces when any pending topic has no time */}
            {(() => {
              const unscheduled = unused.filter((t) => !t.scheduled_at);
              if (unscheduled.length === 0) return null;
              return (
                <View
                  className="flex-row items-center gap-3 rounded-xl px-4 py-3"
                  style={{
                    backgroundColor: 'rgba(245,158,11,0.08)',
                    borderWidth: 1,
                    borderColor: 'rgba(245,158,11,0.25)',
                  }}
                >
                  <Calendar size={14} color="#F59E0B" />
                  <Text className="flex-1 text-[12px] text-state-warning">
                    <Text className="font-semibold text-ink">
                      {unscheduled.length} unscheduled topic{unscheduled.length === 1 ? '' : 's'}
                    </Text>
                    <Text className="text-ink-muted">
                      {' '}— distribute them across your publish times automatically.
                    </Text>
                  </Text>
                  <Button
                    size="sm"
                    onPress={() =>
                      autoScheduleMut.mutate(undefined, {
                        onSuccess: (r) =>
                          toast.success(`Scheduled ${r.scheduled} topic${r.scheduled === 1 ? '' : 's'}`),
                        onError: (e) =>
                          toast.error('Schedule failed', e instanceof Error ? e.message : undefined),
                      })
                    }
                    loading={autoScheduleMut.isPending}
                  >
                    Schedule all
                  </Button>
                </View>
              );
            })()}

            {queue.length > 0 ? (
              <View className="rounded-lg border border-surface-border overflow-hidden">
                {/* Pending */}
                {unused.map((t, i) => (
                  <TopicRow
                    key={t.id}
                    topic={t}
                    isLast={i === unused.length - 1 && used.length === 0}
                    onDelete={() => deleteMut.mutate(t.id)}
                    onSave={(id, patch) =>
                      updateTopicMut.mutate(
                        { id, ...patch },
                        {
                          onSuccess: () => toast.success('Topic updated'),
                          onError: (e) =>
                            toast.error('Update failed', e instanceof Error ? e.message : undefined),
                        },
                      )
                    }
                    saving={updateTopicMut.isPending}
                    defaultLanguage={local.automation_language as ProjectLanguage}
                  />
                ))}

                {/* Divider between pending and published */}
                {used.length > 0 && unused.length > 0 ? (
                  <View
                    style={{
                      backgroundColor: '#F4F4F5',
                      paddingHorizontal: 16,
                      paddingVertical: 6,
                      borderTopWidth: 1,
                      borderTopColor: '#E4E4E7',
                    }}
                  >
                    <Text className="text-[10px] font-bold text-ink-subtle uppercase tracking-widest">
                      Already used ({used.length})
                    </Text>
                  </View>
                ) : null}

                {/* Used */}
                {used.slice(0, 20).map((t, i) => (
                  <TopicRow
                    key={t.id}
                    topic={t}
                    isLast={i === Math.min(used.length, 20) - 1}
                    onDelete={() => deleteMut.mutate(t.id)}
                    onSave={() => {
                      // Already used — no-op (editor not shown)
                    }}
                    saving={false}
                    defaultLanguage={local.automation_language as ProjectLanguage}
                  />
                ))}
              </View>
            ) : (
              <View
                className="items-center justify-center py-10 rounded-xl"
                style={{ backgroundColor: '#F4F4F5', borderWidth: 1, borderColor: '#E4E4E7' }}
              >
                <ListChecks size={24} color="#94A3B8" />
                <Text className="text-[13px] font-semibold text-ink mt-2">No topics yet</Text>
                <Text className="text-[11px] text-ink-muted mt-1 max-w-[300px] text-center">
                  Add 10–20 topics to keep the queue full for several days.
                </Text>
              </View>
            )}

            {unused.length > 0 ? (
              <Pressable
                onPress={() => {
                  if (typeof window !== 'undefined') {
                    if (!window.confirm('Clear all unused topics?')) return;
                  }
                  clearMut.mutate(undefined, {
                    onSuccess: () => toast.success('Queue cleared'),
                  });
                }}
                className="self-end"
              >
                <Text className="text-[11px] text-state-error">Clear all unused</Text>
              </Pressable>
            ) : null}
          </Card.Body>
        </Card>
      </View>
    </ScrollView>
  );
}

function PaidPlanRequired({
  currentPlan,
  onUpgrade,
}: {
  currentPlan: string;
  onUpgrade: () => void;
}) {
  return (
    <View
      className="rounded-xl p-4 mb-5 flex-row items-start gap-3"
      style={{
        backgroundColor: 'rgba(229,57,53,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(229,57,53,0.20)',
      }}
    >
      <Lock size={16} color="#E53935" style={{ marginTop: 2 }} />
      <View className="flex-1">
        <Text className="text-[13px] font-semibold text-ink">
          Auto-publish is a paid feature
        </Text>
        <Text className="text-[12px] text-ink-secondary mt-1 leading-relaxed">
          You're on the <Text className="font-semibold">{currentPlan}</Text> plan. Upgrade to
          Starter ($19) for 1 video/day, Creator ($29) for 2/day, Pro ($49) for 3/day, or Studio
          ($99) for 5/day.
        </Text>
      </View>
      <Button size="sm" onPress={onUpgrade}>
        Upgrade
      </Button>
    </View>
  );
}

function YouTubeRequired({ onConnect }: { onConnect: () => void }) {
  return (
    <View
      className="rounded-xl p-4 mb-5 flex-row items-start gap-3"
      style={{
        backgroundColor: 'rgba(255,179,0,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,179,0,0.25)',
      }}
    >
      <AlertTriangle size={16} color="#F59E0B" style={{ marginTop: 2 }} />
      <View className="flex-1">
        <Text className="text-[13px] font-semibold text-ink">YouTube not connected</Text>
        <Text className="text-[12px] text-ink-secondary mt-1">
          Auto-publish needs your channel authorized to upload. Connect on the YouTube page.
        </Text>
      </View>
      <Button size="sm" variant="secondary" onPress={onConnect}>
        Connect
      </Button>
    </View>
  );
}

function DailyProgress({
  limit,
  used,
  queueSize,
  enabled,
}: {
  limit: number;
  used: number;
  queueSize: number;
  enabled: boolean;
}) {
  const remaining = Math.max(0, limit - used);
  const days = limit > 0 ? Math.ceil(queueSize / limit) : 0;
  return (
    <View
      className="rounded-2xl p-5 flex-row items-center gap-4"
      style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4E4E7' }}
    >
      <View className="flex-1">
        <Text className="text-[11px] font-bold text-ink-subtle uppercase tracking-wider mb-1">
          Today
        </Text>
        <Text className="text-[28px] font-bold text-ink" style={{ letterSpacing: -0.6 }}>
          {used} / {limit}
        </Text>
        <Text className="text-[11px] text-ink-muted mt-0.5">
          {enabled
            ? remaining > 0
              ? `${remaining} more will auto-publish today`
              : 'Daily quota reached'
            : 'Auto-publish is OFF'}
        </Text>
      </View>
      <View className="flex-1 border-l border-surface-border pl-4">
        <Text className="text-[11px] font-bold text-ink-subtle uppercase tracking-wider mb-1">
          Queue
        </Text>
        <Text className="text-[28px] font-bold text-ink" style={{ letterSpacing: -0.6 }}>
          {queueSize}
        </Text>
        <Text className="text-[11px] text-ink-muted mt-0.5">
          {limit > 0 && queueSize > 0 ? `~${days} day${days === 1 ? '' : 's'} of content` : 'Empty — add topics below'}
        </Text>
      </View>
    </View>
  );
}

function AddTimePicker({ onAdd }: { onAdd: (t: string) => void }) {
  const [open, setOpen] = useState(false);
  const [hour, setHour] = useState('09');
  const [minute, setMinute] = useState('00');

  function handleSave() {
    const h = parseInt(hour, 10);
    const m = parseInt(minute, 10);
    if (Number.isNaN(h) || h < 0 || h > 23) {
      toast.error('Invalid hour', '0–23 only');
      return;
    }
    if (Number.isNaN(m) || m < 0 || m > 59) {
      toast.error('Invalid minute', '0–59 only');
      return;
    }
    const t = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    onAdd(t);
    setOpen(false);
    setHour('09');
    setMinute('00');
  }

  if (!open) {
    return (
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center gap-1 rounded-md px-2.5 py-1.5"
        style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderStyle: 'dashed', borderColor: '#94A3B8' }}
      >
        <Plus size={11} color="#64748B" />
        <Text className="text-[12px] text-ink-secondary">Add time</Text>
      </Pressable>
    );
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E4E4E7',
        borderRadius: 8,
        padding: 6,
      }}
    >
      <TextInput
        value={hour}
        onChangeText={(v) => setHour(v.replace(/[^0-9]/g, '').slice(0, 2))}
        placeholder="HH"
        keyboardType="number-pad"
        maxLength={2}
        style={{
          width: 36,
          textAlign: 'center',
          fontSize: 13,
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          color: '#0F172A',
          paddingVertical: 4,
          backgroundColor: '#F4F4F5',
          borderRadius: 4,
        }}
        onSubmitEditing={handleSave}
        autoFocus
      />
      <Text style={{ color: '#64748B', fontSize: 13, fontWeight: '600' }}>:</Text>
      <TextInput
        value={minute}
        onChangeText={(v) => setMinute(v.replace(/[^0-9]/g, '').slice(0, 2))}
        placeholder="MM"
        keyboardType="number-pad"
        maxLength={2}
        style={{
          width: 36,
          textAlign: 'center',
          fontSize: 13,
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          color: '#0F172A',
          paddingVertical: 4,
          backgroundColor: '#F4F4F5',
          borderRadius: 4,
        }}
        onSubmitEditing={handleSave}
      />
      <Pressable
        onPress={handleSave}
        className="rounded-md px-2 py-1.5"
        style={{ backgroundColor: '#E53935' }}
      >
        <Text className="text-[11px] font-semibold text-white">Add</Text>
      </Pressable>
      <Pressable
        onPress={() => setOpen(false)}
        className="rounded-md px-1.5 py-1.5"
      >
        <Text className="text-[11px] text-ink-muted">Cancel</Text>
      </Pressable>
    </View>
  );
}

function formatSchedule(iso: string | null): { label: string; relative: 'past' | 'soon' | 'future' } {
  if (!iso) return { label: 'Not scheduled', relative: 'future' };
  const d = new Date(iso);
  const now = Date.now();
  const diffMs = d.getTime() - now;
  const isToday = new Date().toDateString() === d.toDateString();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = tomorrow.toDateString() === d.toDateString();

  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  let dayLabel: string;
  if (isToday) dayLabel = 'Today';
  else if (isTomorrow) dayLabel = 'Tomorrow';
  else dayLabel = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  const relative: 'past' | 'soon' | 'future' =
    diffMs < 0 ? 'past' : diffMs < 60 * 60 * 1000 ? 'soon' : 'future';

  return { label: `${dayLabel}, ${time}`, relative };
}

function TopicRow({
  topic,
  isLast,
  onDelete,
  onSave,
  saving,
  defaultLanguage,
}: {
  topic: TopicQueueItem;
  isLast: boolean;
  onDelete: () => void;
  onSave: (
    id: string,
    patch: {
      scheduled_at?: string;
      language?: ProjectLanguage | null;
      voice_id?: string | null;
      user_script?: string | null;
    },
  ) => void;
  saving: boolean;
  defaultLanguage: ProjectLanguage;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const sched = formatSchedule(topic.scheduled_at);
  const accent =
    sched.relative === 'past' ? '#EF4444' : sched.relative === 'soon' ? '#F59E0B' : '#64748B';

  return (
    <View
      style={{
        backgroundColor: topic.used ? '#FAFAFA' : '#FFFFFF',
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: '#E4E4E7',
        opacity: topic.used ? 0.7 : 1,
      }}
    >
      <View className="flex-row items-center px-4 py-3">
        {topic.used ? (
          <CheckCircle2 size={14} color="#00C853" style={{ marginRight: 8 }} />
        ) : (
          <Calendar size={14} color={accent} style={{ marginRight: 8 }} />
        )}
        <View className="flex-1 mr-2">
          <Text
            className="text-[13px] text-ink"
            numberOfLines={2}
            style={{ textDecorationLine: topic.used ? 'line-through' : 'none' }}
          >
            {topic.topic}
          </Text>
          {topic.used_at ? (
            <Text className="text-[10px] text-ink-subtle mt-0.5">
              Published{' '}
              {new Date(topic.used_at).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>
          ) : (
            <Pressable
              onPress={() => setEditing(true)}
              disabled={topic.used}
              className="flex-row items-center gap-1 mt-0.5"
            >
              <Clock size={10} color={accent} />
              <Text className="text-[10px] font-medium" style={{ color: accent }}>
                {sched.label}
              </Text>
              <Text className="text-[10px] text-ink-subtle">· edit</Text>
            </Pressable>
          )}
        </View>
        {topic.project_id ? (
          <Pressable
            onPress={() => router.push(`/projects/${topic.project_id}` as any)}
            className="rounded-md px-2 py-1 mr-1"
            style={{ backgroundColor: '#F4F4F5' }}
          >
            <Text className="text-[10px] font-semibold text-ink-secondary">View project</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={onDelete} className="p-1.5">
          <Trash2 size={12} color="#94A3B8" />
        </Pressable>
      </View>
      {editing ? (
        <TopicEditor
          topic={topic}
          defaultLanguage={defaultLanguage}
          onCancel={() => setEditing(false)}
          loading={saving}
          onSave={(patch) => {
            onSave(topic.id, patch);
            setEditing(false);
          }}
        />
      ) : null}
    </View>
  );
}

function TopicEditor({
  topic,
  defaultLanguage,
  onCancel,
  onSave,
  loading,
}: {
  topic: TopicQueueItem;
  defaultLanguage: ProjectLanguage;
  onCancel: () => void;
  onSave: (patch: {
    scheduled_at?: string;
    language?: ProjectLanguage | null;
    voice_id?: string | null;
    user_script?: string | null;
  }) => void;
  loading: boolean;
}) {
  // Date/time
  const initial = topic.scheduled_at
    ? new Date(topic.scheduled_at)
    : new Date(Date.now() + 5 * 60 * 1000);
  const [date, setDate] = useState(toDateInputValue(initial));
  const [time, setTime] = useState(toTimeInputValue(initial));

  // Per-topic overrides; null = use automation default
  const [language, setLanguage] = useState<ProjectLanguage>(topic.language ?? defaultLanguage);
  const [voiceId, setVoiceId] = useState<string | null>(topic.voice_id ?? null);
  const [scriptMode, setScriptMode] = useState<'auto' | 'custom'>(
    topic.user_script ? 'custom' : 'auto',
  );
  const [customScript, setCustomScript] = useState<string>(topic.user_script ?? '');

  function handleSave() {
    const parsed = new Date(`${date}T${time}`);
    if (Number.isNaN(parsed.getTime())) {
      toast.error('Invalid date/time');
      return;
    }
    if (parsed.getTime() < Date.now() - 60_000) {
      toast.error('Time must be in the future');
      return;
    }
    onSave({
      scheduled_at: parsed.toISOString(),
      language,
      voice_id: voiceId,
      user_script:
        scriptMode === 'custom' ? customScript.trim() || null : null,
    });
  }

  return (
    <View
      style={{
        backgroundColor: '#F4F4F5',
        borderTopWidth: 1,
        borderTopColor: '#E4E4E7',
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
      }}
    >
      {/* Schedule + language row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text className="text-[11px] font-semibold text-ink-secondary uppercase tracking-wide">
            Time
          </Text>
          <DateInput value={date} onChange={setDate} />
          <TimeInput value={time} onChange={setTime} />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text className="text-[11px] font-semibold text-ink-secondary uppercase tracking-wide">
            Language
          </Text>
          {(['ta', 'en', 'hi'] as ProjectLanguage[]).map((l) => {
            const active = language === l;
            return (
              <Pressable
                key={l}
                onPress={() => {
                  setLanguage(l);
                  setVoiceId(null); // language change resets voice
                }}
                className="rounded-md px-2.5 py-1"
                style={{
                  backgroundColor: active ? '#E53935' : '#FFFFFF',
                  borderWidth: 1,
                  borderColor: active ? '#E53935' : '#E4E4E7',
                }}
              >
                <Text
                  className="text-[11px] font-semibold"
                  style={{ color: active ? '#fff' : '#334155' }}
                >
                  {l === 'ta' ? 'Tamil' : l === 'en' ? 'English' : 'Hindi'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Voice picker — filtered by chosen language */}
      <View>
        <Text className="text-[11px] font-semibold text-ink-secondary uppercase tracking-wide mb-1.5">
          Voice
        </Text>
        <View style={{ maxHeight: 240 }}>
          <ScrollView style={{ maxHeight: 240 }}>
            <VoicePicker language={language} value={voiceId} onChange={setVoiceId} />
          </ScrollView>
        </View>
      </View>

      {/* Script source toggle */}
      <View>
        <Text className="text-[11px] font-semibold text-ink-secondary uppercase tracking-wide mb-1.5">
          Script
        </Text>
        <View className="flex-row gap-2 mb-2">
          {(
            [
              { v: 'auto', label: 'AI generates from topic' },
              { v: 'custom', label: 'Write my own script' },
            ] as const
          ).map((opt) => {
            const active = scriptMode === opt.v;
            return (
              <Pressable
                key={opt.v}
                onPress={() => setScriptMode(opt.v)}
                className="rounded-md px-3 py-1.5"
                style={{
                  backgroundColor: active ? '#E53935' : '#FFFFFF',
                  borderWidth: 1,
                  borderColor: active ? '#E53935' : '#E4E4E7',
                }}
              >
                <Text
                  className="text-[11px] font-semibold"
                  style={{ color: active ? '#fff' : '#334155' }}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {scriptMode === 'custom' ? (
          <Textarea
            rows={6}
            value={customScript}
            onChangeText={setCustomScript}
            placeholder={
              language === 'ta'
                ? 'உங்கள் ஸ்கிரிப்டை இங்கே ஒட்டவும். AI இதை சரியாகப் பேசும்.'
                : language === 'hi'
                  ? 'अपना स्क्रिप्ट यहाँ पेस्ट करें। AI इसे जैसा है वैसा बोलेगा।'
                  : 'Paste your script here. The AI will narrate it exactly as written.'
            }
          />
        ) : (
          <Text className="text-[11px] text-ink-muted leading-relaxed">
            AI will write the script in {language === 'ta' ? 'Tamil' : language === 'hi' ? 'Hindi' : 'English'} based on the topic, then narrate it with the chosen voice.
          </Text>
        )}
      </View>

      {/* Actions */}
      <View className="flex-row justify-end gap-2 pt-1">
        <Pressable
          onPress={onCancel}
          disabled={loading}
          className="rounded-md px-3 py-2"
          style={{ opacity: loading ? 0.6 : 1 }}
        >
          <Text className="text-[12px] text-ink-muted">Cancel</Text>
        </Pressable>
        <Pressable
          onPress={handleSave}
          disabled={loading}
          className="rounded-md px-4 py-2"
          style={{ backgroundColor: '#E53935', opacity: loading ? 0.6 : 1 }}
        >
          <Text className="text-[12px] font-semibold text-white">
            {loading ? 'Saving…' : 'Save changes'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// Renders a real <input type="date"> on web, falls back to TextInput on native.
function DateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  if (typeof document !== 'undefined') {
    return (
      <View>
        <input
          type="date"
          value={value}
          onChange={(e: any) => onChange(e.target.value)}
          style={{
            fontSize: 12,
            padding: '6px 8px',
            borderRadius: 6,
            border: '1px solid #E4E4E7',
            backgroundColor: '#FFFFFF',
            color: '#0F172A',
            fontFamily: 'inherit',
          }}
        />
      </View>
    );
  }
  return null;
}

function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  if (typeof document !== 'undefined') {
    return (
      <View>
        <input
          type="time"
          value={value}
          step={60}
          onChange={(e: any) => onChange(e.target.value)}
          style={{
            fontSize: 12,
            padding: '6px 8px',
            borderRadius: 6,
            border: '1px solid #E4E4E7',
            backgroundColor: '#FFFFFF',
            color: '#0F172A',
            fontFamily: 'inherit',
          }}
        />
      </View>
    );
  }
  return null;
}

function toDateInputValue(d: Date): string {
  // YYYY-MM-DD in local time
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toTimeInputValue(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}
