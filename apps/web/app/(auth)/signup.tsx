import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { AuthSplitLayout } from '../../components/AuthLayout';
import { Button, Input, toast } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { signupSchema } from '@newsflow/shared';

export default function Signup() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      await signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        full_name: parsed.data.full_name,
        phone: parsed.data.phone ?? undefined,
      });
      toast.success('Account created', 'Check your inbox to confirm, then sign in.');
      router.replace('/login');
    } catch (e) {
      setErrors({ form: e instanceof Error ? e.message : 'Signup failed' });
    } finally {
      setLoading(false);
    }
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
