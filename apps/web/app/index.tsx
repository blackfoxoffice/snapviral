import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { ArrowRight, ArrowUpRight } from 'lucide-react-native';
import { useAuth } from '../lib/auth';
import { usePlans } from '../lib/queries';
import { SnapViralLogo } from '../components/icons/SnapViralLogo';

// =====================================================================
// Global keyframes & web-only fonts.
// Injected once into <head> on the web bundle. SSR-safe (guarded).
// =====================================================================
const KEYFRAMES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Newsreader:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=JetBrains+Mono:wght@400;500;600&display=swap');

:root { --sv-ink: #0A0A0B; --sv-red: #E11D2C; --sv-redhot: #FF2D40; }
html, body { background: #FFFFFF; }
* { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
::selection { background: #0A0A0B; color: #FFFFFF; }

@keyframes sv-marquee { from { transform: translate3d(0,0,0); } to { transform: translate3d(-50%,0,0); } }
@keyframes sv-fade-up { from { opacity: 0; transform: translate3d(0,14px,0); } to { opacity: 1; transform: translate3d(0,0,0); } }
@keyframes sv-fade-out { from { opacity: 1; } to { opacity: 0; transform: translate3d(0,-8px,0); } }
@keyframes sv-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(225,29,44,0.55); }
  50% { box-shadow: 0 0 0 7px rgba(225,29,44,0); }
}
@keyframes sv-pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}
@keyframes sv-blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}
@keyframes sv-grow-bar {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
@keyframes sv-rise-in {
  from { opacity: 0; transform: translate3d(0,16px,0); filter: blur(6px); }
  to { opacity: 1; transform: translate3d(0,0,0); filter: blur(0); }
}
@keyframes sv-spin { to { transform: rotate(360deg); } }
@keyframes sv-shimmer { from { background-position: 0% 50%; } to { background-position: 200% 50%; } }
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

// =====================================================================
// Type system
// =====================================================================
const FONT = {
  sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  serif: 'Newsreader, Georgia, "Times New Roman", serif',
  mono: 'JetBrains Mono, "SF Mono", Menlo, Consolas, monospace',
} as const;

const C = {
  ink: '#0A0A0B',
  body: '#27272A',
  muted: '#6B7280',
  subtle: '#A1A1AA',
  faint: '#D4D4D8',
  hairline: 'rgba(10,10,11,0.08)',
  hair: 'rgba(10,10,11,0.06)',
  paper: '#FFFFFF',
  warm: '#FAFAF7',
  surface: '#F4F4F5',
  red: '#E11D2C',
  redHot: '#FF2D40',
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
  const padX = isMobile ? 20 : width >= 1280 ? 40 : 28;

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.paper }}>
        <ActivityIndicator color={C.red} />
      </View>
    );
  }
  if (session) return <Redirect href="/dashboard" />;

  const ctx = { isMobile, padX, router };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.paper, ...({ fontFamily: FONT.sans } as any) }}
      showsVerticalScrollIndicator={false}
    >
      <Nav ctx={ctx} />
      <Hero ctx={ctx} />
      <Marquee ctx={ctx} />
      <BigClaim ctx={ctx} />
      <LiveProduct ctx={ctx} />
      <Scene
        ctx={ctx}
        eyebrow="01 / Languages"
        title="Native, not translated."
        body="Tamil, Hindi and English voiceovers your audience can't tell apart from a person. Subtitles burned in with the right script — Devanagari, Tamil, Latin — never one font crammed into another's sentence."
        visual={<LanguagesVisual ctx={ctx} />}
      />
      <Scene
        ctx={ctx}
        eyebrow="02 / Schedule"
        title="Set it. Forget it."
        body="Drop in 100 topics on a Sunday. Pick the times you want each one to ship. Walk away. The auto-publisher fires within ±60 seconds of your slot — at 5am if that's your audience."
        visual={<ScheduleVisual ctx={ctx} />}
        flipped
      />
      <Scene
        ctx={ctx}
        eyebrow="03 / Visuals"
        title="No AI text in the frame."
        body="Per-scene image generation tuned for your language and culture. No misspelled chyrons, no jumbled signs, no garbage subtitles baked in. Clean photographic Shorts only."
        visual={<VisualsVisual ctx={ctx} />}
      />
      <BigCounter ctx={ctx} />
      <Pricing ctx={ctx} />
      <Outro ctx={ctx} />
      <Footer ctx={ctx} />
    </ScrollView>
  );
}

// =====================================================================
// Context type
// =====================================================================
type Ctx = { isMobile: boolean; padX: number; router: ReturnType<typeof useRouter> };

// =====================================================================
// Nav
// =====================================================================
function Nav({ ctx }: { ctx: Ctx }) {
  const { isMobile, padX, router } = ctx;
  return (
    <View
      style={{
        position: 'sticky' as any,
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(255,255,255,0.7)',
        ...({ backdropFilter: 'saturate(180%) blur(14px)', WebkitBackdropFilter: 'saturate(180%) blur(14px)' } as any),
        borderBottomWidth: 1,
        borderBottomColor: C.hair,
      }}
    >
      <View
        style={{
          maxWidth: 1280,
          width: '100%',
          alignSelf: 'center',
          paddingHorizontal: padX,
          height: 60,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <SnapViralLogo size={22} />
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={{ fontFamily: FONT.sans, fontSize: 16, fontWeight: '800', color: C.ink, letterSpacing: -0.4 }}>
              Snap
            </Text>
            <Text
              style={{
                fontFamily: FONT.serif,
                fontSize: 16,
                fontWeight: '600',
                color: C.red,
                letterSpacing: -0.4,
                fontStyle: 'italic',
              }}
            >
              Viral
            </Text>
          </View>
        </Pressable>

        {!isMobile ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 28 }}>
            {['Product', 'Languages', 'Pricing', 'Blog'].map((label) => (
              <NavItem key={label} label={label} />
            ))}
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {!isMobile ? (
            <Pressable
              onPress={() => router.push('/login')}
              style={{
                paddingHorizontal: 14,
                height: 34,
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: FONT.sans, fontSize: 13, color: C.body, fontWeight: '500' }}>Sign in</Text>
            </Pressable>
          ) : null}
          <CTA primary onPress={() => router.push('/signup')} compact>
            {isMobile ? 'Start free' : 'Start free'}
          </CTA>
        </View>
      </View>
    </View>
  );
}

function NavItem({ label }: { label: string }) {
  const [hover, setHover] = useState(false);
  return (
    <Pressable onHoverIn={() => setHover(true)} onHoverOut={() => setHover(false)}>
      <View style={{ height: 34, justifyContent: 'center', position: 'relative' }}>
        <Text style={{ fontFamily: FONT.sans, fontSize: 13, color: hover ? C.ink : C.body, fontWeight: '500', ...({ transition: 'color 180ms ease' } as any) }}>
          {label}
        </Text>
        <View
          style={{
            position: 'absolute',
            bottom: 6,
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: C.ink,
            transformOrigin: 'left' as any,
            transform: [{ scaleX: hover ? 1 : 0 }] as any,
            ...({ transition: 'transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1)' } as any),
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
}: {
  children: React.ReactNode;
  primary?: boolean;
  compact?: boolean;
  onPress?: () => void;
  inverse?: boolean;
}) {
  const [hover, setHover] = useState(false);
  const bg = inverse ? '#FFFFFF' : primary ? C.ink : 'transparent';
  const fg = inverse ? C.ink : primary ? '#FFFFFF' : C.ink;
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: compact ? 14 : 22,
        height: compact ? 36 : 50,
        borderRadius: 999,
        backgroundColor: bg,
        borderWidth: primary || inverse ? 0 : 1,
        borderColor: C.hairline,
        transform: [{ translateY: hover ? -1 : 0 }] as any,
        ...({
          transition: 'transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 200ms ease, background 200ms ease',
          boxShadow: hover && primary
            ? '0 12px 32px -12px rgba(10,10,11,0.30)'
            : hover && inverse
              ? '0 12px 32px -12px rgba(255,255,255,0.30)'
              : 'none',
        } as any),
      }}
    >
      <Text
        style={{
          fontFamily: FONT.sans,
          fontSize: compact ? 13 : 15,
          fontWeight: '600',
          color: fg,
          letterSpacing: -0.2,
        }}
      >
        {children}
      </Text>
      <ArrowRight size={compact ? 12 : 14} color={fg} />
    </Pressable>
  );
}

// =====================================================================
// Hero — typewriter cycling word
// =====================================================================
const HERO_WORDS = ['shipping', 'writing', 'narrating', 'scaling', 'publishing'];

function Hero({ ctx }: { ctx: Ctx }) {
  const { isMobile, padX, router } = ctx;
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % HERO_WORDS.length), 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <View style={{ paddingHorizontal: padX, paddingTop: isMobile ? 64 : 120, paddingBottom: isMobile ? 56 : 120 }}>
      <View style={{ maxWidth: 1280, width: '100%', alignSelf: 'center' }}>
        {/* Status pill */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            alignSelf: 'flex-start',
            paddingHorizontal: 12,
            height: 28,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: C.hairline,
            backgroundColor: C.paper,
            marginBottom: isMobile ? 28 : 44,
            ...({ animation: 'sv-fade-up 600ms cubic-bezier(0.2,0.8,0.2,1) both' } as any),
          }}
        >
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#22C55E',
              ...({ animation: 'sv-pulse-dot 2s ease-in-out infinite' } as any),
            }}
          />
          <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: C.body, fontWeight: '500' }}>
            All systems shipping
          </Text>
        </View>

        {/* Headline */}
        <View style={{ ...({ animation: 'sv-fade-up 700ms 100ms cubic-bezier(0.2,0.8,0.2,1) both' } as any) }}>
          <Text
            style={{
              fontFamily: FONT.sans,
              fontSize: isMobile ? 48 : 116,
              lineHeight: isMobile ? 50 : 110,
              fontWeight: '700',
              color: C.ink,
              letterSpacing: isMobile ? -1.8 : -5,
            }}
          >
            Your YouTube channel,
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap' }}>
            <View style={{ minWidth: isMobile ? 180 : 460, position: 'relative', height: isMobile ? 56 : 124 }}>
              <Text
                key={idx}
                style={{
                  fontFamily: FONT.serif,
                  fontStyle: 'italic',
                  fontWeight: '500',
                  fontSize: isMobile ? 48 : 116,
                  lineHeight: isMobile ? 56 : 124,
                  color: C.red,
                  letterSpacing: isMobile ? -1.8 : -5,
                  position: 'absolute',
                  ...({ animation: 'sv-fade-up 480ms cubic-bezier(0.2,0.8,0.2,1) both' } as any),
                }}
              >
                {HERO_WORDS[idx]}
              </Text>
            </View>
            <Text
              style={{
                fontFamily: FONT.sans,
                fontSize: isMobile ? 48 : 116,
                lineHeight: isMobile ? 50 : 110,
                fontWeight: '700',
                color: C.ink,
                letterSpacing: isMobile ? -1.8 : -5,
              }}
            >
              {' '}while you sleep.
            </Text>
          </View>
        </View>

        {/* Subhead */}
        <Text
          style={{
            fontFamily: FONT.sans,
            fontSize: isMobile ? 16 : 21,
            lineHeight: isMobile ? 24 : 32,
            color: C.body,
            marginTop: isMobile ? 24 : 40,
            maxWidth: 640,
            ...({ animation: 'sv-fade-up 800ms 220ms cubic-bezier(0.2,0.8,0.2,1) both' } as any),
          }}
        >
          SnapViral writes, narrates and animates 3–5 vertical Shorts per day in Tamil, Hindi or
          English — and ships them straight to your channel on a schedule you pick.
        </Text>

        {/* CTAs */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            marginTop: isMobile ? 28 : 44,
            flexWrap: 'wrap',
            ...({ animation: 'sv-fade-up 900ms 320ms cubic-bezier(0.2,0.8,0.2,1) both' } as any),
          }}
        >
          <CTA primary onPress={() => router.push('/signup')}>
            Start free
          </CTA>
          <Pressable
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: 18,
              height: 50,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: C.hairline,
            }}
          >
            <Text style={{ fontFamily: FONT.sans, fontSize: 14, fontWeight: '500', color: C.ink }}>
              See it run live
            </Text>
            <ArrowUpRight size={14} color={C.muted} />
          </Pressable>
        </View>

        {/* Microcopy */}
        <Text
          style={{
            fontFamily: FONT.mono,
            fontSize: 11,
            color: C.muted,
            marginTop: 18,
            ...({ animation: 'sv-fade-up 1000ms 420ms cubic-bezier(0.2,0.8,0.2,1) both' } as any),
          }}
        >
          $ 0 to start · no card · cancel any time
        </Text>
      </View>
    </View>
  );
}

// =====================================================================
// Marquee — infinite scroll of script fragments
// =====================================================================
const MARQUEE_ITEMS = [
  'தமிழ் News reaches 50K subs in 90 days',
  'topic → upload in 4 minutes',
  'auto-publish at 5am, on a Tuesday',
  'voiceover quality your editor can\'t match',
  'AES-256 vault for every API key',
  'web research with citations, not stale prompts',
  'दिल्ली में आज का मौसम',
  'no AI text inside the frame, ever',
  '1080×1920, libass-burned subtitles',
  '99.9% pipeline uptime',
];

function Marquee({ ctx }: { ctx: Ctx }) {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <View
      style={{
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: C.hair,
        paddingVertical: ctx.isMobile ? 18 : 24,
        overflow: 'hidden',
        backgroundColor: C.paper,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          ...({
            animation: 'sv-marquee 60s linear infinite',
            whiteSpace: 'nowrap',
            willChange: 'transform',
          } as any),
        }}
      >
        {items.map((it, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text
              style={{
                fontFamily: FONT.sans,
                fontSize: ctx.isMobile ? 18 : 22,
                color: C.ink,
                fontWeight: '500',
                letterSpacing: -0.6,
                paddingHorizontal: 24,
              }}
            >
              {it}
            </Text>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.red }} />
          </View>
        ))}
      </View>
    </View>
  );
}

// =====================================================================
// Big claim — single editorial sentence
// =====================================================================
function BigClaim({ ctx }: { ctx: Ctx }) {
  const { isMobile, padX } = ctx;
  return (
    <View
      style={{
        paddingHorizontal: padX,
        paddingVertical: isMobile ? 80 : 200,
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          fontFamily: FONT.sans,
          fontSize: isMobile ? 36 : 88,
          lineHeight: isMobile ? 42 : 96,
          fontWeight: '700',
          color: C.ink,
          textAlign: 'center',
          letterSpacing: isMobile ? -1.4 : -3.8,
          maxWidth: 1100,
        }}
      >
        The shortest path between{' '}
        <Text style={{ fontFamily: FONT.serif, fontWeight: '500', fontStyle: 'italic', color: C.ink }}>
          a thought
        </Text>{' '}
        and{' '}
        <Text style={{ fontFamily: FONT.serif, fontWeight: '500', fontStyle: 'italic', color: C.red }}>
          a million views.
        </Text>
      </Text>
    </View>
  );
}

// =====================================================================
// Live product — animated pipeline that runs itself
// =====================================================================
const PIPELINE_STAGES = [
  { label: 'fetching live web context', detail: '0.4s', tone: 'fast' as const },
  { label: 'drafting tamil script · 6 scenes', detail: '14.2s', tone: 'med' as const },
  { label: 'rendering scene visuals', detail: '38.0s', tone: 'med' as const, sub: ['scene 01', 'scene 02', 'scene 03', 'scene 04', 'scene 05', 'scene 06'] },
  { label: 'recording elevenlabs voiceover', detail: '11.7s', tone: 'med' as const },
  { label: 'aligning subtitles · burn-in', detail: '6.3s', tone: 'fast' as const },
  { label: 'publishing to youtube', detail: '4.1s', tone: 'fast' as const },
];

function LiveProduct({ ctx }: { ctx: Ctx }) {
  const { isMobile, padX } = ctx;
  const [stage, setStage] = useState(0);
  const [subStep, setSubStep] = useState(0);
  const [topic, setTopic] = useState('');

  // Type the topic on first run
  useEffect(() => {
    const target = 'chennai metro phase 2 inauguration';
    let i = 0;
    const t = setInterval(() => {
      i++;
      setTopic(target.slice(0, i));
      if (i >= target.length) clearInterval(t);
    }, 35);
    return () => clearInterval(t);
  }, []);

  // Cycle through pipeline stages
  useEffect(() => {
    const t = setTimeout(
      () => {
        if (stage < PIPELINE_STAGES.length - 1) {
          setStage((s) => s + 1);
          setSubStep(0);
        } else {
          // Restart loop after a beat
          setTimeout(() => {
            setStage(0);
            setSubStep(0);
          }, 2400);
        }
      },
      stage === 2 ? 2600 : stage === 1 ? 2000 : 1400,
    );
    return () => clearTimeout(t);
  }, [stage]);

  // Sub-step progress within "rendering scene visuals"
  useEffect(() => {
    if (stage !== 2) return;
    const t = setInterval(() => {
      setSubStep((s) => Math.min(s + 1, 6));
    }, 380);
    return () => clearInterval(t);
  }, [stage]);

  return (
    <View style={{ paddingHorizontal: padX, paddingBottom: isMobile ? 80 : 160 }}>
      <View style={{ maxWidth: 1280, width: '100%', alignSelf: 'center' }}>
        <View
          style={{
            borderRadius: 24,
            backgroundColor: C.ink,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.06)',
            ...({
              backgroundImage:
                'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(225,29,44,0.10), transparent 60%)',
              boxShadow:
                '0 1px 0 rgba(255,255,255,0.04) inset, 0 40px 80px -40px rgba(10,10,11,0.6)',
            } as any),
          }}
        >
          {/* Top bar */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: 18,
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(255,255,255,0.06)',
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: C.red,
                ...({ animation: 'sv-pulse-dot 1.6s ease-in-out infinite' } as any),
              }}
            />
            <Text
              style={{
                fontFamily: FONT.mono,
                fontSize: 11,
                color: 'rgba(255,255,255,0.55)',
                letterSpacing: 0.5,
              }}
            >
              snapviral · live pipeline
            </Text>
            <View style={{ flex: 1 }} />
            <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
              run #84,213
            </Text>
          </View>

          <View style={{ flexDirection: isMobile ? 'column' : 'row' }}>
            {/* Left: input */}
            <View
              style={{
                padding: isMobile ? 24 : 36,
                flex: isMobile ? undefined : 0.55,
                borderRightWidth: isMobile ? 0 : 1,
                borderRightColor: 'rgba(255,255,255,0.06)',
                borderBottomWidth: isMobile ? 1 : 0,
                borderBottomColor: 'rgba(255,255,255,0.06)',
              }}
            >
              <Text
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.35)',
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  marginBottom: 12,
                }}
              >
                topic
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text
                  style={{
                    fontFamily: FONT.serif,
                    fontStyle: 'italic',
                    fontWeight: '500',
                    fontSize: isMobile ? 22 : 32,
                    lineHeight: isMobile ? 28 : 40,
                    color: '#FFFFFF',
                    letterSpacing: -0.6,
                  }}
                >
                  {topic}
                </Text>
                <Text
                  style={{
                    fontSize: isMobile ? 22 : 32,
                    lineHeight: isMobile ? 28 : 40,
                    color: C.redHot,
                    fontWeight: '500',
                    marginLeft: 2,
                    ...({ animation: 'sv-blink 1s steps(1) infinite' } as any),
                  }}
                >
                  ▍
                </Text>
              </View>

              <View style={{ marginTop: 24, gap: 12 }}>
                <Field label="lang" value="ta · tamil" />
                <Field label="duration" value="30s" />
                <Field label="voice" value="anchor / female" />
                <Field label="image style" value="realistic" />
              </View>
            </View>

            {/* Right: pipeline */}
            <View style={{ flex: 1, padding: isMobile ? 20 : 30 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <Text
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.35)',
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                  }}
                >
                  pipeline
                </Text>
                <Text
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.5)',
                    fontVariant: ['tabular-nums'] as any,
                  }}
                >
                  {stage + 1} / 6
                </Text>
              </View>

              {PIPELINE_STAGES.map((s, i) => (
                <PipelineRow
                  key={i}
                  index={i}
                  label={s.label}
                  detail={s.detail}
                  state={i < stage ? 'done' : i === stage ? 'running' : 'queued'}
                  subStep={i === 2 ? subStep : undefined}
                  totalSub={i === 2 ? 6 : undefined}
                />
              ))}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text
        style={{
          fontFamily: FONT.mono,
          fontSize: 11,
          color: 'rgba(255,255,255,0.35)',
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Text>
      <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '500' }}>
        {value}
      </Text>
    </View>
  );
}

function PipelineRow({
  index,
  label,
  detail,
  state,
  subStep,
  totalSub,
}: {
  index: number;
  label: string;
  detail: string;
  state: 'done' | 'running' | 'queued';
  subStep?: number;
  totalSub?: number;
}) {
  return (
    <View
      style={{
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.04)',
        opacity: state === 'queued' ? 0.4 : 1,
        ...({ transition: 'opacity 400ms ease' } as any),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Text
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            color: 'rgba(255,255,255,0.3)',
            width: 22,
            fontVariant: ['tabular-nums'] as any,
          }}
        >
          {String(index + 1).padStart(2, '0')}
        </Text>

        {/* dot */}
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: state === 'done' ? '#22C55E' : state === 'running' ? C.red : 'rgba(255,255,255,0.15)',
            ...(state === 'running'
              ? ({ animation: 'sv-pulse 1.6s ease-out infinite' } as any)
              : {}),
          }}
        />

        <Text
          style={{
            flex: 1,
            fontFamily: FONT.mono,
            fontSize: 13,
            color: state === 'queued' ? 'rgba(255,255,255,0.4)' : '#FFFFFF',
            fontWeight: state === 'running' ? '600' : '500',
          }}
        >
          {label}
          {state === 'running' && totalSub != null ? (
            <Text style={{ color: C.redHot, fontWeight: '600' }}>
              {' '}· {subStep} / {totalSub}
            </Text>
          ) : null}
        </Text>

        <Text
          style={{
            fontFamily: FONT.mono,
            fontSize: 11,
            color: state === 'done' ? '#22C55E' : state === 'running' ? C.redHot : 'rgba(255,255,255,0.3)',
            fontVariant: ['tabular-nums'] as any,
          }}
        >
          {state === 'done' ? `+${detail}` : state === 'running' ? '...' : detail}
        </Text>
      </View>

      {/* sub-step bar for "rendering scene visuals" */}
      {state === 'running' && totalSub != null ? (
        <View style={{ marginLeft: 42, marginTop: 10, height: 2, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
          <View
            style={{
              height: 2,
              width: `${((subStep ?? 0) / totalSub) * 100}%`,
              backgroundColor: C.red,
              borderRadius: 999,
              ...({ transition: 'width 280ms cubic-bezier(0.2, 0.8, 0.2, 1)' } as any),
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

// =====================================================================
// Scene — full-viewport feature story
// =====================================================================
function Scene({
  ctx,
  eyebrow,
  title,
  body,
  visual,
  flipped,
}: {
  ctx: Ctx;
  eyebrow: string;
  title: string;
  body: string;
  visual: React.ReactNode;
  flipped?: boolean;
}) {
  const { isMobile, padX } = ctx;
  return (
    <View
      style={{
        paddingHorizontal: padX,
        paddingVertical: isMobile ? 64 : 140,
        borderTopWidth: 1,
        borderTopColor: C.hair,
      }}
    >
      <View
        style={{
          maxWidth: 1280,
          width: '100%',
          alignSelf: 'center',
          flexDirection: isMobile ? 'column' : flipped ? 'row-reverse' : 'row',
          alignItems: 'center',
          gap: isMobile ? 32 : 80,
        }}
      >
        <View style={{ flex: isMobile ? undefined : 0.9, width: '100%' }}>
          <Text
            style={{
              fontFamily: FONT.mono,
              fontSize: 11,
              color: C.red,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              marginBottom: 18,
            }}
          >
            {eyebrow}
          </Text>
          <Text
            style={{
              fontFamily: FONT.sans,
              fontSize: isMobile ? 36 : 64,
              lineHeight: isMobile ? 42 : 70,
              fontWeight: '700',
              color: C.ink,
              letterSpacing: isMobile ? -1.4 : -2.6,
              marginBottom: 22,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              fontFamily: FONT.sans,
              fontSize: isMobile ? 16 : 19,
              lineHeight: isMobile ? 24 : 30,
              color: C.body,
              maxWidth: 480,
            }}
          >
            {body}
          </Text>
        </View>

        <View style={{ flex: 1, width: '100%' }}>{visual}</View>
      </View>
    </View>
  );
}

// =====================================================================
// Scene visuals
// =====================================================================
function LanguagesVisual({ ctx }: { ctx: Ctx }) {
  // Three big language glyphs that gently float
  const langs = [
    { glyph: 'த', name: 'TAMIL', sample: 'இன்று செய்தி', delay: 0 },
    { glyph: 'अ', name: 'HINDI', sample: 'आज की ख़बर', delay: 200 },
    { glyph: 'A', name: 'ENGLISH', sample: 'today\'s news', delay: 400 },
  ];
  return (
    <View
      style={{
        flexDirection: ctx.isMobile ? 'column' : 'row',
        gap: 12,
        width: '100%',
      }}
    >
      {langs.map((l, i) => (
        <LangCard key={i} {...l} />
      ))}
    </View>
  );
}

function LangCard({ glyph, name, sample, delay }: { glyph: string; name: string; sample: string; delay: number }) {
  const [hover, setHover] = useState(false);
  return (
    <Pressable
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={{
        flex: 1,
        aspectRatio: 1,
        borderRadius: 18,
        backgroundColor: C.ink,
        padding: 24,
        justifyContent: 'space-between',
        overflow: 'hidden',
        position: 'relative',
        transform: [{ translateY: hover ? -6 : 0 }] as any,
        ...({
          transition: 'transform 350ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 350ms ease',
          animation: `sv-rise-in 700ms ${delay}ms cubic-bezier(0.2,0.8,0.2,1) both`,
          boxShadow: hover
            ? '0 30px 60px -30px rgba(225,29,44,0.50)'
            : '0 24px 48px -24px rgba(10,10,11,0.30)',
        } as any),
      }}
    >
      <View
        style={{
          position: 'absolute',
          right: -20,
          bottom: -40,
          opacity: hover ? 0.18 : 0.10,
          ...({ transition: 'opacity 400ms ease' } as any),
        }}
      >
        <Text
          style={{
            fontFamily: FONT.serif,
            fontStyle: 'italic',
            fontSize: 220,
            lineHeight: 220,
            color: '#FFFFFF',
            fontWeight: '500',
          }}
        >
          {glyph}
        </Text>
      </View>
      <View>
        <Text style={{ fontFamily: FONT.mono, fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5 }}>
          {name}
        </Text>
        <Text
          style={{
            fontFamily: FONT.serif,
            fontStyle: 'italic',
            fontSize: 56,
            lineHeight: 60,
            color: '#FFFFFF',
            fontWeight: '500',
            letterSpacing: -2,
            marginTop: 12,
          }}
        >
          {glyph}
        </Text>
      </View>
      <View>
        <Text style={{ fontFamily: FONT.sans, fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: '500' }}>
          {sample}
        </Text>
        {/* Animated waveform */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 14, marginTop: 12 }}>
          {Array.from({ length: 24 }).map((_, i) => (
            <View
              key={i}
              style={{
                width: 2,
                height: `${30 + Math.abs(Math.sin(i * 0.7)) * 70}%`,
                backgroundColor: C.redHot,
                borderRadius: 1,
                opacity: 0.85,
                ...({
                  animation: `sv-pulse-dot ${800 + i * 30}ms ease-in-out infinite`,
                  animationDelay: `${i * 40}ms`,
                } as any),
              }}
            />
          ))}
        </View>
      </View>
    </Pressable>
  );
}

function ScheduleVisual({ ctx }: { ctx: Ctx }) {
  // Simulated calendar week with red dot slots
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const slots = [
    [true, false, true, false, false, true, false], // 09:00
    [false, true, false, true, true, false, true], // 13:00
    [true, true, true, true, true, true, true], // 19:00
  ];
  const times = ['09:00', '13:00', '19:00'];
  return (
    <View
      style={{
        borderRadius: 18,
        backgroundColor: C.warm,
        borderWidth: 1,
        borderColor: C.hair,
        padding: ctx.isMobile ? 18 : 28,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: C.muted, letterSpacing: 1.2, textTransform: 'uppercase' }}>
          this week · IST
        </Text>
        <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: C.red, letterSpacing: 1.2, fontWeight: '600' }}>
          12 SCHEDULED
        </Text>
      </View>

      {/* Day header */}
      <View style={{ flexDirection: 'row', marginBottom: 8 }}>
        <View style={{ width: 50 }} />
        {days.map((d, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontFamily: FONT.mono, fontSize: 10, color: C.muted, letterSpacing: 0.5 }}>
              {d}
            </Text>
          </View>
        ))}
      </View>

      {/* Slots */}
      {times.map((t, ti) => (
        <View key={t} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
          <Text
            style={{
              width: 50,
              fontFamily: FONT.mono,
              fontSize: 11,
              color: C.body,
              fontVariant: ['tabular-nums'] as any,
            }}
          >
            {t}
          </Text>
          {days.map((_, di) => {
            const filled = slots[ti]?.[di];
            return (
              <View key={di} style={{ flex: 1, alignItems: 'center' }}>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    backgroundColor: filled ? C.red : C.surface,
                    borderWidth: 1,
                    borderColor: filled ? C.red : C.hair,
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...(filled && ti === 1 && di === 1
                      ? ({ animation: 'sv-pulse 1.8s ease-out infinite' } as any)
                      : {}),
                  }}
                >
                  {filled ? <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#FFFFFF' }} /> : null}
                </View>
              </View>
            );
          })}
        </View>
      ))}

      <View
        style={{
          marginTop: 18,
          paddingTop: 18,
          borderTopWidth: 1,
          borderTopColor: C.hair,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E', ...({ animation: 'sv-pulse-dot 2s ease-in-out infinite' } as any) }} />
        <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: C.body }}>
          next fire · today 13:00 · "wwdc top 5"
        </Text>
      </View>
    </View>
  );
}

function VisualsVisual({ ctx }: { ctx: Ctx }) {
  // Grid of 6 scenes — 4 clean, 2 have crossed-out "AI-text" warnings
  const scenes = [
    { tone: '#1A1A1C', clean: true, label: 'scene 01' },
    { tone: '#3F1D1F', clean: true, label: 'scene 02' },
    { tone: '#1F2937', clean: true, label: 'scene 03' },
    { tone: '#2C2113', clean: true, label: 'scene 04' },
    { tone: '#1A1A1C', clean: true, label: 'scene 05' },
    { tone: '#1F1A2C', clean: true, label: 'scene 06' },
  ];
  return (
    <View
      style={{
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: C.hair,
        backgroundColor: C.paper,
        padding: 16,
      }}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {scenes.map((s, i) => (
          <View
            key={i}
            style={{
              flexBasis: ctx.isMobile ? '48%' : '32%',
              flexGrow: 1,
              aspectRatio: 9 / 16,
              borderRadius: 12,
              backgroundColor: s.tone,
              overflow: 'hidden',
              padding: 12,
              justifyContent: 'space-between',
              ...({
                animation: `sv-rise-in 600ms ${i * 80}ms cubic-bezier(0.2,0.8,0.2,1) both`,
                backgroundImage:
                  'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%, rgba(0,0,0,0.30) 100%)',
              } as any),
            }}
          >
            <Text style={{ fontFamily: FONT.mono, fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: 1 }}>
              {s.label}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#22C55E' }} />
              <Text style={{ fontFamily: FONT.mono, fontSize: 9, color: '#22C55E', fontWeight: '600' }}>
                no text
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View
        style={{
          marginTop: 16,
          padding: 12,
          borderRadius: 10,
          backgroundColor: C.warm,
          borderWidth: 1,
          borderColor: C.hair,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: C.body, flex: 1 }}>
          /scenes · 6 of 6 generated · 0 with garbled text
        </Text>
        <Text
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            color: '#22C55E',
            fontWeight: '700',
            letterSpacing: 1.2,
          }}
        >
          PASSED
        </Text>
      </View>
    </View>
  );
}

// =====================================================================
// Big counter — animates on view
// =====================================================================
function BigCounter({ ctx }: { ctx: Ctx }) {
  const { isMobile, padX } = ctx;
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<View>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !started) {
            setStarted(true);
            const target = 1247;
            const duration = 1800;
            const start = performance.now();
            const tick = (now: number) => {
              const t = Math.min(1, (now - start) / duration);
              const eased = 1 - Math.pow(1 - t, 3);
              setValue(Math.floor(target * eased));
              if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }
        }
      },
      { threshold: 0.4 },
    );
    const node = (ref.current as any)?.['_nativeTag'] != null ? null : (ref.current as unknown as Element);
    // RN Web: ref forwards a DOM element
    if (node) observer.observe(node);
    return () => observer.disconnect();
  }, [started]);

  return (
    <View
      ref={ref as any}
      style={{
        paddingHorizontal: padX,
        paddingVertical: isMobile ? 80 : 200,
        backgroundColor: C.ink,
        alignItems: 'center',
        ...({
          backgroundImage:
            'radial-gradient(circle at 50% 50%, rgba(225,29,44,0.10), transparent 60%)',
        } as any),
      }}
    >
      <Text
        style={{
          fontFamily: FONT.mono,
          fontSize: 11,
          color: 'rgba(255,255,255,0.45)',
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          marginBottom: 28,
        }}
      >
        last 7 days · across snapviral creators
      </Text>
      <Text
        style={{
          fontFamily: FONT.sans,
          fontSize: isMobile ? 84 : 220,
          lineHeight: isMobile ? 88 : 220,
          fontWeight: '700',
          color: '#FFFFFF',
          letterSpacing: isMobile ? -3 : -10,
          fontVariant: ['tabular-nums'] as any,
        }}
      >
        {value.toLocaleString()}
      </Text>
      <Text
        style={{
          fontFamily: FONT.serif,
          fontStyle: 'italic',
          fontWeight: '500',
          fontSize: isMobile ? 22 : 36,
          lineHeight: isMobile ? 28 : 44,
          color: 'rgba(255,255,255,0.7)',
          textAlign: 'center',
          marginTop: 24,
          maxWidth: 720,
        }}
      >
        Shorts shipped while their creators slept.
      </Text>
    </View>
  );
}

// =====================================================================
// Pricing
// =====================================================================
function Pricing({ ctx }: { ctx: Ctx }) {
  const { isMobile, padX, router } = ctx;
  const { data: plans } = usePlans();

  const free = plans?.find((p) => p.key === 'free');
  const creator = plans?.find((p) => p.key === 'creator');

  return (
    <View style={{ paddingHorizontal: padX, paddingVertical: isMobile ? 80 : 160 }}>
      <View style={{ maxWidth: 1100, width: '100%', alignSelf: 'center' }}>
        <Text
          style={{
            fontFamily: FONT.mono,
            fontSize: 11,
            color: C.red,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            marginBottom: 18,
          }}
        >
          Pricing
        </Text>
        <Text
          style={{
            fontFamily: FONT.sans,
            fontSize: isMobile ? 36 : 72,
            lineHeight: isMobile ? 42 : 76,
            fontWeight: '700',
            color: C.ink,
            letterSpacing: isMobile ? -1.4 : -3,
            marginBottom: isMobile ? 8 : 24,
            maxWidth: 800,
          }}
        >
          Two paths in.{' '}
          <Text style={{ fontFamily: FONT.serif, fontStyle: 'italic', fontWeight: '500', color: C.subtle }}>
            Pick yours.
          </Text>
        </Text>

        <View
          style={{
            flexDirection: isMobile ? 'column' : 'row',
            gap: 0,
            marginTop: isMobile ? 32 : 56,
            borderTopWidth: 1,
            borderTopColor: C.hair,
          }}
        >
          {/* Free */}
          <PriceColumn
            title="Free"
            price="$0"
            cadence="forever"
            blurb={free?.description ?? '2 videos a month. To get a feel.'}
            features={
              free?.features?.slice(0, 4) ?? [
                '2 videos / month',
                'All 3 languages',
                'Watermarked output',
                'Manual publish only',
              ]
            }
            cta="Sign up"
            onPress={() => router.push('/signup')}
            isMobile={isMobile}
            divider={!isMobile}
          />
          {/* Creator */}
          <PriceColumn
            title="Creator"
            price={creator ? `$${(creator.monthlyPriceUsdCents / 100).toFixed(0)}` : '$29'}
            cadence="/ month"
            blurb={creator?.description ?? '30 videos a month. Auto-publish on. Ship daily.'}
            features={
              creator?.features?.slice(0, 4) ?? [
                '30 videos / month',
                'Auto-publish to YouTube',
                'Live web research',
                'No watermark',
              ]
            }
            cta="Try Creator"
            onPress={() => router.push('/signup')}
            isMobile={isMobile}
            featured
          />
        </View>

        <Pressable
          onPress={() => router.push('/signup')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 28, alignSelf: 'flex-start' }}
        >
          <Text style={{ fontFamily: FONT.sans, fontSize: 13, color: C.muted, fontWeight: '500' }}>
            Pro & Studio plans, INR pricing
          </Text>
          <ArrowRight size={12} color={C.muted} />
        </Pressable>
      </View>
    </View>
  );
}

function PriceColumn({
  title,
  price,
  cadence,
  blurb,
  features,
  cta,
  onPress,
  isMobile,
  featured,
  divider,
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
  divider?: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <Pressable
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={{
        flex: 1,
        paddingVertical: isMobile ? 28 : 40,
        paddingHorizontal: isMobile ? 0 : 32,
        borderRightWidth: divider ? 1 : 0,
        borderRightColor: C.hair,
        borderBottomWidth: isMobile ? 1 : 0,
        borderBottomColor: C.hair,
        backgroundColor: featured ? (hover ? C.warm : 'transparent') : 'transparent',
        ...({ transition: 'background 250ms ease' } as any),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <Text style={{ fontFamily: FONT.sans, fontSize: 14, fontWeight: '700', color: C.ink, letterSpacing: -0.2 }}>
          {title}
        </Text>
        {featured ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              paddingHorizontal: 8,
              height: 22,
              borderRadius: 999,
              backgroundColor: C.red,
            }}
          >
            <View
              style={{
                width: 5,
                height: 5,
                borderRadius: 2.5,
                backgroundColor: '#FFFFFF',
                ...({ animation: 'sv-pulse-dot 1.6s ease-in-out infinite' } as any),
              }}
            />
            <Text style={{ fontFamily: FONT.mono, fontSize: 9, fontWeight: '700', color: '#FFFFFF', letterSpacing: 1 }}>
              MOST PICKED
            </Text>
          </View>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 10 }}>
        <Text
          style={{
            fontFamily: FONT.sans,
            fontSize: 56,
            fontWeight: '700',
            color: C.ink,
            letterSpacing: -2.4,
            fontVariant: ['tabular-nums'] as any,
          }}
        >
          {price}
        </Text>
        <Text style={{ fontFamily: FONT.sans, fontSize: 14, color: C.muted, marginLeft: 6 }}>{cadence}</Text>
      </View>
      <Text
        style={{
          fontFamily: FONT.serif,
          fontStyle: 'italic',
          fontSize: 16,
          lineHeight: 24,
          color: C.body,
          fontWeight: '500',
          marginBottom: 28,
        }}
      >
        {blurb}
      </Text>

      <Pressable
        onPress={onPress}
        style={{
          height: 44,
          borderRadius: 999,
          backgroundColor: featured ? C.ink : 'transparent',
          borderWidth: 1,
          borderColor: featured ? C.ink : C.hairline,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 6,
          marginBottom: 24,
        }}
      >
        <Text
          style={{
            fontFamily: FONT.sans,
            fontSize: 13,
            fontWeight: '600',
            color: featured ? '#FFFFFF' : C.ink,
            letterSpacing: -0.2,
          }}
        >
          {cta}
        </Text>
        <ArrowRight size={12} color={featured ? '#FFFFFF' : C.ink} />
      </Pressable>

      <View style={{ gap: 10 }}>
        {features.map((f, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
            <Text
              style={{
                fontFamily: FONT.mono,
                fontSize: 11,
                color: C.subtle,
                fontVariant: ['tabular-nums'] as any,
                width: 18,
                marginTop: 1,
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </Text>
            <Text style={{ fontFamily: FONT.sans, fontSize: 14, color: C.body, flex: 1, lineHeight: 22 }}>{f}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

// =====================================================================
// Outro
// =====================================================================
function Outro({ ctx }: { ctx: Ctx }) {
  const { isMobile, padX, router } = ctx;
  return (
    <View
      style={{
        paddingHorizontal: padX,
        paddingVertical: isMobile ? 96 : 200,
        borderTopWidth: 1,
        borderTopColor: C.hair,
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          fontFamily: FONT.sans,
          fontSize: isMobile ? 40 : 116,
          lineHeight: isMobile ? 44 : 116,
          fontWeight: '700',
          color: C.ink,
          letterSpacing: isMobile ? -1.8 : -5,
          textAlign: 'center',
          maxWidth: 1080,
        }}
      >
        Stop talking.{'\n'}
        <Text style={{ fontFamily: FONT.serif, fontStyle: 'italic', fontWeight: '500', color: C.red }}>
          Start shipping.
        </Text>
      </Text>
      <View style={{ marginTop: isMobile ? 32 : 56 }}>
        <CTA primary onPress={() => router.push('/signup')}>
          Start free — no card
        </CTA>
      </View>
    </View>
  );
}

// =====================================================================
// Footer
// =====================================================================
function Footer({ ctx }: { ctx: Ctx }) {
  const { isMobile, padX, router } = ctx;
  return (
    <View
      style={{
        paddingHorizontal: padX,
        paddingTop: 48,
        paddingBottom: 36,
        borderTopWidth: 1,
        borderTopColor: C.hair,
      }}
    >
      <View style={{ maxWidth: 1280, width: '100%', alignSelf: 'center' }}>
        <View
          style={{
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'flex-end',
            gap: 32,
          }}
        >
          <View style={{ maxWidth: 360 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <SnapViralLogo size={20} />
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text style={{ fontFamily: FONT.sans, fontSize: 14, fontWeight: '800', color: C.ink, letterSpacing: -0.4 }}>
                  Snap
                </Text>
                <Text
                  style={{
                    fontFamily: FONT.serif,
                    fontStyle: 'italic',
                    fontSize: 14,
                    fontWeight: '600',
                    color: C.red,
                    letterSpacing: -0.4,
                  }}
                >
                  Viral
                </Text>
              </View>
            </View>
            <Text style={{ fontFamily: FONT.sans, fontSize: 13, color: C.body, lineHeight: 20 }}>
              An autopilot for YouTube Shorts. Built in Chennai. Shipping for creators worldwide.
            </Text>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: isMobile ? 24 : 48 }}>
            <FootCol
              label="Product"
              links={[
                ['Sign in', '/login'],
                ['Sign up', '/signup'],
                ['Blog', '/blog'],
                ['Admin', '/admin/login'],
              ]}
              router={router}
            />
            <FootCol
              label="Legal"
              links={[
                ['Privacy', '/privacy'],
                ['Terms', '/terms'],
              ]}
              router={router}
            />
          </View>
        </View>

        <View
          style={{
            marginTop: 48,
            paddingTop: 20,
            borderTopWidth: 1,
            borderTopColor: C.hair,
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: 8,
          }}
        >
          <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: C.muted }}>
            © {new Date().getFullYear()} SnapViral · all systems operational
          </Text>
          <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: C.muted }}>app.snapviral.in</Text>
        </View>
      </View>
    </View>
  );
}

function FootCol({
  label,
  links,
  router,
}: {
  label: string;
  links: Array<[string, string]>;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <View style={{ gap: 10 }}>
      <Text
        style={{
          fontFamily: FONT.mono,
          fontSize: 10,
          color: C.muted,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          marginBottom: 4,
        }}
      >
        {label}
      </Text>
      {links.map(([t, h]) => (
        <FootLink key={t} label={t} onPress={() => router.push(h as any)} />
      ))}
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
          ...({ transition: 'color 200ms ease' } as any),
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
