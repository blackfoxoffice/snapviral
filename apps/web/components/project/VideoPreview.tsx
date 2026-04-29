import { View, Text, Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import { Download, Youtube, Loader2, Sparkles, ExternalLink, CheckCircle2, Clock, Calendar, X } from 'lucide-react-native';
import { MotiView } from 'moti';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { Skeleton } from '../ui/Skeleton';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { toast } from '../ui/Toast';
import type { Project } from '@newsflow/shared';
import { supabase } from '../../lib/supabase';
import { api } from '../../lib/api';
import {
  useYouTubeStatus,
  useGenerateYouTubeMetadata,
  usePublishToYouTube,
  useScheduleYouTube,
  useCancelSchedule,
} from '../../lib/queries';

interface Props {
  project: Project;
}

function formatScheduleDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDefaultScheduleDate(): string {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export function VideoPreview({ project }: Props) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [showPublish, setShowPublish] = useState(false);
  const [mode, setMode] = useState<'now' | 'schedule'>('now');

  const [ytTitle, setYtTitle] = useState(project.yt_title ?? '');
  const [ytDescription, setYtDescription] = useState(project.yt_description ?? '');
  const [ytTags, setYtTags] = useState(project.yt_tags?.join(', ') ?? '');
  const [privacy, setPrivacy] = useState<'public' | 'unlisted' | 'private'>('public');
  const [scheduleDate, setScheduleDate] = useState(getDefaultScheduleDate());

  const { data: ytStatus } = useYouTubeStatus();
  const generateMeta = useGenerateYouTubeMetadata();
  const publishYt = usePublishToYouTube();
  const scheduleYt = useScheduleYouTube();
  const cancelSchedule = useCancelSchedule();

  useEffect(() => {
    if (project.yt_title) setYtTitle(project.yt_title);
    if (project.yt_description) setYtDescription(project.yt_description);
    if (project.yt_tags) setYtTags(project.yt_tags.join(', '));
  }, [project.yt_title, project.yt_description, project.yt_tags]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!project.final_video_path) return;
      const { data } = await supabase.storage
        .from('project-assets')
        .createSignedUrl(project.final_video_path, 60 * 60);
      if (cancelled) return;
      setSignedUrl(data?.signedUrl ?? null);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [project.final_video_path]);

  async function handleDownload() {
    try {
      const url = await api.getDownloadUrl(project.id);
      if (typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener');
      }
    } catch (e) {
      toast.error('Could not download', e instanceof Error ? e.message : undefined);
    }
  }

  async function handleGenerateMetadata() {
    try {
      const meta = await generateMeta.mutateAsync(project.id);
      setYtTitle(meta.title);
      setYtDescription(meta.description);
      setYtTags(meta.tags.join(', '));
      toast.success('Metadata generated');
    } catch (e) {
      toast.error('Generation failed', e instanceof Error ? e.message : undefined);
    }
  }

  function parseTags(): string[] {
    return ytTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }

  async function handlePublishNow() {
    try {
      const result = await publishYt.mutateAsync({
        projectId: project.id,
        title: ytTitle || undefined,
        description: ytDescription || undefined,
        tags: parseTags().length > 0 ? parseTags() : undefined,
        privacy,
      });
      toast.success('Published to YouTube!');
      setShowPublish(false);
      if (typeof window !== 'undefined' && result.url) {
        window.open(result.url, '_blank', 'noopener');
      }
    } catch (e) {
      toast.error('Publish failed', e instanceof Error ? e.message : undefined);
    }
  }

  async function handleSchedule() {
    const scheduledAt = new Date(scheduleDate);
    if (scheduledAt <= new Date()) {
      toast.error('Please pick a future date and time');
      return;
    }
    try {
      await scheduleYt.mutateAsync({
        projectId: project.id,
        scheduled_at: scheduledAt.toISOString(),
        title: ytTitle || undefined,
        description: ytDescription || undefined,
        tags: parseTags().length > 0 ? parseTags() : undefined,
        privacy,
      });
      toast.success('Scheduled!', `Will publish on ${formatScheduleDate(scheduledAt.toISOString())}`);
      setShowPublish(false);
    } catch (e) {
      toast.error('Schedule failed', e instanceof Error ? e.message : undefined);
    }
  }

  async function handleCancelSchedule() {
    try {
      await cancelSchedule.mutateAsync(project.id);
      toast.success('Schedule cancelled');
    } catch (e) {
      toast.error('Failed to cancel', e instanceof Error ? e.message : undefined);
    }
  }

  function handleOpenPublish() {
    if (!ytStatus?.connected) {
      toast.error('Connect YouTube first', 'Go to Settings → Branding to connect your channel.');
      return;
    }
    setScheduleDate(getDefaultScheduleDate());
    setShowPublish(true);
  }

  const ready = project.status === 'ready' && signedUrl;
  const failed = project.status === 'failed';
  const published = !!project.yt_video_id;
  const scheduled = !!project.yt_scheduled_at && !published;

  return (
    <View className="gap-4">
      <View
        className="w-full overflow-hidden rounded-xl bg-surface-sunken items-center justify-center"
        style={{ aspectRatio: 9 / 16, maxWidth: 400, alignSelf: 'center' }}
      >
        {ready && signedUrl ? (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <video
            src={signedUrl}
            controls
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            // @ts-ignore web-only attribute
            playsInline
          />
        ) : failed ? (
          <View className="px-6 items-center">
            <Text className="text-ink font-semibold text-[14px] text-center mb-1.5">Something went wrong</Text>
            <Text className="text-ink-muted text-[12px] text-center">
              {project.error ?? 'The pipeline failed. Try again.'}
            </Text>
          </View>
        ) : (
          <View className="items-center gap-3 p-6">
            <Skeleton className="h-[80%] w-[80%] rounded-md" />
            <View className="items-center absolute inset-0 justify-center">
              <MotiView
                from={{ rotate: '0deg' }}
                animate={{ rotate: '360deg' }}
                transition={{ type: 'timing', duration: 1200, loop: true, repeatReverse: false }}
              >
                <Loader2 size={24} color="#E53935" />
              </MotiView>
              <Text className="mt-2.5 text-ink-secondary text-[12px]">
                {project.current_step ? `${project.current_step}...` : 'Starting up...'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {project.status !== 'ready' && project.status !== 'failed' ? (
        <View className="gap-1.5">
          <View className="flex-row justify-between">
            <Text className="text-[11px] font-semibold text-ink-secondary uppercase tracking-wide">Progress</Text>
            <Text className="text-[11px] text-ink-muted" style={{ fontVariant: ['tabular-nums'] }}>
              {project.progress_pct}%
            </Text>
          </View>
          <ProgressBar value={project.progress_pct} />
        </View>
      ) : null}

      {published ? (
        <View className="rounded-lg bg-accent-soft border border-accent-border p-3 flex-row items-center gap-3">
          <CheckCircle2 size={16} color="#00E676" />
          <View className="flex-1">
            <Text className="text-[13px] font-semibold text-ink">Published to YouTube</Text>
            {project.yt_title ? (
              <Text className="text-[11px] text-ink-muted mt-0.5" numberOfLines={1}>{project.yt_title}</Text>
            ) : null}
          </View>
          <Pressable
            onPress={() => {
              if (typeof window !== 'undefined') {
                window.open(`https://youtu.be/${project.yt_video_id}`, '_blank', 'noopener');
              }
            }}
            className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-md bg-surface-raised border border-surface-border"
          >
            <ExternalLink size={12} color="#B0BEC5" />
            <Text className="text-[11px] text-ink-secondary font-semibold">View</Text>
          </Pressable>
        </View>
      ) : null}

      {scheduled ? (
        <View className="rounded-lg bg-state-warning-soft border border-state-warning/25 p-3 flex-row items-center gap-3">
          <Clock size={16} color="#FFA726" />
          <View className="flex-1">
            <Text className="text-[13px] font-semibold text-state-warning">Scheduled</Text>
            <Text className="text-[11px] text-ink-muted mt-0.5">
              Publishes {formatScheduleDate(project.yt_scheduled_at!)}
            </Text>
          </View>
          <Pressable
            onPress={handleCancelSchedule}
            className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-md bg-surface-raised border border-surface-border"
          >
            <X size={12} color="#B0BEC5" />
            <Text className="text-[11px] text-ink-secondary font-semibold">Cancel</Text>
          </Pressable>
        </View>
      ) : null}

      <View className="flex-row gap-2.5 justify-center flex-wrap">
        <Button
          onPress={handleDownload}
          disabled={!ready}
          leftIcon={<Download size={14} color={ready ? '#fff' : '#546E7A'} />}
        >
          Download MP4
        </Button>
        <Button
          variant="secondary"
          onPress={handleOpenPublish}
          disabled={!ready}
          leftIcon={<Youtube size={14} color={ready ? '#E53935' : '#546E7A'} />}
        >
          {published ? 'Republish' : scheduled ? 'Edit Schedule' : 'Publish to YouTube'}
        </Button>
      </View>

      <Dialog
        open={showPublish}
        onClose={() => setShowPublish(false)}
        title="Publish to YouTube"
        description="Publish immediately or schedule for a specific date and time."
        footer={
          <>
            <Button variant="secondary" onPress={() => setShowPublish(false)}>Cancel</Button>
            {mode === 'now' ? (
              <Button
                onPress={handlePublishNow}
                loading={publishYt.isPending}
                disabled={!ytTitle.trim()}
                leftIcon={<Youtube size={14} color="#fff" />}
              >
                Publish Now
              </Button>
            ) : (
              <Button
                onPress={handleSchedule}
                loading={scheduleYt.isPending}
                disabled={!ytTitle.trim()}
                leftIcon={<Clock size={14} color="#fff" />}
              >
                Schedule
              </Button>
            )}
          </>
        }
      >
        <View className="gap-4">
          {/* Mode toggle */}
          <View className="flex-row rounded-lg border border-surface-border overflow-hidden">
            <Pressable
              onPress={() => setMode('now')}
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 ${
                mode === 'now' ? 'bg-brand' : 'bg-surface-raised'
              }`}
            >
              <Youtube size={13} color={mode === 'now' ? '#fff' : '#78909C'} />
              <Text className={`text-[12px] font-semibold ${mode === 'now' ? 'text-white' : 'text-ink-muted'}`}>
                Publish Now
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setMode('schedule')}
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 ${
                mode === 'schedule' ? 'bg-brand' : 'bg-surface-raised'
              }`}
            >
              <Calendar size={13} color={mode === 'schedule' ? '#fff' : '#78909C'} />
              <Text className={`text-[12px] font-semibold ${mode === 'schedule' ? 'text-white' : 'text-ink-muted'}`}>
                Schedule
              </Text>
            </Pressable>
          </View>

          {mode === 'schedule' ? (
            <View className="rounded-lg border border-surface-border bg-surface-raised p-3 gap-2">
              <Text className="text-[12px] font-semibold text-ink-secondary uppercase tracking-wide">Publish Date & Time</Text>
              {typeof document !== 'undefined' ? (
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e: any) => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #263238',
                    backgroundColor: '#1E1E1E',
                    color: '#F5F5F5',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    outline: 'none',
                    colorScheme: 'dark',
                  }}
                />
              ) : null}
              <Text className="text-[11px] text-ink-muted">
                The video will auto-publish to your YouTube channel at this time.
              </Text>
            </View>
          ) : null}

          <View className="flex-row gap-2">
            <Button
              variant="secondary"
              size="sm"
              onPress={handleGenerateMetadata}
              loading={generateMeta.isPending}
              leftIcon={<Sparkles size={13} color="#00E676" />}
            >
              Generate with AI
            </Button>
          </View>

          <Input
            label="Title"
            value={ytTitle}
            onChangeText={setYtTitle}
            placeholder="Video title (max 100 characters)"
          />
          <Textarea
            label="Description"
            value={ytDescription}
            onChangeText={setYtDescription}
            placeholder="Video description with hashtags..."
            rows={5}
          />
          <Input
            label="Tags"
            value={ytTags}
            onChangeText={setYtTags}
            placeholder="news, breaking, trending (comma-separated)"
          />
          <Select
            label="Privacy"
            value={privacy}
            onChange={setPrivacy}
            options={[
              { value: 'public' as const, label: 'Public', helper: 'Anyone can search and view' },
              { value: 'unlisted' as const, label: 'Unlisted', helper: 'Only people with the link' },
              { value: 'private' as const, label: 'Private', helper: 'Only you can view' },
            ]}
          />

          {!ytStatus?.connected ? (
            <View className="rounded-lg bg-state-warning-soft border border-state-warning/25 p-3">
              <Text className="text-[12px] text-state-warning font-semibold">YouTube not connected</Text>
              <Text className="text-[11px] text-ink-muted mt-0.5">
                Go to Settings → Branding to connect your YouTube channel.
              </Text>
            </View>
          ) : (
            <View className="rounded-lg bg-surface-raised border border-surface-border p-3 flex-row items-center gap-2">
              <Youtube size={14} color="#E53935" />
              <Text className="text-[12px] text-ink-secondary">
                Publishing to <Text className="font-semibold text-ink">{ytStatus.channel_name}</Text>
              </Text>
            </View>
          )}
        </View>
      </Dialog>
    </View>
  );
}
