import { Slot, Redirect, usePathname, useRouter } from 'expo-router';
import { View, Text, Pressable, ActivityIndicator, ScrollView, useWindowDimensions } from 'react-native';
import { Shield, KeyRound, Users, FileText, Newspaper, Bell, ChevronRight } from 'lucide-react-native';
import { useIsAdmin } from '../../../lib/admin';
import { useAuth } from '../../../lib/auth';

const FONT = {
  sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif',
  serif: 'Newsreader, Georgia, "Times New Roman", serif',
  mono: '"JetBrains Mono", "SF Mono", Menlo, monospace',
};

const TABS = [
  { href: '/admin',                label: 'Overview',      Icon: Shield },
  { href: '/admin/secrets',        label: 'Secrets',       Icon: KeyRound },
  { href: '/admin/users',          label: 'Users',         Icon: Users },
  { href: '/admin/notifications',  label: 'Notifications', Icon: Bell },
  { href: '/admin/blog',           label: 'Blog',          Icon: Newspaper },
  { href: '/admin/audit',          label: 'Audit log',     Icon: FileText },
];

export default function AdminLayout() {
  const isAdmin = useIsAdmin();
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  if (isAdmin === null) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: '#FAFAF7' }}>
        <ActivityIndicator color="#E11D2C" />
      </View>
    );
  }

  if (isAdmin === false) {
    return <Redirect href="/dashboard" />;
  }

  return (
    <View className="flex-1" style={{ backgroundColor: '#FAFAF7' }}>
      {/* Admin chrome — editorial header */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(10,10,11,0.06)',
        }}
      >
        <View
          style={{
            paddingHorizontal: isMobile ? 16 : 32,
            paddingTop: 16,
            paddingBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              backgroundColor: '#0A0A0B',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Shield size={14} color="#FFFFFF" strokeWidth={2.4} />
          </View>
          <View style={{ flex: 1, minWidth: 200 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 10,
                  fontWeight: '700',
                  color: '#71717A',
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                }}
              >
                SnapViral
              </Text>
              <ChevronRight size={11} color="#A1A1AA" />
              <Text
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 10,
                  fontWeight: '700',
                  color: '#E11D2C',
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                }}
              >
                Admin Console
              </Text>
            </View>
            <Text
              style={{
                fontFamily: FONT.sans,
                fontSize: 14,
                color: '#0A0A0B',
                fontWeight: '600',
                marginTop: 2,
              }}
            >
              {user?.email ?? 'admin'}
            </Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 10,
              height: 24,
              borderRadius: 999,
              backgroundColor: '#FEE2E2',
            }}
          >
            <View
              style={{
                width: 5,
                height: 5,
                borderRadius: 2.5,
                backgroundColor: '#E11D2C',
              }}
            />
            <Text
              style={{
                fontFamily: FONT.mono,
                fontSize: 9,
                fontWeight: '700',
                color: '#9F1239',
                letterSpacing: 1.2,
              }}
            >
              RESTRICTED
            </Text>
          </View>
        </View>

        {/* Tab nav — refined */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: isMobile ? 8 : 24 }}
        >
          {TABS.map((tab) => {
            const active =
              pathname === tab.href || (tab.href !== '/admin' && pathname.startsWith(tab.href));
            const Icon = tab.Icon;
            return (
              <Pressable
                key={tab.href}
                onPress={() => router.push(tab.href as any)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 7,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderBottomWidth: 2,
                  borderBottomColor: active ? '#E11D2C' : 'transparent',
                }}
              >
                <Icon size={13} color={active ? '#E11D2C' : '#71717A'} strokeWidth={active ? 2.2 : 1.8} />
                <Text
                  style={{
                    fontFamily: FONT.sans,
                    fontSize: 13,
                    fontWeight: active ? '700' : '500',
                    color: active ? '#0A0A0B' : '#52525B',
                    letterSpacing: -0.2,
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View className="flex-1">
        <Slot />
      </View>
    </View>
  );
}
