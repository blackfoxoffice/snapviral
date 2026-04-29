import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { AuthSplitLayout } from '../../components/AuthLayout';
import { Button, Input, toast } from '../../components/ui';
import { useAuth } from '../../lib/auth';

export default function Login() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
      toast.success('Welcome back!');
      router.replace('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplitLayout
      title="Welcome back"
      subtitle="Sign in to your account to keep creating."
      footer={
        <Text className="text-[13px] text-ink-muted text-center">
          New to Newsflow?{' '}
          <Link href="/signup" asChild>
            <Pressable>
              <Text className="text-brand font-semibold">Create an account</Text>
            </Pressable>
          </Link>
        </Text>
      }
    >
      <View className="gap-4">
        <Input
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <Input
          label="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          autoComplete="password"
          error={error ?? undefined}
        />
        <View className="mt-1">
          <Button onPress={handleSubmit} loading={loading} block size="lg">
            Sign in
          </Button>
        </View>
      </View>
    </AuthSplitLayout>
  );
}
