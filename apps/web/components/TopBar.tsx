import { View, Text, Pressable, useWindowDimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Menu } from 'lucide-react-native';
import { Input } from './ui/Input';
import { useAuth } from '../lib/auth';
import { useSidebarCollapsed } from '../lib/sidebar';
import { SnapViralLogo } from './icons/SnapViralLogo';
import { NotificationBell } from './NotificationBell';

export function TopBar() {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isMobile = width < 768;
  const { toggle } = useSidebarCollapsed();

  const name =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split('@')[0] ??
    'Account';

  // Add safe area inset for top, but on web/PWA this will properly handle the padding
  // without relying on buggy CSS env variables.
  const paddingTop = Platform.OS === 'web' ? `env(safe-area-inset-top, ${insets.top}px)` : insets.top;

  return (
    <View
      className="flex-row items-center justify-between border-b border-surface-border bg-surface-sunken px-4"
      style={{
        minHeight: 48,
        paddingTop: paddingTop as any,
      }}
    >
      {isMobile ? (
        <View className="flex-row items-center gap-2">
          <SnapViralLogo size={24} />
          <View className="flex-row items-baseline">
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A', letterSpacing: -0.4 }}>Snap</Text>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#E53935', letterSpacing: -0.4, fontStyle: 'italic' }}>Viral</Text>
          </View>
        </View>
      ) : (
        <View className="flex-1 max-w-xs">
          <Input
            placeholder="Search..."
            leftIcon={<Search size={14} color="#546E7A" />}
            editable={false}
          />
        </View>
      )}
      <View className="flex-row items-center gap-2">
        <NotificationBell />
        <View className="h-7 w-7 items-center justify-center rounded-full bg-brand">
          <Text className="text-[11px] font-bold text-white">
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );
}
