import { View, Text, ScrollView, useWindowDimensions } from 'react-native';
import { Shield } from 'lucide-react-native';
import { Card } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useAdminUsers } from '../../../lib/queries';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AdminUsers() {
  const { data: users, isLoading } = useAdminUsers();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <ScrollView className="flex-1">
      <View
        className="mx-auto w-full max-w-[1100px]"
        style={{ paddingHorizontal: isMobile ? 16 : 32, paddingTop: 24, paddingBottom: 80 }}
      >
        <Text className="text-[24px] font-bold text-ink mb-1" style={{ letterSpacing: -0.5 }}>
          Users
        </Text>
        <Text className="text-[13px] text-ink-muted mb-6">
          Everyone with an account on this Newsflow Studio instance.
        </Text>

        <Card variant="flat">
          {isLoading ? (
            <View className="p-4 gap-3">
              <Skeleton className="h-10 rounded-md" />
              <Skeleton className="h-10 rounded-md" />
              <Skeleton className="h-10 rounded-md" />
            </View>
          ) : !users || users.length === 0 ? (
            <View className="p-8 items-center">
              <Text className="text-[13px] text-ink-muted">No users found.</Text>
            </View>
          ) : (
            <View>
              <View className="flex-row items-center px-5 py-2.5 border-b border-surface-border bg-surface-raised">
                <Text className="flex-[3] text-[10px] font-bold uppercase tracking-widest text-ink-subtle">
                  Email
                </Text>
                <Text className="flex-[2] text-[10px] font-bold uppercase tracking-widest text-ink-subtle">
                  Name
                </Text>
                <Text className="w-[80px] text-[10px] font-bold uppercase tracking-widest text-ink-subtle">
                  Role
                </Text>
                <Text className="w-[100px] text-[10px] font-bold uppercase tracking-widest text-ink-subtle">
                  Joined
                </Text>
              </View>
              {users.map((u, i) => (
                <View
                  key={u.id}
                  className="flex-row items-center px-5 py-3"
                  style={i < users.length - 1 ? { borderBottomWidth: 1, borderBottomColor: '#E4E4E7' } : {}}
                >
                  <Text className="flex-[3] text-[13px] text-ink" numberOfLines={1}>
                    {u.email}
                  </Text>
                  <Text className="flex-[2] text-[12px] text-ink-secondary" numberOfLines={1}>
                    {u.full_name || '—'}
                  </Text>
                  <View className="w-[80px]">
                    {u.is_admin ? (
                      <View className="flex-row items-center gap-1 self-start rounded-md bg-brand-soft border border-brand/25 px-2 py-0.5">
                        <Shield size={10} color="#E53935" />
                        <Text className="text-[10px] font-bold text-brand uppercase">Admin</Text>
                      </View>
                    ) : (
                      <Text className="text-[11px] text-ink-muted">User</Text>
                    )}
                  </View>
                  <Text className="w-[100px] text-[11px] text-ink-muted">{timeAgo(u.created_at)}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>
      </View>
    </ScrollView>
  );
}
