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
import { ArrowRight, Lock, Mail, ShieldAlert, ChevronLeft } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { SnapViralLogo } from '../../components/icons/SnapViralLogo';

const FONT = {
  sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif',
  serif: 'Newsreader, Georgia, "Times New Roman", serif',
  mono: '"JetBrains Mono", "SF Mono", Menlo, monospace',
};

const C = {
  ink: '#0A0A0B',
  inkSoft: '#18181B',
  body: '#27272A',
  muted: '#52525B',
  subtle: '#71717A',
  faint: '#A1A1AA',
  hairline: 'rgba(10,10,11,0.08)',
  hair: 'rgba(10,10,11,0.06)',
  paper: '#FFFFFF',
  warm: '#FAFAF7',
  surface: '#F4F4F5',
  red: '#E11D2C',
  redHot: '#FF2D40',
};

// =====================================================================
// Inject minimal keyframes once (web only)
// =====================================================================
const KEYFRAMES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Newsreader:ital,wght@0,400;0,500;1,400;1,500&family=JetBrains+Mono:wght@400;500;600&display=swap');
@keyframes sv-admin-grain { 0%, 100% { transform: translate(0,0); } 25% { transform: translate(-1px,-1px); } 50% { transform: translate(1px,-1px); } 75% { transform: translate(-1px,1px); } }
@keyframes sv-admin-fade { from { opacity: 0; transform: translate3d(0,8px,0); } to { opacity: 1; transform: translate3d(0,0,0); } }
@keyframes sv-admin-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
`;
function useInjectStyles() {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById('sv-admin-keyframes')) return;
    const el = document.createElement('style');
    el.id = 'sv-admin-keyframes';
    el.textContent = KEYFRAMES;
    document.head.appendChild(el);
  }, []);
}

export default function AdminLogin() {
  useInjectStyles();
  const router = useRouter();
  const { signIn, signOut, session, user } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 900;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminCheck, setAdminCheck] = useState<'idle' | 'checking' | 'admin' | 'not_admin'>('idle');
  const [verifying, setVerifying] = useState(false);

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
        setTimeout(() => router.replace('/admin' as any), 300);
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
        flexDirection: isMobile ? 'column' : 'row',
        backgroundColor: C.paper,
        ...({ fontFamily: FONT.sans } as any),
      }}
    >
      {/* ============================================================ */}
      {/* LEFT: Editorial brand panel (full-bleed black w/ red accents) */}
      {/* ============================================================ */}
      {!isMobile ? (
        <View
          style={{
            flex: 1.05,
            backgroundColor: C.ink,
            position: 'relative',
            overflow: 'hidden',
            paddingHorizontal: 56,
            paddingVertical: 48,
            justifyContent: 'space-between',
            ...({
              backgroundImage:
                'radial-gradient(ellipse 90% 60% at 100% 0%, rgba(225,29,44,0.20) 0%, rgba(225,29,44,0.04) 35%, transparent 65%), ' +
                'radial-gradient(ellipse 70% 50% at 0% 100%, rgba(225,29,44,0.12) 0%, transparent 60%), ' +
                'linear-gradient(180deg, #0A0A0B 0%, #18181B 100%)',
            } as any),
          }}
        >
          {/* Subtle dotted grain */}
          <View
            style={{
              position: 'absolute',
              inset: 0 as any,
              opacity: 0.45,
              ...({
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
                backgroundSize: '22px 22px',
              } as any),
            }}
          />

          {/* Top: brand mark + back link */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <SnapViralLogo size={26} />
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text style={{ fontFamily: FONT.sans, fontSize: 17, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.4 }}>
                  Snap
                </Text>
                <Text
                  style={{
                    fontFamily: FONT.serif,
                    fontStyle: 'italic',
                    fontSize: 17,
                    fontWeight: '600',
                    color: C.redHot,
                    letterSpacing: -0.4,
                  }}
                >
                  Viral
                </Text>
              </View>
              <Text
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.4)',
                  letterSpacing: 1.5,
                  marginLeft: 8,
                  paddingLeft: 10,
                  borderLeftWidth: 1,
                  borderLeftColor: 'rgba(255,255,255,0.15)',
                }}
              >
                ADMIN CONSOLE
              </Text>
            </View>

            <BackLink onPress={() => router.push('/' as any)} />
          </View>

          {/* Middle: editorial pitch */}
          <View style={{ zIndex: 1, ...({ animation: 'sv-admin-fade 700ms 100ms cubic-bezier(0.2,0.8,0.2,1) both' } as any) }}>
            <Text
              style={{
                fontFamily: FONT.sans,
                fontSize: 64,
                lineHeight: 68,
                fontWeight: '700',
                color: '#FFFFFF',
                letterSpacing: -2.6,
                marginBottom: 28,
                maxWidth: 560,
              }}
            >
              Restricted{'\n'}
              <Text style={{ fontFamily: FONT.serif, fontStyle: 'italic', fontWeight: '500', color: C.redHot }}>
                command surface.
              </Text>
            </Text>
            <Text
              style={{
                fontFamily: FONT.sans,
                fontSize: 17,
                lineHeight: 27,
                color: 'rgba(255,255,255,0.62)',
                maxWidth: 460,
              }}
            >
              API key vault, user moderation, push broadcasts, blog publishing and the full audit
              trail. Every action logged. Every key encrypted at rest.
            </Text>

            <View style={{ marginTop: 44, gap: 16 }}>
              <FeatureLine label="Encrypted secrets vault" />
              <FeatureLine label="Per-action audit trail" />
              <FeatureLine label="Push notification broadcasts" />
              <FeatureLine label="Blog publishing & user moderation" />
            </View>
          </View>

          {/* Bottom: footer signature */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
            <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
              admin.snapviral.in
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 2.5,
                  backgroundColor: '#22C55E',
                  ...({ animation: 'sv-admin-pulse 2s ease-in-out infinite' } as any),
                }}
              />
              <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                all systems operational
              </Text>
            </View>
          </View>
        </View>
      ) : null}

      {/* ============================================================ */}
      {/* RIGHT: Sign-in form (white, refined)                          */}
      {/* ============================================================ */}
      <View
        style={{
          flex: 1,
          backgroundColor: C.paper,
          paddingHorizontal: isMobile ? 24 : 56,
          paddingVertical: isMobile ? 32 : 48,
          alignItems: 'center',
          justifyContent: isMobile ? 'flex-start' : 'center',
        }}
      >
        {/* Mobile-only top bar */}
        {isMobile ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              marginBottom: 32,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <SnapViralLogo size={22} />
              <Text
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 10,
                  color: C.muted,
                  letterSpacing: 1.5,
                  fontWeight: '700',
                }}
              >
                ADMIN CONSOLE
              </Text>
            </View>
            <BackLink onPress={() => router.push('/' as any)} mobile />
          </View>
        ) : null}

        <View
          style={{
            width: '100%',
            maxWidth: 400,
            ...({ animation: 'sv-admin-fade 700ms 200ms cubic-bezier(0.2,0.8,0.2,1) both' } as any),
          }}
        >
          {/* Eyebrow */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.red }} />
            <Text
              style={{
                fontFamily: FONT.mono,
                fontSize: 11,
                fontWeight: '700',
                color: C.red,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
              }}
            >
              Authenticate
            </Text>
          </View>

          {/* Heading */}
          <Text
            style={{
              fontFamily: FONT.sans,
              fontSize: 36,
              lineHeight: 40,
              fontWeight: '700',
              color: C.ink,
              letterSpacing: -1.6,
              marginBottom: 12,
            }}
          >
            Sign in to{'\n'}
            <Text style={{ fontFamily: FONT.serif, fontStyle: 'italic', fontWeight: '500' }}>
              the console.
            </Text>
          </Text>
          <Text
            style={{
              fontFamily: FONT.sans,
              fontSize: 14,
              lineHeight: 22,
              color: C.muted,
              marginBottom: 32,
            }}
          >
            Admin accounts only. Non-admin sessions are signed out automatically.
          </Text>

          {/* Already-signed-in states */}
          {session && adminCheck === 'checking' ? (
            <SignedInPanel state="checking" />
          ) : session && adminCheck === 'admin' ? (
            <SignedInPanel state="admin" />
          ) : session && adminCheck === 'not_admin' ? (
            <NotAdminPanel email={user?.email ?? ''} onSignOut={handleSignOut} onDashboard={() => router.push('/dashboard')} />
          ) : (
            <View style={{ gap: 16 }}>
              <Field label="Email">
                <View style={inputContainer}>
                  <Mail size={14} color={C.subtle} />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="admin@snapviral.in"
                    placeholderTextColor={C.faint}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    style={inputStyle}
                  />
                </View>
              </Field>

              <Field label="Password">
                <View style={inputContainer}>
                  <Lock size={14} color={C.subtle} />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor={C.faint}
                    secureTextEntry
                    autoComplete="password"
                    style={inputStyle}
                    onSubmitEditing={handleSubmit}
                  />
                </View>
              </Field>

              {error ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 8,
                    backgroundColor: '#FEF2F2',
                    borderWidth: 1,
                    borderColor: '#FECACA',
                  }}
                >
                  <ShieldAlert size={13} color={C.red} style={{ marginTop: 2 }} />
                  <Text style={{ fontFamily: FONT.sans, fontSize: 12, color: '#9F1239', flex: 1, lineHeight: 18 }}>
                    {error}
                  </Text>
                </View>
              ) : null}

              <Pressable
                onPress={handleSubmit}
                disabled={submitting || verifying}
                style={{
                  marginTop: 8,
                  height: 46,
                  borderRadius: 12,
                  backgroundColor: C.ink,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                  opacity: submitting || verifying ? 0.7 : 1,
                  ...({
                    transition: 'transform 220ms cubic-bezier(0.2,0.8,0.2,1), box-shadow 220ms ease',
                  } as any),
                }}
              >
                {submitting || verifying ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={{ fontFamily: FONT.sans, fontSize: 14, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.2 }}>
                      Enter console
                    </Text>
                    <ArrowRight size={14} color="#FFFFFF" />
                  </>
                )}
              </Pressable>

              {/* Helper line */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 14,
                  paddingTop: 14,
                  borderTopWidth: 1,
                  borderTopColor: C.hair,
                }}
              >
                <Text
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 10,
                    color: C.subtle,
                    letterSpacing: 0.5,
                  }}
                >
                  Locked out?
                </Text>
                <Text style={{ fontFamily: FONT.sans, fontSize: 12, color: C.muted }}>
                  Reach a fellow admin to reset your password.
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// Atoms
// =====================================================================

function BackLink({ onPress, mobile }: { onPress: () => void; mobile?: boolean }) {
  const [hover, setHover] = useState(false);
  const dark = !mobile;
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        height: 32,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: dark ? 'rgba(255,255,255,0.12)' : C.hairline,
        backgroundColor: dark
          ? hover
            ? 'rgba(255,255,255,0.06)'
            : 'transparent'
          : hover
            ? C.surface
            : C.paper,
        ...({ transition: 'background 200ms ease' } as any),
      }}
    >
      <ChevronLeft size={11} color={dark ? 'rgba(255,255,255,0.65)' : C.muted} />
      <Text
        style={{
          fontFamily: FONT.sans,
          fontSize: 12,
          fontWeight: '500',
          color: dark ? 'rgba(255,255,255,0.85)' : C.body,
        }}
      >
        Back to site
      </Text>
    </Pressable>
  );
}

function FeatureLine({ label }: { label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View
        style={{
          width: 14,
          height: 14,
          borderRadius: 7,
          backgroundColor: 'rgba(255,45,64,0.18)',
          borderWidth: 1,
          borderColor: 'rgba(255,45,64,0.40)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: C.redHot }} />
      </View>
      <Text style={{ fontFamily: FONT.sans, fontSize: 14, color: 'rgba(255,255,255,0.78)', fontWeight: '500' }}>
        {label}
      </Text>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View>
      <Text
        style={{
          fontFamily: FONT.mono,
          fontSize: 10,
          fontWeight: '700',
          color: C.subtle,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        {label}
      </Text>
      {children}
    </View>
  );
}

const inputContainer = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 10,
  paddingHorizontal: 14,
  height: 46,
  borderRadius: 12,
  backgroundColor: C.warm,
  borderWidth: 1,
  borderColor: C.hairline,
};

const inputStyle = {
  flex: 1,
  fontFamily: FONT.sans,
  fontSize: 14,
  color: C.ink,
  ...({ outlineStyle: 'none' } as any),
};

function SignedInPanel({ state }: { state: 'checking' | 'admin' }) {
  const isChecking = state === 'checking';
  return (
    <View
      style={{
        paddingVertical: 24,
        paddingHorizontal: 20,
        borderRadius: 14,
        backgroundColor: C.warm,
        borderWidth: 1,
        borderColor: C.hairline,
        alignItems: 'center',
      }}
    >
      {isChecking ? (
        <>
          <ActivityIndicator color={C.red} />
          <Text style={{ fontFamily: FONT.sans, fontSize: 14, color: C.body, marginTop: 14, fontWeight: '500' }}>
            Verifying admin access…
          </Text>
        </>
      ) : (
        <>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              backgroundColor: '#DCFCE7',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 18, color: '#16A34A', fontWeight: '700' }}>✓</Text>
          </View>
          <Text style={{ fontFamily: FONT.sans, fontSize: 15, fontWeight: '700', color: C.ink, marginBottom: 4 }}>
            Admin verified
          </Text>
          <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: C.subtle }}>
            Redirecting to console…
          </Text>
        </>
      )}
    </View>
  );
}

function NotAdminPanel({
  email,
  onSignOut,
  onDashboard,
}: {
  email: string;
  onSignOut: () => void;
  onDashboard: () => void;
}) {
  return (
    <View style={{ gap: 14 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 10,
          padding: 14,
          borderRadius: 12,
          backgroundColor: '#FEF3C7',
          borderWidth: 1,
          borderColor: '#FDE68A',
        }}
      >
        <ShieldAlert size={16} color="#A16207" style={{ marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: FONT.sans, fontSize: 13, fontWeight: '700', color: '#7C2D12', marginBottom: 4 }}>
            Not an admin account
          </Text>
          <Text style={{ fontFamily: FONT.sans, fontSize: 13, color: '#78350F', lineHeight: 19 }}>
            You're signed in as{' '}
            <Text style={{ fontWeight: '700' }}>{email}</Text>
            , but this account doesn't have admin privileges.
          </Text>
        </View>
      </View>
      <Pressable
        onPress={onSignOut}
        style={{
          height: 44,
          borderRadius: 12,
          backgroundColor: C.ink,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontFamily: FONT.sans, fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>
          Sign out & try a different account
        </Text>
      </Pressable>
      <Pressable
        onPress={onDashboard}
        style={{
          paddingVertical: 14,
          alignItems: 'center',
        }}
      >
        <Text style={{ fontFamily: FONT.sans, fontSize: 12, color: C.muted, fontWeight: '500' }}>
          Or go to your dashboard →
        </Text>
      </Pressable>
    </View>
  );
}
