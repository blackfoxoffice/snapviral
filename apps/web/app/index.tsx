import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
  Image,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import {
  ArrowRight,
  Plus,
  Minus,
  Check,
  Play,
  Sparkles,
  Globe2,
  Film,
  Layers,
  Wand2,
  Languages,
  Mic2,
  PaletteIcon,
  Calendar,
} from 'lucide-react-native';
import { useAuth } from '../lib/auth';
import { useBlogPosts, usePlans } from '../lib/queries';
import { SnapViralLogo } from '../components/icons/SnapViralLogo';

// =====================================================================
// Global keyframes & web fonts
// =====================================================================
const KEYFRAMES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Newsreader:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=JetBrains+Mono:wght@400;500;600&display=swap');

:root { --sv-ink: #0A0A0B; --sv-red: #E11D2C; --sv-redhot: #FF2D40; }
html, body { background: #FFFFFF; font-family: Inter, -apple-system, sans-serif; }
* { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
::selection { background: #0A0A0B; color: #FFFFFF; }

@keyframes sv-fade-up { from { opacity: 0; transform: translate3d(0,16px,0); } to { opacity: 1; transform: translate3d(0,0,0); } }
@keyframes sv-rise-in { from { opacity: 0; transform: translate3d(0,24px,0) scale(0.98); filter: blur(4px); } to { opacity: 1; transform: translate3d(0,0,0) scale(1); filter: blur(0); } }
@keyframes sv-pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
@keyframes sv-pulse-ring { 0%, 100% { box-shadow: 0 0 0 0 rgba(225,29,44,0.55); } 50% { box-shadow: 0 0 0 7px rgba(225,29,44,0); } }
@keyframes sv-marquee { from { transform: translate3d(0,0,0); } to { transform: translate3d(-50%,0,0); } }
@keyframes sv-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
@keyframes sv-shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes sv-spin { to { transform: rotate(360deg); } }
@keyframes sv-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
`;

function useInjectStyles() {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById('sv-keyframes')) return;
    const el = document.createElement('style');
    el.id = 'sv-keyframes';
    el.textContent = KEYFRAMES;
    document.head.appendChild(el);
  }, []);
}

const FONT = {
  sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  serif: 'Newsreader, Georgia, "Times New Roman", serif',
  mono: '"JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
} as const;

const C = {
  ink: '#0A0A0B',
  body: '#27272A',
  muted: '#52525B',
  subtle: '#71717A',
  faint: '#A1A1AA',
  hairline: 'rgba(10,10,11,0.08)',
  hair: 'rgba(10,10,11,0.06)',
  paper: '#FFFFFF',
  warm: '#FAFAF7',
  surface: '#F4F4F5',
  surface2: '#EFEFEF',
  red: '#E11D2C',
  redHot: '#FF2D40',
  redDeep: '#9F0617',
  green: '#16A34A',
  blue: '#2563EB',
  purple: '#7C3AED',
  amber: '#F59E0B',
} as const;

// Curated photographic backdrops (Unsplash CDN, hotlink-safe)
const IMG = {
  studio: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=1200&q=80&auto=format&fit=crop',
  desk: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80&auto=format&fit=crop',
  creator1: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&q=80&auto=format&fit=crop',
  creator2: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&h=400&q=80&auto=format&fit=crop',
  creator3: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&q=80&auto=format&fit=crop',
  creator4: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&q=80&auto=format&fit=crop',
  creator5: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&q=80&auto=format&fit=crop',
  cartoonGirl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=600&q=80&auto=format&fit=crop',
  film: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1000&q=80&auto=format&fit=crop',
  landscape: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=80&auto=format&fit=crop',
  abstractRed: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=1400&q=80&auto=format&fit=crop',
} as const;

// =====================================================================
// Page
// =====================================================================
export default function Index() {
  useInjectStyles();
  const { session, loading } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1100;
  const padX = isMobile ? 20 : isTablet ? 32 : 48;

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.paper }}>
        <ActivityIndicator color={C.red} />
      </View>
    );
  }
  if (session) return <Redirect href="/dashboard" />;

  const ctx: Ctx = { isMobile, isTablet, padX, router };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.paper, ...({ fontFamily: FONT.sans } as any) }}
      showsVerticalScrollIndicator={false}
    >
      <Nav ctx={ctx} />
      <Hero ctx={ctx} />
      <SocialProof ctx={ctx} />
      <FeatureStack ctx={ctx} />
      <DeepDiveCartoons ctx={ctx} />
      <DeepDiveShorts ctx={ctx} />
      <DeepDiveMultilang ctx={ctx} />
      <StatsBlock ctx={ctx} />
      <PromoBlock ctx={ctx} />
      <Pricing ctx={ctx} />
      <BlogStrip ctx={ctx} />
      <FAQ ctx={ctx} />
      <Convert ctx={ctx} />
      <Footer ctx={ctx} />
    </ScrollView>
  );
}

type Ctx = { isMobile: boolean; isTablet: boolean; padX: number; router: ReturnType<typeof useRouter> };

// =====================================================================
// NAV
// =====================================================================
function Nav({ ctx }: { ctx: Ctx }) {
  const { isMobile, padX, router } = ctx;
  return (
    <View
      style={{
        position: 'sticky' as any,
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(255,255,255,0.78)',
        borderBottomWidth: 1,
        borderBottomColor: C.hair,
        ...({ backdropFilter: 'saturate(180%) blur(14px)', WebkitBackdropFilter: 'saturate(180%) blur(14px)' } as any),
      }}
    >
      <View
        style={{
          maxWidth: 1280,
          width: '100%',
          alignSelf: 'center',
          paddingHorizontal: padX,
          height: 64,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Pressable onPress={() => router.push('/' as any)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <SnapViralLogo size={26} />
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={{ fontFamily: FONT.sans, fontSize: 17, fontWeight: '800', color: C.ink, letterSpacing: -0.4 }}>
              Snap
            </Text>
            <Text style={{ fontFamily: FONT.serif, fontStyle: 'italic', fontSize: 17, fontWeight: '600', color: C.red, letterSpacing: -0.4 }}>
              Viral
            </Text>
          </View>
        </Pressable>

        {!isMobile ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 28 }}>
            <NavLink label="Product" />
            <NavLink label="Features" />
            <NavLink label="Pricing" />
            <NavLink label="Blog" onPress={() => router.push('/blog' as any)} />
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {!isMobile ? (
            <Pressable
              onPress={() => router.push('/login')}
              style={{ paddingHorizontal: 14, height: 36, justifyContent: 'center' }}
            >
              <Text style={{ fontFamily: FONT.sans, fontSize: 13, color: C.body, fontWeight: '500' }}>Sign in</Text>
            </Pressable>
          ) : null}
          <CTA primary compact onPress={() => router.push('/signup')}>
            {isMobile ? 'Sign up' : 'Start free'}
          </CTA>
        </View>
      </View>
    </View>
  );
}

function NavLink({ label, onPress }: { label: string; onPress?: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <Pressable onPress={onPress} onHoverIn={() => setHover(true)} onHoverOut={() => setHover(false)}>
      <View style={{ height: 36, justifyContent: 'center', position: 'relative' }}>
        <Text
          style={{
            fontFamily: FONT.sans,
            fontSize: 13,
            color: hover ? C.ink : C.body,
            fontWeight: '500',
            ...({ transition: 'color 180ms ease' } as any),
          }}
        >
          {label}
        </Text>
        <View
          style={{
            position: 'absolute',
            bottom: 8,
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: C.ink,
            transformOrigin: 'left' as any,
            transform: [{ scaleX: hover ? 1 : 0 }] as any,
            ...({ transition: 'transform 280ms cubic-bezier(0.2,0.8,0.2,1)' } as any),
          }}
        />
      </View>
    </Pressable>
  );
}

function CTA({
  children,
  primary,
  compact,
  onPress,
  inverse,
  ghost,
}: {
  children: React.ReactNode;
  primary?: boolean;
  compact?: boolean;
  onPress?: () => void;
  inverse?: boolean;
  ghost?: boolean;
}) {
  const [hover, setHover] = useState(false);
  const bg = inverse ? '#FFFFFF' : primary ? C.ink : ghost ? 'transparent' : 'rgba(255,255,255,0.10)';
  const fg = inverse ? C.ink : primary ? '#FFFFFF' : ghost ? '#FFFFFF' : '#FFFFFF';
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        paddingHorizontal: compact ? 14 : 22,
        height: compact ? 36 : 50,
        borderRadius: 999,
        backgroundColor: bg,
        borderWidth: ghost ? 1 : 0,
        borderColor: 'rgba(255,255,255,0.20)',
        transform: [{ translateY: hover ? -1 : 0 }] as any,
        ...({
          transition: 'transform 220ms cubic-bezier(0.2,0.8,0.2,1), box-shadow 220ms ease, background-color 220ms ease',
          boxShadow: hover && primary
            ? '0 12px 32px -12px rgba(10,10,11,0.30)'
            : hover && inverse
              ? '0 12px 32px -12px rgba(255,255,255,0.30)'
              : 'none',
        } as any),
      }}
    >
      <Text style={{ fontFamily: FONT.sans, fontSize: compact ? 13 : 15, fontWeight: '600', color: fg, letterSpacing: -0.2 }}>
        {children}
      </Text>
      <ArrowRight size={compact ? 12 : 14} color={fg} />
    </Pressable>
  );
}

// =====================================================================
// HERO
// =====================================================================
function Hero({ ctx }: { ctx: Ctx }) {
  const { isMobile, padX, router } = ctx;
  return (
    <View style={{ position: 'relative', overflow: 'hidden', backgroundColor: '#100208' }}>
      {/* Layered red gradient backdrop */}
      <View
        style={{
          position: 'absolute',
          inset: 0 as any,
          ...({
            backgroundImage:
              'radial-gradient(ellipse 120% 80% at 50% -10%, rgba(255,45,64,0.45) 0%, rgba(225,29,44,0.20) 30%, rgba(20,2,8,0.95) 70%), ' +
              'radial-gradient(circle at 80% 20%, rgba(255,107,122,0.30), transparent 50%), ' +
              'radial-gradient(circle at 20% 80%, rgba(159,6,23,0.40), transparent 50%), ' +
              'linear-gradient(180deg, #100208 0%, #1a040a 50%, #0a0104 100%)',
          } as any),
        }}
      />
      {/* Subtle dotted texture */}
      <View
        style={{
          position: 'absolute',
          inset: 0 as any,
          opacity: 0.4,
          ...({
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          } as any),
        }}
      />

      <View
        style={{
          maxWidth: 1280,
          width: '100%',
          alignSelf: 'center',
          paddingHorizontal: padX,
          paddingTop: isMobile ? 64 : 110,
          paddingBottom: isMobile ? 48 : 72,
          alignItems: 'center',
          zIndex: 1,
        }}
      >
        {/* New badge */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 12,
            height: 30,
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.12)',
            marginBottom: 28,
            ...({ animation: 'sv-fade-up 700ms cubic-bezier(0.2,0.8,0.2,1) both' } as any),
          }}
        >
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: C.redHot,
              ...({ animation: 'sv-pulse-dot 1.6s ease-in-out infinite' } as any),
            }}
          />
          <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: '500', letterSpacing: 0.3 }}>
            v2 · cartoon scenes are live
          </Text>
        </View>

        {/* Headline */}
        <View
          style={{
            alignItems: 'center',
            ...({ animation: 'sv-fade-up 800ms 100ms cubic-bezier(0.2,0.8,0.2,1) both' } as any),
          }}
        >
          <Text
            style={{
              fontFamily: FONT.sans,
              fontSize: isMobile ? 44 : 92,
              lineHeight: isMobile ? 48 : 96,
              fontWeight: '800',
              color: '#FFFFFF',
              letterSpacing: isMobile ? -1.8 : -3.8,
              textAlign: 'center',
              maxWidth: 1080,
            }}
          >
            Make any video.{'\n'}
            <Text style={{ fontFamily: FONT.serif, fontStyle: 'italic', fontWeight: '500', color: C.redHot }}>
              In any language.
            </Text>{' '}
            On{' '}
            <Text style={{ position: 'relative' as any }}>
              <Text style={{ color: '#FFFFFF' }}>autopilot</Text>
              <View
                style={{
                  position: 'absolute',
                  bottom: 6,
                  left: 0,
                  right: 0,
                  height: isMobile ? 3 : 6,
                  borderRadius: 999,
                  backgroundColor: C.redHot,
                  ...({ animation: 'sv-fade-up 1200ms 800ms cubic-bezier(0.2,0.8,0.2,1) both' } as any),
                }}
              />
            </Text>
            .
          </Text>
        </View>

        {/* Subhead */}
        <Text
          style={{
            fontFamily: FONT.sans,
            fontSize: isMobile ? 16 : 19,
            lineHeight: isMobile ? 24 : 30,
            color: 'rgba(255,255,255,0.7)',
            textAlign: 'center',
            maxWidth: 640,
            marginTop: 28,
            ...({ animation: 'sv-fade-up 900ms 220ms cubic-bezier(0.2,0.8,0.2,1) both' } as any),
          }}
        >
          Cartoon explainers. Vertical Shorts. Long-form essays. Talking-head news. SnapViral
          scripts, narrates, animates and ships them straight to your channel — in Tamil, Hindi
          or English. You bring the idea.
        </Text>

        {/* CTAs */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            marginTop: 32,
            ...({ animation: 'sv-fade-up 1000ms 320ms cubic-bezier(0.2,0.8,0.2,1) both' } as any),
          }}
        >
          <CTA inverse onPress={() => router.push('/signup')}>
            Start free
          </CTA>
          <CTA ghost onPress={() => router.push('/login')}>
            Sign in
          </CTA>
        </View>

        <View
          style={{
            marginTop: 18,
            ...({ animation: 'sv-fade-up 1100ms 420ms cubic-bezier(0.2,0.8,0.2,1) both' } as any),
          }}
        >
          <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
            $0 to start · no card · cancel any time
          </Text>
        </View>
      </View>

      {/* Floating Mac mockup with dashboard */}
      <View
        style={{
          paddingHorizontal: padX,
          paddingBottom: isMobile ? 24 : 56,
          alignItems: 'center',
          zIndex: 1,
          ...({ animation: 'sv-rise-in 1200ms 500ms cubic-bezier(0.2,0.8,0.2,1) both' } as any),
        }}
      >
        <MacMockup ctx={ctx} />
      </View>
    </View>
  );
}

function MacMockup({ ctx }: { ctx: Ctx }) {
  const { isMobile } = ctx;
  return (
    <View
      style={{
        maxWidth: 1100,
        width: '100%',
        borderRadius: isMobile ? 12 : 18,
        backgroundColor: '#1A1A1C',
        padding: isMobile ? 6 : 10,
        ...({
          boxShadow:
            '0 60px 120px -40px rgba(0,0,0,0.7), 0 30px 60px -20px rgba(225,29,44,0.25), inset 0 1px 0 rgba(255,255,255,0.06)',
        } as any),
      }}
    >
      <View
        style={{
          borderRadius: isMobile ? 8 : 12,
          backgroundColor: '#0F0F11',
          overflow: 'hidden',
        }}
      >
        {/* Mac chrome */}
        <View
          style={{
            height: isMobile ? 28 : 36,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 14,
            gap: 6,
            backgroundColor: '#1A1A1C',
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(255,255,255,0.06)',
          }}
        >
          <View style={{ width: 11, height: 11, borderRadius: 5.5, backgroundColor: '#FF5F57' }} />
          <View style={{ width: 11, height: 11, borderRadius: 5.5, backgroundColor: '#FEBC2E' }} />
          <View style={{ width: 11, height: 11, borderRadius: 5.5, backgroundColor: '#28C840' }} />
          {!isMobile ? (
            <View style={{ flex: 1, alignItems: 'center' }}>
              <View
                style={{
                  paddingHorizontal: 12,
                  height: 22,
                  borderRadius: 6,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 6,
                }}
              >
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.redHot, ...({ animation: 'sv-pulse-dot 1.6s ease-in-out infinite' } as any) }} />
                <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
                  app.snapviral.in / studio
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Studio body */}
        <View style={{ flexDirection: 'row', minHeight: isMobile ? 320 : 540 }}>
          {/* Sidebar */}
          {!isMobile ? (
            <View
              style={{
                width: 200,
                backgroundColor: '#0A0A0C',
                paddingVertical: 18,
                paddingHorizontal: 12,
                borderRightWidth: 1,
                borderRightColor: 'rgba(255,255,255,0.04)',
                gap: 4,
              }}
            >
              {[
                { l: 'Studio', a: true },
                { l: 'Library' },
                { l: 'Auto-publish', dot: true },
                { l: 'YouTube' },
                { l: 'Voice lab' },
                { l: 'Cartoons' },
                { l: 'Settings' },
              ].map((it, i) => (
                <View
                  key={i}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: it.a ? 'rgba(255,45,64,0.16)' : 'transparent',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text style={{ fontFamily: FONT.sans, fontSize: 12, fontWeight: it.a ? '600' : '500', color: it.a ? '#FFFFFF' : 'rgba(255,255,255,0.6)' }}>
                    {it.l}
                  </Text>
                  {it.dot ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' }} /> : null}
                </View>
              ))}
            </View>
          ) : null}

          {/* Main canvas */}
          <View style={{ flex: 1, padding: isMobile ? 14 : 24, gap: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <View>
                <Text style={{ fontFamily: FONT.sans, fontSize: isMobile ? 14 : 16, fontWeight: '700', color: '#FFFFFF' }}>
                  New scene
                </Text>
                <Text style={{ fontFamily: FONT.mono, fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                  studio · cartoon · 60s
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <View style={{ paddingHorizontal: 10, height: 28, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: FONT.sans, fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Save draft</Text>
                </View>
                <View style={{ paddingHorizontal: 10, height: 28, borderRadius: 999, backgroundColor: C.red, justifyContent: 'center', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Play size={9} color="#FFFFFF" fill="#FFFFFF" />
                  <Text style={{ fontFamily: FONT.sans, fontSize: 11, fontWeight: '600', color: '#FFFFFF' }}>Render</Text>
                </View>
              </View>
            </View>

            {/* Viewport */}
            <View
              style={{
                aspectRatio: isMobile ? 16 / 9 : 16 / 8,
                borderRadius: 10,
                backgroundColor: '#1A1A1C',
                overflow: 'hidden',
                position: 'relative',
                ...({
                  backgroundImage:
                    'linear-gradient(135deg, #2D1B0E 0%, #4A2820 35%, #3F1D1F 70%, #1A0A0E 100%)',
                } as any),
              }}
            >
              {/* Cartoon character placeholder */}
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '15%',
                  width: isMobile ? 72 : 140,
                  height: isMobile ? 110 : 200,
                  ...({ animation: 'sv-float 4s ease-in-out infinite' } as any),
                }}
              >
                <View
                  style={{
                    width: '100%',
                    aspectRatio: 0.7,
                    borderRadius: 999,
                    ...({
                      backgroundImage: 'radial-gradient(circle at 50% 30%, #FFD7B5 0%, #E8A87C 100%)',
                    } as any),
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    top: '12%',
                    left: '32%',
                    width: '8%',
                    height: '6%',
                    borderRadius: 999,
                    backgroundColor: '#0A0A0B',
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    top: '12%',
                    left: '60%',
                    width: '8%',
                    height: '6%',
                    borderRadius: 999,
                    backgroundColor: '#0A0A0B',
                  }}
                />
              </View>

              {/* Caption */}
              <View
                style={{
                  position: 'absolute',
                  bottom: 14,
                  left: 0,
                  right: 0,
                  alignItems: 'center',
                }}
              >
                <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.7)' }}>
                  <Text style={{ fontFamily: FONT.sans, fontSize: isMobile ? 10 : 13, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 }}>
                    Once upon a Tuesday in Chennai...
                  </Text>
                </View>
              </View>

              {/* Play badge */}
              <View
                style={{
                  position: 'absolute',
                  top: 14,
                  left: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 8,
                  height: 22,
                  borderRadius: 999,
                  backgroundColor: 'rgba(0,0,0,0.55)',
                }}
              >
                <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.redHot, ...({ animation: 'sv-pulse-dot 1.6s ease-in-out infinite' } as any) }} />
                <Text style={{ fontFamily: FONT.mono, fontSize: 9, color: '#FFFFFF', letterSpacing: 0.5, fontWeight: '600' }}>
                  REC · 0:24
                </Text>
              </View>
            </View>

            {/* Timeline strip */}
            <View
              style={{
                borderRadius: 10,
                backgroundColor: '#1A1A1C',
                padding: 10,
                gap: 8,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.04)',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: FONT.mono, fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: 1, textTransform: 'uppercase' }}>
                  timeline · 6 scenes
                </Text>
                <Text style={{ fontFamily: FONT.mono, fontSize: 10, color: 'rgba(255,255,255,0.55)', fontVariant: ['tabular-nums'] as any }}>
                  00:24 / 00:60
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {[0.6, 1, 0.4, 0.8, 0.5, 0.7].map((w, i) => (
                  <View
                    key={i}
                    style={{
                      flex: w,
                      height: isMobile ? 22 : 32,
                      borderRadius: 4,
                      backgroundColor: i === 1 ? C.red : 'rgba(255,255,255,0.10)',
                      ...(i === 1 ? ({ boxShadow: '0 0 0 2px rgba(225,29,44,0.30)' } as any) : {}),
                    }}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// SOCIAL PROOF
// =====================================================================
function SocialProof({ ctx }: { ctx: Ctx }) {
  const { isMobile, padX } = ctx;
  return (
    <View
      style={{
        backgroundColor: C.warm,
        paddingHorizontal: padX,
        paddingTop: isMobile ? 56 : 96,
        paddingBottom: isMobile ? 56 : 96,
        borderBottomWidth: 1,
        borderBottomColor: C.hair,
      }}
    >
      <View style={{ maxWidth: 1280, width: '100%', alignSelf: 'center', alignItems: 'center' }}>
        <View
          style={{
            paddingHorizontal: 12,
            height: 26,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: C.hairline,
            backgroundColor: C.paper,
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <Text style={{ fontFamily: FONT.mono, fontSize: 10, color: C.muted, letterSpacing: 1.2 }}>
            POWERING THE WORLD'S
          </Text>
        </View>
        <Text
          style={{
            fontFamily: FONT.sans,
            fontSize: isMobile ? 28 : 48,
            lineHeight: isMobile ? 32 : 54,
            fontWeight: '700',
            color: C.ink,
            letterSpacing: isMobile ? -1.2 : -2.2,
            textAlign: 'center',
            maxWidth: 800,
            marginBottom: isMobile ? 32 : 56,
          }}
        >
          most ambitious{' '}
          <Text style={{ fontFamily: FONT.serif, fontStyle: 'italic', fontWeight: '500' }}>creator channels</Text>
        </Text>

        {/* Floating creator avatars */}
        <CreatorOrbit ctx={ctx} />
      </View>
    </View>
  );
}

function CreatorOrbit({ ctx }: { ctx: Ctx }) {
  const { isMobile } = ctx;
  const cards = [
    { src: IMG.creator1, name: 'Priya M.', subs: '142K', tag: 'Tamil news', color: C.red, delay: 0 },
    { src: IMG.creator2, name: 'Vignesh K.', subs: '88K', tag: 'Cartoons', color: C.blue, delay: 120 },
    { src: IMG.creator3, name: 'Rahul S.', subs: '210K', tag: 'Tech shorts', color: C.purple, delay: 240 },
    { src: IMG.creator4, name: 'Aisha N.', subs: '64K', tag: 'Hindi essays', color: C.amber, delay: 360 },
    { src: IMG.creator5, name: 'Karthik R.', subs: '320K', tag: 'Long-form', color: C.green, delay: 480 },
  ];
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 14,
        justifyContent: 'center',
        maxWidth: 980,
      }}
    >
      {cards.map((c, i) => (
        <CreatorCard key={i} {...c} isMobile={isMobile} />
      ))}
    </View>
  );
}

function CreatorCard({
  src,
  name,
  subs,
  tag,
  color,
  delay,
  isMobile,
}: {
  src: string;
  name: string;
  subs: string;
  tag: string;
  color: string;
  delay: number;
  isMobile: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <Pressable
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={{
        flexBasis: isMobile ? '47%' : 180,
        flexGrow: 0,
        backgroundColor: C.paper,
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: C.hairline,
        alignItems: 'center',
        transform: [{ translateY: hover ? -8 : 0 }] as any,
        ...({
          transition: 'transform 350ms cubic-bezier(0.2,0.8,0.2,1), box-shadow 350ms ease',
          boxShadow: hover
            ? `0 20px 40px -20px ${color}55`
            : '0 1px 0 rgba(10,10,11,0.04), 0 2px 8px rgba(10,10,11,0.04)',
          animation: `sv-rise-in 700ms ${delay}ms cubic-bezier(0.2,0.8,0.2,1) both`,
        } as any),
      }}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          marginBottom: 12,
          overflow: 'hidden',
          borderWidth: 2,
          borderColor: color,
          ...({ boxShadow: `0 0 0 4px ${color}22` } as any),
        }}
      >
        <Image source={{ uri: src }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      </View>
      <Text style={{ fontFamily: FONT.sans, fontSize: 13, fontWeight: '700', color: C.ink, marginBottom: 2 }}>
        {name}
      </Text>
      <Text style={{ fontFamily: FONT.mono, fontSize: 10, color: color, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6 }}>
        {tag.toUpperCase()}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: 8,
          height: 22,
          borderRadius: 999,
          backgroundColor: C.surface,
        }}
      >
        <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#FF0000' }} />
        <Text style={{ fontFamily: FONT.sans, fontSize: 11, fontWeight: '600', color: C.body }}>
          {subs} subs
        </Text>
      </View>
    </Pressable>
  );
}

// =====================================================================
// FEATURE STACK
// =====================================================================
function FeatureStack({ ctx }: { ctx: Ctx }) {
  const { isMobile, isTablet, padX } = ctx;
  const cols = isMobile ? 1 : isTablet ? 2 : 3;
  return (
    <View style={{ paddingHorizontal: padX, paddingVertical: isMobile ? 64 : 120 }}>
      <View style={{ maxWidth: 1280, width: '100%', alignSelf: 'center' }}>
        <SectionEyebrow>Stack</SectionEyebrow>
        <Text
          style={{
            fontFamily: FONT.sans,
            fontSize: isMobile ? 32 : 56,
            lineHeight: isMobile ? 36 : 60,
            fontWeight: '700',
            color: C.ink,
            letterSpacing: isMobile ? -1.4 : -2.4,
            marginTop: 14,
            marginBottom: isMobile ? 32 : 56,
            maxWidth: 800,
          }}
        >
          The complete{' '}
          <Text style={{ fontFamily: FONT.serif, fontStyle: 'italic', fontWeight: '500' }}>
            video creation
          </Text>{' '}
          stack.
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
          <FeatureTile
            cols={cols}
            spanCols={cols === 3 ? 1 : cols === 2 ? 1 : 1}
            color={C.red}
            Icon={Sparkles}
            title="Cartoon scenes"
            body="Pick a character, type a story, get a 30-second animated short. Lip-synced narration in any language."
            visual={<TileVisualCartoon />}
          />
          <FeatureTile
            cols={cols}
            spanCols={cols === 3 ? 2 : cols === 2 ? 1 : 1}
            color={C.blue}
            Icon={Film}
            title="Vertical Shorts"
            body="9:16 format. Auto-generated visuals, voiceover, subtitle burn-in. Direct-publish to YouTube Shorts on a schedule."
            visual={<TileVisualShorts />}
          />
          <FeatureTile
            cols={cols}
            spanCols={cols === 3 ? 1 : cols === 2 ? 1 : 1}
            color={C.purple}
            Icon={Languages}
            title="Native multilingual"
            body="Tamil, Hindi & English. Real Devanagari shaping. Native voiceovers your audience can't tell from a person."
            visual={<TileVisualLang />}
          />
          <FeatureTile
            cols={cols}
            spanCols={cols === 3 ? 1 : cols === 2 ? 1 : 1}
            color={C.green}
            Icon={Mic2}
            title="Voice library"
            body="50+ studio-quality voices. Per-topic overrides. Different anchors for different segments."
            visual={<TileVisualVoice />}
          />
          <FeatureTile
            cols={cols}
            spanCols={cols === 3 ? 1 : cols === 2 ? 2 : 1}
            color={C.amber}
            Icon={Calendar}
            title="Auto-publish"
            body="Drop 100 topics. Pick the times. Walk away. We fire within 60 seconds of every slot — 5am if that's your audience."
            visual={<TileVisualSchedule />}
          />
          <FeatureTile
            cols={cols}
            spanCols={cols === 3 ? 1 : cols === 2 ? 1 : 1}
            color={C.ink}
            Icon={Layers}
            title="Long-form essays"
            body="3-minute explainers, 8-minute deep-dives. Cited research. Multi-scene composition with a real script structure."
            visual={<TileVisualLongform />}
          />
        </View>
      </View>
    </View>
  );
}

function FeatureTile({
  cols,
  spanCols,
  color,
  title,
  body,
  visual,
}: {
  cols: number;
  spanCols: number;
  color: string;
  Icon: any;
  title: string;
  body: string;
  visual: React.ReactNode;
}) {
  const [hover, setHover] = useState(false);
  const basis = `calc(${(spanCols / cols) * 100}% - ${(14 * (cols - 1) * spanCols) / cols}px)`;
  return (
    <Pressable
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={{
        flexBasis: basis as any,
        flexGrow: 0,
        flexShrink: 0,
        minWidth: 220,
        minHeight: 320,
        backgroundColor: C.paper,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: hover ? color : C.hairline,
        padding: 22,
        gap: 16,
        overflow: 'hidden',
        ...({
          transition: 'border-color 280ms ease, transform 350ms cubic-bezier(0.2,0.8,0.2,1), box-shadow 350ms ease',
          transform: hover ? 'translateY(-4px)' : 'translateY(0)',
          boxShadow: hover
            ? `0 24px 48px -24px ${color}33, 0 1px 0 rgba(10,10,11,0.04)`
            : '0 1px 0 rgba(10,10,11,0.04)',
        } as any),
      }}
    >
      {/* Visual */}
      <View
        style={{
          minHeight: 160,
          borderRadius: 12,
          backgroundColor: C.warm,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: C.hair,
        }}
      >
        {visual}
      </View>

      {/* Title + body */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: FONT.sans, fontSize: 17, fontWeight: '700', color: C.ink, letterSpacing: -0.4, marginBottom: 6 }}>
          {title}
        </Text>
        <Text style={{ fontFamily: FONT.sans, fontSize: 13, color: C.muted, lineHeight: 20 }}>
          {body}
        </Text>
      </View>
    </Pressable>
  );
}

// Tile visuals — actual product mock-style elements

function TileVisualCartoon() {
  return (
    <View
      style={{
        flex: 1,
        ...({
          backgroundImage:
            'radial-gradient(circle at 30% 40%, #FFD7B5 0%, #FFB088 40%, #C8102E 100%)',
        } as any),
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Cartoon character */}
      <View style={{ position: 'absolute', bottom: -20, left: '50%', marginLeft: -40, width: 80, height: 110, ...({ animation: 'sv-float 3.5s ease-in-out infinite' } as any) }}>
        <View style={{ width: '100%', aspectRatio: 0.7, borderRadius: 999, backgroundColor: '#FFE0C7', borderWidth: 2, borderColor: '#0A0A0B' }} />
        <View style={{ position: 'absolute', top: '20%', left: '28%', width: 8, height: 8, borderRadius: 4, backgroundColor: '#0A0A0B' }} />
        <View style={{ position: 'absolute', top: '20%', right: '28%', width: 8, height: 8, borderRadius: 4, backgroundColor: '#0A0A0B' }} />
        <View style={{ position: 'absolute', top: '38%', left: '38%', width: 16, height: 6, borderRadius: 3, backgroundColor: '#E11D2C' }} />
      </View>
      <View style={{ position: 'absolute', top: 12, left: 12, paddingHorizontal: 8, height: 22, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: FONT.mono, fontSize: 9, fontWeight: '700', color: C.ink, letterSpacing: 0.8 }}>
          CARTOON · 30s
        </Text>
      </View>
    </View>
  );
}

function TileVisualShorts() {
  return (
    <View style={{ flex: 1, padding: 14, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: C.warm }}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            width: 60,
            aspectRatio: 9 / 16,
            borderRadius: 8,
            ...({
              backgroundImage:
                i === 0
                  ? 'linear-gradient(135deg, #1F2937, #C8102E)'
                  : i === 1
                    ? 'linear-gradient(135deg, #2D1B0E, #FF2D40)'
                    : 'linear-gradient(135deg, #1F1A2C, #7C3AED)',
            } as any),
            justifyContent: 'flex-end',
            padding: 6,
            transform: [{ rotate: `${(i - 1) * 4}deg` }] as any,
          }}
        >
          <View style={{ height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.6)' }} />
          <View style={{ height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)', marginTop: 3, width: '70%' }} />
        </View>
      ))}
    </View>
  );
}

function TileVisualLang() {
  return (
    <View style={{ flex: 1, padding: 16, gap: 6, backgroundColor: C.warm }}>
      {[
        { glyph: 'த', label: 'Tamil', color: C.red },
        { glyph: 'अ', label: 'Hindi', color: C.purple },
        { glyph: 'A', label: 'English', color: C.blue },
      ].map((l, i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            padding: 8,
            borderRadius: 8,
            backgroundColor: C.paper,
            borderWidth: 1,
            borderColor: C.hair,
          }}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              backgroundColor: `${l.color}14`,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: `${l.color}30`,
            }}
          >
            <Text style={{ fontFamily: FONT.serif, fontSize: 16, fontWeight: '600', color: l.color, fontStyle: 'italic' }}>
              {l.glyph}
            </Text>
          </View>
          <Text style={{ fontFamily: FONT.sans, fontSize: 12, fontWeight: '600', color: C.ink }}>
            {l.label}
          </Text>
          <View style={{ flex: 1 }} />
          <Check size={12} color={l.color} strokeWidth={3} />
        </View>
      ))}
    </View>
  );
}

function TileVisualVoice() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 2, paddingHorizontal: 14, backgroundColor: C.warm }}>
      {Array.from({ length: 36 }).map((_, i) => (
        <View
          key={i}
          style={{
            width: 3,
            height: `${20 + Math.abs(Math.sin(i * 0.6)) * 70}%`,
            backgroundColor: C.red,
            borderRadius: 1,
            opacity: 0.85,
            ...({
              animation: `sv-pulse-dot ${800 + (i % 5) * 100}ms ease-in-out infinite`,
              animationDelay: `${i * 30}ms`,
            } as any),
          }}
        />
      ))}
    </View>
  );
}

function TileVisualSchedule() {
  return (
    <View style={{ flex: 1, padding: 14, gap: 6, backgroundColor: C.warm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <View key={i} style={{ alignItems: 'center', gap: 6, flex: 1 }}>
            <Text style={{ fontFamily: FONT.mono, fontSize: 9, color: C.muted, fontWeight: '600' }}>{d}</Text>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: [0, 2, 4].includes(i) ? C.red : i === 1 ? C.amber : C.surface2,
                ...(i === 2 ? ({ animation: 'sv-pulse-ring 1.8s ease-out infinite' } as any) : {}),
              }}
            />
          </View>
        ))}
      </View>
      <View style={{ marginTop: 10, padding: 8, borderRadius: 6, backgroundColor: C.paper, borderWidth: 1, borderColor: C.hair }}>
        <Text style={{ fontFamily: FONT.mono, fontSize: 9, color: C.muted, letterSpacing: 0.5 }}>
          NEXT FIRE
        </Text>
        <Text style={{ fontFamily: FONT.sans, fontSize: 12, fontWeight: '600', color: C.ink, marginTop: 2 }}>
          Wed · 13:00 IST
        </Text>
      </View>
    </View>
  );
}

function TileVisualLongform() {
  return (
    <View style={{ flex: 1, padding: 14, gap: 4, backgroundColor: '#0A0A0B', justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.redHot, ...({ animation: 'sv-pulse-dot 1.6s ease-in-out infinite' } as any) }} />
        <Text style={{ fontFamily: FONT.mono, fontSize: 9, color: 'rgba(255,255,255,0.6)' }}>
          script.md
        </Text>
      </View>
      <View style={{ gap: 3 }}>
        <View style={{ height: 6, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', width: '90%' }} />
        <View style={{ height: 6, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.10)', width: '70%' }} />
        <View style={{ height: 6, borderRadius: 2, backgroundColor: 'rgba(225,29,44,0.40)', width: '85%' }} />
        <View style={{ height: 6, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.10)', width: '60%' }} />
        <View style={{ height: 6, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', width: '95%' }} />
      </View>
      <Text style={{ fontFamily: FONT.mono, fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>
        8m · 12 scenes · cited
      </Text>
    </View>
  );
}

// =====================================================================
// DEEP DIVES (alternating left/right)
// =====================================================================
function DeepDiveCartoons({ ctx }: { ctx: Ctx }) {
  const { isMobile, padX } = ctx;
  return (
    <View style={{ paddingHorizontal: padX, paddingVertical: isMobile ? 64 : 120, backgroundColor: C.warm, borderTopWidth: 1, borderTopColor: C.hair }}>
      <View
        style={{
          maxWidth: 1280,
          width: '100%',
          alignSelf: 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 32 : 80,
          alignItems: 'center',
        }}
      >
        <View style={{ flex: 1, width: '100%' }}>
          <SectionEyebrow color={C.purple}>Cartoon scenes</SectionEyebrow>
          <Text
            style={{
              fontFamily: FONT.sans,
              fontSize: isMobile ? 32 : 56,
              lineHeight: isMobile ? 36 : 62,
              fontWeight: '700',
              color: C.ink,
              letterSpacing: isMobile ? -1.4 : -2.4,
              marginTop: 14,
              marginBottom: 18,
            }}
          >
            Type a story.{'\n'}
            <Text style={{ fontFamily: FONT.serif, fontStyle: 'italic', fontWeight: '500', color: C.purple }}>
              Animate it
            </Text>{' '}
            in 4 minutes.
          </Text>
          <Text style={{ fontFamily: FONT.sans, fontSize: isMobile ? 16 : 18, lineHeight: isMobile ? 24 : 28, color: C.body, maxWidth: 480, marginBottom: 24 }}>
            Pick from 40+ cartoon characters. Drop in a script — or let SnapViral write one. Get a
            lip-synced animated scene with native voiceover, sound effects, and brand-safe music.
            Perfect for kids' stories, explainers, and viral hooks.
          </Text>
          <View style={{ gap: 12 }}>
            {['40+ cartoon styles · ages 4 to 80', 'Lip-sync in Tamil, Hindi & English', 'Royalty-free music & SFX', 'Brand kit: your colors, logo, font'].map((f, i) => (
              <BulletItem key={i} text={f} />
            ))}
          </View>
        </View>

        <View style={{ flex: 1, width: '100%' }}>
          <CartoonStudioMockup ctx={ctx} />
        </View>
      </View>
    </View>
  );
}

function CartoonStudioMockup({ ctx }: { ctx: Ctx }) {
  return (
    <View
      style={{
        borderRadius: 20,
        backgroundColor: C.paper,
        borderWidth: 1,
        borderColor: C.hairline,
        overflow: 'hidden',
        ...({ boxShadow: '0 30px 60px -30px rgba(124,58,237,0.30), 0 1px 0 rgba(10,10,11,0.04)' } as any),
      }}
    >
      {/* Stage */}
      <View
        style={{
          aspectRatio: 16 / 10,
          ...({
            backgroundImage: 'linear-gradient(135deg, #FCE7F3 0%, #DDD6FE 50%, #BFDBFE 100%)',
          } as any),
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Stage props */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', backgroundColor: 'rgba(255,255,255,0.2)' }} />
        {/* Sun */}
        <View style={{ position: 'absolute', top: 30, right: 40, width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFD60A', ...({ boxShadow: '0 0 40px rgba(255,214,10,0.6)' } as any) }} />
        {/* Cartoon characters */}
        <View style={{ position: 'absolute', bottom: '15%', left: '20%', ...({ animation: 'sv-float 3.5s ease-in-out infinite' } as any) }}>
          <CartoonChar primary="#F472B6" secondary="#FFE0C7" size={ctx.isMobile ? 80 : 120} />
        </View>
        <View style={{ position: 'absolute', bottom: '15%', right: '20%', ...({ animation: 'sv-float 4s ease-in-out infinite', animationDelay: '0.5s' } as any) }}>
          <CartoonChar primary="#60A5FA" secondary="#FFE0C7" size={ctx.isMobile ? 80 : 120} />
        </View>
        {/* Speech bubble */}
        <View
          style={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            marginLeft: -100,
            paddingHorizontal: 16,
            paddingVertical: 10,
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            borderWidth: 2,
            borderColor: C.ink,
            ...({ animation: 'sv-bounce 2s ease-in-out infinite' } as any),
          }}
        >
          <Text style={{ fontFamily: FONT.serif, fontStyle: 'italic', fontSize: 14, fontWeight: '600', color: C.ink }}>
            Once upon a time...
          </Text>
        </View>
      </View>

      {/* Controls */}
      <View style={{ padding: 16, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: C.surface, borderWidth: 1, borderColor: C.hair }}>
            <Text style={{ fontFamily: FONT.mono, fontSize: 10, color: C.muted, marginBottom: 2 }}>STORY</Text>
            <Text style={{ fontFamily: FONT.sans, fontSize: 12, color: C.ink, fontWeight: '500' }}>
              The little fox who learned to share...
            </Text>
          </View>
          <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: C.purple, alignItems: 'center', justifyContent: 'center' }}>
            <Wand2 size={14} color="#FFFFFF" />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {[C.red, C.purple, C.blue, C.green, C.amber].map((c, i) => (
            <View
              key={i}
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                backgroundColor: c,
                borderWidth: i === 1 ? 2 : 0,
                borderColor: C.ink,
              }}
            />
          ))}
          <View style={{ flex: 1 }} />
          <View style={{ paddingHorizontal: 10, height: 24, borderRadius: 999, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4 }}>
            <Play size={9} color={C.ink} fill={C.ink} />
            <Text style={{ fontFamily: FONT.mono, fontSize: 10, color: C.ink, fontWeight: '600' }}>0:14</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function CartoonChar({ primary, secondary, size }: { primary: string; secondary: string; size: number }) {
  return (
    <View style={{ width: size, height: size * 1.2 }}>
      {/* Body */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', borderRadius: size / 3, backgroundColor: primary, borderWidth: 2, borderColor: C.ink }} />
      {/* Head */}
      <View style={{ position: 'absolute', top: 0, left: '15%', right: '15%', aspectRatio: 1, borderRadius: size, backgroundColor: secondary, borderWidth: 2, borderColor: C.ink }}>
        {/* Eyes */}
        <View style={{ position: 'absolute', top: '35%', left: '25%', width: 6, height: 6, borderRadius: 3, backgroundColor: C.ink }} />
        <View style={{ position: 'absolute', top: '35%', right: '25%', width: 6, height: 6, borderRadius: 3, backgroundColor: C.ink }} />
        {/* Smile */}
        <View style={{ position: 'absolute', top: '55%', left: '35%', right: '35%', height: 3, borderBottomLeftRadius: 999, borderBottomRightRadius: 999, borderBottomWidth: 2, borderColor: C.ink }} />
      </View>
    </View>
  );
}

function DeepDiveShorts({ ctx }: { ctx: Ctx }) {
  const { isMobile, padX } = ctx;
  return (
    <View style={{ paddingHorizontal: padX, paddingVertical: isMobile ? 64 : 120, borderTopWidth: 1, borderTopColor: C.hair }}>
      <View
        style={{
          maxWidth: 1280,
          width: '100%',
          alignSelf: 'center',
          flexDirection: isMobile ? 'column' : 'row-reverse',
          gap: isMobile ? 32 : 80,
          alignItems: 'center',
        }}
      >
        <View style={{ flex: 1, width: '100%' }}>
          <SectionEyebrow>YouTube Shorts</SectionEyebrow>
          <Text
            style={{
              fontFamily: FONT.sans,
              fontSize: isMobile ? 32 : 56,
              lineHeight: isMobile ? 36 : 62,
              fontWeight: '700',
              color: C.ink,
              letterSpacing: isMobile ? -1.4 : -2.4,
              marginTop: 14,
              marginBottom: 18,
            }}
          >
            5 Shorts a day.{'\n'}
            <Text style={{ fontFamily: FONT.serif, fontStyle: 'italic', fontWeight: '500', color: C.red }}>
              Without a team.
            </Text>
          </Text>
          <Text style={{ fontFamily: FONT.sans, fontSize: isMobile ? 16 : 18, lineHeight: isMobile ? 24 : 28, color: C.body, maxWidth: 480, marginBottom: 24 }}>
            9:16 vertical. Auto-generated visuals tuned for your language and culture. Native
            voiceover. Subtitle burn-in with the right script. Direct-published to your YouTube
            channel on a schedule you set.
          </Text>
          <View style={{ gap: 12 }}>
            {['Topic to upload in 4 minutes', '1080×1920 with libass-burned subs', 'Auto-generated YouTube metadata', 'Schedule weeks in advance'].map((f, i) => (
              <BulletItem key={i} text={f} />
            ))}
          </View>
        </View>

        <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
          <PhonesMockup ctx={ctx} />
        </View>
      </View>
    </View>
  );
}

function PhonesMockup({ ctx }: { ctx: Ctx }) {
  return (
    <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
      {[
        { gradient: 'linear-gradient(160deg, #2D1B0E, #C8102E 60%, #1A0A0E)', title: 'Chennai Metro Phase 2', tag: 'TAMIL', delay: 0, scale: 0.9 },
        { gradient: 'linear-gradient(160deg, #1F2937, #2563EB 60%, #0F172A)', title: 'WWDC top 5', tag: 'ENGLISH', delay: 200, scale: 1 },
        { gradient: 'linear-gradient(160deg, #1F1A2C, #7C3AED 60%, #1A0A2E)', title: 'दिल्ली का मौसम', tag: 'HINDI', delay: 400, scale: 0.9 },
      ].map((p, i) => (
        <PhoneCard key={i} {...p} isMobile={ctx.isMobile} />
      ))}
    </View>
  );
}

function PhoneCard({
  gradient,
  title,
  tag,
  delay,
  scale,
  isMobile,
}: {
  gradient: string;
  title: string;
  tag: string;
  delay: number;
  scale: number;
  isMobile: boolean;
}) {
  return (
    <View
      style={{
        width: isMobile ? 90 : 150,
        aspectRatio: 9 / 19,
        borderRadius: 20,
        padding: 4,
        backgroundColor: '#0A0A0B',
        ...({
          animation: `sv-rise-in 800ms ${delay}ms cubic-bezier(0.2,0.8,0.2,1) both`,
          transform: `scale(${scale})`,
          boxShadow: '0 20px 40px -20px rgba(10,10,11,0.4)',
        } as any),
      }}
    >
      <View
        style={{
          flex: 1,
          borderRadius: 16,
          overflow: 'hidden',
          ...({ backgroundImage: gradient } as any),
          padding: 8,
          justifyContent: 'space-between',
        }}
      >
        <View
          style={{
            paddingHorizontal: 6,
            height: 16,
            borderRadius: 999,
            backgroundColor: 'rgba(0,0,0,0.5)',
            alignSelf: 'flex-start',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: FONT.mono, fontSize: 7, color: '#FFFFFF', fontWeight: '700', letterSpacing: 0.5 }}>
            {tag}
          </Text>
        </View>
        <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: 'rgba(255,255,255,0.18)',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1.5,
              borderColor: 'rgba(255,255,255,0.4)',
            }}
          >
            <Play size={11} color="#FFFFFF" fill="#FFFFFF" />
          </View>
        </View>
        <View
          style={{
            paddingHorizontal: 6,
            paddingVertical: 4,
            borderRadius: 4,
            backgroundColor: 'rgba(0,0,0,0.7)',
          }}
        >
          <Text style={{ fontFamily: FONT.sans, fontSize: 9, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.2 }} numberOfLines={2}>
            {title}
          </Text>
        </View>
      </View>
    </View>
  );
}

function DeepDiveMultilang({ ctx }: { ctx: Ctx }) {
  const { isMobile, padX } = ctx;
  return (
    <View style={{ paddingHorizontal: padX, paddingVertical: isMobile ? 64 : 120, backgroundColor: C.warm, borderTopWidth: 1, borderTopColor: C.hair }}>
      <View
        style={{
          maxWidth: 1280,
          width: '100%',
          alignSelf: 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 32 : 80,
          alignItems: 'center',
        }}
      >
        <View style={{ flex: 1, width: '100%' }}>
          <SectionEyebrow color={C.blue}>Long-form & multilingual</SectionEyebrow>
          <Text
            style={{
              fontFamily: FONT.sans,
              fontSize: isMobile ? 32 : 56,
              lineHeight: isMobile ? 36 : 62,
              fontWeight: '700',
              color: C.ink,
              letterSpacing: isMobile ? -1.4 : -2.4,
              marginTop: 14,
              marginBottom: 18,
            }}
          >
            8-minute essays.{'\n'}
            <Text style={{ fontFamily: FONT.serif, fontStyle: 'italic', fontWeight: '500', color: C.blue }}>
              Native everything.
            </Text>
          </Text>
          <Text style={{ fontFamily: FONT.sans, fontSize: isMobile ? 16 : 18, lineHeight: isMobile ? 24 : 28, color: C.body, maxWidth: 480, marginBottom: 24 }}>
            Long-form deep-dives with cited research. Multi-scene composition. Real script
            structure with hooks, beats, and CTAs. Tamil and Hindi voiceovers most agencies envy —
            with proper Devanagari and Tamil shaping in subtitles.
          </Text>
          <View style={{ gap: 12 }}>
            {['Cited live-web research', 'Studio voices in Ta / Hi / En', 'Multi-scene timeline editor', 'Brand-safe royalty-free music'].map((f, i) => (
              <BulletItem key={i} text={f} />
            ))}
          </View>
        </View>

        <View style={{ flex: 1, width: '100%' }}>
          <ScriptEditorMockup />
        </View>
      </View>
    </View>
  );
}

function ScriptEditorMockup() {
  return (
    <View
      style={{
        borderRadius: 20,
        backgroundColor: '#0A0A0B',
        overflow: 'hidden',
        ...({ boxShadow: '0 30px 60px -30px rgba(37,99,235,0.30)' } as any),
      }}
    >
      <View style={{ height: 32, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
        <View style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: '#FF5F57' }} />
        <View style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: '#FEBC2E' }} />
        <View style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: '#28C840' }} />
        <View style={{ flex: 1 }} />
        <Text style={{ fontFamily: FONT.mono, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>script.md</Text>
      </View>

      <View style={{ padding: 20, gap: 12 }}>
        <View>
          <Text style={{ fontFamily: FONT.mono, fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.2, marginBottom: 6 }}>
            # SCENE 01 · HOOK
          </Text>
          <Text style={{ fontFamily: FONT.serif, fontStyle: 'italic', fontSize: 18, fontWeight: '500', color: '#FFFFFF', lineHeight: 26 }}>
            What if I told you the average creator wastes 4 hours making one Short?
          </Text>
        </View>

        <View>
          <Text style={{ fontFamily: FONT.mono, fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.2, marginBottom: 6 }}>
            # SCENE 02 · CONTEXT
          </Text>
          <Text style={{ fontFamily: FONT.serif, fontSize: 16, color: 'rgba(255,255,255,0.8)', lineHeight: 24 }}>
            <Text style={{ color: C.redHot, fontWeight: '600' }}>SnapViral</Text> compresses that to four
            minutes — and ships in <Text style={{ color: C.redHot, fontWeight: '600' }}>three languages</Text>.
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
          {[
            { l: 'TA · 0:24' },
            { l: 'EN · 0:18' },
            { l: 'HI · 0:21' },
          ].map((t, i) => (
            <View
              key={i}
              style={{
                paddingHorizontal: 10,
                height: 24,
                borderRadius: 999,
                backgroundColor: i === 0 ? 'rgba(225,29,44,0.18)' : 'rgba(255,255,255,0.06)',
                borderWidth: 1,
                borderColor: i === 0 ? C.red : 'rgba(255,255,255,0.10)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: FONT.mono, fontSize: 10, color: '#FFFFFF', fontWeight: '600' }}>
                {t.l}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function BulletItem({ text }: { text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
      <View
        style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          backgroundColor: C.surface,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 2,
        }}
      >
        <Check size={10} color={C.red} strokeWidth={3} />
      </View>
      <Text style={{ fontFamily: FONT.sans, fontSize: 14, color: C.body, flex: 1, lineHeight: 22 }}>
        {text}
      </Text>
    </View>
  );
}

// =====================================================================
// STATS BLOCK
// =====================================================================
function StatsBlock({ ctx }: { ctx: Ctx }) {
  const { isMobile, padX } = ctx;
  return (
    <View style={{ paddingHorizontal: padX, paddingVertical: isMobile ? 64 : 120 }}>
      <View
        style={{
          maxWidth: 1280,
          width: '100%',
          alignSelf: 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 14,
        }}
      >
        <StatCard
          big="9,184"
          label="Shorts shipped this week"
          subtext="Across SnapViral creators · last 7 days"
          color={C.red}
          chart={<BarChart values={[40, 65, 35, 80, 100, 75, 95]} color={C.red} />}
          isMobile={isMobile}
        />
        <StatCard
          big="4 min"
          label="From topic to upload"
          subtext="p50 latency · last 30 days"
          color={C.purple}
          chart={<LineChart color={C.purple} />}
          isMobile={isMobile}
        />
      </View>
    </View>
  );
}

function StatCard({
  big,
  label,
  subtext,
  color,
  chart,
  isMobile,
}: {
  big: string;
  label: string;
  subtext: string;
  color: string;
  chart: React.ReactNode;
  isMobile: boolean;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: C.warm,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: C.hairline,
        padding: isMobile ? 24 : 36,
        gap: 24,
        ...({ boxShadow: '0 1px 0 rgba(10,10,11,0.04)' } as any),
      }}
    >
      <View>
        <Text
          style={{
            fontFamily: FONT.sans,
            fontSize: isMobile ? 56 : 84,
            lineHeight: isMobile ? 60 : 88,
            fontWeight: '700',
            color: C.ink,
            letterSpacing: isMobile ? -2.4 : -4,
            fontVariant: ['tabular-nums'] as any,
          }}
        >
          {big}
        </Text>
        <Text style={{ fontFamily: FONT.sans, fontSize: 17, fontWeight: '600', color: C.ink, marginTop: 8, letterSpacing: -0.3 }}>
          {label}
        </Text>
        <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: C.muted, marginTop: 4, letterSpacing: 0.3 }}>
          {subtext}
        </Text>
      </View>
      <View style={{ height: 80 }}>{chart}</View>
    </View>
  );
}

function BarChart({ values, color }: { values: number[]; color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: '100%' }}>
      {values.map((v, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: `${v}%`,
            backgroundColor: color,
            borderTopLeftRadius: 6,
            borderTopRightRadius: 6,
            opacity: 0.85,
            ...({
              animation: `sv-rise-in 800ms ${i * 80}ms cubic-bezier(0.2,0.8,0.2,1) both`,
            } as any),
          }}
        />
      ))}
    </View>
  );
}

function LineChart({ color }: { color: string }) {
  // Simple stylized line chart with stops
  return (
    <View style={{ position: 'relative', height: '100%', width: '100%' }}>
      <View
        style={{
          position: 'absolute',
          inset: 0 as any,
          ...({
            backgroundImage: `linear-gradient(to top, ${color}10, transparent)`,
            mask: 'linear-gradient(to top, black 0%, transparent 100%)',
            clipPath: 'polygon(0% 80%, 14% 60%, 28% 70%, 42% 40%, 57% 50%, 71% 25%, 85% 30%, 100% 15%, 100% 100%, 0% 100%)',
            WebkitClipPath: 'polygon(0% 80%, 14% 60%, 28% 70%, 42% 40%, 57% 50%, 71% 25%, 85% 30%, 100% 15%, 100% 100%, 0% 100%)',
          } as any),
        }}
      />
      <View
        style={{
          position: 'absolute',
          inset: 0 as any,
          ...({
            backgroundColor: color,
            clipPath: 'polygon(0% 80%, 14% 60%, 28% 70%, 42% 40%, 57% 50%, 71% 25%, 85% 30%, 100% 15%, 100% 17%, 85% 32%, 71% 27%, 57% 52%, 42% 42%, 28% 72%, 14% 62%, 0% 82%)',
            WebkitClipPath: 'polygon(0% 80%, 14% 60%, 28% 70%, 42% 40%, 57% 50%, 71% 25%, 85% 30%, 100% 15%, 100% 17%, 85% 32%, 71% 27%, 57% 52%, 42% 42%, 28% 72%, 14% 62%, 0% 82%)',
          } as any),
        }}
      />
      {/* Endpoint */}
      <View
        style={{
          position: 'absolute',
          right: 0,
          top: '15%',
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: color,
          marginRight: -6,
          marginTop: -6,
          ...({
            boxShadow: `0 0 0 4px ${color}33`,
            animation: 'sv-pulse-ring 1.8s ease-out infinite',
          } as any),
        }}
      />
    </View>
  );
}

// =====================================================================
// PROMO BLOCK
// =====================================================================
function PromoBlock({ ctx }: { ctx: Ctx }) {
  const { isMobile, padX, router } = ctx;
  return (
    <View style={{ paddingHorizontal: padX, paddingVertical: isMobile ? 32 : 56 }}>
      <View
        style={{
          maxWidth: 1280,
          width: '100%',
          alignSelf: 'center',
          borderRadius: 28,
          overflow: 'hidden',
          position: 'relative',
          backgroundColor: '#100208',
          paddingHorizontal: isMobile ? 32 : 64,
          paddingVertical: isMobile ? 56 : 96,
          ...({
            backgroundImage:
              'radial-gradient(circle at 80% 0%, rgba(255,45,64,0.55), transparent 50%), ' +
              'radial-gradient(circle at 20% 100%, rgba(159,6,23,0.40), transparent 50%), ' +
              'linear-gradient(135deg, #100208 0%, #1a040a 50%, #0a0104 100%)',
            boxShadow: '0 30px 60px -30px rgba(225,29,44,0.40)',
          } as any),
        }}
      >
        {/* Subtle dotted texture */}
        <View
          style={{
            position: 'absolute',
            inset: 0 as any,
            opacity: 0.4,
            ...({
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)',
              backgroundSize: '20px 20px',
            } as any),
          }}
        />

        <View
          style={{
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: 32,
            zIndex: 1,
          }}
        >
          <View style={{ flex: 1 }}>
            <View
              style={{
                paddingHorizontal: 12,
                height: 28,
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.12)',
                alignSelf: 'flex-start',
                justifyContent: 'center',
                marginBottom: 18,
              }}
            >
              <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: 'rgba(255,255,255,0.85)', letterSpacing: 0.5, fontWeight: '500' }}>
                STREAMLINE YOUR
              </Text>
            </View>
            <Text
              style={{
                fontFamily: FONT.sans,
                fontSize: isMobile ? 36 : 64,
                lineHeight: isMobile ? 40 : 70,
                fontWeight: '700',
                color: '#FFFFFF',
                letterSpacing: isMobile ? -1.4 : -2.6,
                marginBottom: 18,
              }}
            >
              YouTube content{'\n'}
              <Text style={{ fontFamily: FONT.serif, fontStyle: 'italic', fontWeight: '500', color: C.redHot }}>
                infrastructure.
              </Text>
            </Text>
            <Text style={{ fontFamily: FONT.sans, fontSize: 17, lineHeight: 26, color: 'rgba(255,255,255,0.7)', maxWidth: 520, marginBottom: 28 }}>
              Scripts, cartoons, voiceovers, scheduling, publishing — all in one studio. Built for
              creators who'd rather create than edit.
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <CTA inverse onPress={() => router.push('/signup')}>
                Start free
              </CTA>
              <CTA ghost onPress={() => router.push('/blog' as any)}>
                Read the blog
              </CTA>
            </View>
          </View>

          {!isMobile ? (
            <View style={{ width: 320, height: 240 }}>
              <PromoMockup />
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function PromoMockup() {
  return (
    <View
      style={{
        flex: 1,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        padding: 14,
        gap: 8,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.redHot, ...({ animation: 'sv-pulse-dot 1.6s ease-in-out infinite' } as any) }} />
        <Text style={{ fontFamily: FONT.mono, fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 }}>
          studio · live
        </Text>
        <View style={{ flex: 1 }} />
        <Text style={{ fontFamily: FONT.mono, fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>
          5 of 5 ready
        </Text>
      </View>

      {[
        { l: 'Cartoon · The little fox', t: 'TA', v: '0:30', s: 'done' as const },
        { l: 'Short · WWDC top 5', t: 'EN', v: '0:24', s: 'done' as const },
        { l: 'Essay · Tamil farmers law', t: 'TA', v: '8:14', s: 'done' as const },
        { l: 'Short · दिल्ली का मौसम', t: 'HI', v: '0:18', s: 'done' as const },
        { l: 'Cartoon · The kite story', t: 'EN', v: '0:30', s: 'rendering' as const },
      ].map((row, i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 8,
            paddingVertical: 6,
            borderRadius: 8,
            backgroundColor: 'rgba(255,255,255,0.04)',
          }}
        >
          <View
            style={{
              width: 18,
              height: 18,
              borderRadius: 4,
              backgroundColor: 'rgba(255,255,255,0.08)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: FONT.mono, fontSize: 8, color: '#FFFFFF', fontWeight: '700' }}>{row.t}</Text>
          </View>
          <Text style={{ flex: 1, fontFamily: FONT.sans, fontSize: 11, color: '#FFFFFF', fontWeight: '500' }} numberOfLines={1}>
            {row.l}
          </Text>
          <Text style={{ fontFamily: FONT.mono, fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>{row.v}</Text>
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: row.s === 'done' ? '#22C55E' : C.redHot,
              ...(row.s === 'rendering' ? ({ animation: 'sv-pulse-dot 1.6s ease-in-out infinite' } as any) : {}),
            }}
          />
        </View>
      ))}
    </View>
  );
}

// =====================================================================
// PRICING
// =====================================================================
function Pricing({ ctx }: { ctx: Ctx }) {
  const { isMobile, padX, router } = ctx;
  const { data: plans } = usePlans();
  const free = plans?.find((p) => p.key === 'free');
  const creator = plans?.find((p) => p.key === 'creator');
  const studio = plans?.find((p) => p.key === 'studio');

  return (
    <View style={{ paddingHorizontal: padX, paddingVertical: isMobile ? 64 : 120 }}>
      <View style={{ maxWidth: 1280, width: '100%', alignSelf: 'center' }}>
        <View style={{ alignItems: 'center', marginBottom: isMobile ? 40 : 64 }}>
          <SectionEyebrow>Pricing</SectionEyebrow>
          <Text
            style={{
              fontFamily: FONT.sans,
              fontSize: isMobile ? 32 : 56,
              lineHeight: isMobile ? 36 : 60,
              fontWeight: '700',
              color: C.ink,
              letterSpacing: isMobile ? -1.4 : -2.4,
              textAlign: 'center',
              marginTop: 14,
              maxWidth: 800,
            }}
          >
            Choose a plan{'\n'}
            <Text style={{ fontFamily: FONT.serif, fontStyle: 'italic', fontWeight: '500', color: C.subtle }}>
              that fits your needs.
            </Text>
          </Text>
        </View>

        <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 14 }}>
          <PriceCard
            title="Essential"
            price={free?.monthlyPriceUsdCents ? `$${(free.monthlyPriceUsdCents / 100).toFixed(0)}` : '$0'}
            cadence="forever"
            blurb={free?.description ?? 'For dipping a toe in. Two videos a month.'}
            features={
              free?.features?.slice(0, 6) ?? [
                '2 videos / month',
                'All 3 languages',
                'Cartoon & Shorts modes',
                'Watermarked output',
                'Manual publish only',
                'Community support',
              ]
            }
            cta="Start free"
            onPress={() => router.push('/signup')}
            isMobile={isMobile}
          />
          <PriceCard
            title="Performance"
            price={creator?.monthlyPriceUsdCents ? `$${(creator.monthlyPriceUsdCents / 100).toFixed(0)}` : '$29'}
            cadence="/ month"
            blurb={creator?.description ?? 'For shipping daily. Auto-publish on.'}
            features={
              creator?.features?.slice(0, 6) ?? [
                '30 videos / month',
                'Auto-publish to YouTube',
                'Live web research',
                'No watermark',
                'All cartoon characters',
                'Priority queue',
              ]
            }
            cta="Get Performance"
            onPress={() => router.push('/signup')}
            isMobile={isMobile}
            featured
          />
          <PriceCard
            title="Scale"
            price={studio?.monthlyPriceUsdCents ? `$${(studio.monthlyPriceUsdCents / 100).toFixed(0)}` : '$1,200'}
            cadence="/ month"
            blurb={studio?.description ?? 'For agencies running multi-channel.'}
            features={
              studio?.features?.slice(0, 6) ?? [
                '500 videos / month',
                'Multi-channel auto-publish',
                'Custom voice cloning',
                'Brand kit & API access',
                'White-glove onboarding',
                'Dedicated support',
              ]
            }
            cta="Talk to sales"
            onPress={() => router.push('/signup')}
            isMobile={isMobile}
          />
        </View>

        {/* Enterprise note */}
        <View
          style={{
            marginTop: 24,
            paddingVertical: 18,
            paddingHorizontal: 24,
            borderRadius: 14,
            backgroundColor: C.warm,
            borderWidth: 1,
            borderColor: C.hair,
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: FONT.sans, fontSize: 14, fontWeight: '700', color: C.ink, marginBottom: 2 }}>
              Enterprise
            </Text>
            <Text style={{ fontFamily: FONT.sans, fontSize: 13, color: C.muted }}>
              Custom volume, dedicated infrastructure, SSO. For media houses & networks.
            </Text>
          </View>
          <Pressable onPress={() => router.push('/signup')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontFamily: FONT.sans, fontSize: 13, fontWeight: '600', color: C.ink }}>Get in touch</Text>
            <ArrowRight size={12} color={C.ink} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function PriceCard({
  title,
  price,
  cadence,
  blurb,
  features,
  cta,
  onPress,
  isMobile,
  featured,
}: {
  title: string;
  price: string;
  cadence: string;
  blurb: string;
  features: string[];
  cta: string;
  onPress: () => void;
  isMobile: boolean;
  featured?: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <Pressable
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={{
        flex: 1,
        borderRadius: 18,
        padding: 28,
        backgroundColor: featured ? C.ink : C.paper,
        borderWidth: 1,
        borderColor: featured ? C.ink : C.hairline,
        position: 'relative',
        ...({
          transition: 'transform 320ms cubic-bezier(0.2,0.8,0.2,1), box-shadow 320ms ease',
          transform: hover ? 'translateY(-4px)' : 'translateY(0)',
          boxShadow: featured
            ? '0 30px 60px -30px rgba(10,10,11,0.40)'
            : hover
              ? '0 20px 40px -20px rgba(10,10,11,0.10)'
              : '0 1px 0 rgba(10,10,11,0.04)',
        } as any),
      }}
    >
      {featured ? (
        <View
          style={{
            position: 'absolute',
            top: -10,
            left: 24,
            paddingHorizontal: 10,
            height: 24,
            borderRadius: 999,
            backgroundColor: C.red,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#FFFFFF', ...({ animation: 'sv-pulse-dot 1.6s ease-in-out infinite' } as any) }} />
          <Text style={{ fontFamily: FONT.mono, fontSize: 9, fontWeight: '700', color: '#FFFFFF', letterSpacing: 1 }}>
            MOST PICKED
          </Text>
        </View>
      ) : null}

      <Text style={{ fontFamily: FONT.sans, fontSize: 13, fontWeight: '700', color: featured ? C.redHot : C.muted, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 14 }}>
        {title}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 }}>
        <Text
          style={{
            fontFamily: FONT.sans,
            fontSize: 52,
            fontWeight: '700',
            color: featured ? '#FFFFFF' : C.ink,
            letterSpacing: -2.2,
            fontVariant: ['tabular-nums'] as any,
          }}
        >
          {price}
        </Text>
        <Text style={{ fontFamily: FONT.sans, fontSize: 14, color: featured ? 'rgba(255,255,255,0.5)' : C.muted, marginLeft: 6 }}>
          {cadence}
        </Text>
      </View>
      <Text
        style={{
          fontFamily: FONT.serif,
          fontStyle: 'italic',
          fontSize: 15,
          fontWeight: '500',
          lineHeight: 22,
          color: featured ? 'rgba(255,255,255,0.7)' : C.body,
          marginBottom: 24,
        }}
      >
        {blurb}
      </Text>

      <Pressable
        onPress={onPress}
        style={{
          height: 44,
          borderRadius: 12,
          backgroundColor: featured ? '#FFFFFF' : C.ink,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 6,
          marginBottom: 24,
        }}
      >
        <Text style={{ fontFamily: FONT.sans, fontSize: 14, fontWeight: '600', color: featured ? C.ink : '#FFFFFF', letterSpacing: -0.2 }}>
          {cta}
        </Text>
        <ArrowRight size={13} color={featured ? C.ink : '#FFFFFF'} />
      </Pressable>

      <View style={{ gap: 12 }}>
        {features.map((f, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
            <Check size={14} color={featured ? C.redHot : C.red} strokeWidth={3} style={{ marginTop: 2 }} />
            <Text style={{ fontFamily: FONT.sans, fontSize: 13, color: featured ? 'rgba(255,255,255,0.85)' : C.body, flex: 1, lineHeight: 20 }}>
              {f}
            </Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

// =====================================================================
// BLOG STRIP
// =====================================================================
function BlogStrip({ ctx }: { ctx: Ctx }) {
  const { isMobile, padX, router } = ctx;
  const { data: blog } = useBlogPosts({ limit: 3 });
  const posts = blog?.posts ?? [];
  if (posts.length === 0) return null;

  return (
    <View style={{ paddingHorizontal: padX, paddingVertical: isMobile ? 64 : 120, backgroundColor: C.warm, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.hair }}>
      <View style={{ maxWidth: 1280, width: '100%', alignSelf: 'center' }}>
        <View
          style={{
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'flex-end',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: isMobile ? 32 : 48,
          }}
        >
          <View>
            <SectionEyebrow>Field notes</SectionEyebrow>
            <Text
              style={{
                fontFamily: FONT.sans,
                fontSize: isMobile ? 28 : 44,
                lineHeight: isMobile ? 32 : 48,
                fontWeight: '700',
                color: C.ink,
                letterSpacing: isMobile ? -1.2 : -1.8,
                marginTop: 14,
              }}
            >
              From the{' '}
              <Text style={{ fontFamily: FONT.serif, fontStyle: 'italic', fontWeight: '500' }}>
                SnapViral journal.
              </Text>
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/blog' as any)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            <Text style={{ fontFamily: FONT.sans, fontSize: 13, fontWeight: '600', color: C.ink }}>All posts</Text>
            <ArrowRight size={12} color={C.ink} />
          </Pressable>
        </View>

        <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 14 }}>
          {posts.slice(0, 3).map((p) => (
            <BlogCard key={p.slug} post={p} onPress={() => router.push(`/blog/${p.slug}` as any)} />
          ))}
        </View>
      </View>
    </View>
  );
}

function BlogCard({
  post,
  onPress,
}: {
  post: { slug: string; title: string; excerpt: string | null; cover_image_url: string | null; tags: string[]; read_minutes: number | null; published_at: string | null };
  onPress: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={{
        flex: 1,
        borderRadius: 16,
        backgroundColor: C.paper,
        borderWidth: 1,
        borderColor: C.hairline,
        overflow: 'hidden',
        ...({
          transition: 'transform 320ms cubic-bezier(0.2,0.8,0.2,1), box-shadow 320ms ease',
          transform: hover ? 'translateY(-4px)' : 'translateY(0)',
          boxShadow: hover
            ? '0 20px 40px -20px rgba(10,10,11,0.10)'
            : '0 1px 0 rgba(10,10,11,0.04)',
        } as any),
      }}
    >
      {post.cover_image_url ? (
        <View style={{ aspectRatio: 16 / 9, backgroundColor: C.surface, overflow: 'hidden' }}>
          <Image source={{ uri: post.cover_image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        </View>
      ) : (
        <View style={{ aspectRatio: 16 / 9, alignItems: 'center', justifyContent: 'center', ...({ backgroundImage: 'linear-gradient(135deg, #FCE7F3, #FFE4E1, #DDD6FE)' } as any) }}>
          <SnapViralLogo size={48} />
        </View>
      )}
      <View style={{ padding: 22 }}>
        {post.tags?.[0] ? (
          <Text style={{ fontFamily: FONT.mono, fontSize: 10, fontWeight: '700', color: C.red, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 }}>
            {post.tags[0]}
          </Text>
        ) : null}
        <Text style={{ fontFamily: FONT.sans, fontSize: 17, fontWeight: '700', color: C.ink, letterSpacing: -0.4, marginBottom: 10, lineHeight: 23 }} numberOfLines={2}>
          {post.title}
        </Text>
        {post.excerpt ? (
          <Text style={{ fontFamily: FONT.sans, fontSize: 13, color: C.muted, lineHeight: 20, marginBottom: 14 }} numberOfLines={2}>
            {post.excerpt}
          </Text>
        ) : null}
        <Text style={{ fontFamily: FONT.mono, fontSize: 10, color: C.subtle, fontWeight: '500' }}>
          {post.read_minutes ?? 3} min read
        </Text>
      </View>
    </Pressable>
  );
}

// =====================================================================
// FAQ
// =====================================================================
function FAQ({ ctx }: { ctx: Ctx }) {
  const { isMobile, padX } = ctx;
  const items = [
    {
      q: 'Is SnapViral free?',
      a: 'Yes — the Essential plan gives you 2 videos a month forever, in all 3 languages and both cartoon and Shorts modes. Output is watermarked. Upgrade when you outgrow it.',
    },
    {
      q: 'Can I try Performance for free?',
      a: 'There\'s no free trial of Performance, but you can run all the same modes on Essential watermarked first to see the output quality. Your first paid month is fully refundable for 14 days, no questions.',
    },
    {
      q: 'What is the best way to render multilingual videos that look professional?',
      a: 'Use the Cartoon or Long-form modes with the per-topic language override. SnapViral handles Devanagari and Tamil shaping natively, picks fonts that match the script, and uses ElevenLabs voices tuned for each language. The output is indistinguishable from agency work.',
    },
    {
      q: 'Can I configure my own brand kit?',
      a: 'Yes. Upload your logo, set your brand colors, pick your subtitle font, and SnapViral applies them to every render. Per-channel brand kits are on the Scale plan for agencies running multi-channel.',
    },
    {
      q: 'Can I bring my own voice?',
      a: 'Yes — Performance and Scale support voice ID overrides per topic. Scale also includes ElevenLabs voice cloning if you want your own voice cloned and used for narration.',
    },
    {
      q: 'Do I really save time with SnapViral?',
      a: 'A single Short typically costs a creator 2–4 hours of editing. SnapViral compresses it to 4 minutes. If you ship 5 Shorts a day, that\'s 10–20 hours saved daily. The math is hard to argue with.',
    },
  ];

  const left = items.slice(0, 3);
  const right = items.slice(3);

  return (
    <View style={{ paddingHorizontal: padX, paddingVertical: isMobile ? 64 : 120 }}>
      <View style={{ maxWidth: 1280, width: '100%', alignSelf: 'center' }}>
        <View style={{ alignItems: 'center', marginBottom: isMobile ? 32 : 56 }}>
          <SectionEyebrow>FAQ</SectionEyebrow>
          <Text
            style={{
              fontFamily: FONT.sans,
              fontSize: isMobile ? 32 : 56,
              lineHeight: isMobile ? 36 : 60,
              fontWeight: '700',
              color: C.ink,
              letterSpacing: isMobile ? -1.4 : -2.4,
              textAlign: 'center',
              marginTop: 14,
            }}
          >
            Questions &{' '}
            <Text style={{ fontFamily: FONT.serif, fontStyle: 'italic', fontWeight: '500' }}>answers.</Text>
          </Text>
        </View>

        <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 0 : 64 }}>
          <View style={{ flex: 1, gap: 0 }}>
            {left.map((it, i) => (
              <FAQItem key={i} {...it} />
            ))}
          </View>
          <View style={{ flex: 1, gap: 0 }}>
            {right.map((it, i) => (
              <FAQItem key={i} {...it} />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable
      onPress={() => setOpen((v) => !v)}
      style={{
        paddingVertical: 22,
        borderBottomWidth: 1,
        borderBottomColor: C.hair,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <Text style={{ fontFamily: FONT.sans, fontSize: 16, fontWeight: '600', color: C.ink, letterSpacing: -0.3, flex: 1, lineHeight: 24 }}>
          {q}
        </Text>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: open ? C.ink : C.surface,
            alignItems: 'center',
            justifyContent: 'center',
            ...({ transition: 'background-color 220ms ease' } as any),
          }}
        >
          {open ? <Minus size={12} color="#FFFFFF" strokeWidth={3} /> : <Plus size={12} color={C.ink} strokeWidth={3} />}
        </View>
      </View>
      {open ? (
        <Text style={{ fontFamily: FONT.sans, fontSize: 14, color: C.muted, lineHeight: 22, marginTop: 12, paddingRight: 44 }}>
          {a}
        </Text>
      ) : null}
    </Pressable>
  );
}

// =====================================================================
// CONVERT BLOCK
// =====================================================================
function Convert({ ctx }: { ctx: Ctx }) {
  const { isMobile, padX, router } = ctx;
  return (
    <View style={{ paddingHorizontal: padX, paddingVertical: isMobile ? 56 : 96 }}>
      <View style={{ maxWidth: 1280, width: '100%', alignSelf: 'center', alignItems: 'center', marginBottom: isMobile ? 32 : 48 }}>
        <Text
          style={{
            fontFamily: FONT.sans,
            fontSize: isMobile ? 24 : 36,
            lineHeight: isMobile ? 28 : 42,
            fontWeight: '700',
            color: C.ink,
            letterSpacing: isMobile ? -0.8 : -1.2,
            textAlign: 'center',
          }}
        >
          Want{' '}
          <Text style={{ fontFamily: FONT.serif, fontStyle: 'italic', fontWeight: '500' }}>something simpler?</Text>
        </Text>
      </View>

      <View
        style={{
          maxWidth: 720,
          width: '100%',
          alignSelf: 'center',
          borderRadius: 20,
          padding: isMobile ? 24 : 32,
          backgroundColor: C.warm,
          borderWidth: 1,
          borderColor: C.hairline,
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: 20,
          ...({ boxShadow: '0 20px 40px -20px rgba(10,10,11,0.08)' } as any),
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: FONT.sans, fontSize: 19, fontWeight: '700', color: C.ink, letterSpacing: -0.4, marginBottom: 8 }}>
            Convert your{' '}
            <Text style={{ fontFamily: FONT.serif, fontStyle: 'italic', fontWeight: '500', color: C.red }}>idea</Text>{' '}
            into a finished YouTube channel.
          </Text>
          <Text style={{ fontFamily: FONT.sans, fontSize: 14, color: C.muted, lineHeight: 22 }}>
            Sign up free. No credit card. Ship your first Short in under 5 minutes.
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={() => router.push('/login')}
            style={{
              paddingHorizontal: 18,
              height: 44,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: C.hairline,
              backgroundColor: C.paper,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: FONT.sans, fontSize: 13, fontWeight: '600', color: C.ink }}>Sign in</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/signup')}
            style={{
              paddingHorizontal: 18,
              height: 44,
              borderRadius: 12,
              backgroundColor: C.ink,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 6,
            }}
          >
            <Text style={{ fontFamily: FONT.sans, fontSize: 13, fontWeight: '600', color: '#FFFFFF' }}>Sign up</Text>
            <ArrowRight size={12} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// FOOTER
// =====================================================================
function Footer({ ctx }: { ctx: Ctx }) {
  const { isMobile, padX, router } = ctx;
  const cols: Array<{ label: string; links: Array<[string, string]> }> = [
    {
      label: 'Product',
      links: [
        ['Cartoons', '/'],
        ['YouTube Shorts', '/'],
        ['Long-form', '/'],
        ['Auto-publish', '/'],
        ['Voice library', '/'],
      ],
    },
    {
      label: 'Resources',
      links: [
        ['Blog', '/blog'],
        ['Field notes', '/blog'],
        ['Templates', '/'],
        ['Status', '/'],
      ],
    },
    {
      label: 'Company',
      links: [
        ['About', '/'],
        ['Careers', '/'],
        ['Press', '/'],
      ],
    },
    {
      label: 'Account',
      links: [
        ['Sign in', '/login'],
        ['Sign up', '/signup'],
        ['Admin portal', '/admin/login'],
        ['Privacy', '/privacy'],
        ['Terms', '/terms'],
      ],
    },
  ];
  return (
    <View
      style={{
        paddingHorizontal: padX,
        paddingTop: 56,
        paddingBottom: 32,
        borderTopWidth: 1,
        borderTopColor: C.hair,
        backgroundColor: C.warm,
      }}
    >
      <View style={{ maxWidth: 1280, width: '100%', alignSelf: 'center' }}>
        <View
          style={{
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            gap: isMobile ? 32 : 64,
          }}
        >
          {/* Brand */}
          <View style={{ flex: isMobile ? undefined : 1, maxWidth: 320 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <SnapViralLogo size={26} />
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text style={{ fontFamily: FONT.sans, fontSize: 17, fontWeight: '800', color: C.ink, letterSpacing: -0.4 }}>
                  Snap
                </Text>
                <Text style={{ fontFamily: FONT.serif, fontStyle: 'italic', fontSize: 17, fontWeight: '600', color: C.red, letterSpacing: -0.4 }}>
                  Viral
                </Text>
              </View>
            </View>
            <Text style={{ fontFamily: FONT.sans, fontSize: 14, color: C.muted, lineHeight: 22 }}>
              The complete video creation stack. Cartoons, Shorts, long-form. Built for creators
              shipping daily.
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginTop: 18,
                paddingHorizontal: 10,
                height: 26,
                alignSelf: 'flex-start',
                borderRadius: 999,
                backgroundColor: C.paper,
                borderWidth: 1,
                borderColor: C.hair,
              }}
            >
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E', ...({ animation: 'sv-pulse-dot 2s ease-in-out infinite' } as any) }} />
              <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: C.body, fontWeight: '500' }}>
                all systems operational
              </Text>
            </View>
          </View>

          {/* Link cols */}
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              flex: isMobile ? undefined : 1.6,
              gap: isMobile ? 24 : 0,
            }}
          >
            {cols.map((c) => (
              <View key={c.label} style={{ flexBasis: isMobile ? '50%' : '25%', gap: 10 }}>
                <Text style={{ fontFamily: FONT.mono, fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
                  {c.label}
                </Text>
                {c.links.map(([label, href]) => (
                  <FootLink key={label} label={label} onPress={() => router.push(href as any)} />
                ))}
              </View>
            ))}
          </View>
        </View>

        <View
          style={{
            marginTop: 48,
            paddingTop: 24,
            borderTopWidth: 1,
            borderTopColor: C.hair,
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: 12,
          }}
        >
          <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: C.muted }}>
            © {new Date().getFullYear()} SnapViral · made with care in Chennai
          </Text>
          <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: C.muted }}>
            app.snapviral.in
          </Text>
        </View>
      </View>
    </View>
  );
}

function FootLink({ label, onPress }: { label: string; onPress: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <Pressable onHoverIn={() => setHover(true)} onHoverOut={() => setHover(false)} onPress={onPress}>
      <Text
        style={{
          fontFamily: FONT.sans,
          fontSize: 13,
          color: hover ? C.ink : C.body,
          fontWeight: '500',
          ...({ transition: 'color 200ms ease' } as any),
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// =====================================================================
// Atoms
// =====================================================================
function SectionEyebrow({ children, color = C.red }: { children: React.ReactNode; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
      <Text
        style={{
          fontFamily: FONT.mono,
          fontSize: 11,
          fontWeight: '700',
          color: color,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
        }}
      >
        {children}
      </Text>
    </View>
  );
}
