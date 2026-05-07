import { View, Text, ScrollView, Pressable, useWindowDimensions, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import {
  Youtube,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Calendar,
  Upload,
  RefreshCw,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { toast } from '../../components/ui/Toast';
import { useYouTubeStatus, useDisconnectYouTube, useProjects } from '../../lib/queries';
import { api } from '../../lib/api';

export default function YouTubePage() {
  const router = useRouter();
  const { data: status, refetch: refetchStatus, isLoading: statusLoading } = useYouTubeStatus();
  const disconnectMut = useDisconnectYouTube();
  const { data: projects } = useProjects();
  const [connecting, setConnecting] = useState(false);
  const [showCreateChannelHelp, setShowCreateChannelHelp] = useState(false);
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // Read OAuth callback hash from URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('yt_connected') === '1') {
      toast.success('YouTube connected!');
      refetchStatus();
      window.history.replaceState({}, '', window.location.pathname);
    }
    const ytError = params.get('yt_error');
    if (ytError) {
      const detail = params.get('detail') ?? '';
      if (ytError === 'no_channel') {
        setShowCreateChannelHelp(true);
        toast.error(
          'No YouTube channel on this account',
          'Create a channel first, then try connecting again.',
        );
      } else if (ytError === 'invalid_grant' || ytError === 'token_exchange') {
        toast.error('Could not exchange the OAuth code', detail || 'Try again in a moment.');
      } else {
        toast.error('YouTube connection failed', detail || undefined);
      }
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [refetchStatus]);

  async function handleConnect() {
    setConnecting(true);
    try {
      const url = await api.getYouTubeAuthUrl();
      if (typeof window !== 'undefined') window.location.href = url;
    } catch (e) {
      toast.error('Could not start YouTube connection', e instanceof Error ? e.message : undefined);
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    try {
      await disconnectMut.mutateAsync();
      toast.success('YouTube disconnected');
    } catch (e) {
      toast.error('Disconnect failed', e instanceof Error ? e.message : undefined);
    }
  }

  const published = (projects ?? []).filter((p) => p.yt_video_id);
  const scheduled = (projects ?? []).filter((p) => p.yt_scheduled_at && !p.yt_video_id);
  const ready = (projects ?? []).filter((p) => p.status === 'ready' && !p.yt_video_id && !p.yt_scheduled_at);

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View
        className="mx-auto w-full max-w-[1100px] pb-20"
        style={{ paddingHorizontal: isMobile ? 16 : 32, paddingTop: isMobile ? 20 : 32 }}
      >
        {/* Header */}
        <View className={`mb-6 ${isMobile ? '' : 'flex-row items-end justify-between'}`}>
          <View>
            <Text
              className={`font-bold text-ink ${isMobile ? 'text-[22px]' : 'text-[26px]'}`}
              style={{ letterSpacing: -0.5 }}
            >
              YouTube
            </Text>
            <Text className="text-[13px] text-ink-muted mt-1">
              Connect your channel, publish videos, and manage scheduled uploads.
            </Text>
          </View>
        </View>

        {/* Connection card */}
        <Card className="mb-5">
          <Card.Header>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-[14px] font-semibold text-ink">Channel connection</Text>
                <Text className="text-[12px] text-ink-muted mt-0.5">
                  Use Google OAuth to authorize publishing on your behalf.
                </Text>
              </View>
              {status?.connected ? <Badge variant="success">Connected</Badge> : null}
            </View>
          </Card.Header>
          <Card.Body className="gap-3">
            {statusLoading ? (
              <View className="flex-row items-center gap-2 py-2">
                <ActivityIndicator size="small" color="#E53935" />
                <Text className="text-[13px] text-ink-muted">Checking connection…</Text>
              </View>
            ) : status?.connected ? (
              <ConnectedView
                channelId={status.channel_id ?? ''}
                channelName={status.channel_name ?? ''}
                onDisconnect={handleDisconnect}
                disconnecting={disconnectMut.isPending}
                onReconnect={handleConnect}
                reconnecting={connecting}
              />
            ) : showCreateChannelHelp ? (
              <NoChannelHelp onDismiss={() => setShowCreateChannelHelp(false)} onTryAgain={handleConnect} connecting={connecting} />
            ) : (
              <DisconnectedView onConnect={handleConnect} connecting={connecting} />
            )}
          </Card.Body>
        </Card>

        {status?.connected ? (
          <View className={isMobile ? 'gap-4' : 'flex-row gap-4'}>
            <StatTile label="Published" value={published.length} Icon={CheckCircle2} accent="#00C853" />
            <StatTile label="Scheduled" value={scheduled.length} Icon={Calendar} accent="#F59E0B" />
            <StatTile label="Ready to publish" value={ready.length} Icon={Upload} accent="#2563EB" />
          </View>
        ) : null}

        {/* Recent published */}
        {status?.connected && published.length > 0 ? (
          <Card variant="flat" className="mt-5">
            <Card.Header className="flex-row items-center justify-between">
              <Text className="text-[14px] font-semibold text-ink">Recently published</Text>
            </Card.Header>
            <View>
              {published.slice(0, 6).map((p, i) => (
                <Pressable
                  key={p.id}
                  onPress={() => router.push(`/projects/${p.id}`)}
                  className="flex-row items-center px-5 py-3 hover:bg-surface-raised"
                  style={i < Math.min(published.length, 6) - 1 ? { borderBottomWidth: 1, borderBottomColor: '#E4E4E7' } : {}}
                >
                  <View className="flex-1 mr-3">
                    <Text className="text-[13px] font-semibold text-ink" numberOfLines={1}>
                      {p.yt_title ?? p.title}
                    </Text>
                    <Text className="text-[11px] text-ink-muted mt-0.5">
                      Published{' '}
                      {p.yt_published_at
                        ? new Date(p.yt_published_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      if (typeof window !== 'undefined' && p.yt_video_id) {
                        window.open(`https://youtube.com/shorts/${p.yt_video_id}`, '_blank');
                      }
                    }}
                    className="flex-row items-center gap-1 rounded-md px-3 py-1.5 bg-surface-raised"
                  >
                    <Text className="text-[11px] text-ink-secondary">View</Text>
                    <ExternalLink size={11} color="#64748B" />
                  </Pressable>
                </Pressable>
              ))}
            </View>
          </Card>
        ) : null}

        {/* Scheduled queue */}
        {status?.connected && scheduled.length > 0 ? (
          <Card variant="flat" className="mt-5">
            <Card.Header className="flex-row items-center justify-between">
              <Text className="text-[14px] font-semibold text-ink">Scheduled</Text>
            </Card.Header>
            <View>
              {scheduled.map((p, i) => (
                <Pressable
                  key={p.id}
                  onPress={() => router.push(`/projects/${p.id}`)}
                  className="flex-row items-center px-5 py-3 hover:bg-surface-raised"
                  style={i < scheduled.length - 1 ? { borderBottomWidth: 1, borderBottomColor: '#E4E4E7' } : {}}
                >
                  <View className="flex-1">
                    <Text className="text-[13px] font-semibold text-ink" numberOfLines={1}>
                      {p.yt_title ?? p.title}
                    </Text>
                    <Text className="text-[11px] text-ink-muted mt-0.5">
                      Goes live{' '}
                      {p.yt_scheduled_at
                        ? new Date(p.yt_scheduled_at).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })
                        : '—'}
                    </Text>
                  </View>
                  <Calendar size={14} color="#F59E0B" />
                </Pressable>
              ))}
            </View>
          </Card>
        ) : null}
      </View>
    </ScrollView>
  );
}

function ConnectedView({
  channelId,
  channelName,
  onDisconnect,
  disconnecting,
  onReconnect,
  reconnecting,
}: {
  channelId: string;
  channelName: string;
  onDisconnect: () => void;
  disconnecting: boolean;
  onReconnect: () => void;
  reconnecting: boolean;
}) {
  return (
    <View>
      <View className="flex-row items-center gap-3 rounded-lg bg-accent-soft border border-accent-border p-3 mb-3">
        <View className="h-10 w-10 rounded-full bg-brand items-center justify-center">
          <Youtube size={18} color="#fff" />
        </View>
        <View className="flex-1">
          <Text className="text-[13px] font-semibold text-ink" numberOfLines={1}>
            {channelName}
          </Text>
          <Text className="text-[11px] text-ink-muted font-mono" numberOfLines={1}>
            {channelId}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            if (typeof window !== 'undefined') {
              window.open(`https://youtube.com/channel/${channelId}`, '_blank');
            }
          }}
          className="rounded-md p-2 hover:bg-surface-raised"
        >
          <ExternalLink size={14} color="#64748B" />
        </Pressable>
      </View>
      <View className="flex-row gap-2">
        <Button variant="secondary" size="sm" onPress={onReconnect} loading={reconnecting} leftIcon={<RefreshCw size={12} color="#475569" />}>
          Re-authorize
        </Button>
        <Button variant="secondary" size="sm" onPress={onDisconnect} loading={disconnecting}>
          Disconnect
        </Button>
      </View>
    </View>
  );
}

function DisconnectedView({ onConnect, connecting }: { onConnect: () => void; connecting: boolean }) {
  return (
    <Pressable
      onPress={onConnect}
      disabled={connecting}
      className="border-2 border-dashed border-surface-border rounded-xl p-8 items-center justify-center"
    >
      <View className="h-14 w-14 rounded-full bg-brand-soft items-center justify-center mb-3">
        <Youtube size={26} color="#E53935" />
      </View>
      <Text className="text-[15px] font-semibold text-ink">
        {connecting ? 'Connecting…' : 'Connect YouTube channel'}
      </Text>
      <Text className="text-[12px] text-ink-muted mt-1 text-center max-w-[360px]">
        Sign in with Google to authorize SnapViral to upload and schedule videos on your channel.
      </Text>
    </Pressable>
  );
}

function NoChannelHelp({
  onDismiss,
  onTryAgain,
  connecting,
}: {
  onDismiss: () => void;
  onTryAgain: () => void;
  connecting: boolean;
}) {
  return (
    <View className="rounded-xl border border-state-warning/25 bg-state-warning-soft p-4">
      <View className="flex-row items-center gap-2 mb-2">
        <AlertTriangle size={14} color="#F59E0B" />
        <Text className="text-[13px] font-bold text-state-warning uppercase tracking-wide">
          Channel needed
        </Text>
      </View>
      <Text className="text-[14px] font-semibold text-ink mb-1">
        Your Google account doesn't have a YouTube channel yet.
      </Text>
      <Text className="text-[12px] text-ink-secondary leading-relaxed mb-4">
        Google requires you to create a channel manually before any third-party app (including this one) can connect to it. This is a one-time, 30-second setup on YouTube.com.
      </Text>

      <View className="rounded-lg bg-surface-card border border-surface-border p-3 mb-4">
        <Text className="text-[11px] font-bold text-ink-subtle uppercase tracking-wider mb-2">
          Steps
        </Text>
        <Step n={1} text="Click 'Open YouTube' below" />
        <Step n={2} text='Sign in with the Google account you want to use here' />
        <Step n={3} text='Click your profile picture (top-right) → "Create a channel"' />
        <Step n={4} text="Pick a channel name and click Create" />
        <Step n={5} text='Come back here and click "Try connecting again"' />
      </View>

      <View className="flex-row gap-2 flex-wrap">
        <Pressable
          onPress={() => {
            if (typeof window !== 'undefined') {
              window.open('https://www.youtube.com/account', '_blank');
            }
          }}
          className="flex-row items-center gap-2 rounded-lg px-4 py-2.5 bg-brand active:opacity-90"
        >
          <Plus size={13} color="#fff" />
          <Text className="text-[12px] font-semibold text-white">Open YouTube</Text>
          <ExternalLink size={11} color="rgba(255,255,255,0.7)" />
        </Pressable>
        <Button variant="secondary" size="sm" onPress={onTryAgain} loading={connecting}>
          Try connecting again
        </Button>
        <Button variant="ghost" size="sm" onPress={onDismiss}>
          Dismiss
        </Button>
      </View>
    </View>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <View className="flex-row items-start gap-2 mb-1.5">
      <View
        className="items-center justify-center rounded-full bg-brand-soft"
        style={{ width: 18, height: 18, marginTop: 1 }}
      >
        <Text className="text-[10px] font-bold text-brand">{n}</Text>
      </View>
      <Text className="flex-1 text-[12px] text-ink-secondary leading-relaxed">{text}</Text>
    </View>
  );
}

function StatTile({
  label,
  value,
  Icon,
  accent,
}: {
  label: string;
  value: number;
  Icon: any;
  accent: string;
}) {
  return (
    <View
      className="rounded-xl border bg-surface-card p-4"
      style={{ flex: 1, minWidth: 160, borderColor: '#E4E4E7' }}
    >
      <View className="flex-row items-center gap-2 mb-2">
        <Icon size={13} color={accent} />
        <Text className="text-[10px] font-bold uppercase tracking-widest text-ink-subtle">
          {label}
        </Text>
      </View>
      <Text
        className="text-[26px] font-bold text-ink"
        style={{ fontVariant: ['tabular-nums'], letterSpacing: -0.5 }}
      >
        {value}
      </Text>
    </View>
  );
}
