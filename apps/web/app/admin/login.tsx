import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Lock, Mail, Shield, ShieldAlert } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { SnapViralLogo } from '../../components/icons/SnapViralLogo';

export default function AdminLogin() {
  const router = useRouter();
  const { signIn, signOut, session, user } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  // If already signed in, immediately verify admin status. If admin, redirect.
  // If not, show "you're signed in as a non-admin — sign out to use this portal".
  const [adminCheck, setAdminCheck] = useState<'idle' | 'checking' | 'admin' | 'not_admin'>('idle');

  useEffect(() => {
    if (!session || !user) {
      setAdminCheck('idle');
      return;
    }
    let cancelled = false;
    setAdminCheck('checking');
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      if (cancelled) return;
      const isAdmin = Boolean((data as { is_admin?: boolean } | null)?.is_admin);
      setAdminCheck(isAdmin ? 'admin' : 'not_admin');
      if (isAdmin) {
        // Use a small delay to let the UI flash success
        setTimeout(() => router.replace('/admin' as any), 200);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session, user, router]);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
      // Once auth state updates, the effect above will verify admin status.
      setVerifying(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    setAdminCheck('idle');
    setVerifying(false);
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#0B1220',
        // ambient red/blue dimensional glow on a near-black canvas
        backgroundImage:
          'radial-gradient(900px 500px at 20% -10%, rgba(229,57,53,0.18), transparent 60%), ' +
          'radial-gradient(700px 400px at 90% 10%, rgba(59,130,246,0.10), transparent 60%), ' +
          'radial-gradient(500px 400px at 50% 110%, rgba(229,57,53,0.10), transparent 70%)' as any,
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? 20 : 40,
      }}
    >
      {/* Back to app link, top-left */}
      <Pressable
        onPress={() => router.push('/' as any)}
        style={{
          position: 'absolute',
          top: isMobile ? 20 : 32,
          left: isMobile ? 20 : 32,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 999,
          backgroundColor: 'rgba(255,255,255,0.06)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.10)',
        }}
      >
        <ArrowLeft size={12} color="rgba(255,255,255,0.7)" />
        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500' }}>
          Back to site
        </Text>
      </Pressable>

      <View
        style={{
          width: '100%',
          maxWidth: 440,
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderRadius: 24,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
          padding: isMobile ? 28 : 40,
          shadowColor: '#000',
          shadowOpacity: 0.4,
          shadowRadius: 40,
          shadowOffset: { width: 0, height: 20 },
        }}
      >
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              backgroundColor: 'rgba(229,57,53,0.15)',
              borderWidth: 1,
              borderColor: 'rgba(229,57,53,0.3)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 18,
            }}
          >
            <Shield size={26} color="#FF6B6B" strokeWidth={2.4} />
          </View>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: '#FF6B6B',
              letterSpacing: 2.5,
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            Admin Portal
          </Text>
          <Text
            style={{
              fontSize: 26,
              fontWeight: '800',
              color: '#FFFFFF',
              letterSpacing: -0.6,
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            Restricted access.
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.55)',
              textAlign: 'center',
              maxWidth: 320,
              lineHeight: 20,
            }}
          >
            Sign in with an admin account to manage API keys, users, blog posts and platform
            settings.
          </Text>
        </View>

        {/* Already signed-in flows */}
        {session && adminCheck === 'checking' ? (
          <View style={{ alignItems: 'center', paddingVertical: 24 }}>
            <ActivityIndicator color="#FF6B6B" />
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 12 }}>
              Verifying admin access…
            </Text>
          </View>
        ) : null}

        {session && adminCheck === 'admin' ? (
          <View style={{ alignItems: 'center', paddingVertical: 16 }}>
            <Text style={{ color: '#10B981', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>
              ✓ Admin verified
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
              Redirecting to admin overview…
            </Text>
          </View>
        ) : null}

        {session && adminCheck === 'not_admin' ? (
          <View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 10,
                padding: 14,
                borderRadius: 12,
                backgroundColor: 'rgba(245,158,11,0.10)',
                borderWidth: 1,
                borderColor: 'rgba(245,158,11,0.30)',
                marginBottom: 16,
              }}
            >
              <ShieldAlert size={16} color="#F59E0B" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#FBBF24', fontSize: 13, fontWeight: '600', marginBottom: 4 }}>
                  Not an admin account
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, lineHeight: 18 }}>
                  You're signed in as <Text style={{ fontWeight: '700' }}>{user?.email}</Text>, but
                  this account does not have admin privileges. Sign out and try again with an admin
                  email.
                </Text>
              </View>
            </View>
            <Pressable
              onPress={handleSignOut}
              style={{
                paddingVertical: 12,
                borderRadius: 10,
                alignItems: 'center',
                backgroundColor: '#E53935',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>
                Sign out and use a different account
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/dashboard' as any)}
              style={{ paddingVertical: 14, alignItems: 'center' }}
            >
              <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: '500' }}>
                Or, go to your dashboard →
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* Sign-in form (only if not signed in) */}
        {!session ? (
          <View style={{ gap: 14 }}>
            <View>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: 'rgba(255,255,255,0.55)',
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                Email
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingHorizontal: 14,
                  height: 46,
                  borderRadius: 10,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.10)',
                }}
              >
                <Mail size={14} color="rgba(255,255,255,0.5)" />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="admin@snapviral.in"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  style={{
                    flex: 1,
                    color: '#FFFFFF',
                    fontSize: 14,
                    ...({ outlineStyle: 'none' } as any),
                  }}
                />
              </View>
            </View>

            <View>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: 'rgba(255,255,255,0.55)',
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                Password
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingHorizontal: 14,
                  height: 46,
                  borderRadius: 10,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.10)',
                }}
              >
                <Lock size={14} color="rgba(255,255,255,0.5)" />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  secureTextEntry
                  autoComplete="password"
                  style={{
                    flex: 1,
                    color: '#FFFFFF',
                    fontSize: 14,
                    ...({ outlineStyle: 'none' } as any),
                  }}
                  onSubmitEditing={handleSubmit}
                />
              </View>
            </View>

            {error ? (
              <Text style={{ color: '#FCA5A5', fontSize: 12, marginTop: -2 }}>{error}</Text>
            ) : null}

            <Pressable
              onPress={handleSubmit}
              disabled={submitting || verifying}
              style={{
                marginTop: 8,
                height: 46,
                borderRadius: 10,
                backgroundColor: '#E53935',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
                opacity: submitting || verifying ? 0.7 : 1,
                shadowColor: '#E53935',
                shadowOpacity: 0.4,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 6 },
              }}
            >
              {submitting || verifying ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>
                    Enter admin portal
                  </Text>
                  <ArrowRight size={14} color="#FFFFFF" />
                </>
              )}
            </Pressable>
          </View>
        ) : null}

        {/* Footer brand */}
        <View
          style={{
            marginTop: 28,
            paddingTop: 20,
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.06)',
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <SnapViralLogo size={16} />
          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '500' }}>
            SnapViral · admin.snapviral.in
          </Text>
        </View>
      </View>
    </View>
  );
}
