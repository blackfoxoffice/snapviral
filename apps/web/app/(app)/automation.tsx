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
import {
  Zap,
  Trash2,
  Plus,
  Clock,
  Lock,
  Calendar,
  CheckCircle2,
  Wand2,
  Globe,
  AlertTriangle,
  ListChecks,
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
import {
  useAutomationStatus,
  useUpdateAutomationSettings,
  useAddTopics,
  useDeleteTopic,
  useClearTopics,
  useYouTubeStatus,
} from '../../lib/queries';

const TIME_OPTIONS: string[] = (() => {
  const times: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return times;
})();

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
  const deleteMut = useDeleteTopic();
  const clearMut = useClearTopics();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [topicsInput, setTopicsInput] = useState('');

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
            <View>
              <Text className="text-[12px] font-semibold text-ink-secondary mb-1.5 uppercase tracking-wide">
                Add topics (one per line)
              </Text>
              <Textarea
                rows={6}
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
                  leftIcon={<Plus size={12} color="#fff" />}
                  onPress={handleAddTopics}
                  loading={addMut.isPending}
                  disabled={topicsInput.trim().length === 0}
                >
                  Add to queue
                </Button>
              </View>
            </View>

            {queue.length > 0 ? (
              <View className="rounded-lg border border-surface-border overflow-hidden">
                {/* Pending */}
                {unused.map((t, i) => (
                  <TopicRow
                    key={t.id}
                    topic={t}
                    isLast={i === unused.length - 1 && used.length === 0}
                    onDelete={() => deleteMut.mutate(t.id)}
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
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E4E4E7',
        borderRadius: 8,
        padding: 8,
        maxHeight: 240,
        width: 140,
      }}
    >
      <ScrollView style={{ maxHeight: 220 }}>
        {TIME_OPTIONS.map((t) => (
          <Pressable
            key={t}
            onPress={() => {
              onAdd(t);
              setOpen(false);
            }}
            className="px-2 py-1.5 rounded hover:bg-surface-raised"
          >
            <Text className="text-[12px] font-mono text-ink-secondary">{t}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function TopicRow({
  topic,
  isLast,
  onDelete,
}: {
  topic: TopicQueueItem;
  isLast: boolean;
  onDelete: () => void;
}) {
  const router = useRouter();
  return (
    <View
      className="flex-row items-center px-4 py-3"
      style={{
        backgroundColor: topic.used ? '#FAFAFA' : '#FFFFFF',
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: '#E4E4E7',
        opacity: topic.used ? 0.7 : 1,
      }}
    >
      {topic.used ? (
        <CheckCircle2 size={14} color="#00C853" style={{ marginRight: 8 }} />
      ) : (
        <Calendar size={14} color="#64748B" style={{ marginRight: 8 }} />
      )}
      <View className="flex-1">
        <Text
          className="text-[13px] text-ink"
          numberOfLines={2}
          style={{ textDecorationLine: topic.used ? 'line-through' : 'none' }}
        >
          {topic.topic}
        </Text>
        {topic.used_at ? (
          <Text className="text-[10px] text-ink-subtle mt-0.5">
            Used {new Date(topic.used_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </Text>
        ) : null}
      </View>
      {topic.project_id ? (
        <Pressable
          onPress={() => router.push(`/projects/${topic.project_id}` as any)}
          className="rounded-md px-2 py-1"
          style={{ backgroundColor: '#F4F4F5' }}
        >
          <Text className="text-[10px] font-semibold text-ink-secondary">View project</Text>
        </Pressable>
      ) : null}
      <Pressable onPress={onDelete} className="p-1.5 ml-2">
        <Trash2 size={12} color="#94A3B8" />
      </Pressable>
    </View>
  );
}
