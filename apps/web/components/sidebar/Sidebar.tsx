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
  Shield,
  Youtube,
  CreditCard,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import { useAuth } from '../../lib/auth';
import { useIsAdmin } from '../../lib/admin';
import { SnapViralLogo } from '../icons/SnapViralLogo';
import { useSidebarCollapsed } from '../../lib/sidebar';

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
  const isAdmin = useIsAdmin();

  if (width < 768) return null;

  const navItems: NavItem[] = isAdmin
    ? [...NAV.slice(0, NAV.length - 1), { href: '/admin', label: 'Admin', Icon: Shield }, NAV[NAV.length - 1]!]
    : NAV;

  const name =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split('@')[0] ??
    'Account';
  const email = user?.email ?? '';

  return (
    <View
      className="h-screen bg-nav"
      style={{ width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH }}
    >
      {/* Logo / wordmark */}
      <View
        className="flex-row items-center px-4 pt-5 pb-6"
        style={{ gap: collapsed ? 0 : 10 }}
      >
        <SnapViralLogo size={collapsed ? 32 : 30} />
        {!collapsed ? (
          <View className="flex-row items-baseline">
            <Text
              className="font-extrabold text-white"
              style={{ fontSize: 16, letterSpacing: -0.5, lineHeight: 18 }}
            >
              Snap
            </Text>
            <Text
              className="font-extrabold"
              style={{ fontSize: 16, letterSpacing: -0.5, lineHeight: 18, color: '#FF4D4F', fontStyle: 'italic' }}
            >
              Viral
            </Text>
          </View>
        ) : null}
      </View>

      {/* Nav items */}
      <View className="flex-1 px-2 gap-0.5">
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
              className={`flex-row items-center rounded-lg ${
                collapsed ? 'justify-center px-0 py-2.5' : 'gap-2.5 px-3 py-2.5'
              } ${active ? 'bg-nav-surface' : ''} ${item.disabled ? 'opacity-30' : ''}`}
              style={collapsed ? { height: 40 } : undefined}
            >
              <Icon
                size={collapsed ? 18 : 16}
                color={active ? '#E53935' : '#78909C'}
                strokeWidth={active ? 2 : 1.5}
              />
              {!collapsed ? (
                <Text
                  className={`text-[13px] ${
                    active ? 'text-white font-semibold' : 'text-nav-muted'
                  }`}
                >
                  {item.label}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {/* Collapse toggle */}
      <View className="px-2 mb-1">
        <Pressable
          onPress={toggle}
          className="flex-row items-center rounded-lg hover:bg-nav-surface py-2.5"
          style={collapsed ? { justifyContent: 'center' } : { paddingHorizontal: 12, gap: 10 }}
        >
          {collapsed ? (
            <ChevronsRight size={16} color="#546E7A" />
          ) : (
            <>
              <ChevronsLeft size={16} color="#546E7A" />
              <Text className="text-[12px] text-ink-subtle">Collapse</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Divider */}
      <View className="border-t border-nav-border mx-2.5" />

      {/* User */}
      <View className="px-2 py-3">
        <View
          className="flex-row items-center"
          style={
            collapsed
              ? { justifyContent: 'center' }
              : { gap: 10, paddingHorizontal: 10 }
          }
        >
          <View className="h-8 w-8 items-center justify-center rounded-full bg-brand">
            <Text className="text-[12px] font-bold text-white">
              {name.charAt(0).toUpperCase()}
            </Text>
          </View>
          {!collapsed ? (
            <>
              <View className="flex-1 min-w-0">
                <Text className="text-[12px] font-semibold text-white" numberOfLines={1}>
                  {name}
                </Text>
                <Text className="text-[11px] text-nav-muted" numberOfLines={1}>
                  {email}
                </Text>
              </View>
              <Pressable onPress={() => signOut()} className="p-1.5 rounded-lg hover:bg-nav-surface">
                <LogOut size={14} color="#78909C" />
              </Pressable>
            </>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export function BottomTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const { width } = useWindowDimensions();
  if (width >= 768) return null;

  const items = NAV.filter((n) => !n.disabled);
  return (
    <View
      className="flex-row items-center justify-around border-t border-surface-border bg-surface-sunken"
      style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, paddingBottom: 4 }}
    >
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== '/dashboard' && pathname.startsWith(item.href));
        const Icon = item.Icon;
        return (
          <Pressable
            key={item.href}
            onPress={() => router.push(item.href as any)}
            className="items-center justify-center py-2 px-2"
            style={{ minWidth: 56 }}
          >
            <Icon size={20} color={active ? '#E53935' : '#78909C'} strokeWidth={active ? 2 : 1.5} />
            <Text
              className={`text-[10px] mt-1 ${active ? 'text-brand font-semibold' : 'text-ink-muted'}`}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
