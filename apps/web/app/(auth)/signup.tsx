import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { CheckCircle2, Mail } from 'lucide-react-native';
import { AuthSplitLayout } from '../../components/AuthLayout';
import { Button, Input, toast } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { signupSchema } from '@newsflow/shared';

export default function Signup() {
  const router = useRouter();
  const { signUp, resendConfirmation } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<{ email: string } | null>(null);
  const [resending, setResending] = useState(false);

  async function handleSubmit() {
    setErrors({});
    if (password !== confirm) {
      setErrors({ confirm: 'Passwords do not match' });
      return;
    }
    const parsed = signupSchema.safeParse({
      full_name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      password,
    });
    if (!parsed.success) {
      const flat: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.') || 'form';
        flat[key] = issue.message;
      }
      setErrors(flat);
      return;
    }
    setLoading(true);
    try {
      const result = await signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        full_name: parsed.data.full_name,
        phone: parsed.data.phone ?? undefined,
      });
      if (result.needsEmailConfirm) {
        // Email confirmation is enabled — show the "check inbox" state.
        setPending({ email: parsed.data.email });
      } else {
        // Email confirmation disabled — straight to dashboard.
        toast.success('Account created');
        router.replace('/dashboard');
      }
    } catch (e) {
      setErrors({ form: e instanceof Error ? e.message : 'Signup failed' });
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!pending) return;
    setResending(true);
    try {
      await resendConfirmation(pending.email);
      toast.success('Email sent', `New verification link on the way to ${pending.email}`);
    } catch (e) {
      toast.error('Could not resend', e instanceof Error ? e.message : undefined);
    } finally {
      setResending(false);
    }
  }

  if (pending) {
    return (
      <AuthSplitLayout
        title="Confirm your email"
        subtitle="One last step. We sent a verification link."
        footer={
          <Text className="text-[13px] text-ink-muted text-center">
            Already verified?{' '}
            <Link href="/login" asChild>
              <Pressable>
                <Text className="text-brand font-semibold">Sign in</Text>
              </Pressable>
            </Link>
          </Text>
        }
      >
        <View className="gap-5 items-center py-4">
          <View
            className="items-center justify-center rounded-full"
            style={{ width: 56, height: 56, backgroundColor: 'rgba(225,29,44,0.10)' }}
          >
            <Mail size={26} color="#E11D2C" />
          </View>
          <View className="items-center gap-2">
            <Text className="text-[16px] font-semibold text-ink text-center">
              Check your inbox
            </Text>
            <Text className="text-[13px] text-ink-muted text-center max-w-[340px] leading-relaxed">
              We sent a verification link to{' '}
              <Text className="font-semibold text-ink">{pending.email}</Text>. Click it to finish
              setting up your account. Links expire in 24 hours.
            </Text>
          </View>
          <View className="w-full max-w-[300px] gap-2">
            <Button
              onPress={handleResend}
              loading={resending}
              variant="secondary"
              block
              size="md"
            >
              Resend verification email
            </Button>
            <Pressable onPress={() => setPending(null)}>
              <Text className="text-[12px] text-ink-subtle text-center">
                Used the wrong email? Try again
              </Text>
            </Pressable>
          </View>
        </View>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout
      title="Create your account"
      subtitle="Start generating news Shorts today — it only takes a minute."
      footer={
        <Text className="text-[13px] text-ink-muted text-center">
          Already have an account?{' '}
          <Link href="/login" asChild>
            <Pressable>
              <Text className="text-brand font-semibold">Sign in</Text>
            </Pressable>
          </Link>
        </Text>
      }
    >
      <View className="gap-4">
        <Input
          label="Full name"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Priya Selvam"
          autoComplete="name"
          error={errors.full_name}
        />
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          error={errors.email}
        />
        <Input
          label="Phone (optional)"
          value={phone}
          onChangeText={setPhone}
          placeholder="+91 98765 43210"
          keyboardType="phone-pad"
          autoComplete="tel"
          error={errors.phone}
        />
        <View className="flex-row gap-3">
          <Input
            label="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="Min. 8 characters"
            autoComplete="password-new"
            error={errors.password}
            className="flex-1"
          />
          <Input
            label="Confirm"
            secureTextEntry
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Repeat"
            autoComplete="password-new"
            error={errors.confirm}
            className="flex-1"
          />
        </View>
        {errors.form ? (
          <View className="rounded-lg bg-state-error-soft px-3.5 py-2.5 border border-state-error/20">
            <Text className="text-[12px] text-state-error">{errors.form}</Text>
          </View>
        ) : null}
        <View className="mt-1">
          <Button onPress={handleSubmit} loading={loading} block size="lg">
            Create account
          </Button>
        </View>
      </View>
    </AuthSplitLayout>
  );
}
