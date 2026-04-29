import { useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, RefreshCw } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import type { ScriptOutput } from '@newsflow/shared';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import { StatusBadge } from '../../../components/project/StatusBadge';
import { PipelineTimeline } from '../../../components/project/PipelineTimeline';
import { ScenesStrip } from '../../../components/project/ScenesStrip';
import { VideoPreview } from '../../../components/project/VideoPreview';
import { toast } from '../../../components/ui/Toast';
import { useProject, useGenerateProject, qk } from '../../../lib/queries';
import { supabase } from '../../../lib/supabase';

export default function ProjectDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isWide = width >= 960;

  const { data: project, isLoading } = useProject(id);
  const generateMutation = useGenerateProject();

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`project-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects', filter: `id=eq.${id}` },
        () => {
          qc.invalidateQueries({ queryKey: qk.project(id) });
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pipeline_jobs', filter: `project_id=eq.${id}` },
        () => {
          qc.invalidateQueries({ queryKey: qk.project(id) });
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'assets', filter: `project_id=eq.${id}` },
        () => {
          qc.invalidateQueries({ queryKey: qk.project(id) });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, qc]);

  const scriptAsset = useMemo(
    () => project?.assets.find((a) => a.type === 'script'),
    [project],
  );
  const script = (scriptAsset?.content ?? null) as ScriptOutput | null;

  const transcriptAsset = useMemo(
    () => project?.assets.find((a) => a.type === 'transcript'),
    [project],
  );
  const research = useMemo(() => {
    const c = transcriptAsset?.content as { mode?: string; research?: { summary: string; citations: string[] } } | null;
    if (c?.mode === 'research' && c.research) return c.research;
    return null;
  }, [transcriptAsset]);

  if (isLoading || !project) {
    return (
      <ScrollView className="flex-1">
        <View
          className="mx-auto w-full max-w-[1200px] pb-24"
          style={{ paddingHorizontal: isMobile ? 16 : 32, paddingTop: isMobile ? 20 : 32 }}
        >
          <View className="gap-5">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-[400px] rounded-xl" />
          </View>
        </View>
      </ScrollView>
    );
  }

  async function handleRetry() {
    try {
      await generateMutation.mutateAsync(id as string);
      toast.success('Regenerating', 'Pipeline restarted.');
    } catch (e) {
      toast.error('Retry failed', e instanceof Error ? e.message : undefined);
    }
  }

  return (
    <ScrollView className="flex-1">
      <View
        className="mx-auto w-full max-w-[1200px] pb-24"
        style={{ paddingHorizontal: isMobile ? 16 : 32, paddingTop: isMobile ? 16 : 32 }}
      >
        <View className={`${isMobile ? 'gap-2 mb-3' : 'flex-row items-center gap-2.5 mb-4'}`}>
          <View className="flex-row items-center gap-2 flex-1">
            <Pressable
              onPress={() => router.back()}
              className="h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-raised"
            >
              <ArrowLeft size={16} color="#B0BEC5" />
            </Pressable>
            <Text
              className={`font-bold text-ink flex-1 ${isMobile ? 'text-[20px]' : 'text-[22px]'}`}
              style={{ letterSpacing: -0.5 }}
              numberOfLines={1}
            >
              {project.title}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <StatusBadge status={project.status} />
            {project.status === 'failed' ? (
              <Button
                variant="secondary"
                size="sm"
                onPress={handleRetry}
                loading={generateMutation.isPending}
                leftIcon={<RefreshCw size={13} color="#B0BEC5" />}
              >
                Retry
              </Button>
            ) : null}
          </View>
        </View>

        {project.topic ? (
          <Text className="text-[13px] text-ink-muted mb-4">{project.topic}</Text>
        ) : null}

        <View className={`gap-4 ${isWide ? 'flex-row' : ''}`}>
          <View className={isWide ? 'flex-[3]' : ''}>
            <Card>
              <Card.Body>
                <VideoPreview project={project} />
              </Card.Body>
            </Card>

            {project.assets.some((a) => a.type === 'image') ? (
              <Card className="mt-4">
                <Card.Body>
                  <ScenesStrip assets={project.assets} script={script} />
                </Card.Body>
              </Card>
            ) : null}

            {research ? (
              <Card className="mt-4">
                <Card.Header>
                  <Text className="text-[14px] font-semibold text-ink">Research briefing</Text>
                </Card.Header>
                <Card.Body className="gap-2.5">
                  <Text className="text-[13px] text-ink-secondary leading-relaxed">
                    {research.summary}
                  </Text>
                  {research.citations.length > 0 ? (
                    <View className="mt-1.5 gap-1">
                      <Text className="text-[11px] font-bold text-ink-muted uppercase tracking-wide">Sources</Text>
                      {research.citations.map((url, i) => (
                        <Pressable
                          key={i}
                          onPress={() => {
                            if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener');
                          }}
                        >
                          <Text className="text-[11px] text-state-info" numberOfLines={1}>
                            [{i + 1}] {url}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                </Card.Body>
              </Card>
            ) : null}

            {script ? (
              <Card className="mt-4">
                <Card.Header>
                  <Text className="text-[14px] font-semibold text-ink">Script</Text>
                </Card.Header>
                <Card.Body className="gap-2.5">
                  <ScriptBlock label="Hook" text={script.hook} />
                  {script.scenes.map((s, i) => (
                    <ScriptBlock key={i} label={`Scene ${i + 1}`} text={s.narration} />
                  ))}
                  <ScriptBlock label="Call to action" text={script.cta} />
                </Card.Body>
              </Card>
            ) : null}
          </View>

          <View className={isWide ? 'flex-[2]' : ''}>
            <Card>
              <Card.Header>
                <Text className="text-[14px] font-semibold text-ink">Pipeline</Text>
              </Card.Header>
              <Card.Body>
                <PipelineTimeline
                  jobs={project.jobs}
                  currentStep={project.current_step}
                  status={project.status}
                />
              </Card.Body>
            </Card>

            {project.status === 'failed' && project.error ? (
              <Card className="mt-4">
                <Card.Header>
                  <Text className="text-[14px] font-semibold text-state-error">Error</Text>
                </Card.Header>
                <Card.Body>
                  <Text className="text-[12px] text-ink-secondary">{project.error}</Text>
                </Card.Body>
              </Card>
            ) : null}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function ScriptBlock({ label, text }: { label: string; text: string }) {
  return (
    <View className="rounded-lg bg-surface-raised p-3 border border-surface-border">
      <Text className="text-[10px] font-bold text-ink-muted mb-1 uppercase tracking-wide">{label}</Text>
      <Text className="text-[13px] text-ink-secondary leading-relaxed">{text}</Text>
    </View>
  );
}
