import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, useWindowDimensions, Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Plus,
  ArrowRight,
  ArrowUpRight,
  Play,
  CircleDot,
  ChevronRight,
  Smartphone,
  Download,
} from 'lucide-react-native';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { StatusBadge } from '../../components/project/StatusBadge';
import { useProjects, useDashboardStats } from '../../lib/queries';
import { useAuth } from '../../lib/auth';
import { LANGUAGE_LABEL } from '../../lib/languages';
import type { Project } from '@newsflow/shared';

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const LANG = LANGUAGE_LABEL;
const SOURCE: Record<string, string> = { urls: 'YouTube', script: 'Script', topic: 'Topic', research: 'Research' };



export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const firstName =
    ((user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? '').split(' ')[0] ?? '';

  const isLoading = projectsLoading || statsLoading;
  const total = stats?.total_projects ?? 0;
  const recent = (projects ?? []).slice(0, 6);
  const activeJobs = (projects ?? []).filter((p) => p.status === 'running' || p.status === 'queued');

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View
        className="mx-auto w-full max-w-[1100px] pb-24"
        style={{ paddingHorizontal: isMobile ? 16 : 40, paddingTop: isMobile ? 20 : 36 }}
      >
        {/* Header */}
        <View className={`mb-8 ${isMobile ? '' : 'flex-row items-end justify-between'}`}>
          <View>
            <Text className="text-[13px] text-ink-subtle mb-0.5">
              {new Date().toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
            <Text
              className={`font-bold text-ink ${isMobile ? 'text-[22px]' : 'text-[28px]'}`}
              style={{ letterSpacing: -0.8 }}
            >
              {firstName ? `${firstName}'s Studio` : 'Your Studio'}
            </Text>
          </View>
          {!isMobile ? (
            <Button
              onPress={() => router.push('/projects/new')}
              leftIcon={<Plus size={14} color="#fff" />}
            >
              New project
            </Button>
          ) : null}
        </View>

        {isLoading ? (
          <View className="gap-4">
            <Skeleton className="h-[120px] rounded-2xl" />
            <View className="flex-row gap-3">
              <Skeleton className="h-[80px] flex-1 rounded-xl" />
              <Skeleton className="h-[80px] flex-1 rounded-xl" />
              <Skeleton className="h-[80px] flex-1 rounded-xl" />
            </View>
            <Skeleton className="h-[200px] rounded-xl" />
          </View>
        ) : total === 0 ? (
          <EmptyStudio onNew={() => router.push('/projects/new')} />
        ) : (
          <View className="gap-5">
            {/* Hero metric strip — modernized with subtle gradient + shadow */}
            <View
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#E4E4E7',
                shadowColor: '#0F172A',
                shadowOpacity: 0.04,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                // Subtle red wash at the top edge to tie the section to the brand
                backgroundImage:
                  'linear-gradient(180deg, rgba(229,57,53,0.025) 0%, rgba(255,255,255,1) 60%)' as any,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                }}
              >
                <HeroMetric
                  number={stats?.ready_projects ?? 0}
                  label="videos ready"
                  accent="#10B981"
                  isMobile={isMobile}
                  position={0}
                />
                <HeroMetric
                  number={stats?.published_to_youtube ?? 0}
                  label="published"
                  accent="#E53935"
                  isMobile={isMobile}
                  position={1}
                />
                <HeroMetric
                  number={formatDuration(stats?.total_voiceover_seconds ?? 0)}
                  label="total content"
                  accent="#3B82F6"
                  isMobile={isMobile}
                  position={2}
                />
                <HeroMetric
                  number={stats?.created_this_month ?? 0}
                  label="this month"
                  accent="#F59E0B"
                  isMobile={isMobile}
                  position={3}
                />
              </View>
            </View>

            {/* Active jobs banner */}
            {activeJobs.length > 0 ? (
              <Pressable
                onPress={() => router.push(`/projects/${activeJobs[0]!.id}`)}
                className="flex-row items-center gap-3 rounded-xl px-4 py-3"
                style={{ backgroundColor: 'rgba(66,165,245,0.08)', borderWidth: 1, borderColor: 'rgba(66,165,245,0.15)' }}
              >
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#42A5F5' }} />
                <Text className="flex-1 text-[13px] text-ink">
                  <Text className="font-semibold">{activeJobs[0]!.title}</Text>
                  <Text className="text-ink-muted"> is generating{activeJobs.length > 1 ? ` (+${activeJobs.length - 1} more)` : ''}</Text>
                </Text>
                <ArrowUpRight size={14} color="#42A5F5" />
              </Pressable>
            ) : null}

            {/* Two-column layout: recent + breakdown */}
            <View className={isMobile ? 'gap-5' : 'flex-row gap-5'}>
              {/* Recent projects */}
              <View className={isMobile ? '' : 'flex-1'}>
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-[13px] font-semibold text-ink">Recent</Text>
                  <Pressable
                    onPress={() => router.push('/library')}
                    className="flex-row items-center gap-1"
                  >
                    <Text className="text-[11px] text-ink-subtle">All projects</Text>
                    <ArrowRight size={11} color="#546E7A" />
                  </Pressable>
                </View>
                <View
                  className="rounded-xl overflow-hidden"
                  style={{ borderWidth: 1, borderColor: '#E4E4E7' }}
                >
                  {recent.map((p, i) => (
                    <ProjectRow key={p.id} project={p} last={i === recent.length - 1} />
                  ))}
                </View>
              </View>

              {/* Right sidebar: breakdown + quick actions */}
              <View style={isMobile ? {} : { width: 280 }} className="gap-5">
                {/* Pipeline breakdown */}
                <View
                  className="rounded-xl p-4"
                  style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4E4E7' }}
                >
                  <Text className="text-[11px] font-semibold text-ink-subtle uppercase tracking-wider mb-3">
                    Pipeline
                  </Text>
                  <View className="gap-2.5">
                    <PipelineStat label="Ready" count={stats?.ready_projects ?? 0} color="#00E676" total={total} />
                    <PipelineStat label="Failed" count={stats?.failed_projects ?? 0} color="#EF5350" total={total} />
                    <PipelineStat label="Running" count={stats?.running_projects ?? 0} color="#42A5F5" total={total} />
                  </View>
                </View>

                {/* Language split */}
                {stats && Object.keys(stats.by_language).length > 0 ? (
                  <View
                    className="rounded-xl p-4"
                    style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4E4E7' }}
                  >
                    <Text className="text-[11px] font-semibold text-ink-subtle uppercase tracking-wider mb-3">
                      Languages
                    </Text>
                    <View className="gap-2">
                      {Object.entries(stats.by_language)
                        .sort((a, b) => b[1] - a[1])
                        .map(([lang, count]) => (
                          <View key={lang} className="flex-row items-center justify-between">
                            <Text className="text-[12px] text-ink-secondary">{(LANG as Record<string, string>)[lang] ?? lang}</Text>
                            <Text className="text-[12px] font-semibold text-ink" style={{ fontVariant: ['tabular-nums'] }}>
                              {count}
                            </Text>
                          </View>
                        ))}
                    </View>
                  </View>
                ) : null}

                {/* Quick actions */}
                <View className="gap-2">
                  <Pressable
                    onPress={() => router.push('/projects/new')}
                    className="flex-row items-center gap-3 rounded-xl px-4 py-3 active:opacity-80"
                    style={{ backgroundColor: '#E53935' }}
                  >
                    <Plus size={16} color="#fff" />
                    <Text className="text-[13px] font-semibold text-white flex-1">New project</Text>
                    <ArrowRight size={14} color="rgba(255,255,255,0.6)" />
                  </Pressable>
                  <Pressable
                    onPress={() => router.push('/library')}
                    className="flex-row items-center gap-3 rounded-xl px-4 py-3 active:opacity-80"
                    style={{ backgroundColor: '#F4F4F5', borderWidth: 1, borderColor: '#E4E4E7' }}
                  >
                    <Play size={14} color="#78909C" />
                    <Text className="text-[13px] text-ink-secondary flex-1">Browse library</Text>
                    <ArrowRight size={14} color="#546E7A" />
                  </Pressable>
                </View>

                {/* Get the mobile app */}
                <DownloadAppCard />
              </View>
            </View>
          </View>
        )}

        {/* Mobile FAB */}
        {isMobile && total > 0 ? (
          <View style={{ position: 'fixed' as any, bottom: 80, right: 16, zIndex: 50 }}>
            <Pressable
              onPress={() => router.push('/projects/new')}
              className="items-center justify-center rounded-full active:opacity-80"
              style={{ width: 52, height: 52, backgroundColor: '#E53935', elevation: 8, shadowColor: '#E53935', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}
            >
              <Plus size={22} color="#fff" />
            </Pressable>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

function HeroMetric({
  number,
  label,
  accent,
  isMobile,
  position,
}: {
  number: number | string;
  label: string;
  accent: string;
  isMobile: boolean;
  position: number;
}) {
  // Mobile: 2x2 grid (top row = positions 0,1 / bottom row = 2,3).
  // Desktop: single row of 4 separated by left borders.
  const mobileBorderTop = isMobile && position >= 2;
  const mobileBorderLeft = isMobile && position % 2 === 1;
  const desktopBorderLeft = !isMobile && position > 0;
  return (
    <View
      style={{
        flexBasis: isMobile ? '50%' : '25%',
        paddingHorizontal: isMobile ? 14 : 20,
        paddingVertical: 14,
        borderTopWidth: mobileBorderTop ? 1 : 0,
        borderLeftWidth: mobileBorderLeft || desktopBorderLeft ? 1 : 0,
        borderColor: '#E4E4E7',
      }}
    >
      <Text
        style={{
          fontSize: isMobile ? 22 : 26,
          fontWeight: '700',
          color: '#0F172A',
          fontVariant: ['tabular-nums'] as any,
          letterSpacing: -0.6,
        }}
      >
        {number}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: accent }} />
        <Text style={{ fontSize: 11, color: '#64748B' }}>{label}</Text>
      </View>
    </View>
  );
}

function ProjectRow({ project: p, last }: { project: Project; last: boolean }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(`/projects/${p.id}`)}
      className="flex-row items-center bg-surface-card px-4 py-3 active:bg-surface-raised"
      style={last ? {} : { borderBottomWidth: 1, borderBottomColor: '#E4E4E7' }}
    >
      <View className="flex-1 mr-3">
        <View className="flex-row items-center gap-2">
          <Text className="text-[13px] font-medium text-ink" numberOfLines={1} style={{ flexShrink: 1 }}>
            {p.title}
          </Text>
          <StatusBadge status={p.status} />
        </View>
        <Text className="text-[11px] text-ink-subtle mt-0.5">
          {LANG[p.language] ?? p.language} · {SOURCE[p.input_mode] ?? p.input_mode} · {timeAgo(p.created_at)}
        </Text>
      </View>
      <ChevronRight size={14} color="#37474F" />
    </Pressable>
  );
}

function PipelineStat({
  label,
  count,
  color,
  total,
}: {
  label: string;
  count: number;
  color: string;
  total: number;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <View>
      <View className="flex-row items-center justify-between mb-1">
        <View className="flex-row items-center gap-2">
          <CircleDot size={10} color={color} />
          <Text className="text-[12px] text-ink-secondary">{label}</Text>
        </View>
        <Text className="text-[12px] font-semibold text-ink" style={{ fontVariant: ['tabular-nums'] }}>
          {count}
        </Text>
      </View>
      <View className="h-[3px] rounded-full bg-surface-raised overflow-hidden">
        <View
          style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%`, height: 3, backgroundColor: color, borderRadius: 2 }}
        />
      </View>
    </View>
  );
}

function EmptyStudio({ onNew }: { onNew: () => void }) {
  return (
    <View className="items-center py-20 px-6">
      <View
        className="items-center justify-center rounded-2xl mb-6"
        style={{ width: 72, height: 72, backgroundColor: 'rgba(229,57,53,0.08)' }}
      >
        <Play size={28} color="#E53935" />
      </View>
      <Text
        className="text-[22px] font-bold text-ink text-center mb-2"
        style={{ letterSpacing: -0.5 }}
      >
        Your studio is empty
      </Text>
      <Text className="text-[14px] text-ink-muted text-center mb-8 max-w-[320px] leading-relaxed">
        Create your first project from YouTube URLs, your own script, or just a topic.
      </Text>
      <Button
        onPress={onNew}
        leftIcon={<Plus size={14} color="#fff" />}
      >
        Create first project
      </Button>
      <View style={{ width: '100%', maxWidth: 360, marginTop: 32 }}>
        <DownloadAppCard />
      </View>
    </View>
  );
}

let deferredPrompt: any = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.dispatchEvent(new Event('pwa-install-ready'));
  });
}

function DownloadAppCard() {
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (deferredPrompt) setCanInstall(true);

    const handler = () => setCanInstall(true);
    window.addEventListener('pwa-install-ready', handler);
    return () => window.removeEventListener('pwa-install-ready', handler);
  }, []);

  const handleInstall = async () => {
    if (canInstall && deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        deferredPrompt = null;
        setCanInstall(false);
      }
    } else if (Platform.OS === 'web') {
      alert('To install: tap the share or menu button in your browser and select "Add to Home Screen". This creates a native App on your device!');
    }
  };

  return (
    <Pressable
      onPress={handleInstall}
      className="rounded-xl overflow-hidden active:opacity-90"
      style={{
        backgroundColor: '#0F172A',
        padding: 14,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.10)',
          }}
        >
          <Smartphone size={18} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>
            Get the SnapViral App
          </Text>
          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
            PWA WebAPK · &lt; 2 MB · Instant install
          </Text>
        </View>
        <Download size={16} color="#FFFFFF" />
      </View>
      <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 10 }}>
        {canInstall 
          ? 'Tap here to install the native app on your device instantly.' 
          : 'Install directly from your browser menu ("Add to Home Screen").'}
      </Text>
    </Pressable>
  );
}
