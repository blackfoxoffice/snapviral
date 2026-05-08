import { View, Text, ScrollView, useWindowDimensions } from 'react-native';
import {
  Users as UsersIcon,
  FileVideo,
  CheckCircle2,
  Youtube,
  Calendar,
  AlertTriangle,
  Activity,
  Clock,
  TrendingUp,
} from 'lucide-react-native';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useAdminOverview } from '../../../lib/queries';

const FONT = {
  sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif',
  serif: 'Newsreader, Georgia, "Times New Roman", serif',
  mono: '"JetBrains Mono", "SF Mono", Menlo, monospace',
};

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
    <ScrollView className="flex-1" style={{ backgroundColor: '#FAFAF7' }}>
      <View
        className="mx-auto w-full"
        style={{
          maxWidth: 1200,
          paddingHorizontal: isMobile ? 16 : 32,
          paddingTop: 28,
          paddingBottom: 80,
        }}
      >
        {/* Editorial header */}
        <View style={{ marginBottom: 32 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#16A34A' }} />
            <Text
              style={{
                fontFamily: FONT.mono,
                fontSize: 11,
                fontWeight: '700',
                color: '#16A34A',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
              }}
            >
              Live · refreshing every 30s
            </Text>
          </View>
          <Text
            style={{
              fontFamily: FONT.sans,
              fontSize: isMobile ? 26 : 34,
              fontWeight: '700',
              color: '#0A0A0B',
              letterSpacing: -1.2,
              marginBottom: 6,
            }}
          >
            System overview
          </Text>
          <Text
            style={{
              fontFamily: FONT.sans,
              fontSize: 14,
              color: '#52525B',
              maxWidth: 640,
              lineHeight: 22,
            }}
          >
            A live snapshot of every signal that matters: who's signing up, what's queued in the
            pipeline, what shipped, and what's on fire.
          </Text>
        </View>

        {isLoading ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <View key={i} style={{ flexBasis: isMobile ? '47%' : '23%', flexGrow: 1, minWidth: 160 }}>
                <Skeleton className="h-[120px] rounded-xl" />
              </View>
            ))}
          </View>
        ) : data ? (
          <>
            {/* Hero metrics */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
              <Tile
                Icon={UsersIcon}
                label="Users"
                value={data.user_count}
                accent="#0F172A"
                isMobile={isMobile}
                wide
              />
              <Tile
                Icon={FileVideo}
                label="Projects"
                value={data.project_count}
                accent="#52525B"
                isMobile={isMobile}
                wide
              />
              <Tile
                Icon={Activity}
                label="Active jobs"
                value={data.active_jobs}
                accent="#E11D2C"
                isMobile={isMobile}
                wide
                pulse
              />
              <Tile
                Icon={Clock}
                label="Total content"
                value={formatDuration(data.total_storage_seconds)}
                accent="#7C3AED"
                isMobile={isMobile}
                wide
              />
            </View>

            {/* Pipeline health row */}
            <Text
              style={{
                fontFamily: FONT.mono,
                fontSize: 11,
                fontWeight: '700',
                color: '#71717A',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                marginBottom: 12,
              }}
            >
              Pipeline health
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <Tile
                Icon={CheckCircle2}
                label="Ready"
                value={data.ready_videos}
                accent="#16A34A"
                isMobile={isMobile}
              />
              <Tile
                Icon={Youtube}
                label="Published"
                value={data.published_videos}
                accent="#E11D2C"
                isMobile={isMobile}
              />
              <Tile
                Icon={Calendar}
                label="Scheduled"
                value={data.scheduled_videos}
                accent="#F59E0B"
                isMobile={isMobile}
              />
              <Tile
                Icon={AlertTriangle}
                label="Failed"
                value={data.failed_videos}
                accent="#DC2626"
                isMobile={isMobile}
              />
            </View>
          </>
        ) : (
          <View
            style={{
              padding: 60,
              alignItems: 'center',
              backgroundColor: '#FFFFFF',
              borderRadius: 14,
              borderWidth: 1,
              borderColor: 'rgba(10,10,11,0.08)',
              borderStyle: 'dashed',
            }}
          >
            <Text style={{ fontFamily: FONT.sans, fontSize: 14, color: '#71717A' }}>
              No data available.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function Tile({
  Icon,
  label,
  value,
  accent,
  isMobile,
  wide,
  pulse,
}: {
  Icon: any;
  label: string;
  value: string | number;
  accent: string;
  isMobile: boolean;
  wide?: boolean;
  pulse?: boolean;
}) {
  return (
    <View
      style={{
        flexBasis: isMobile ? '47%' : wide ? '23%' : '23%',
        flexGrow: 1,
        minWidth: isMobile ? 140 : 200,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(10,10,11,0.08)',
        padding: 18,
        ...({ boxShadow: '0 1px 0 rgba(10,10,11,0.04)' } as any),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            backgroundColor: `${accent}14`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={14} color={accent} strokeWidth={2.2} />
        </View>
        {pulse ? (
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: accent,
            }}
          />
        ) : null}
      </View>
      <Text
        style={{
          fontFamily: FONT.sans,
          fontSize: 28,
          fontWeight: '700',
          color: '#0A0A0B',
          letterSpacing: -0.8,
          fontVariant: ['tabular-nums'] as any,
          marginBottom: 4,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontFamily: FONT.mono,
          fontSize: 10,
          fontWeight: '700',
          color: '#71717A',
          letterSpacing: 1.2,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
    </View>
  );
}
