import { Redirect, Slot } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../../lib/auth';
import { SidebarProvider } from '../../lib/sidebar';
import { Sidebar, BottomTabs } from '../../components/sidebar/Sidebar';
import { TopBar } from '../../components/TopBar';

export default function AppLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator color="#E53935" />
      </View>
    );
  }
  if (!session) return <Redirect href="/login" />;

  return (
    <SidebarProvider>
      <View className="flex-1 flex-row bg-surface">
        <Sidebar />
        <View className="flex-1">
          <TopBar />
          <View className="flex-1">
            <Slot />
          </View>
          <BottomTabs />
        </View>
      </View>
    </SidebarProvider>
  );
}
