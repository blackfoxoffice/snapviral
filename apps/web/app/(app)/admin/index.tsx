import { View, Text, ScrollView, useWindowDimensions } from 'react-native';
import {
  Users as UsersIcon,
  FileVideo,
  CheckCircle,
  Youtube,
  Calendar,
  AlertTriangle,
  Loader,
  Clock,
} from 'lucide-react-native';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useAdminOverview } from '../../../lib/queries';

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export default function AdminOverview() {
  const { data, isLoading } = useAdminOverview();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <ScrollView className="flex-1">
      <View
        className="mx-auto w-full max-w-[1100px]"
        style={{ paddingHorizontal: isMobile ? 16 : 32, paddingTop: 24, paddingBottom: 80 }}
      >
        <Text className="text-[24px] font-bold text-ink mb-1" style={{ letterSpacing: -0.5 }}>
          System overview
        </Text>
        <Text className="text-[13px] text-ink-muted mb-6">
          Live snapshot of users, projects, and pipeline health.
        </Text>

        {isLoading ? (
          <View className="flex-row flex-wrap gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <View key={i} style={{ flexBasis: '47%', flexGrow: 1, minWidth: 160 }}>
                <Skeleton className="h-[88px] rounded-xl" />
              </View>
            ))}
          </View>
        ) : data ? (
          <View className="flex-row flex-wrap gap-3">
            <Tile icon={<UsersIcon size={14} color="#42A5F5" />} label="Users" value={data.user_count} accent="#42A5F5" />
            <Tile icon={<FileVideo size={14} color="#78909C" />} label="Projects" value={data.project_count} accent="#78909C" />
            <Tile icon={<CheckCircle size={14} color="#00E676" />} label="Ready" value={data.ready_videos} accent="#00E676" />
            <Tile icon={<Youtube size={14} color="#E53935" />} label="Published" value={data.published_videos} accent="#E53935" />
            <Tile icon={<Calendar size={14} color="#FFB300" />} label="Scheduled" value={data.scheduled_videos} accent="#FFB300" />
            <Tile icon={<AlertTriangle size={14} color="#EF5350" />} label="Failed" value={data.failed_videos} accent="#EF5350" />
            <Tile icon={<Loader size={14} color="#42A5F5" />} label="Active jobs" value={data.active_jobs} accent="#42A5F5" />
            <Tile icon={<Clock size={14} color="#78909C" />} label="Total content" value={formatDuration(data.total_storage_seconds)} accent="#78909C" />
          </View>
        ) : (
          <Text className="text-[13px] text-ink-muted">No data available.</Text>
        )}
      </View>
    </ScrollView>
  );
}

function Tile({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <View
      className="rounded-xl border bg-surface-card p-4"
      style={{ flexBasis: '47%', flexGrow: 1, minWidth: 160, borderColor: '#222' }}
    >
      <View className="flex-row items-center gap-2 mb-2">
        {icon}
        <Text className="text-[10px] font-bold uppercase tracking-widest text-ink-subtle">
          {label}
        </Text>
      </View>
      <Text
        className="text-[24px] font-bold text-ink"
        style={{ fontVariant: ['tabular-nums'], letterSpacing: -0.5 }}
      >
        {value}
      </Text>
      <View className="mt-2 h-[3px] rounded-full bg-surface-raised overflow-hidden">
        <View style={{ width: '100%', height: 3, backgroundColor: accent, opacity: 0.4 }} />
      </View>
    </View>
  );
}
