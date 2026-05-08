import { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { CheckCircle2, Lock, ShieldAlert } from 'lucide-react-native';
import { AuthSplitLayout } from '../../components/AuthLayout';
import { Button, Input, toast } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';

// Supabase puts the recovery tokens in the URL hash:
//   #access_token=…&refresh_token=…&type=recovery
// We pull them out, hand them to supabase.auth.setSession() so the user is
// authenticated for the password update, then let them set a new password.
function readRecoveryParams(): { access?: string; refresh?: string; type?: string; error?: string; errorDescription?: string } {
  if (typeof window === 'undefined') return {};
  const hash = window.location.hash.replace(/^#/, '');
  const params = new URLSearchParams(hash);
  return {
    access: params.get('access_token') ?? undefined,
    refresh: params.get('refresh_token') ?? undefined,
    type: params.get('type') ?? undefined,
    error: params.get('error') ?? undefined,
    errorDescription: params.get('error_description') ?? undefined,
  };
}

export default function ResetPassword() {
  const router = useRouter();
  const { updatePassword } = useAuth();

  const [phase, setPhase] = useState<'verifying' | 'ready' | 'invalid' | 'done'>('verifying');
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const params = readRecoveryParams();
      if (params.error || !params.access || !params.refresh) {
        if (!cancelled) {
          setRecoveryError(params.errorDescription?.replace(/\+/g, ' ') ?? 'The reset link is invalid or expired.');
          setPhase('invalid');
        }
        return;
      }
      const { error } = await supabase.auth.setSession({
        access_token: params.access,
        refresh_token: params.refresh,
      });
      if (cancelled) return;
      if (error) {
        setRecoveryError(error.message);
        setPhase('invalid');
        return;
      }
      // Strip the tokens from the URL so they don't linger in browser history.
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', window.location.pathname);
      }
      setPhase('ready');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit() {
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await updatePassword(password);
      toast.success('Password updated', 'You can now sign in with the new password.');
      setPhase('done');
      setTimeout(() => router.replace('/dashboard'), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update password');
    } finally {
      setSubmitting(false);
    }
  }

  if (phase === 'verifying') {
    return (
      <AuthSplitLayout title="Verifying link…" subtitle="Hold on a second.">
        <View className="items-center py-8">
          <ActivityIndicator color="#E11D2C" />
        </View>
      </AuthSplitLayout>
    );
  }

  if (phase === 'invalid') {
    return (
      <AuthSplitLayout
        title="That link won't work"
        subtitle="Reset links expire after 1 hour and can only be used once."
        footer={
          <Text className="text-[13px] text-ink-muted text-center">
            Need a new one?{' '}
            <Link href={'/forgot-password' as any} asChild>
              <Pressable>
                <Text className="text-brand font-semibold">Request another</Text>
              </Pressable>
            </Link>
          </Text>
        }
      >
        <View
          className="flex-row items-start gap-3 rounded-md p-4"
          style={{ backgroundColor: 'rgba(220,38,38,0.06)', borderWidth: 1, borderColor: 'rgba(220,38,38,0.20)' }}
        >
          <ShieldAlert size={16} color="#DC2626" style={{ marginTop: 2 }} />
          <View className="flex-1">
            <Text className="text-[13px] font-semibold text-ink mb-1">Reset link invalid</Text>
            <Text className="text-[12px] text-ink-muted leading-relaxed">
              {recoveryError ?? 'The link in your email may have expired or already been used.'}
            </Text>
          </View>
        </View>
      </AuthSplitLayout>
    );
  }

  if (phase === 'done') {
    return (
      <AuthSplitLayout title="Password updated" subtitle="Redirecting to your dashboard…">
        <View className="items-center py-6 gap-4">
          <View
            className="items-center justify-center rounded-full"
            style={{ width: 56, height: 56, backgroundColor: 'rgba(22,163,74,0.10)' }}
          >
            <CheckCircle2 size={26} color="#16A34A" />
          </View>
          <Text className="text-[14px] text-ink-muted">You're already signed in.</Text>
        </View>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout
      title="Set a new password"
      subtitle="At least 8 characters. Pick something only you know."
      footer={
        <Text className="text-[13px] text-ink-muted text-center">
          Changed your mind?{' '}
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
          <Lock size={13} color="#475569" style={{ marginTop: 2 }} />
          <Text className="flex-1 text-[12px] text-ink-secondary leading-relaxed">
            All your active sessions on other devices will stay signed in. To revoke them, sign
            out and back in after this.
          </Text>
        </View>
        <Input
          label="New password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="At least 8 characters"
          autoComplete="new-password"
        />
        <Input
          label="Confirm password"
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
          placeholder="Type it again"
          autoComplete="new-password"
          error={error ?? undefined}
          onSubmitEditing={handleSubmit}
        />
        <View className="mt-1">
          <Button onPress={handleSubmit} loading={submitting} block size="lg">
            Update password
          </Button>
        </View>
      </View>
    </AuthSplitLayout>
  );
}
