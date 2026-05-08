import { useEffect, useState } from 'react';
import {
  Slot,
  Redirect,
  usePathname,
  useRouter,
} from 'expo-router';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import {
  Shield,
  KeyRound,
  Users,
  FileText,
  Newspaper,
  Bell,
  ChevronRight,
  ArrowLeft,
  LogOut,
} from 'lucide-react-native';
import { useAuth } from '../../lib/auth';
import { useIsAdmin } from '../../lib/admin';

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

// Inject keyframes once for hover transitions on tab underline.
function useChromeStyles() {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById('sv-admin-chrome-styles')) return;
    const el = document.createElement('style');
    el.id = 'sv-admin-chrome-styles';
    el.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Newsreader:ital,wght@0,400;0,500;1,400;1,500&family=JetBrains+Mono:wght@400;500;600&display=swap');
    `;
    document.head.appendChild(el);
  }, []);
}

export default function AdminGroupLayout() {
  useChromeStyles();
  const router = useRouter();
  const pathname = usePathname();
  const { session, loading, signOut, user } = useAuth();
  const isAdmin = useIsAdmin();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // Auth not yet resolved — show neutral splash so we don't flash content.
  if (loading || isAdmin === null) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FAFAF7',
        }}
      >
        <ActivityIndicator color="#E11D2C" />
      </View>
    );
  }

  // Not signed in — kick to admin login.
  if (!session) {
    return <Redirect href={'/admin/login' as any} />;
  }

  // Signed in but not admin — bounce to dashboard.
  if (isAdmin === false) {
    return <Redirect href="/dashboard" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAF7', ...({ fontFamily: FONT.sans } as any) }}>
      {/* ============================================================ */}
      {/* Editorial header                                              */}
      {/* ============================================================ */}
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
              numberOfLines={1}
            >
              {user?.email ?? 'admin'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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

            <BackToApp onPress={() => router.push('/dashboard' as any)} />
            <SignOutPill
              onPress={async () => {
                await signOut();
                router.replace('/admin/login' as any);
              }}
            />
          </View>
        </View>

        {/* Tab nav — bottom-border accent */}
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
                <Icon
                  size={13}
                  color={active ? '#E11D2C' : '#71717A'}
                  strokeWidth={active ? 2.2 : 1.8}
                />
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

      <View style={{ flex: 1 }}>
        <Slot />
      </View>
    </View>
  );
}

function BackToApp({ onPress }: { onPress: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        height: 28,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(10,10,11,0.10)',
        backgroundColor: hover ? '#F4F4F5' : '#FFFFFF',
        ...({ transition: 'background 200ms ease' } as any),
      }}
    >
      <ArrowLeft size={11} color="#52525B" />
      <Text
        style={{
          fontFamily: FONT.sans,
          fontSize: 11,
          fontWeight: '600',
          color: '#27272A',
        }}
      >
        Back to app
      </Text>
    </Pressable>
  );
}

function SignOutPill({ onPress }: { onPress: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={{
        width: 28,
        height: 28,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(10,10,11,0.10)',
        backgroundColor: hover ? '#FEF2F2' : '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        ...({ transition: 'background 200ms ease' } as any),
      }}
    >
      <LogOut size={11} color={hover ? '#E11D2C' : '#52525B'} />
    </Pressable>
  );
}
