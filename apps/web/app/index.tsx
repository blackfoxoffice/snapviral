import { Redirect } from 'expo-router';
import { useAuth } from '../lib/auth';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator color="#E53935" />
      </View>
    );
  }
  return <Redirect href={session ? '/dashboard' : '/login'} />;
}
