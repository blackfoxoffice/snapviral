import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { CheckCircle2, Mail } from 'lucide-react-native';
import { AuthSplitLayout } from '../../components/AuthLayout';
import { Button, Input, toast } from '../../components/ui';
import { useAuth } from '../../lib/auth';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await resetPassword(email.trim());
      setSent(true);
      toast.success('Check your inbox', `We sent a reset link to ${email.trim()}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send reset email');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthSplitLayout
        title="Check your inbox"
        subtitle="We just sent you a password reset link."
        footer={
          <Text className="text-[13px] text-ink-muted text-center">
            Didn't get it?{' '}
            <Pressable onPress={() => setSent(false)}>
              <Text className="text-brand font-semibold">Try again</Text>
            </Pressable>
          </Text>
        }
      >
        <View className="gap-5 items-center py-4">
          <View
            className="items-center justify-center rounded-full"
            style={{ width: 56, height: 56, backgroundColor: 'rgba(22,163,74,0.10)' }}
          >
            <CheckCircle2 size={26} color="#16A34A" />
          </View>
          <View className="items-center gap-2">
            <Text className="text-[16px] font-semibold text-ink text-center">
              Reset link sent
            </Text>
            <Text className="text-[13px] text-ink-muted text-center max-w-[320px] leading-relaxed">
              Open the email at <Text className="font-semibold text-ink">{email}</Text> and click
              the secure link inside. It expires in 1 hour. Check your spam folder if it doesn't
              show up.
            </Text>
          </View>
          <Link href="/login" asChild>
            <Pressable className="mt-2">
              <Text className="text-[13px] text-brand font-semibold">← Back to sign in</Text>
            </Pressable>
          </Link>
        </View>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout
      title="Forgot your password?"
      subtitle="Enter the email you signed up with and we'll send you a reset link."
      footer={
        <Text className="text-[13px] text-ink-muted text-center">
          Remembered it?{' '}
          <Link href="/login" asChild>
            <Pressable>
              <Text className="text-brand font-semibold">Back to sign in</Text>
            </Pressable>
          </Link>
        </Text>
      }
    >
      <View className="gap-4">
        <View
          className="flex-row items-start gap-2 rounded-md p-3"
          style={{ backgroundColor: 'rgba(15,23,42,0.04)' }}
        >
          <Mail size={14} color="#475569" style={{ marginTop: 2 }} />
          <Text className="flex-1 text-[12px] text-ink-secondary leading-relaxed">
            For security reasons, we'll send a one-time reset link instead of the password itself.
            Links expire in 1 hour.
          </Text>
        </View>
        <Input
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          autoComplete="email"
          error={error ?? undefined}
          onSubmitEditing={handleSubmit}
        />
        <View className="mt-1">
          <Button onPress={handleSubmit} loading={loading} block size="lg">
            Send reset link
          </Button>
        </View>
      </View>
    </AuthSplitLayout>
  );
}
