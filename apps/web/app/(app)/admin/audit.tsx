import { View, Text, ScrollView, useWindowDimensions } from 'react-native';
import { Plus, RefreshCw, Eye, Trash2 } from 'lucide-react-native';
import { Card } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useAdminAuditLog } from '../../../lib/queries';
import type { SecretAccessLogEntry } from '@newsflow/shared';

const ACTION_META: Record<SecretAccessLogEntry['action'], { label: string; color: string; Icon: typeof Plus }> = {
  create: { label: 'Created', color: '#00E676', Icon: Plus },
  rotate: { label: 'Rotated', color: '#FFB300', Icon: RefreshCw },
  read: { label: 'Read', color: '#42A5F5', Icon: Eye },
  delete: { label: 'Deleted', color: '#EF5350', Icon: Trash2 },
};

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function AdminAuditLog() {
  const { data: log, isLoading } = useAdminAuditLog(100);
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <ScrollView className="flex-1">
      <View
        className="mx-auto w-full max-w-[1100px]"
        style={{ paddingHorizontal: isMobile ? 16 : 32, paddingTop: 24, paddingBottom: 80 }}
      >
        <Text className="text-[24px] font-bold text-ink mb-1" style={{ letterSpacing: -0.5 }}>
          Audit log
        </Text>
        <Text className="text-[13px] text-ink-muted mb-6">
          Every secret access — create, rotate, read by the API, delete — is recorded here.
        </Text>

        <Card variant="flat">
          {isLoading ? (
            <View className="p-4 gap-3">
              <Skeleton className="h-10 rounded-md" />
              <Skeleton className="h-10 rounded-md" />
              <Skeleton className="h-10 rounded-md" />
            </View>
          ) : !log || log.length === 0 ? (
            <View className="p-8 items-center">
              <Text className="text-[13px] text-ink-muted">No activity yet.</Text>
            </View>
          ) : (
            <View>
              {log.map((entry, i) => {
                const meta = ACTION_META[entry.action];
                const Icon = meta.Icon;
                return (
                  <View
                    key={entry.id}
                    className="flex-row items-center px-5 py-3"
                    style={i < log.length - 1 ? { borderBottomWidth: 1, borderBottomColor: '#2A2A2A' } : {}}
                  >
                    <View
                      className="items-center justify-center rounded-md mr-3"
                      style={{
                        width: 28,
                        height: 28,
                        backgroundColor: `${meta.color}15`,
                      }}
                    >
                      <Icon size={12} color={meta.color} />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text
                          className="text-[12px] font-bold"
                          style={{ color: meta.color, textTransform: 'uppercase', letterSpacing: 0.5 }}
                        >
                          {meta.label}
                        </Text>
                        <Text className="text-[13px] font-mono text-ink">{entry.key_name}</Text>
                      </View>
                      <Text className="text-[11px] text-ink-muted mt-0.5">
                        by {entry.actor_role ?? 'unknown'}
                        {entry.actor_id ? ` · ${entry.actor_id.slice(0, 8)}` : ''}
                      </Text>
                    </View>
                    <Text className="text-[11px] text-ink-subtle" style={{ fontVariant: ['tabular-nums'] }}>
                      {fmtTime(entry.created_at)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </Card>
      </View>
    </ScrollView>
  );
}
