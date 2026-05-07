import { Slot, Redirect, usePathname, useRouter } from 'expo-router';
import { View, Text, Pressable, ActivityIndicator, ScrollView, useWindowDimensions } from 'react-native';
import { Shield, KeyRound, Users, FileText, Newspaper } from 'lucide-react-native';
import { useIsAdmin } from '../../../lib/admin';

const TABS = [
  { href: '/admin', label: 'Overview', Icon: Shield },
  { href: '/admin/secrets', label: 'Secrets', Icon: KeyRound },
  { href: '/admin/users', label: 'Users', Icon: Users },
  { href: '/admin/blog', label: 'Blog', Icon: Newspaper },
  { href: '/admin/audit', label: 'Audit log', Icon: FileText },
];

export default function AdminLayout() {
  const isAdmin = useIsAdmin();
  const pathname = usePathname();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  if (isAdmin === null) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="#E53935" />
      </View>
    );
  }

  if (isAdmin === false) {
    return <Redirect href="/dashboard" />;
  }

  return (
    <View className="flex-1">
      {/* Admin top bar */}
      <View
        className="flex-row items-center gap-3 border-b border-surface-border bg-surface-sunken"
        style={{ paddingHorizontal: isMobile ? 16 : 32, paddingVertical: 12 }}
      >
        <View
          className="items-center justify-center rounded-md"
          style={{ width: 24, height: 24, backgroundColor: 'rgba(229,57,53,0.15)' }}
        >
          <Shield size={12} color="#E53935" />
        </View>
        <Text className="text-[13px] font-semibold text-ink">Admin</Text>
        <View className="rounded-full bg-brand-soft px-2 py-0.5 border border-brand/20">
          <Text className="text-[10px] font-bold text-brand uppercase tracking-widest">
            Restricted
          </Text>
        </View>
      </View>

      {/* Tab nav */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="border-b border-surface-border bg-surface-sunken"
        contentContainerStyle={{ paddingHorizontal: isMobile ? 8 : 24 }}
      >
        {TABS.map((tab) => {
          const active =
            pathname === tab.href ||
            (tab.href !== '/admin' && pathname.startsWith(tab.href));
          const Icon = tab.Icon;
          return (
            <Pressable
              key={tab.href}
              onPress={() => router.push(tab.href as any)}
              className="flex-row items-center gap-2 px-3 py-3"
              style={
                active
                  ? { borderBottomWidth: 2, borderBottomColor: '#E53935' }
                  : { borderBottomWidth: 2, borderBottomColor: 'transparent' }
              }
            >
              <Icon size={13} color={active ? '#E53935' : '#78909C'} />
              <Text
                className={`text-[12px] ${
                  active ? 'text-brand font-semibold' : 'text-ink-muted'
                }`}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View className="flex-1">
        <Slot />
      </View>
    </View>
  );
}
