import { Link, Stack } from 'expo-router';
import { View, Text } from 'react-native';
import { Button } from '../components/ui/Button';

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View className="flex-1 items-center justify-center bg-surface p-8">
        <Text className="text-6xl font-bold text-ink mb-4">404</Text>
        <Text className="text-xl font-semibold text-ink mb-2">Page not found</Text>
        <Text className="text-base text-ink-muted mb-6">
          We couldn't find the page you were looking for.
        </Text>
        <Link href="/" asChild>
          <Button>Go home</Button>
        </Link>
      </View>
    </>
  );
}
