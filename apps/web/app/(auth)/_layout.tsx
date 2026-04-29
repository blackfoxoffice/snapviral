import { Redirect, Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../../lib/auth';

export default function AuthLayout() {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator color="#E53935" />
      </View>
    );
  }
  if (session) return <Redirect href="/dashboard" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
