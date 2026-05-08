import '../global.css';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../lib/auth';
import { ThemeProvider } from '../lib/theme';
import { ToastHost } from '../components/ui/Toast';

export default function RootLayout() {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
        },
      }),
    [],
  );

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FAFAFA' } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(app)" />
            <Stack.Screen name="(admin)" />
            <Stack.Screen name="blog/index" options={{ title: 'Blog · SnapViral' }} />
            <Stack.Screen name="blog/[slug]" options={{ title: 'SnapViral Blog' }} />
            <Stack.Screen name="admin/login" options={{ title: 'Admin · SnapViral' }} />
            <Stack.Screen name="auth/confirm" options={{ title: 'Confirm email · SnapViral' }} />
            <Stack.Screen name="auth/reset-password" options={{ title: 'Reset password · SnapViral' }} />
            <Stack.Screen name="privacy" options={{ title: 'Privacy Policy' }} />
            <Stack.Screen name="terms" options={{ title: 'Terms of Service' }} />
            <Stack.Screen name="about" options={{ title: 'About · SnapViral' }} />
            <Stack.Screen name="+not-found" options={{ title: 'Not found' }} />
          </Stack>
          <ToastHost />
        </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
