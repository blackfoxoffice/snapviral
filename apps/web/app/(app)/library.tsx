import { View, Text, ScrollView, useWindowDimensions } from 'react-native';
import { FolderClosed } from 'lucide-react-native';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { ProjectsTable } from '../../components/project/ProjectsTable';
import { useProjects } from '../../lib/queries';

export default function Library() {
  const { data: projects, isLoading } = useProjects();
  const readyProjects = (projects ?? []).filter((p) => p.status === 'ready');
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <ScrollView className="flex-1">
      <View
        className="mx-auto w-full max-w-[1200px] pb-24"
        style={{ paddingHorizontal: isMobile ? 16 : 32, paddingTop: isMobile ? 20 : 32 }}
      >
        <View className="mb-5">
          <Text
            className={`font-bold text-ink ${isMobile ? 'text-[22px]' : 'text-[24px]'}`}
            style={{ letterSpacing: -0.5 }}
          >
            Library
          </Text>
          <Text className="text-[13px] text-ink-muted mt-1">
            Every finished video you've created.
          </Text>
        </View>

        <Card variant="flat">
          {isLoading ? (
            <View className="p-4 gap-3">
              <Skeleton className="h-10 rounded-md" />
              <Skeleton className="h-10 rounded-md" />
              <Skeleton className="h-10 rounded-md" />
            </View>
          ) : readyProjects.length === 0 ? (
            <View className="p-4">
              <EmptyState
                icon={<FolderClosed size={20} color="#78909C" />}
                title="No finished videos yet"
                subtitle="Your completed videos will appear here once a project finishes generating."
              />
            </View>
          ) : (
            <ProjectsTable projects={readyProjects} />
          )}
        </Card>
      </View>
    </ScrollView>
  );
}
