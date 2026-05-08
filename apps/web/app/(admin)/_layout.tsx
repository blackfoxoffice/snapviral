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
  TextInput,
  useWindowDimensions,
} from 'react-native';
import {
  LayoutGrid,
  KeyRound,
  Users,
  FileText,
  Newspaper,
  Bell,
  ArrowLeft,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Search,
  Menu,
  X,
  ExternalLink,
  Shield,
  CreditCard,
} from 'lucide-react-native';
import { useAuth } from '../../lib/auth';
import { useIsAdmin } from '../../lib/admin';
import { SnapViralLogo } from '../../components/icons/SnapViralLogo';

// =====================================================================
// Design tokens — calibrated for a modern admin template aesthetic.
// White sidebar, clean cards, brand red as the only chromatic accent.
// =====================================================================
const FONT = {
  sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif',
  serif: 'Newsreader, Georgia, "Times New Roman", serif',
  mono: '"JetBrains Mono", "SF Mono", Menlo, monospace',
};

const C = {
  bg: '#F6F7F9',
  paper: '#FFFFFF',
  ink: '#0F172A',
  inkSoft: '#1E293B',
  body: '#334155',
  muted: '#64748B',
  subtle: '#94A3B8',
  faint: '#CBD5E1',
  hairline: 'rgba(15,23,42,0.08)',
  hair: 'rgba(15,23,42,0.05)',
  red: '#E11D2C',
  redSoft: '#FEF2F2',
  redText: '#9F1239',
  green: '#16A34A',
  greenSoft: '#F0FDF4',
};

const SIDEBAR_W = 256;
const SIDEBAR_W_COLLAPSED = 72;
const TOPBAR_H = 64;

interface NavItem {
  href: string;
  label: string;
  Icon: any;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV: NavSection[] = [
  {
    label: 'Main',
    items: [{ href: '/admin', label: 'Overview', Icon: LayoutGrid }],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/blog', label: 'Blog', Icon: Newspaper },
      { href: '/admin/notifications', label: 'Notifications', Icon: Bell },
    ],
  },
  {
    label: 'People',
    items: [
      { href: '/admin/users', label: 'Users', Icon: Users },
      { href: '/admin/billing', label: 'Billing', Icon: CreditCard },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/secrets', label: 'Secrets', Icon: KeyRound },
      { href: '/admin/audit', label: 'Audit log', Icon: FileText },
    ],
  },
];

// Lookup: pathname → readable label for breadcrumb
const PATH_LABELS: Record<string, string> = {
  '/admin': 'Overview',
  '/admin/blog': 'Blog',
  '/admin/notifications': 'Notifications',
  '/admin/users': 'Users',
  '/admin/billing': 'Billing',
  '/admin/secrets': 'Secrets',
  '/admin/audit': 'Audit log',
};

function useAdminFonts() {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById('sv-admin-font')) return;
    const el = document.createElement('style');
    el.id = 'sv-admin-font';
    el.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Newsreader:ital,wght@0,400;0,500;1,400;1,500&family=JetBrains+Mono:wght@400;500;600&display=swap');
    `;
    document.head.appendChild(el);
  }, []);
}

export default function AdminGroupLayout() {
  useAdminFonts();
  const router = useRouter();
  const pathname = usePathname();
  const { session, loading, signOut, user } = useAuth();
  const isAdmin = useIsAdmin();
  const { width } = useWindowDimensions();
  const isMobile = width < 1024;

  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Close drawer when route changes (mobile)
  useEffect(() => {
    setDrawerOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  // Close profile dropdown on outside click (web)
  useEffect(() => {
    if (!profileOpen) return;
    if (typeof document === 'undefined') return;
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target?.closest?.('[data-profile-popover]')) setProfileOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [profileOpen]);

  if (loading || isAdmin === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}>
        <ActivityIndicator color={C.red} />
      </View>
    );
  }
  if (!session) return <Redirect href={'/admin/login' as any} />;
  if (isAdmin === false) return <Redirect href="/dashboard" />;

  const sidebarWidth = isMobile ? SIDEBAR_W : collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W;

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: C.bg, ...({ fontFamily: FONT.sans } as any) }}>
      {/* ================================================================ */}
      {/* SIDEBAR — desktop static, mobile drawer                          */}
      {/* ================================================================ */}
      {isMobile ? (
        <>
          {drawerOpen ? (
            <Pressable
              onPress={() => setDrawerOpen(false)}
              style={{
                position: 'fixed' as any,
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(15,23,42,0.5)',
                zIndex: 40,
                ...({ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' } as any),
              }}
            />
          ) : null}
          <View
            style={{
              position: 'fixed' as any,
              top: 0,
              bottom: 0,
              left: 0,
              width: SIDEBAR_W,
              backgroundColor: C.paper,
              borderRightWidth: 1,
              borderRightColor: C.hairline,
              zIndex: 50,
              transform: [{ translateX: drawerOpen ? 0 : -SIDEBAR_W }] as any,
              ...({ transition: 'transform 280ms cubic-bezier(0.2,0.8,0.2,1)' } as any),
            }}
          >
            <SidebarContents
              collapsed={false}
              pathname={pathname}
              onNavigate={(href) => {
                router.push(href as any);
                setDrawerOpen(false);
              }}
              onCloseDrawer={() => setDrawerOpen(false)}
            />
          </View>
        </>
      ) : (
        <View
          style={{
            width: sidebarWidth,
            backgroundColor: C.paper,
            borderRightWidth: 1,
            borderRightColor: C.hairline,
            ...({ transition: 'width 220ms cubic-bezier(0.2,0.8,0.2,1)' } as any),
          }}
        >
          <SidebarContents
            collapsed={collapsed}
            pathname={pathname}
            onNavigate={(href) => router.push(href as any)}
            onToggleCollapse={() => setCollapsed((c) => !c)}
          />
        </View>
      )}

      {/* ================================================================ */}
      {/* MAIN COLUMN: topbar + content                                     */}
      {/* ================================================================ */}
      <View style={{ flex: 1, flexDirection: 'column', minWidth: 0 }}>
        {/* Topbar */}
        <View
          style={{
            height: TOPBAR_H,
            paddingHorizontal: isMobile ? 16 : 24,
            backgroundColor: C.paper,
            borderBottomWidth: 1,
            borderBottomColor: C.hairline,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            zIndex: 30,
          }}
        >
          {/* Mobile menu trigger */}
          {isMobile ? (
            <Pressable
              onPress={() => setDrawerOpen(true)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                borderWidth: 1,
                borderColor: C.hairline,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Menu size={15} color={C.body} />
            </Pressable>
          ) : null}

          {/* Search */}
          <View
            style={{
              flex: 1,
              maxWidth: 480,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: 12,
              height: 36,
              borderRadius: 10,
              backgroundColor: C.bg,
              borderWidth: 1,
              borderColor: 'transparent',
            }}
          >
            <Search size={13} color={C.muted} />
            <TextInput
              placeholder={isMobile ? 'Search' : 'Search posts, users, secrets…'}
              placeholderTextColor={C.subtle}
              style={{
                flex: 1,
                fontFamily: FONT.sans,
                fontSize: 13,
                color: C.ink,
                ...({ outlineStyle: 'none' } as any),
              }}
            />
            {!isMobile ? (
              <View
                style={{
                  paddingHorizontal: 6,
                  height: 18,
                  borderRadius: 4,
                  backgroundColor: C.paper,
                  borderWidth: 1,
                  borderColor: C.hairline,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontFamily: FONT.mono, fontSize: 9, color: C.muted, fontWeight: '600' }}>
                  ⌘ K
                </Text>
              </View>
            ) : null}
          </View>

          <View style={{ flex: 1 }} />

          {/* Back-to-app pill */}
          {!isMobile ? <BackToApp onPress={() => router.push('/dashboard' as any)} /> : null}

          {/* Notifications shortcut (jumps to admin notifications page) */}
          <Pressable
            onPress={() => router.push('/admin/notifications' as any)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              borderWidth: 1,
              borderColor: C.hairline,
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <Bell size={14} color={C.body} />
            <View
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: C.red,
                borderWidth: 1.5,
                borderColor: C.paper,
              }}
            />
          </Pressable>

          {/* Profile dropdown trigger */}
          <View style={{ position: 'relative' as any }}>
            <Pressable
              // @ts-ignore
              data-profile-popover="trigger"
              onPress={() => setProfileOpen((v) => !v)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingLeft: 4,
                paddingRight: 10,
                height: 36,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: C.hairline,
              }}
            >
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  backgroundColor: C.ink,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    fontFamily: FONT.sans,
                    fontSize: 11,
                    fontWeight: '700',
                    color: '#FFFFFF',
                  }}
                >
                  {(user?.email ?? 'A').charAt(0).toUpperCase()}
                </Text>
              </View>
              {!isMobile ? (
                <Text style={{ fontFamily: FONT.sans, fontSize: 12, color: C.body, fontWeight: '500' }} numberOfLines={1}>
                  Admin
                </Text>
              ) : null}
            </Pressable>

            {profileOpen ? (
              <View
                // @ts-ignore
                data-profile-popover="panel"
                style={{
                  position: 'absolute',
                  top: 44,
                  right: 0,
                  width: 260,
                  backgroundColor: C.paper,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: C.hairline,
                  paddingVertical: 6,
                  zIndex: 100,
                  ...({
                    boxShadow:
                      '0 24px 48px -16px rgba(15,23,42,0.18), 0 8px 24px -8px rgba(15,23,42,0.10)',
                  } as any),
                }}
              >
                <View style={{ paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.hair }}>
                  <Text style={{ fontFamily: FONT.sans, fontSize: 13, fontWeight: '700', color: C.ink, marginBottom: 2 }}>
                    Signed in
                  </Text>
                  <Text
                    style={{ fontFamily: FONT.mono, fontSize: 11, color: C.muted }}
                    numberOfLines={1}
                  >
                    {user?.email ?? '—'}
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      marginTop: 8,
                      alignSelf: 'flex-start',
                      paddingHorizontal: 8,
                      height: 20,
                      borderRadius: 999,
                      backgroundColor: C.redSoft,
                    }}
                  >
                    <Shield size={9} color={C.red} />
                    <Text
                      style={{
                        fontFamily: FONT.mono,
                        fontSize: 9,
                        fontWeight: '700',
                        color: C.redText,
                        letterSpacing: 0.8,
                      }}
                    >
                      ADMIN
                    </Text>
                  </View>
                </View>
                <DropdownItem
                  Icon={ArrowLeft}
                  label="Back to app"
                  onPress={() => {
                    setProfileOpen(false);
                    router.push('/dashboard' as any);
                  }}
                />
                <DropdownItem
                  Icon={ExternalLink}
                  label="Open public site"
                  onPress={() => {
                    setProfileOpen(false);
                    if (typeof window !== 'undefined') window.open('/', '_blank');
                  }}
                />
                <View style={{ height: 1, backgroundColor: C.hair, marginVertical: 4 }} />
                <DropdownItem
                  Icon={LogOut}
                  label="Sign out"
                  danger
                  onPress={async () => {
                    setProfileOpen(false);
                    await signOut();
                    router.replace('/admin/login' as any);
                  }}
                />
              </View>
            ) : null}
          </View>
        </View>

        {/* Breadcrumb strip */}
        <View
          style={{
            paddingHorizontal: isMobile ? 16 : 32,
            paddingVertical: 14,
            backgroundColor: C.paper,
            borderBottomWidth: 1,
            borderBottomColor: C.hair,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Text
            style={{
              fontFamily: FONT.mono,
              fontSize: 11,
              fontWeight: '700',
              color: C.muted,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
            }}
          >
            SnapViral
          </Text>
          <ChevronRight size={11} color={C.subtle} />
          <Text
            style={{
              fontFamily: FONT.mono,
              fontSize: 11,
              fontWeight: '700',
              color: C.muted,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
            }}
          >
            Admin
          </Text>
          <ChevronRight size={11} color={C.subtle} />
          <Text
            style={{
              fontFamily: FONT.mono,
              fontSize: 11,
              fontWeight: '700',
              color: C.red,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
            }}
          >
            {findCurrentLabel(pathname)}
          </Text>
        </View>

        {/* Main content */}
        <View style={{ flex: 1, minHeight: 0 }}>
          <Slot />
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// Sidebar contents
// =====================================================================
function SidebarContents({
  collapsed,
  pathname,
  onNavigate,
  onToggleCollapse,
  onCloseDrawer,
}: {
  collapsed: boolean;
  pathname: string;
  onNavigate: (href: string) => void;
  onToggleCollapse?: () => void;
  onCloseDrawer?: () => void;
}) {
  return (
    <View style={{ flex: 1, flexDirection: 'column' }}>
      {/* Brand strip */}
      <View
        style={{
          height: TOPBAR_H,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: collapsed ? 0 : 18,
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: 10,
          borderBottomWidth: 1,
          borderBottomColor: C.hair,
        }}
      >
        <SnapViralLogo size={26} />
        {!collapsed ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text
                style={{
                  fontFamily: FONT.sans,
                  fontSize: 17,
                  fontWeight: '800',
                  color: C.ink,
                  letterSpacing: -0.4,
                }}
              >
                Snap
              </Text>
              <Text
                style={{
                  fontFamily: FONT.serif,
                  fontStyle: 'italic',
                  fontSize: 17,
                  fontWeight: '600',
                  color: C.red,
                  letterSpacing: -0.4,
                }}
              >
                Viral
              </Text>
            </View>
            <View
              style={{
                paddingHorizontal: 7,
                height: 18,
                borderRadius: 4,
                backgroundColor: C.redSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 9,
                  fontWeight: '700',
                  color: C.redText,
                  letterSpacing: 0.8,
                }}
              >
                ADMIN
              </Text>
            </View>
            <View style={{ flex: 1 }} />
            {onCloseDrawer ? (
              <Pressable
                onPress={onCloseDrawer}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={14} color={C.muted} />
              </Pressable>
            ) : null}
          </>
        ) : null}
      </View>

      {/* Nav scroll */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: 16,
          paddingHorizontal: collapsed ? 8 : 12,
          gap: 4,
        }}
      >
        {NAV.map((section, sIdx) => (
          <View key={sIdx} style={{ marginBottom: 14 }}>
            {!collapsed ? (
              <Text
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 9,
                  fontWeight: '700',
                  color: C.subtle,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  paddingHorizontal: 10,
                  marginBottom: 6,
                }}
              >
                {section.label}
              </Text>
            ) : (
              <View
                style={{
                  height: 1,
                  backgroundColor: C.hair,
                  marginVertical: 6,
                  marginHorizontal: 4,
                }}
              />
            )}
            {section.items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <NavRow
                  key={item.href}
                  item={item}
                  active={active}
                  collapsed={collapsed}
                  onPress={() => onNavigate(item.href)}
                />
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* Footer: collapse toggle + status */}
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: C.hair,
          paddingHorizontal: collapsed ? 8 : 14,
          paddingVertical: 12,
          gap: 10,
        }}
      >
        {!collapsed ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: 8,
              paddingVertical: 8,
              borderRadius: 9,
              backgroundColor: C.greenSoft,
            }}
          >
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.green }} />
            <Text
              style={{
                fontFamily: FONT.mono,
                fontSize: 10,
                fontWeight: '600',
                color: C.green,
                letterSpacing: 0.5,
              }}
            >
              All systems normal
            </Text>
          </View>
        ) : null}
        {onToggleCollapse ? (
          <Pressable
            onPress={onToggleCollapse}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: collapsed ? 0 : 8,
              paddingVertical: 8,
              borderRadius: 8,
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
          >
            {collapsed ? (
              <ChevronRight size={13} color={C.muted} />
            ) : (
              <>
                <ChevronLeft size={13} color={C.muted} />
                <Text style={{ fontFamily: FONT.sans, fontSize: 12, color: C.muted, fontWeight: '500' }}>
                  Collapse
                </Text>
              </>
            )}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function NavRow({
  item,
  active,
  collapsed,
  onPress,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onPress: () => void;
}) {
  const [hover, setHover] = useState(false);
  const Icon = item.Icon;
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={{
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: collapsed ? 0 : 10,
        height: collapsed ? 40 : 38,
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderRadius: 9,
        backgroundColor: active ? C.redSoft : hover ? '#F1F5F9' : 'transparent',
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
            backgroundColor: C.red,
          }}
        />
      ) : null}
      <Icon
        size={collapsed ? 16 : 14}
        color={active ? C.red : hover ? C.ink : C.body}
        strokeWidth={active ? 2.4 : 1.8}
      />
      {!collapsed ? (
        <Text
          style={{
            fontFamily: FONT.sans,
            fontSize: 13,
            fontWeight: active ? '700' : '500',
            color: active ? C.red : hover ? C.ink : C.body,
            letterSpacing: -0.2,
          }}
        >
          {item.label}
        </Text>
      ) : null}
    </Pressable>
  );
}

// =====================================================================
// Topbar bits
// =====================================================================
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
        gap: 6,
        paddingHorizontal: 12,
        height: 36,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: C.hairline,
        backgroundColor: hover ? C.bg : C.paper,
        ...({ transition: 'background 200ms ease' } as any),
      }}
    >
      <ArrowLeft size={11} color={C.muted} />
      <Text
        style={{
          fontFamily: FONT.sans,
          fontSize: 12,
          fontWeight: '600',
          color: C.body,
        }}
      >
        Back to app
      </Text>
    </Pressable>
  );
}

function DropdownItem({
  Icon,
  label,
  onPress,
  danger,
}: {
  Icon: any;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 9,
        backgroundColor: hover ? (danger ? C.redSoft : C.bg) : 'transparent',
        ...({ transition: 'background 160ms ease' } as any),
      }}
    >
      <Icon size={13} color={danger ? C.red : C.body} strokeWidth={1.8} />
      <Text
        style={{
          fontFamily: FONT.sans,
          fontSize: 13,
          fontWeight: '500',
          color: danger ? C.red : C.body,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// =====================================================================
// Helpers
// =====================================================================
function findCurrentLabel(pathname: string): string {
  // Try exact match first, then deepest prefix.
  if (PATH_LABELS[pathname]) return PATH_LABELS[pathname]!;
  const candidates = Object.keys(PATH_LABELS)
    .filter((p) => p !== '/admin' && pathname.startsWith(p))
    .sort((a, b) => b.length - a.length);
  if (candidates[0]) return PATH_LABELS[candidates[0]]!;
  // Sub-routes under /admin/blog/[id] etc.
  if (pathname.startsWith('/admin/blog/')) return 'Blog · post';
  return 'Console';
}
