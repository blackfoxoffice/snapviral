import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import {
  LayoutGrid,
  Plus,
  Library,
  Mic,
  ImagePlus,
  TrendingUp,
  Settings,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  Youtube,
  CreditCard,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import { useAuth } from '../../lib/auth';
import { SnapViralLogo } from '../icons/SnapViralLogo';
import { useSidebarCollapsed } from '../../lib/sidebar';
import { useTheme } from '../../lib/theme';

interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
  disabled?: boolean;
}

const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', Icon: LayoutGrid },
  { href: '/projects/new', label: 'New Project', Icon: Plus },
  { href: '/library', label: 'Library', Icon: Library },
  { href: '/automation', label: 'Auto-publish', Icon: Zap },
  { href: '/youtube', label: 'YouTube', Icon: Youtube },
  { href: '/voiceover', label: 'Voiceover Lab', Icon: Mic, disabled: true },
  { href: '/thumbnails', label: 'Thumbnails', Icon: ImagePlus, disabled: true },
  { href: '/analytics', label: 'Analytics', Icon: TrendingUp, disabled: true },
  { href: '/billing', label: 'Billing', Icon: CreditCard },
  { href: '/settings', label: 'Settings', Icon: Settings },
];

const SIDEBAR_WIDTH = 240;
const SIDEBAR_COLLAPSED_WIDTH = 64;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { width } = useWindowDimensions();
  const { collapsed, toggle } = useSidebarCollapsed();
  const { sidebar } = useTheme();

  if (width < 768) return null;

  const navItems: NavItem[] = NAV;

  const name =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split('@')[0] ??
    'Account';
  const email = user?.email ?? '';

  return (
    <View
      style={{
        height: '100%',
        width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
        backgroundColor: sidebar.bg,
        borderRightWidth: sidebar.isDark ? 0 : 1,
        borderRightColor: sidebar.border,
      }}
    >
      {/* Logo / wordmark */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: 20,
          paddingBottom: 24,
          gap: collapsed ? 0 : 10,
        }}
      >
        <SnapViralLogo size={collapsed ? 32 : 30} />
        {!collapsed ? (
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '800',
                color: sidebar.textActive,
                letterSpacing: -0.5,
                lineHeight: 18,
              }}
            >
              Snap
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '800',
                color: sidebar.brand,
                letterSpacing: -0.5,
                lineHeight: 18,
                fontStyle: 'italic',
              }}
            >
              Viral
            </Text>
          </View>
        ) : null}
      </View>

      {/* Nav items */}
      <View style={{ flex: 1, paddingHorizontal: 8, gap: 2 }}>
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.Icon;
          return (
            <Pressable
              key={item.href}
              disabled={item.disabled}
              onPress={() => !item.disabled && router.push(item.href as any)}
              style={{
                position: 'relative',
                flexDirection: 'row',
                alignItems: 'center',
                gap: collapsed ? 0 : 10,
                paddingHorizontal: collapsed ? 0 : 12,
                paddingVertical: 10,
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 8,
                backgroundColor: active ? sidebar.activeBg : 'transparent',
                opacity: item.disabled ? 0.3 : 1,
                height: collapsed ? 40 : undefined,
                ...({ transition: 'background 180ms ease' } as any),
              }}
            >
              {active ? (
                <View
                  style={{
                    position: 'absolute',
                    left: collapsed ? 4 : 0,
                    top: 8,
                    bottom: 8,
                    width: 3,
                    borderRadius: 2,
                    backgroundColor: sidebar.activeBar,
                  }}
                />
              ) : null}
              <Icon
                size={collapsed ? 18 : 16}
                color={active ? sidebar.activeBar : sidebar.textInactive}
                strokeWidth={active ? 2 : 1.6}
              />
              {!collapsed ? (
                <Text
                  style={{
                    fontSize: 13,
                    color: active ? sidebar.textActive : sidebar.textInactive,
                    fontWeight: active ? '600' : '500',
                  }}
                >
                  {item.label}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {/* Collapse toggle */}
      <View style={{ paddingHorizontal: 8, marginBottom: 4 }}>
        <Pressable
          onPress={toggle}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 10,
            paddingHorizontal: collapsed ? 0 : 12,
            gap: 10,
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: 8,
          }}
        >
          {collapsed ? (
            <ChevronsRight size={16} color={sidebar.textMuted} />
          ) : (
            <>
              <ChevronsLeft size={16} color={sidebar.textMuted} />
              <Text style={{ fontSize: 12, color: sidebar.textMuted }}>Collapse</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: sidebar.border, marginHorizontal: 10 }} />

      {/* User */}
      <View style={{ paddingHorizontal: 8, paddingVertical: 12 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: collapsed ? 0 : 10,
            paddingHorizontal: collapsed ? 0 : 10,
          }}
        >
          <View
            style={{
              height: 32,
              width: 32,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 999,
              backgroundColor: sidebar.brand,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>
              {name.charAt(0).toUpperCase()}
            </Text>
          </View>
          {!collapsed ? (
            <>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={{ fontSize: 12, fontWeight: '600', color: sidebar.textActive }}
                  numberOfLines={1}
                >
                  {name}
                </Text>
                <Text
                  style={{ fontSize: 11, color: sidebar.textMuted }}
                  numberOfLines={1}
                >
                  {email}
                </Text>
              </View>
              <Pressable
                onPress={() => signOut()}
                style={{ padding: 6, borderRadius: 8 }}
              >
                <LogOut size={14} color={sidebar.textMuted} />
              </Pressable>
            </>
          ) : null}
        </View>
      </View>
    </View>
  );
}

// Compact bottom-tab bar for mobile. Only the 5 items that matter most.
const MOBILE_TABS: NavItem[] = [
  { href: '/dashboard', label: 'Home', Icon: LayoutGrid },
  { href: '/library', label: 'Library', Icon: Library },
  { href: '/projects/new', label: 'New', Icon: Plus },
  { href: '/automation', label: 'Auto', Icon: Zap },
  { href: '/settings', label: 'Settings', Icon: Settings },
];

export function BottomTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { sidebar } = useTheme();
  if (width >= 768) return null;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'stretch',
        borderTopWidth: 1,
        borderTopColor: sidebar.border,
        backgroundColor: sidebar.bg,
        position: 'sticky' as any,
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        paddingBottom: 'env(safe-area-inset-bottom)' as any,
      }}
    >
      {MOBILE_TABS.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== '/dashboard' && pathname.startsWith(item.href));
        const Icon = item.Icon;
        const accentNew = item.href === '/projects/new';
        return (
          <Pressable
            key={item.href}
            onPress={() => router.push(item.href as any)}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 8,
              minHeight: 56,
            }}
          >
            {accentNew ? (
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: sidebar.brand,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 2,
                }}
              >
                <Icon size={18} color="#FFFFFF" strokeWidth={2.4} />
              </View>
            ) : (
              <Icon
                size={20}
                color={active ? sidebar.activeBar : sidebar.textInactive}
                strokeWidth={active ? 2 : 1.6}
              />
            )}
            <Text
              style={{
                fontSize: 10,
                marginTop: 2,
                color: active
                  ? sidebar.activeBar
                  : accentNew
                    ? sidebar.textActive
                    : sidebar.textMuted,
                fontWeight: active ? '600' : '500',
              }}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
