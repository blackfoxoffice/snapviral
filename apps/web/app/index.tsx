import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import {
  ArrowRight,
  Plus,
  Minus,
  Check,
  X,
  Languages,
  Globe2,
  Calendar,
  ShieldCheck,
  Sparkles,
  Zap,
  Mic2,
  Image as ImageIcon,
  Youtube,
  Wand2,
  Menu,
  ChevronRight,
} from 'lucide-react-native';
import { useAuth } from '../lib/auth';
import { useBlogPosts, usePlans } from '../lib/queries';
import { SnapViralLogo } from '../components/icons/SnapViralLogo';

// =====================================================================
// Layout primitives
// =====================================================================

function useLayout() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1100;
  const isWide = width >= 1100;
  const padX = isMobile ? 20 : isWide ? 56 : 36;
  return { width, isMobile, isTablet, isWide, padX };
}

const COLOR = {
  ink: '#0A0A0B',
  inkSoft: '#1A1A1C',
  body: '#383B40',
  muted: '#6B7280',
  subtle: '#9CA3AF',
  faint: '#D1D5DB',
  hairline: 'rgba(10,10,11,0.08)',
  hairlineSoft: 'rgba(10,10,11,0.05)',
  paper: '#FFFFFF',
  paperWarm: '#FAFAF9',
  surface: '#F5F5F4',
  brand: '#E11D2C',
  brandHot: '#FF3D4F',
  brandSoft: '#FFE9EB',
  good: '#0F9D58',
} as const;

// =====================================================================
// Page
// =====================================================================
export default function Index() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const layout = useLayout();

  const { data: blog } = useBlogPosts({ limit: 3 });
  const { data: plans } = usePlans();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLOR.paper }}>
        <ActivityIndicator color={COLOR.brand} />
      </View>
    );
  }

  if (session) return <Redirect href="/dashboard" />;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLOR.paper }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 0 }}
    >
      <Nav onLogin={() => router.push('/login')} onSignup={() => router.push('/signup')} layout={layout} />
      <Hero layout={layout} onSignup={() => router.push('/signup')} />
      <Metrics layout={layout} />
      <BentoFeatures layout={layout} />
      <Pipeline layout={layout} />
      <Comparison layout={layout} />
      {plans && plans.length > 0 ? <Pricing layout={layout} plans={plans} onSignup={() => router.push('/signup')} /> : null}
      {blog?.posts && blog.posts.length > 0 ? (
        <BlogPreview
          layout={layout}
          posts={blog.posts}
          onSeeAll={() => router.push('/blog' as any)}
          onPost={(slug) => router.push(`/blog/${slug}` as any)}
        />
      ) : null}
      <FAQ layout={layout} />
      <FinalCTA layout={layout} onSignup={() => router.push('/signup')} />
      <Footer layout={layout} router={router} />
    </ScrollView>
  );
}

// =====================================================================
// Nav
// =====================================================================
function Nav({ onLogin, onSignup, layout }: { onLogin: () => void; onSignup: () => void; layout: ReturnType<typeof useLayout> }) {
  const { isMobile, padX } = layout;
  const [open, setOpen] = useState(false);
  return (
    <View
      style={{
        position: 'sticky' as any,
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(255,255,255,0.78)',
        ...({ backdropFilter: 'saturate(180%) blur(12px)', WebkitBackdropFilter: 'saturate(180%) blur(12px)' } as any),
        borderBottomWidth: 1,
        borderBottomColor: COLOR.hairlineSoft,
      }}
    >
      <View
        style={{
          maxWidth: 1240,
          width: '100%',
          alignSelf: 'center',
          paddingHorizontal: padX,
          paddingVertical: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Pressable
          onPress={() => setOpen(false)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 36 }}
        >
          <SnapViralLogo size={26} />
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: COLOR.ink, letterSpacing: -0.4 }}>Snap</Text>
            <Text style={{ fontSize: 16, fontWeight: '800', color: COLOR.brand, letterSpacing: -0.4, fontStyle: 'italic' }}>
              Viral
            </Text>
          </View>
        </Pressable>

        {!isMobile ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <NavLink label="Features" />
            <NavLink label="Pipeline" />
            <NavLink label="Pricing" />
            <NavLink label="Blog" />
            <NavLink label="FAQ" />
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: isMobile ? 6 : 10 }}>
          {!isMobile ? (
            <Pressable onPress={onLogin} style={{ paddingHorizontal: 12, paddingVertical: 8, height: 36, justifyContent: 'center' }}>
              <Text style={{ fontSize: 13, color: COLOR.body, fontWeight: '500' }}>Sign in</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={onSignup}
            style={{
              backgroundColor: COLOR.ink,
              paddingHorizontal: 14,
              height: 36,
              borderRadius: 999,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: COLOR.paper }}>
              {isMobile ? 'Start free' : 'Get started'}
            </Text>
            <ArrowRight size={12} color={COLOR.paper} />
          </Pressable>
          {isMobile ? (
            <Pressable
              onPress={() => setOpen((v) => !v)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: COLOR.hairline,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Menu size={16} color={COLOR.ink} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Mobile expanded menu */}
      {isMobile && open ? (
        <View
          style={{
            paddingHorizontal: padX,
            paddingBottom: 16,
            borderTopWidth: 1,
            borderTopColor: COLOR.hairlineSoft,
            gap: 4,
          }}
        >
          {['Features', 'Pipeline', 'Pricing', 'Blog', 'FAQ'].map((label) => (
            <Pressable key={label} style={{ paddingVertical: 12 }}>
              <Text style={{ fontSize: 14, color: COLOR.ink, fontWeight: '500' }}>{label}</Text>
            </Pressable>
          ))}
          <Pressable onPress={onLogin} style={{ paddingVertical: 12 }}>
            <Text style={{ fontSize: 14, color: COLOR.ink, fontWeight: '500' }}>Sign in</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function NavLink({ label }: { label: string }) {
  return (
    <Pressable
      style={{
        paddingHorizontal: 12,
        height: 36,
        borderRadius: 999,
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: 13, color: COLOR.body, fontWeight: '500' }}>{label}</Text>
    </Pressable>
  );
}

// =====================================================================
// Hero
// =====================================================================
function Hero({ layout, onSignup }: { layout: ReturnType<typeof useLayout>; onSignup: () => void }) {
  const { isMobile, padX } = layout;
  return (
    <View style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Subtle dotted backdrop */}
      <View
        style={{
          position: 'absolute',
          inset: 0 as any,
          ...({
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(10,10,11,0.06) 1px, transparent 0)',
            backgroundSize: '20px 20px',
            maskImage:
              'radial-gradient(ellipse 80% 60% at 50% 30%, black 35%, transparent 75%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 80% 60% at 50% 30%, black 35%, transparent 75%)',
          } as any),
        }}
      />
      <View
        style={{
          maxWidth: 1240,
          width: '100%',
          alignSelf: 'center',
          paddingHorizontal: padX,
          paddingTop: isMobile ? 56 : 96,
          paddingBottom: isMobile ? 32 : 48,
        }}
      >
        {/* Eyebrow */}
        <View
          style={{
            flexDirection: 'row',
            alignSelf: 'flex-start',
            alignItems: 'center',
            gap: 8,
            paddingLeft: 6,
            paddingRight: 12,
            paddingVertical: 5,
            borderRadius: 999,
            backgroundColor: COLOR.paper,
            borderWidth: 1,
            borderColor: COLOR.hairline,
            marginBottom: isMobile ? 24 : 32,
          }}
        >
          <View
            style={{
              paddingHorizontal: 8,
              height: 20,
              borderRadius: 999,
              backgroundColor: COLOR.brandSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: '700',
                color: COLOR.brand,
                letterSpacing: 0.5,
              }}
            >
              NEW
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: COLOR.body, fontWeight: '500' }}>
            Per-topic voice & language overrides — ship now
          </Text>
        </View>

        {/* Headline */}
        <Text
          style={{
            fontSize: isMobile ? 44 : 92,
            lineHeight: isMobile ? 46 : 92,
            fontWeight: '700',
            color: COLOR.ink,
            letterSpacing: isMobile ? -1.6 : -3.6,
            maxWidth: 980,
          }}
        >
          A YouTube channel{'\n'}
          that <Text style={{ fontStyle: 'italic', color: COLOR.brand, fontWeight: '600' }}>runs itself.</Text>
        </Text>

        {/* Subhead */}
        <Text
          style={{
            fontSize: isMobile ? 16 : 20,
            lineHeight: isMobile ? 24 : 32,
            color: COLOR.body,
            marginTop: isMobile ? 18 : 28,
            maxWidth: 620,
          }}
        >
          SnapViral writes, narrates and animates 3–5 vertical Shorts every day, in Tamil, Hindi
          or English, then schedules them straight to your channel. Topic in. Subscribers out.
        </Text>

        {/* CTA row */}
        <View
          style={{
            marginTop: isMobile ? 28 : 40,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <Pressable
            onPress={onSignup}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: COLOR.ink,
              paddingHorizontal: 22,
              height: 48,
              borderRadius: 12,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: COLOR.paper, letterSpacing: -0.2 }}>
              Start free
            </Text>
            <ArrowRight size={14} color={COLOR.paper} />
          </Pressable>
          <Pressable
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: 18,
              height: 48,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: COLOR.hairline,
              backgroundColor: COLOR.paper,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: COLOR.ink, letterSpacing: -0.2 }}>
              See a sample short
            </Text>
            <ArrowRight size={13} color={COLOR.muted} />
          </Pressable>
        </View>

        {/* Trust line */}
        <Text style={{ fontSize: 12, color: COLOR.muted, marginTop: 14 }}>
          No credit card · 2 free videos · Cancel any time
        </Text>
      </View>

      {/* Product peek */}
      <View
        style={{
          paddingHorizontal: padX,
          paddingBottom: isMobile ? 48 : 80,
          maxWidth: 1240,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        <ProductPeek isMobile={isMobile} />
      </View>
    </View>
  );
}

// A real-looking dashboard peek: topic queue + live generation panel
function ProductPeek({ isMobile }: { isMobile: boolean }) {
  return (
    <View
      style={{
        borderRadius: 20,
        backgroundColor: COLOR.paper,
        borderWidth: 1,
        borderColor: COLOR.hairline,
        overflow: 'hidden',
        ...({
          boxShadow:
            '0 1px 0 rgba(10,10,11,0.04), 0 16px 40px -16px rgba(10,10,11,0.18), 0 32px 80px -32px rgba(10,10,11,0.16)',
        } as any),
      }}
    >
      {/* Browser chrome */}
      <View
        style={{
          height: 36,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
          gap: 6,
          borderBottomWidth: 1,
          borderBottomColor: COLOR.hairlineSoft,
          backgroundColor: COLOR.paperWarm,
        }}
      >
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF5F57' }} />
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#FEBC2E' }} />
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#28C840' }} />
        <View
          style={{
            marginLeft: 16,
            paddingHorizontal: 10,
            height: 22,
            borderRadius: 6,
            backgroundColor: COLOR.paper,
            borderWidth: 1,
            borderColor: COLOR.hairlineSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 11, color: COLOR.muted }}>app.snapviral.in/automation</Text>
        </View>
      </View>

      <View style={{ flexDirection: isMobile ? 'column' : 'row', minHeight: isMobile ? undefined : 380 }}>
        {/* Left: Topic queue */}
        <View
          style={{
            flex: isMobile ? undefined : 1.3,
            padding: isMobile ? 18 : 24,
            borderRightWidth: isMobile ? 0 : 1,
            borderRightColor: COLOR.hairlineSoft,
            borderBottomWidth: isMobile ? 1 : 0,
            borderBottomColor: COLOR.hairlineSoft,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: COLOR.ink, letterSpacing: -0.2 }}>
              Topic queue
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 8,
                height: 22,
                borderRadius: 999,
                backgroundColor: 'rgba(15,157,88,0.08)',
              }}
            >
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: COLOR.good }} />
              <Text style={{ fontSize: 10, fontWeight: '700', color: COLOR.good, letterSpacing: 0.5 }}>AUTO</Text>
            </View>
          </View>

          {([
            { topic: 'Chennai metro phase 2 inauguration', lang: 'TA', when: '08:30', state: 'done' },
            { topic: 'India vs Australia T20 highlights', lang: 'TA', when: '12:15', state: 'running' },
            { topic: 'Apple WWDC keynote — top 5 announcements', lang: 'EN', when: '18:00', state: 'queued' },
            { topic: 'दिल्ली में आज का मौसम', lang: 'HI', when: '21:30', state: 'queued' },
          ] as const).map((row, i) => (
            <TopicRow key={i} {...row} />
          ))}
        </View>

        {/* Right: Live generation panel */}
        <View style={{ flex: 1, padding: isMobile ? 18 : 24, backgroundColor: COLOR.paperWarm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: COLOR.ink, letterSpacing: -0.2 }}>
              Generating · 12:15 IST
            </Text>
            <Text style={{ fontSize: 11, color: COLOR.muted, fontVariant: ['tabular-nums'] as any }}>2:14 left</Text>
          </View>

          {/* Pipeline progress */}
          {([
            { label: 'Web research', state: 'done' as const },
            { label: 'Script', state: 'done' as const },
            { label: 'Scene visuals', state: 'running' as const, detail: '3 of 6' },
            { label: 'Voiceover', state: 'queued' as const },
            { label: 'Subtitle align', state: 'queued' as const },
            { label: 'Compose & publish', state: 'queued' as const },
          ]).map((p, i) => (
            <PipelineRow key={i} {...p} />
          ))}
        </View>
      </View>
    </View>
  );
}

function TopicRow({
  topic,
  lang,
  when,
  state,
}: {
  topic: string;
  lang: string;
  when: string;
  state: 'done' | 'running' | 'queued';
}) {
  const stateColor = state === 'done' ? COLOR.good : state === 'running' ? COLOR.brand : COLOR.muted;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLOR.hairlineSoft,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: COLOR.surface,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: COLOR.hairlineSoft,
        }}
      >
        <Text style={{ fontSize: 9, fontWeight: '800', color: COLOR.body, letterSpacing: 0.5 }}>{lang}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, color: COLOR.ink, fontWeight: '500' }} numberOfLines={1}>
          {topic}
        </Text>
        <Text style={{ fontSize: 11, color: COLOR.muted, marginTop: 2, fontVariant: ['tabular-nums'] as any }}>
          {when} IST
        </Text>
      </View>
      <View
        style={{
          paddingHorizontal: 8,
          height: 22,
          borderRadius: 6,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor:
            state === 'done'
              ? 'rgba(15,157,88,0.10)'
              : state === 'running'
                ? COLOR.brandSoft
                : COLOR.surface,
        }}
      >
        <Text style={{ fontSize: 10, fontWeight: '700', color: stateColor, letterSpacing: 0.5 }}>
          {state === 'done' ? 'PUBLISHED' : state === 'running' ? 'RENDERING' : 'QUEUED'}
        </Text>
      </View>
    </View>
  );
}

function PipelineRow({ label, state, detail }: { label: string; state: 'done' | 'running' | 'queued'; detail?: string }) {
  const stateColor = state === 'done' ? COLOR.good : state === 'running' ? COLOR.brand : COLOR.muted;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 11,
      }}
    >
      <View
        style={{
          width: 16,
          height: 16,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: state === 'done' ? COLOR.good : 'transparent',
          borderWidth: state === 'done' ? 0 : 1.5,
          borderColor: state === 'running' ? COLOR.brand : COLOR.faint,
        }}
      >
        {state === 'done' ? <Check size={10} color="#FFFFFF" strokeWidth={3} /> : null}
        {state === 'running' ? (
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: COLOR.brand }} />
        ) : null}
      </View>
      <Text
        style={{
          flex: 1,
          fontSize: 13,
          color: state === 'queued' ? COLOR.muted : COLOR.ink,
          fontWeight: state === 'running' ? '600' : '500',
        }}
      >
        {label}
      </Text>
      {detail ? (
        <Text style={{ fontSize: 11, color: stateColor, fontWeight: '600', fontVariant: ['tabular-nums'] as any }}>
          {detail}
        </Text>
      ) : null}
    </View>
  );
}

// =====================================================================
// Metrics
// =====================================================================
function Metrics({ layout }: { layout: ReturnType<typeof useLayout> }) {
  const { isMobile, padX } = layout;
  const stats = [
    { v: '4 min', k: 'Topic to upload' },
    { v: '3', k: 'Native languages' },
    { v: '1080×1920', k: 'Render resolution' },
    { v: '99.9%', k: 'Pipeline uptime' },
  ];
  return (
    <View
      style={{
        paddingHorizontal: padX,
        paddingVertical: isMobile ? 32 : 48,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: COLOR.hairlineSoft,
        backgroundColor: COLOR.paperWarm,
      }}
    >
      <View
        style={{
          maxWidth: 1240,
          width: '100%',
          alignSelf: 'center',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: isMobile ? 24 : 0,
        }}
      >
        {stats.map((s, i) => (
          <View
            key={i}
            style={{
              flexBasis: isMobile ? '50%' : '25%',
              alignItems: 'flex-start',
              borderLeftWidth: !isMobile && i > 0 ? 1 : 0,
              borderLeftColor: COLOR.hairlineSoft,
              paddingHorizontal: isMobile ? 0 : 24,
            }}
          >
            <Text
              style={{
                fontSize: isMobile ? 28 : 38,
                fontWeight: '700',
                color: COLOR.ink,
                letterSpacing: -1.2,
                fontVariant: ['tabular-nums'] as any,
              }}
            >
              {s.v}
            </Text>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '600',
                color: COLOR.muted,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                marginTop: 6,
              }}
            >
              {s.k}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// =====================================================================
// Bento Features
// =====================================================================
function BentoFeatures({ layout }: { layout: ReturnType<typeof useLayout> }) {
  const { isMobile, isTablet, padX } = layout;
  const cols = isMobile ? 1 : isTablet ? 2 : 3;
  return (
    <View style={{ paddingHorizontal: padX, paddingTop: isMobile ? 56 : 112, paddingBottom: isMobile ? 56 : 112 }}>
      <View style={{ maxWidth: 1240, width: '100%', alignSelf: 'center' }}>
        <SectionEyebrow>Capabilities</SectionEyebrow>
        <SectionTitle isMobile={isMobile}>
          A finished{' '}
          <Text style={{ color: COLOR.subtle }}>YouTube team,</Text>
          {'\n'}without the team.
        </SectionTitle>

        {/* Bento grid: 12-col on desktop, with mixed spans. We approximate with flex */}
        <View
          style={{
            marginTop: isMobile ? 32 : 56,
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 14,
          }}
        >
          {/* Big: language showcase */}
          <BentoCard
            spanCols={cols === 3 ? 2 : cols === 2 ? 2 : 1}
            cols={cols}
            tone="dark"
            minHeight={isMobile ? 320 : 360}
          >
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                <Languages size={14} color={COLOR.brandHot} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: COLOR.brandHot, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                  Native languages
                </Text>
              </View>
              <Text style={{ fontSize: isMobile ? 24 : 32, lineHeight: isMobile ? 30 : 38, fontWeight: '700', color: '#FFFFFF', letterSpacing: -1, marginBottom: 14 }}>
                Built for Tamil, Hindi & English — first.
              </Text>
              <Text style={{ fontSize: 14, lineHeight: 22, color: 'rgba(255,255,255,0.65)' }}>
                Proper Devanagari and Tamil shaping. Voiceover models tuned for each script. Subtitles
                burned in with the right typography, not a Latin font crammed into a Tamil sentence.
              </Text>

              <View
                style={{
                  marginTop: isMobile ? 24 : 36,
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <LanguageBubble label="த" name="Tamil" />
                <LanguageBubble label="अ" name="Hindi" />
                <LanguageBubble label="A" name="English" />
              </View>
            </View>
          </BentoCard>

          {/* Pipeline speed */}
          <BentoCard spanCols={1} cols={cols} tone="light" minHeight={isMobile ? 240 : 360}>
            <View style={{ flex: 1, justifyContent: 'space-between' }}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Wand2 size={14} color={COLOR.brand} />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: COLOR.brand, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    Speed
                  </Text>
                </View>
                <Text style={{ fontSize: 22, lineHeight: 28, fontWeight: '700', color: COLOR.ink, letterSpacing: -0.6, marginBottom: 10 }}>
                  Topic to publish in 4 minutes flat.
                </Text>
                <Text style={{ fontSize: 13, lineHeight: 20, color: COLOR.body }}>
                  Six chained steps, all parallelized where possible. No human in the loop.
                </Text>
              </View>
              <View style={{ marginTop: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 11, color: COLOR.muted, fontWeight: '600' }}>p50 latency</Text>
                  <Text style={{ fontSize: 11, color: COLOR.ink, fontWeight: '700', fontVariant: ['tabular-nums'] as any }}>3:42</Text>
                </View>
                <View style={{ height: 4, borderRadius: 999, backgroundColor: COLOR.surface, overflow: 'hidden' }}>
                  <View style={{ height: 4, width: '38%', backgroundColor: COLOR.brand, borderRadius: 999 }} />
                </View>
              </View>
            </View>
          </BentoCard>

          {/* Auto schedule */}
          <BentoCard spanCols={1} cols={cols} tone="light" minHeight={isMobile ? 240 : 240}>
            <View style={{ flex: 1, justifyContent: 'space-between' }}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Calendar size={14} color={COLOR.ink} />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: COLOR.ink, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    Auto-publish
                  </Text>
                </View>
                <Text style={{ fontSize: 18, lineHeight: 24, fontWeight: '700', color: COLOR.ink, letterSpacing: -0.4 }}>
                  Schedule weeks in advance.
                </Text>
                <Text style={{ fontSize: 13, lineHeight: 20, color: COLOR.body, marginTop: 8 }}>
                  Drop in 100 topics. Set publish slots. Walk away.
                </Text>
              </View>
            </View>
          </BentoCard>

          {/* Live web research */}
          <BentoCard spanCols={1} cols={cols} tone="light" minHeight={isMobile ? 240 : 240}>
            <View style={{ flex: 1, justifyContent: 'space-between' }}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Globe2 size={14} color={COLOR.ink} />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: COLOR.ink, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    Live web
                  </Text>
                </View>
                <Text style={{ fontSize: 18, lineHeight: 24, fontWeight: '700', color: COLOR.ink, letterSpacing: -0.4 }}>
                  Cited research, not stale prompts.
                </Text>
                <Text style={{ fontSize: 13, lineHeight: 20, color: COLOR.body, marginTop: 8 }}>
                  Perplexity Sonar Pro searches live, then Gemini scripts.
                </Text>
              </View>
            </View>
          </BentoCard>

          {/* Image quality */}
          <BentoCard spanCols={cols === 3 ? 2 : cols === 2 ? 2 : 1} cols={cols} tone="light" minHeight={isMobile ? 240 : 240}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <ImageIcon size={14} color={COLOR.ink} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: COLOR.ink, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                  Visuals
                </Text>
              </View>
              <Text style={{ fontSize: 22, lineHeight: 28, fontWeight: '700', color: COLOR.ink, letterSpacing: -0.6 }}>
                Cinematic 9:16. Zero AI-text inside the frame.
              </Text>
              <Text style={{ fontSize: 13, lineHeight: 20, color: COLOR.body, marginTop: 10, maxWidth: 460 }}>
                Per-scene image generation tuned to your language and culture. No misspelled signs,
                no AI-slop captions. Clean photographic shorts.
              </Text>
            </View>
          </BentoCard>

          {/* Vault */}
          <BentoCard spanCols={1} cols={cols} tone="light" minHeight={isMobile ? 240 : 240}>
            <View style={{ flex: 1, justifyContent: 'space-between' }}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <ShieldCheck size={14} color={COLOR.ink} />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: COLOR.ink, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    Security
                  </Text>
                </View>
                <Text style={{ fontSize: 18, lineHeight: 24, fontWeight: '700', color: COLOR.ink, letterSpacing: -0.4 }}>
                  API keys in a real vault.
                </Text>
                <Text style={{ fontSize: 13, lineHeight: 20, color: COLOR.body, marginTop: 8 }}>
                  AES-256 in Supabase Vault. Even admins see only the last 4.
                </Text>
              </View>
            </View>
          </BentoCard>
        </View>
      </View>
    </View>
  );
}

function BentoCard({
  children,
  spanCols,
  cols,
  tone,
  minHeight,
}: {
  children: React.ReactNode;
  spanCols: number;
  cols: number;
  tone: 'dark' | 'light';
  minHeight: number;
}) {
  // Compute width as a % of the row, accounting for 14px gaps
  // basis = (spanCols / cols) * 100% - gap-correction
  const basisPct = (spanCols / cols) * 100;
  return (
    <View
      style={{
        flexBasis: `calc(${basisPct}% - ${(14 * (cols - 1) * spanCols) / cols}px)` as any,
        flexGrow: 0,
        flexShrink: 0,
        minWidth: 220,
        minHeight,
        borderRadius: 18,
        backgroundColor: tone === 'dark' ? COLOR.ink : COLOR.paper,
        borderWidth: 1,
        borderColor: tone === 'dark' ? 'rgba(255,255,255,0.06)' : COLOR.hairline,
        padding: 24,
        ...({
          boxShadow:
            tone === 'dark'
              ? '0 24px 48px -24px rgba(10,10,11,0.30)'
              : '0 1px 0 rgba(10,10,11,0.03), 0 8px 24px -12px rgba(10,10,11,0.06)',
        } as any),
      }}
    >
      {children}
    </View>
  );
}

function LanguageBubble({ label, name }: { label: string; name: string }) {
  return (
    <View
      style={{
        paddingHorizontal: 14,
        height: 48,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <Text style={{ fontSize: 22, fontWeight: '700', color: '#FFFFFF', lineHeight: 24 }}>{label}</Text>
      <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500' }}>{name}</Text>
    </View>
  );
}

// =====================================================================
// Pipeline (dark)
// =====================================================================
function Pipeline({ layout }: { layout: ReturnType<typeof useLayout> }) {
  const { isMobile, padX } = layout;
  const steps = [
    { n: '01', Icon: Sparkles, title: 'Topic in', body: 'Yours, or AI-suggested from live trends.' },
    { n: '02', Icon: Wand2, title: 'Script', body: 'Gemini Flash, scene-by-scene, in your language.' },
    { n: '03', Icon: ImageIcon, title: 'Visuals', body: 'Cinematic 9:16 imagery, language-aware.' },
    { n: '04', Icon: Mic2, title: 'Voiceover', body: 'ElevenLabs, native shaping, frame-aligned.' },
    { n: '05', Icon: Zap, title: 'Compose', body: 'Subtitle burn-in, brand logo, ready to ship.' },
    { n: '06', Icon: Youtube, title: 'Publish', body: 'Auto-uploaded with AI-generated metadata.' },
  ];
  return (
    <View
      style={{
        backgroundColor: COLOR.ink,
        paddingHorizontal: padX,
        paddingVertical: isMobile ? 64 : 120,
        ...({
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        } as any),
      }}
    >
      <View style={{ maxWidth: 1240, width: '100%', alignSelf: 'center' }}>
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: COLOR.brandHot,
            letterSpacing: 1.8,
            textTransform: 'uppercase',
            marginBottom: 14,
          }}
        >
          The pipeline
        </Text>
        <Text
          style={{
            fontSize: isMobile ? 32 : 56,
            lineHeight: isMobile ? 36 : 60,
            fontWeight: '700',
            color: '#FFFFFF',
            letterSpacing: isMobile ? -1.2 : -2.4,
            maxWidth: 720,
            marginBottom: isMobile ? 32 : 56,
          }}
        >
          Six steps. <Text style={{ color: 'rgba(255,255,255,0.4)' }}>Zero of them are yours.</Text>
        </Text>

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 14,
          }}
        >
          {steps.map((s, i) => (
            <View
              key={i}
              style={{
                flexBasis: isMobile ? '100%' : '32%',
                flexGrow: 1,
                minWidth: 240,
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.08)',
                padding: 22,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 9,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.08)',
                  }}
                >
                  <s.Icon size={14} color={COLOR.brandHot} strokeWidth={2.2} />
                </View>
                <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, fontVariant: ['tabular-nums'] as any }}>
                  STEP / {s.n}
                </Text>
              </View>
              <Text style={{ fontSize: 17, fontWeight: '700', color: '#FFFFFF', marginBottom: 6, letterSpacing: -0.4 }}>
                {s.title}
              </Text>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 20 }}>
                {s.body}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// Comparison
// =====================================================================
function Comparison({ layout }: { layout: ReturnType<typeof useLayout> }) {
  const { isMobile, padX } = layout;
  const rows = [
    { feature: 'Native Tamil / Hindi voiceover', sv: true, editor: false, gpt: false },
    { feature: 'Live web research before each script', sv: true, editor: true, gpt: false },
    { feature: 'Schedules to YouTube on a cadence', sv: true, editor: false, gpt: false },
    { feature: 'Subtitle burn-in with native fonts', sv: true, editor: true, gpt: false },
    { feature: 'Auto-runs while you sleep', sv: true, editor: false, gpt: false },
    { feature: 'Cost / month for 90 Shorts', sv: '$29', editor: '$3,000+', gpt: '$60+' },
  ];
  return (
    <View style={{ paddingHorizontal: padX, paddingVertical: isMobile ? 56 : 112, backgroundColor: COLOR.paperWarm }}>
      <View style={{ maxWidth: 1080, width: '100%', alignSelf: 'center' }}>
        <SectionEyebrow>The honest comparison</SectionEyebrow>
        <SectionTitle isMobile={isMobile}>
          Faster than an editor.{'\n'}
          <Text style={{ color: COLOR.subtle }}>Cheaper than ChatGPT.</Text>
        </SectionTitle>

        <View
          style={{
            marginTop: isMobile ? 32 : 56,
            borderRadius: 16,
            backgroundColor: COLOR.paper,
            borderWidth: 1,
            borderColor: COLOR.hairline,
            overflow: 'hidden',
          }}
        >
          {/* Table header */}
          <View
            style={{
              flexDirection: 'row',
              borderBottomWidth: 1,
              borderBottomColor: COLOR.hairlineSoft,
              backgroundColor: COLOR.paperWarm,
            }}
          >
            <View style={{ flex: isMobile ? 1.4 : 2, padding: isMobile ? 14 : 18 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: COLOR.muted, letterSpacing: 1.2, textTransform: 'uppercase' }}>
                Feature
              </Text>
            </View>
            <ColHead label="SnapViral" highlight />
            <ColHead label={isMobile ? 'Editor' : 'Hire an editor'} />
            <ColHead label={isMobile ? 'GPT' : 'ChatGPT + tools'} />
          </View>

          {rows.map((r, i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                borderBottomWidth: i === rows.length - 1 ? 0 : 1,
                borderBottomColor: COLOR.hairlineSoft,
                alignItems: 'center',
              }}
            >
              <View style={{ flex: isMobile ? 1.4 : 2, padding: isMobile ? 14 : 18 }}>
                <Text style={{ fontSize: isMobile ? 13 : 14, color: COLOR.ink, fontWeight: '500' }}>
                  {r.feature}
                </Text>
              </View>
              <ColCell value={r.sv} highlight />
              <ColCell value={r.editor} />
              <ColCell value={r.gpt} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function ColHead({ label, highlight }: { label: string; highlight?: boolean }) {
  return (
    <View
      style={{
        flex: 1,
        padding: 18,
        backgroundColor: highlight ? '#0A0A0B' : 'transparent',
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: '700',
          color: highlight ? COLOR.brandHot : COLOR.muted,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

function ColCell({ value, highlight }: { value: boolean | string; highlight?: boolean }) {
  return (
    <View
      style={{
        flex: 1,
        padding: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: highlight ? 'rgba(225,29,44,0.04)' : 'transparent',
      }}
    >
      {typeof value === 'boolean' ? (
        value ? (
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: highlight ? COLOR.brand : 'rgba(15,157,88,0.10)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Check size={12} color={highlight ? '#FFFFFF' : COLOR.good} strokeWidth={3} />
          </View>
        ) : (
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: COLOR.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={12} color={COLOR.subtle} strokeWidth={2.5} />
          </View>
        )
      ) : (
        <Text
          style={{
            fontSize: 14,
            fontWeight: '700',
            color: highlight ? COLOR.brand : COLOR.ink,
            letterSpacing: -0.2,
            fontVariant: ['tabular-nums'] as any,
          }}
        >
          {value}
        </Text>
      )}
    </View>
  );
}

// =====================================================================
// Pricing
// =====================================================================
function Pricing({
  layout,
  plans,
  onSignup,
}: {
  layout: ReturnType<typeof useLayout>;
  plans: Array<{ key: string; name: string; description: string; monthlyPriceUsdCents: number; monthlyVideoLimit: number; features: string[]; maxDurationSeconds: number }>;
  onSignup: () => void;
}) {
  const { isMobile, padX } = layout;
  const tiers = plans.filter((p) => ['free', 'creator', 'pro'].includes(p.key));
  return (
    <View style={{ paddingHorizontal: padX, paddingVertical: isMobile ? 56 : 112 }}>
      <View style={{ maxWidth: 1080, width: '100%', alignSelf: 'center' }}>
        <SectionEyebrow>Pricing</SectionEyebrow>
        <SectionTitle isMobile={isMobile}>
          Less than coffee.{'\n'}
          <Text style={{ color: COLOR.subtle }}>Worth a 5-person team.</Text>
        </SectionTitle>

        <View
          style={{
            marginTop: isMobile ? 32 : 56,
            flexDirection: isMobile ? 'column' : 'row',
            gap: 14,
          }}
        >
          {tiers.map((p) => {
            const featured = p.key === 'creator';
            const free = p.key === 'free';
            return (
              <View
                key={p.key}
                style={{
                  flex: 1,
                  borderRadius: 18,
                  padding: 28,
                  borderWidth: 1,
                  backgroundColor: featured ? COLOR.ink : COLOR.paper,
                  borderColor: featured ? COLOR.ink : COLOR.hairline,
                  ...({
                    boxShadow: featured
                      ? '0 30px 60px -30px rgba(10,10,11,0.35)'
                      : '0 1px 0 rgba(10,10,11,0.03)',
                  } as any),
                  position: 'relative',
                }}
              >
                {featured ? (
                  <View
                    style={{
                      position: 'absolute',
                      top: -12,
                      left: 24,
                      paddingHorizontal: 10,
                      height: 24,
                      borderRadius: 999,
                      backgroundColor: COLOR.brand,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1.2 }}>
                      MOST POPULAR
                    </Text>
                  </View>
                ) : null}
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: featured ? COLOR.brandHot : COLOR.muted,
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                    marginBottom: 14,
                  }}
                >
                  {p.name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 6 }}>
                  <Text
                    style={{
                      fontSize: 44,
                      fontWeight: '700',
                      color: featured ? '#FFFFFF' : COLOR.ink,
                      letterSpacing: -2,
                    }}
                  >
                    ${(p.monthlyPriceUsdCents / 100).toFixed(0)}
                  </Text>
                  <Text style={{ fontSize: 14, color: featured ? 'rgba(255,255,255,0.5)' : COLOR.muted, marginLeft: 4 }}>
                    /month
                  </Text>
                </View>
                <Text style={{ fontSize: 13, color: featured ? 'rgba(255,255,255,0.7)' : COLOR.body, marginBottom: 22, lineHeight: 20 }}>
                  {p.description || (free ? 'Try it. 2 videos. No card.' : `${p.monthlyVideoLimit} videos / month`)}
                </Text>

                <Pressable
                  onPress={onSignup}
                  style={{
                    height: 42,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 6,
                    backgroundColor: featured ? COLOR.brand : COLOR.ink,
                    marginBottom: 22,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>
                    {free ? 'Start free' : `Try ${p.name}`}
                  </Text>
                  <ArrowRight size={12} color="#FFFFFF" />
                </Pressable>

                <View style={{ gap: 10 }}>
                  {(p.features ?? []).slice(0, 5).map((f, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                      <Check
                        size={13}
                        color={featured ? COLOR.brandHot : COLOR.good}
                        strokeWidth={2.5}
                        style={{ marginTop: 3 }}
                      />
                      <Text style={{ fontSize: 13, color: featured ? 'rgba(255,255,255,0.85)' : COLOR.body, flex: 1, lineHeight: 20 }}>
                        {f}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>

        <Pressable onPress={onSignup} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 24, alignSelf: 'flex-start' }}>
          <Text style={{ fontSize: 13, color: COLOR.muted, fontWeight: '500' }}>
            See Studio plan & INR pricing
          </Text>
          <ChevronRight size={13} color={COLOR.muted} />
        </Pressable>
      </View>
    </View>
  );
}

// =====================================================================
// Blog preview
// =====================================================================
function BlogPreview({
  layout,
  posts,
  onSeeAll,
  onPost,
}: {
  layout: ReturnType<typeof useLayout>;
  posts: Array<{ slug: string; title: string; excerpt: string | null; cover_image_url: string | null; tags: string[]; read_minutes: number | null; published_at: string | null }>;
  onSeeAll: () => void;
  onPost: (slug: string) => void;
}) {
  const { isMobile, padX } = layout;
  return (
    <View style={{ paddingHorizontal: padX, paddingVertical: isMobile ? 56 : 112, backgroundColor: COLOR.paperWarm }}>
      <View style={{ maxWidth: 1240, width: '100%', alignSelf: 'center' }}>
        <View
          style={{
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'flex-end',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: isMobile ? 24 : 40,
          }}
        >
          <View>
            <SectionEyebrow>From the journal</SectionEyebrow>
            <Text
              style={{
                fontSize: isMobile ? 28 : 40,
                lineHeight: isMobile ? 32 : 44,
                fontWeight: '700',
                color: COLOR.ink,
                letterSpacing: -1.4,
                marginTop: 14,
              }}
            >
              Notes on shipping a viral channel.
            </Text>
          </View>
          <Pressable onPress={onSeeAll} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 13, color: COLOR.ink, fontWeight: '600' }}>All posts</Text>
            <ChevronRight size={13} color={COLOR.ink} />
          </Pressable>
        </View>

        <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 14 }}>
          {posts.slice(0, 3).map((p) => (
            <Pressable
              key={p.slug}
              onPress={() => onPost(p.slug)}
              style={{
                flex: 1,
                backgroundColor: COLOR.paper,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: COLOR.hairline,
                overflow: 'hidden',
              }}
            >
              {p.cover_image_url ? (
                <View
                  style={{
                    aspectRatio: 16 / 9,
                    backgroundColor: COLOR.surface,
                    ...({
                      backgroundImage: `url(${p.cover_image_url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    } as any),
                  }}
                />
              ) : (
                <View style={{ aspectRatio: 16 / 9, backgroundColor: COLOR.surface, alignItems: 'center', justifyContent: 'center' }}>
                  <SnapViralLogo size={36} />
                </View>
              )}
              <View style={{ padding: 22 }}>
                {p.tags?.[0] ? (
                  <Text style={{ fontSize: 10, fontWeight: '700', color: COLOR.brand, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 }}>
                    {p.tags[0]}
                  </Text>
                ) : null}
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: '700',
                    color: COLOR.ink,
                    letterSpacing: -0.3,
                    marginBottom: 8,
                    lineHeight: 23,
                  }}
                  numberOfLines={2}
                >
                  {p.title}
                </Text>
                {p.excerpt ? (
                  <Text style={{ fontSize: 13, color: COLOR.body, lineHeight: 20 }} numberOfLines={2}>
                    {p.excerpt}
                  </Text>
                ) : null}
                <Text style={{ fontSize: 11, color: COLOR.muted, marginTop: 14 }}>
                  {p.read_minutes ?? 3} min read
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// FAQ
// =====================================================================
function FAQ({ layout }: { layout: ReturnType<typeof useLayout> }) {
  const { isMobile, padX } = layout;
  const items = [
    {
      q: 'Do I need a YouTube channel already?',
      a: 'Yes. SnapViral publishes to your channel via the YouTube Data API — connect once via Google OAuth and we handle the rest. We do not create channels for you.',
    },
    {
      q: 'How is the Tamil voiceover quality?',
      a: 'Better than what most agencies use in-house. ElevenLabs voices, with proper Tamil shaping, sandhi handling, and per-topic voice overrides if you want different anchors for different segments.',
    },
    {
      q: 'Can I review videos before they publish?',
      a: 'Yes. Auto-publish is opt-in. By default, every video lands in your Library as "Ready" and you publish manually. Flip auto-publish on once you trust the output.',
    },
    {
      q: 'What if a video looks wrong?',
      a: 'Failed jobs surface in your dashboard with the exact step that broke. You can re-run any step (script, images, voice, compose) without rebuilding from scratch.',
    },
    {
      q: 'What about copyright / licensing?',
      a: 'All visuals are AI-generated, all voiceover is synthetic, and scripts are written from cited live research — not scraped from competitors. You own the outputs commercially.',
    },
    {
      q: 'Is there a mobile app?',
      a: 'The dashboard is a responsive web app. Open app.snapviral.in on your phone — it works.',
    },
  ];
  return (
    <View style={{ paddingHorizontal: padX, paddingVertical: isMobile ? 56 : 112 }}>
      <View
        style={{
          maxWidth: 920,
          width: '100%',
          alignSelf: 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 24 : 64,
        }}
      >
        <View style={{ flex: isMobile ? undefined : 0.7 }}>
          <SectionEyebrow>FAQ</SectionEyebrow>
          <Text
            style={{
              fontSize: isMobile ? 28 : 40,
              lineHeight: isMobile ? 32 : 44,
              fontWeight: '700',
              color: COLOR.ink,
              letterSpacing: -1.4,
              marginTop: 14,
            }}
          >
            Things people ask before they sign up.
          </Text>
        </View>

        <View style={{ flex: isMobile ? undefined : 1, gap: 4 }}>
          {items.map((it, i) => (
            <FAQItem key={i} q={it.q} a={it.a} defaultOpen={i === 0} />
          ))}
        </View>
      </View>
    </View>
  );
}

function FAQItem({ q, a, defaultOpen }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <Pressable
      onPress={() => setOpen((v) => !v)}
      style={{
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLOR.hairlineSoft,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: COLOR.ink, letterSpacing: -0.2, flex: 1, lineHeight: 22 }}>
          {q}
        </Text>
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: COLOR.hairline,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 1,
          }}
        >
          {open ? <Minus size={11} color={COLOR.ink} strokeWidth={2.5} /> : <Plus size={11} color={COLOR.ink} strokeWidth={2.5} />}
        </View>
      </View>
      {open ? (
        <Text style={{ fontSize: 14, color: COLOR.body, lineHeight: 22, marginTop: 10, paddingRight: 36 }}>
          {a}
        </Text>
      ) : null}
    </Pressable>
  );
}

// =====================================================================
// Final CTA
// =====================================================================
function FinalCTA({ layout, onSignup }: { layout: ReturnType<typeof useLayout>; onSignup: () => void }) {
  const { isMobile, padX } = layout;
  return (
    <View style={{ paddingHorizontal: padX, paddingVertical: isMobile ? 56 : 112 }}>
      <View
        style={{
          maxWidth: 1080,
          width: '100%',
          alignSelf: 'center',
          backgroundColor: COLOR.ink,
          borderRadius: 28,
          paddingHorizontal: isMobile ? 28 : 64,
          paddingVertical: isMobile ? 48 : 80,
          alignItems: 'center',
          overflow: 'hidden',
          position: 'relative',
          ...({
            backgroundImage:
              'radial-gradient(circle at 80% -10%, rgba(225,29,44,0.45), transparent 60%), ' +
              'radial-gradient(circle at 0% 110%, rgba(225,29,44,0.18), transparent 60%)',
          } as any),
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: COLOR.brandHot,
            letterSpacing: 1.8,
            textTransform: 'uppercase',
            marginBottom: 18,
          }}
        >
          Stop talking. Start shipping.
        </Text>
        <Text
          style={{
            fontSize: isMobile ? 30 : 56,
            lineHeight: isMobile ? 34 : 60,
            fontWeight: '700',
            color: '#FFFFFF',
            letterSpacing: isMobile ? -1.2 : -2.2,
            textAlign: 'center',
            maxWidth: 720,
            marginBottom: 18,
          }}
        >
          Your first viral Short is{' '}
          <Text style={{ fontStyle: 'italic', color: COLOR.brandHot, fontWeight: '600' }}>five minutes away.</Text>
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: 'rgba(255,255,255,0.6)',
            textAlign: 'center',
            maxWidth: 480,
            marginBottom: 32,
            lineHeight: 22,
          }}
        >
          Free to start. No credit card. Bring your channel — we'll handle everything else.
        </Text>
        <Pressable
          onPress={onSignup}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#FFFFFF',
            paddingHorizontal: 22,
            height: 48,
            borderRadius: 12,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: COLOR.ink, letterSpacing: -0.2 }}>
            Start free — no card
          </Text>
          <ArrowRight size={14} color={COLOR.ink} />
        </Pressable>
      </View>
    </View>
  );
}

// =====================================================================
// Footer
// =====================================================================
function Footer({ layout, router }: { layout: ReturnType<typeof useLayout>; router: any }) {
  const { isMobile, padX } = layout;
  const cols: Array<{ label: string; links: Array<[string, string]> }> = [
    {
      label: 'Product',
      links: [
        ['Features', '/'],
        ['Pricing', '/'],
        ['Changelog', '/blog'],
        ['Status', '/'],
      ],
    },
    {
      label: 'Resources',
      links: [
        ['Blog', '/blog'],
        ['FAQ', '/'],
        ['Sample shorts', '/'],
        ['Voice guide', '/blog'],
      ],
    },
    {
      label: 'Company',
      links: [
        ['About', '/'],
        ['Contact', '/'],
        ['Press', '/'],
      ],
    },
    {
      label: 'Legal',
      links: [
        ['Privacy', '/privacy'],
        ['Terms', '/terms'],
        ['Admin portal', '/admin/login'],
      ],
    },
  ];
  return (
    <View
      style={{
        paddingHorizontal: padX,
        paddingTop: 48,
        paddingBottom: 32,
        borderTopWidth: 1,
        borderTopColor: COLOR.hairlineSoft,
        backgroundColor: COLOR.paper,
      }}
    >
      <View style={{ maxWidth: 1240, width: '100%', alignSelf: 'center' }}>
        <View
          style={{
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            gap: isMobile ? 32 : 64,
          }}
        >
          {/* Brand */}
          <View style={{ flex: isMobile ? undefined : 1, maxWidth: 320 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <SnapViralLogo size={26} />
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: COLOR.ink, letterSpacing: -0.4 }}>Snap</Text>
                <Text style={{ fontSize: 16, fontWeight: '800', color: COLOR.brand, letterSpacing: -0.4, fontStyle: 'italic' }}>
                  Viral
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 13, color: COLOR.body, lineHeight: 20 }}>
              An autopilot for YouTube Shorts. Built in Chennai for creators worldwide.
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginTop: 16,
                paddingHorizontal: 10,
                paddingVertical: 5,
                alignSelf: 'flex-start',
                borderRadius: 999,
                backgroundColor: COLOR.surface,
              }}
            >
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: COLOR.good }} />
              <Text style={{ fontSize: 11, color: COLOR.body, fontWeight: '600' }}>All systems operational</Text>
            </View>
          </View>

          {/* Link cols */}
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              flex: isMobile ? undefined : 1.5,
              gap: isMobile ? 24 : 0,
            }}
          >
            {cols.map((c) => (
              <View key={c.label} style={{ flexBasis: isMobile ? '50%' : '25%', gap: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: COLOR.muted, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 }}>
                  {c.label}
                </Text>
                {c.links.map(([label, href]) => (
                  <Pressable key={label} onPress={() => router.push(href as any)}>
                    <Text style={{ fontSize: 13, color: COLOR.body }}>{label}</Text>
                  </Pressable>
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
            borderTopColor: COLOR.hairlineSoft,
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 11, color: COLOR.muted }}>
            © {new Date().getFullYear()} SnapViral · Built for creators in India and beyond
          </Text>
          <Text style={{ fontSize: 11, color: COLOR.muted }}>app.snapviral.in</Text>
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// Atoms
// =====================================================================
function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        fontSize: 11,
        fontWeight: '700',
        color: COLOR.brand,
        letterSpacing: 1.8,
        textTransform: 'uppercase',
      }}
    >
      {children}
    </Text>
  );
}

function SectionTitle({ children, isMobile }: { children: React.ReactNode; isMobile: boolean }) {
  return (
    <Text
      style={{
        fontSize: isMobile ? 32 : 56,
        lineHeight: isMobile ? 36 : 60,
        fontWeight: '700',
        color: COLOR.ink,
        letterSpacing: isMobile ? -1.2 : -2.4,
        marginTop: 14,
        maxWidth: 760,
      }}
    >
      {children}
    </Text>
  );
}
