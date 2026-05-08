import { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { CheckCircle2, ShieldAlert, Mail } from 'lucide-react-native';
import { AuthSplitLayout } from '../../components/AuthLayout';
import { Button, toast } from '../../components/ui';
import { supabase } from '../../lib/supabase';

// Supabase verification redirect lands here. The session may already be
// active (gotrue sets cookies before redirecting), or there may be tokens
// in the hash. Either path → user is now confirmed.
function readHashParams(): { access?: string; refresh?: string; type?: string; error?: string; errorDescription?: string } {
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

export default function ConfirmEmail() {
  const router = useRouter();
  const [phase, setPhase] = useState<'verifying' | 'ok' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const params = readHashParams();
      if (params.error) {
        if (!cancelled) {
          setErrorMessage(params.errorDescription?.replace(/\+/g, ' ') ?? 'The verification link is invalid or expired.');
          setPhase('error');
        }
        return;
      }
      // If the URL carries tokens, set the session manually. Otherwise
      // gotrue may have already done it; just check for a session.
      if (params.access && params.refresh) {
        const { error } = await supabase.auth.setSession({
          access_token: params.access,
          refresh_token: params.refresh,
        });
        if (cancelled) return;
        if (error) {
          setErrorMessage(error.message);
          setPhase('error');
          return;
        }
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!data.session) {
        setErrorMessage('We could not confirm your email — try the link again or request a new one.');
        setPhase('error');
        return;
      }
      setPhase('ok');
      toast.success('Email verified', 'You\'re all set.');
      // Brief pause so the user sees the success state
      setTimeout(() => router.replace('/dashboard'), 1500);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (phase === 'verifying') {
    return (
      <AuthSplitLayout title="Verifying your email…" subtitle="Almost there.">
        <View className="items-center py-8">
          <ActivityIndicator color="#E11D2C" />
        </View>
      </AuthSplitLayout>
    );
  }

  if (phase === 'error') {
    return (
      <AuthSplitLayout
        title="That link won't work"
        subtitle="Verification links are single-use and expire after 24 hours."
        footer={
          <Text className="text-[13px] text-ink-muted text-center">
            Need a new one?{' '}
            <Link href="/signup" asChild>
              <Pressable>
                <Text className="text-brand font-semibold">Re-create your account</Text>
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
            <Text className="text-[13px] font-semibold text-ink mb-1">Can't verify</Text>
            <Text className="text-[12px] text-ink-muted leading-relaxed">{errorMessage}</Text>
          </View>
        </View>
        <View className="mt-4">
          <Link href="/login" asChild>
            <Pressable>
              <Button block size="md" variant="secondary" onPress={() => router.replace('/login')}>
                Back to sign in
              </Button>
            </Pressable>
          </Link>
        </View>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout title="Email verified" subtitle="Welcome aboard. Redirecting to your dashboard.">
      <View className="items-center py-8 gap-4">
        <View
          className="items-center justify-center rounded-full"
          style={{ width: 64, height: 64, backgroundColor: 'rgba(22,163,74,0.10)' }}
        >
          <CheckCircle2 size={30} color="#16A34A" />
        </View>
        <View className="items-center gap-1">
          <Text className="text-[16px] font-semibold text-ink">You're in.</Text>
          <Text className="text-[13px] text-ink-muted">Sit tight while we get you set up.</Text>
        </View>
        <View className="flex-row items-center gap-2 mt-2 opacity-60">
          <Mail size={11} color="#475569" />
          <Text className="text-[11px] text-ink-muted">Confirmation email saved to your account</Text>
        </View>
      </View>
    </AuthSplitLayout>
  );
}
