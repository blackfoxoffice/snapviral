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
  Zap,
  Globe2,
  Mic2,
  Image as ImageIcon,
  Calendar,
  Youtube,
  Check,
  Sparkles,
  Languages,
  Wand2,
  ShieldCheck,
  Star,
  PlayCircle,
  TrendingUp,
} from 'lucide-react-native';
import { useAuth } from '../lib/auth';
import { useBlogPosts, usePlans } from '../lib/queries';
import { SnapViralLogo } from '../components/icons/SnapViralLogo';

export default function Index() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isWide = width >= 1100;

  const { data: blog } = useBlogPosts({ limit: 3 });
  const { data: plans } = usePlans();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAFA' }}>
        <ActivityIndicator color="#E53935" />
      </View>
    );
  }

  if (session) return <Redirect href="/dashboard" />;

  const PADDING_X = isMobile ? 20 : isWide ? 64 : 40;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 0 }}
    >
      {/* ======================= NAV ======================= */}
      <Nav onLogin={() => router.push('/login')} onSignup={() => router.push('/signup')} padX={PADDING_X} isMobile={isMobile} />

      {/* ======================= HERO ======================= */}
      <Hero
        padX={PADDING_X}
        isMobile={isMobile}
        onSignup={() => router.push('/signup')}
      />

      {/* ======================= LOGOS / SOCIAL PROOF ======================= */}
      <SocialProof padX={PADDING_X} isMobile={isMobile} />

      {/* ======================= FEATURE GRID ======================= */}
      <FeatureGrid padX={PADDING_X} isMobile={isMobile} />

      {/* ======================= PIPELINE / HOW IT WORKS ======================= */}
      <Pipeline padX={PADDING_X} isMobile={isMobile} />

      {/* ======================= BLOG TEASE ======================= */}
      {blog?.posts && blog.posts.length > 0 ? (
        <BlogPreview
          padX={PADDING_X}
          isMobile={isMobile}
          posts={blog.posts}
          onSeeAll={() => router.push('/blog' as any)}
          onPost={(slug) => router.push(`/blog/${slug}` as any)}
        />
      ) : null}

      {/* ======================= PRICING TEASE ======================= */}
      {plans && plans.length > 0 ? (
        <PricingTease
          padX={PADDING_X}
          isMobile={isMobile}
          plans={plans}
          onSignup={() => router.push('/signup')}
        />
      ) : null}

      {/* ======================= TESTIMONIALS ======================= */}
      <Testimonials padX={PADDING_X} isMobile={isMobile} />

      {/* ======================= CTA ======================= */}
      <FinalCTA padX={PADDING_X} isMobile={isMobile} onSignup={() => router.push('/signup')} />

      {/* ======================= FOOTER ======================= */}
      <Footer padX={PADDING_X} isMobile={isMobile} router={router} />
    </ScrollView>
  );
}

// =====================================================================
// NAV
// =====================================================================
function Nav({
  onLogin,
  onSignup,
  padX,
  isMobile,
}: {
  onLogin: () => void;
  onSignup: () => void;
  padX: number;
  isMobile: boolean;
}) {
  return (
    <View
      style={{
        position: 'sticky' as any,
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)' as any,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(15,23,42,0.06)',
      }}
    >
      <View
        style={{
          maxWidth: 1280,
          width: '100%',
          alignSelf: 'center',
          paddingHorizontal: padX,
          paddingVertical: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <SnapViralLogo size={32} />
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 }}>Snap</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#E53935', letterSpacing: -0.5, fontStyle: 'italic' }}>Viral</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: isMobile ? 6 : 12 }}>
          <Pressable onPress={onLogin} style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
            <Text style={{ fontSize: 13, color: '#475569', fontWeight: '500' }}>Sign in</Text>
          </Pressable>
          <Pressable
            onPress={onSignup}
            style={{
              backgroundColor: '#0F172A',
              paddingHorizontal: 16,
              paddingVertical: 9,
              borderRadius: 10,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFFFFF' }}>
              {isMobile ? 'Start free' : 'Start free trial'}
            </Text>
            <ArrowRight size={12} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// HERO
// =====================================================================
function Hero({ padX, isMobile, onSignup }: { padX: number; isMobile: boolean; onSignup: () => void }) {
  return (
    <View
      style={{
        position: 'relative',
        overflow: 'hidden',
        // Soft animated-feeling gradient backdrop
        backgroundImage:
          'radial-gradient(900px 500px at 20% -100px, rgba(229,57,53,0.08), transparent 60%), ' +
          'radial-gradient(700px 400px at 80% 0%, rgba(79,70,229,0.06), transparent 60%), ' +
          'radial-gradient(500px 300px at 50% 100%, rgba(229,57,53,0.05), transparent 70%)' as any,
      }}
    >
      <View
        style={{
          maxWidth: 1080,
          width: '100%',
          alignSelf: 'center',
          paddingHorizontal: padX,
          paddingTop: isMobile ? 64 : 120,
          paddingBottom: isMobile ? 56 : 96,
          alignItems: 'center',
        }}
      >
        {/* Pill: announcement */}
        <Pressable
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: 'rgba(15,23,42,0.08)',
            marginBottom: 28,
            shadowColor: '#0F172A',
            shadowOpacity: 0.04,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
          }}
        >
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' }} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#475569' }}>
            Now live in Tamil, English & Hindi
          </Text>
          <ArrowRight size={11} color="#94A3B8" />
        </Pressable>

        <Text
          style={{
            fontSize: isMobile ? 40 : 72,
            lineHeight: isMobile ? 44 : 76,
            fontWeight: '800',
            color: '#0F172A',
            letterSpacing: -2,
            textAlign: 'center',
            maxWidth: 900,
          }}
        >
          Type a topic.{'\n'}
          <Text style={{ color: '#E53935', fontStyle: 'italic' }}>Go viral</Text>
          <Text> on YouTube.</Text>
        </Text>

        <Text
          style={{
            fontSize: isMobile ? 16 : 19,
            lineHeight: isMobile ? 24 : 30,
            color: '#475569',
            textAlign: 'center',
            maxWidth: 620,
            marginTop: 24,
          }}
        >
          SnapViral writes the script, generates the visuals, narrates it in your voice and language,
          then publishes 3-5 vertical Shorts to your channel every day. Fully automated.
        </Text>

        <View
          style={{
            marginTop: 36,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <Pressable
            onPress={onSignup}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: '#E53935',
              paddingHorizontal: 24,
              paddingVertical: 14,
              borderRadius: 12,
              shadowColor: '#E53935',
              shadowOpacity: 0.35,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 6 },
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>Start creating free</Text>
            <ArrowRight size={14} color="#FFFFFF" />
          </Pressable>
          <Pressable
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: 'rgba(15,23,42,0.10)',
              paddingHorizontal: 22,
              paddingVertical: 14,
              borderRadius: 12,
            }}
          >
            <PlayCircle size={14} color="#0F172A" />
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#0F172A' }}>Watch demo</Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 }}>
          <ShieldCheck size={12} color="#94A3B8" />
          <Text style={{ fontSize: 12, color: '#64748B' }}>
            No credit card · 2 free videos · Cancel anytime
          </Text>
        </View>

        {/* Hero device mockup */}
        <View style={{ marginTop: isMobile ? 56 : 80, alignItems: 'center' }}>
          <PhoneMockup isMobile={isMobile} />
        </View>
      </View>
    </View>
  );
}

function PhoneMockup({ isMobile }: { isMobile: boolean }) {
  const phoneW = isMobile ? 220 : 260;
  const phoneH = phoneW * (16 / 9);
  return (
    <View
      style={{
        width: phoneW,
        height: phoneH,
        borderRadius: 32,
        padding: 8,
        backgroundColor: '#0F172A',
        shadowColor: '#0F172A',
        shadowOpacity: 0.25,
        shadowRadius: 40,
        shadowOffset: { width: 0, height: 24 },
      }}
    >
      <View
        style={{
          flex: 1,
          borderRadius: 24,
          overflow: 'hidden',
          backgroundColor: '#000',
          backgroundImage:
            'radial-gradient(circle at 30% 30%, #FF6B6B 0%, #C8102E 40%, #1a0608 100%)' as any,
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingBottom: 40,
        }}
      >
        <View
          style={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: [{ translateX: -36 }] as any,
            width: 72,
            height: 18,
            borderRadius: 12,
            backgroundColor: '#000',
          }}
        />
        <SnapViralLogo size={72} />
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: '600',
            marginTop: 16,
            opacity: 0.9,
          }}
        >
          live tamil news short
        </Text>
      </View>
    </View>
  );
}

// =====================================================================
// SOCIAL PROOF
// =====================================================================
function SocialProof({ padX, isMobile }: { padX: number; isMobile: boolean }) {
  return (
    <View
      style={{
        paddingVertical: isMobile ? 32 : 48,
        paddingHorizontal: padX,
        backgroundColor: '#FAFAFA',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: 'rgba(15,23,42,0.05)',
      }}
    >
      <View style={{ maxWidth: 1080, width: '100%', alignSelf: 'center', alignItems: 'center' }}>
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: '#94A3B8',
            letterSpacing: 2,
            textTransform: 'uppercase',
            marginBottom: 24,
          }}
        >
          Powering creators across regions
        </Text>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: isMobile ? 24 : 56,
            justifyContent: 'center',
            alignItems: 'center',
            opacity: 0.6,
          }}
        >
          {['தமிழ் News Daily', 'India Pulse', 'Chennai Live', 'Bharat Briefs', 'Wire 24', 'NowTV'].map(
            (n) => (
              <Text
                key={n}
                style={{ fontSize: 14, fontWeight: '700', color: '#475569', letterSpacing: -0.3 }}
              >
                {n}
              </Text>
            ),
          )}
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// FEATURE GRID
// =====================================================================
function FeatureGrid({ padX, isMobile }: { padX: number; isMobile: boolean }) {
  const features = [
    {
      Icon: Languages,
      accent: '#E53935',
      title: 'Native Tamil, English & Hindi',
      body:
        'Scripts written in your language. Voice synthesis with proper Tamil and Devanagari shaping. Subtitles burned in with the right typography.',
    },
    {
      Icon: Wand2,
      accent: '#3B82F6',
      title: 'Topic to publish in 4 minutes',
      body:
        'Type a headline, get a finished 9:16 short. Script, scene-by-scene visuals, voiceover, alignment, subtitle burn-in, YouTube upload — all automatic.',
    },
    {
      Icon: Globe2,
      accent: '#A855F7',
      title: 'Live web research',
      body:
        'Perplexity Sonar Pro searches the live web and writes a cited briefing. Then Gemini turns it into an original script — no copy-paste from competitors.',
    },
    {
      Icon: Calendar,
      accent: '#F59E0B',
      title: 'Schedule weeks in advance',
      body:
        'Drop in 100 topics, set publish times to the minute, walk away. The auto-publisher fires 3-5 videos a day at exactly the times you pick.',
    },
    {
      Icon: ImageIcon,
      accent: '#10B981',
      title: 'Cinematic visuals, zero text',
      body:
        'Per-scene image generation tuned to your language and culture. No misspelled signs, no AI-slop captions inside the frame — clean photographic shorts.',
    },
    {
      Icon: ShieldCheck,
      accent: '#0F172A',
      title: 'API keys in a vault',
      body:
        'Your OpenRouter, ElevenLabs and Google credentials are AES-256 encrypted in Supabase Vault. Even admins can only see the last 4 characters.',
    },
  ];
  return (
    <View
      style={{
        paddingVertical: isMobile ? 64 : 120,
        paddingHorizontal: padX,
      }}
    >
      <View style={{ maxWidth: 1080, width: '100%', alignSelf: 'center' }}>
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: '#E53935',
            letterSpacing: 2,
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          What's in the box
        </Text>
        <Text
          style={{
            fontSize: isMobile ? 28 : 44,
            lineHeight: isMobile ? 34 : 52,
            fontWeight: '800',
            color: '#0F172A',
            letterSpacing: -1,
            maxWidth: 720,
            marginBottom: isMobile ? 32 : 56,
          }}
        >
          A finished YouTube channel,{' '}
          <Text style={{ color: '#94A3B8' }}>without the team.</Text>
        </Text>

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          {features.map((f, i) => (
            <View
              key={i}
              style={{
                flexBasis: isMobile ? '100%' : '32%',
                flexGrow: 1,
                minWidth: 260,
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(15,23,42,0.06)',
                padding: 28,
                shadowColor: '#0F172A',
                shadowOpacity: 0.03,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 6 },
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: `${f.accent}14`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 18,
                }}
              >
                <f.Icon size={20} color={f.accent} strokeWidth={2.2} />
              </View>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: '700',
                  color: '#0F172A',
                  letterSpacing: -0.4,
                  marginBottom: 10,
                }}
              >
                {f.title}
              </Text>
              <Text style={{ fontSize: 14, color: '#64748B', lineHeight: 22 }}>{f.body}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// PIPELINE / HOW IT WORKS
// =====================================================================
function Pipeline({ padX, isMobile }: { padX: number; isMobile: boolean }) {
  const steps = [
    { n: '01', Icon: Sparkles, accent: '#3B82F6', title: 'You add a topic', body: 'Or generate 12 trending ones with one click.' },
    { n: '02', Icon: Wand2, accent: '#E53935', title: 'AI writes the script', body: 'Gemini Flash, scene-by-scene, in your language.' },
    { n: '03', Icon: ImageIcon, accent: '#F59E0B', title: 'Visuals are generated', body: 'Cinematic 9:16 imagery, language-aware.' },
    { n: '04', Icon: Mic2, accent: '#A855F7', title: 'Voiceover is recorded', body: 'ElevenLabs, native shaping, subtitle alignment.' },
    { n: '05', Icon: Zap, accent: '#10B981', title: 'Composed into a Short', body: 'Subtitle burn-in, brand logo, ready to ship.' },
    { n: '06', Icon: Youtube, accent: '#E53935', title: 'Posted to YouTube', body: 'Auto-uploaded with AI-generated metadata.' },
  ];
  return (
    <View
      style={{
        paddingVertical: isMobile ? 64 : 120,
        paddingHorizontal: padX,
        backgroundColor: '#0F172A',
      }}
    >
      <View style={{ maxWidth: 1080, width: '100%', alignSelf: 'center' }}>
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: '#FF6B6B',
            letterSpacing: 2,
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          How it works
        </Text>
        <Text
          style={{
            fontSize: isMobile ? 28 : 44,
            lineHeight: isMobile ? 34 : 52,
            fontWeight: '800',
            color: '#FFFFFF',
            letterSpacing: -1,
            maxWidth: 720,
            marginBottom: isMobile ? 32 : 56,
          }}
        >
          Six steps. <Text style={{ color: '#94A3B8' }}>Zero of them are yours.</Text>
        </Text>

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          {steps.map((s, i) => (
            <View
              key={i}
              style={{
                flexBasis: isMobile ? '100%' : '32%',
                flexGrow: 1,
                minWidth: 240,
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.08)',
                padding: 24,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: `${s.accent}22`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <s.Icon size={16} color={s.accent} strokeWidth={2.2} />
                </View>
                <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5 }}>
                  {s.n}
                </Text>
              </View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 6, letterSpacing: -0.3 }}>
                {s.title}
              </Text>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 20 }}>
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
// BLOG PREVIEW
// =====================================================================
function BlogPreview({
  padX,
  isMobile,
  posts,
  onSeeAll,
  onPost,
}: {
  padX: number;
  isMobile: boolean;
  posts: Array<{ slug: string; title: string; excerpt: string | null; cover_image_url: string | null; read_minutes: number | null; tags: string[]; published_at: string | null }>;
  onSeeAll: () => void;
  onPost: (slug: string) => void;
}) {
  return (
    <View style={{ paddingVertical: isMobile ? 64 : 120, paddingHorizontal: padX }}>
      <View style={{ maxWidth: 1080, width: '100%', alignSelf: 'center' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
          <View>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#E53935', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
              From the blog
            </Text>
            <Text style={{ fontSize: isMobile ? 24 : 36, fontWeight: '800', color: '#0F172A', letterSpacing: -0.8 }}>
              Notes on shipping
            </Text>
          </View>
          <Pressable onPress={onSeeAll} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 13, color: '#0F172A', fontWeight: '600' }}>All posts</Text>
            <ArrowRight size={12} color="#0F172A" />
          </Pressable>
        </View>

        <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
          {posts.slice(0, 3).map((p) => (
            <Pressable
              key={p.slug}
              onPress={() => onPost(p.slug)}
              style={{
                flex: 1,
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(15,23,42,0.06)',
                overflow: 'hidden',
              }}
            >
              {p.cover_image_url ? (
                <View style={{ aspectRatio: 16 / 9, backgroundColor: '#F1F5F9', backgroundImage: `url(${p.cover_image_url})` as any, backgroundSize: 'cover' as any, backgroundPosition: 'center' as any }} />
              ) : (
                <View style={{ aspectRatio: 16 / 9, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
                  <SnapViralLogo size={36} />
                </View>
              )}
              <View style={{ padding: 20 }}>
                {p.tags && p.tags.length > 0 ? (
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#E53935', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
                    {p.tags[0]}
                  </Text>
                ) : null}
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A', letterSpacing: -0.3, marginBottom: 8 }} numberOfLines={2}>
                  {p.title}
                </Text>
                {p.excerpt ? (
                  <Text style={{ fontSize: 13, color: '#64748B', lineHeight: 20 }} numberOfLines={2}>
                    {p.excerpt}
                  </Text>
                ) : null}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
                  <Text style={{ fontSize: 11, color: '#94A3B8' }}>
                    {p.read_minutes ?? 3} min read
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// PRICING TEASE
// =====================================================================
function PricingTease({
  padX,
  isMobile,
  plans,
  onSignup,
}: {
  padX: number;
  isMobile: boolean;
  plans: Array<{ key: string; name: string; description: string; monthlyPriceUsdCents: number; monthlyVideoLimit: number; features: string[] }>;
  onSignup: () => void;
}) {
  const featured = plans.find((p) => p.key === 'creator');
  return (
    <View
      style={{
        paddingVertical: isMobile ? 64 : 120,
        paddingHorizontal: padX,
        backgroundColor: '#FAFAFA',
      }}
    >
      <View style={{ maxWidth: 1080, width: '100%', alignSelf: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#E53935', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>
          Pricing
        </Text>
        <Text
          style={{
            fontSize: isMobile ? 28 : 44,
            lineHeight: isMobile ? 34 : 52,
            fontWeight: '800',
            color: '#0F172A',
            letterSpacing: -1,
            textAlign: 'center',
            marginBottom: 14,
            maxWidth: 600,
          }}
        >
          Cheaper than{' '}
          <Text style={{ color: '#E53935' }}>your morning coffee.</Text>
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: '#64748B',
            textAlign: 'center',
            maxWidth: 520,
            marginBottom: 40,
            lineHeight: 24,
          }}
        >
          Start free with 2 videos a month. Upgrade when you're shipping daily — Creator at $29/mo
          buys 30 videos and full auto-publish.
        </Text>

        <View
          style={{
            flexDirection: isMobile ? 'column' : 'row',
            gap: 16,
            width: '100%',
            maxWidth: 720,
          }}
        >
          {/* Free callout */}
          <View
            style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: 'rgba(15,23,42,0.08)',
              padding: 28,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#475569', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>
              Free
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 16 }}>
              <Text style={{ fontSize: 40, fontWeight: '800', color: '#0F172A', letterSpacing: -1.5 }}>$0</Text>
              <Text style={{ fontSize: 14, color: '#64748B', marginLeft: 4 }}>/ forever</Text>
            </View>
            <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 18, lineHeight: 20 }}>
              2 videos / month. 30s max. Tamil, English, Hindi. Watermarked output.
            </Text>
            <Pressable
              onPress={onSignup}
              style={{
                paddingVertical: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(15,23,42,0.15)',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F172A' }}>Get started</Text>
            </Pressable>
          </View>

          {/* Featured plan */}
          {featured ? (
            <View
              style={{
                flex: 1,
                backgroundColor: '#0F172A',
                borderRadius: 20,
                padding: 28,
                position: 'relative',
                shadowColor: '#0F172A',
                shadowOpacity: 0.20,
                shadowRadius: 32,
                shadowOffset: { width: 0, height: 12 },
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  top: -10,
                  right: 16,
                  backgroundColor: '#E53935',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 999,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                  Most popular
                </Text>
              </View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#FF6B6B', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>
                {featured.name}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 16 }}>
                <Text style={{ fontSize: 40, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1.5 }}>
                  ${(featured.monthlyPriceUsdCents / 100).toFixed(0)}
                </Text>
                <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginLeft: 4 }}>/ month</Text>
              </View>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 18, lineHeight: 20 }}>
                {featured.monthlyVideoLimit} videos / month. Auto-publish, web research, no watermark.
              </Text>
              <Pressable
                onPress={onSignup}
                style={{
                  paddingVertical: 12,
                  borderRadius: 10,
                  alignItems: 'center',
                  backgroundColor: '#E53935',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>Try Creator</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <Pressable
          onPress={onSignup}
          style={{ marginTop: 32, flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Text style={{ fontSize: 13, color: '#475569', fontWeight: '500' }}>
            See all plans (Starter, Creator, Pro, Studio — INR available)
          </Text>
          <ArrowRight size={12} color="#475569" />
        </Pressable>
      </View>
    </View>
  );
}

// =====================================================================
// TESTIMONIALS
// =====================================================================
function Testimonials({ padX, isMobile }: { padX: number; isMobile: boolean }) {
  const quotes = [
    {
      body:
        'I queue 30 topics every Sunday, set 9 AM and 9 PM publish slots. Monday-Friday the channel runs itself. My subscriber count has doubled.',
      who: 'Vignesh K.',
      role: 'Tamil news creator · Chennai',
      stars: 5,
    },
    {
      body:
        'The Tamil voiceover quality is the best I\'ve found anywhere — better than the in-house tools my old agency used. And it\'s a fifth of the cost.',
      who: 'Priya M.',
      role: 'Independent journalist',
      stars: 5,
    },
    {
      body:
        "We were paying three editors to produce 5 Shorts a day. Now SnapViral handles it overnight. Margins finally make sense.",
      who: 'Rahul S.',
      role: 'Founder, regional media co.',
      stars: 5,
    },
  ];
  return (
    <View style={{ paddingVertical: isMobile ? 64 : 120, paddingHorizontal: padX }}>
      <View style={{ maxWidth: 1080, width: '100%', alignSelf: 'center' }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#E53935', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16, textAlign: 'center' }}>
          What creators say
        </Text>
        <Text
          style={{
            fontSize: isMobile ? 28 : 44,
            lineHeight: isMobile ? 34 : 52,
            fontWeight: '800',
            color: '#0F172A',
            letterSpacing: -1,
            textAlign: 'center',
            marginBottom: 56,
            maxWidth: 720,
            alignSelf: 'center',
          }}
        >
          From a topic to{' '}
          <Text style={{ color: '#94A3B8' }}>10k subscribers.</Text>
        </Text>

        <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
          {quotes.map((q, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(15,23,42,0.06)',
                padding: 28,
              }}
            >
              <View style={{ flexDirection: 'row', gap: 2, marginBottom: 14 }}>
                {Array.from({ length: q.stars }).map((_, idx) => (
                  <Star key={idx} size={14} color="#FBBF24" fill="#FBBF24" />
                ))}
              </View>
              <Text
                style={{
                  fontSize: 16,
                  color: '#0F172A',
                  lineHeight: 26,
                  letterSpacing: -0.2,
                  marginBottom: 24,
                }}
              >
                "{q.body}"
              </Text>
              <View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>{q.who}</Text>
                <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{q.role}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// FINAL CTA
// =====================================================================
function FinalCTA({ padX, isMobile, onSignup }: { padX: number; isMobile: boolean; onSignup: () => void }) {
  return (
    <View
      style={{
        paddingVertical: isMobile ? 64 : 120,
        paddingHorizontal: padX,
        backgroundColor: '#FAFAFA',
      }}
    >
      <View
        style={{
          maxWidth: 920,
          width: '100%',
          alignSelf: 'center',
          backgroundColor: '#0F172A',
          borderRadius: 28,
          padding: isMobile ? 32 : 64,
          alignItems: 'center',
          overflow: 'hidden',
          position: 'relative',
          shadowColor: '#0F172A',
          shadowOpacity: 0.20,
          shadowRadius: 40,
          shadowOffset: { width: 0, height: 20 },
        }}
      >
        {/* Decorative gradient blob */}
        <View
          style={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: 200,
            backgroundColor: '#E53935',
            opacity: 0.30,
            filter: 'blur(80px)' as any,
          }}
        />
        <Text
          style={{
            fontSize: isMobile ? 28 : 44,
            lineHeight: isMobile ? 34 : 52,
            fontWeight: '800',
            color: '#FFFFFF',
            letterSpacing: -1,
            textAlign: 'center',
            marginBottom: 16,
            maxWidth: 640,
            zIndex: 1,
          }}
        >
          Your first viral Short is{' '}
          <Text style={{ color: '#FF6B6B', fontStyle: 'italic' }}>five minutes away.</Text>
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: 'rgba(255,255,255,0.7)',
            textAlign: 'center',
            maxWidth: 520,
            marginBottom: 32,
            lineHeight: 24,
            zIndex: 1,
          }}
        >
          Free to start. No credit card. Bring your YouTube channel — we'll handle everything else.
        </Text>
        <Pressable
          onPress={onSignup}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#E53935',
            paddingHorizontal: 28,
            paddingVertical: 16,
            borderRadius: 12,
            zIndex: 1,
            shadowColor: '#E53935',
            shadowOpacity: 0.5,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 8 },
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>Start free — no card</Text>
          <ArrowRight size={14} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

// =====================================================================
// FOOTER
// =====================================================================
function Footer({ padX, isMobile, router }: { padX: number; isMobile: boolean; router: any }) {
  return (
    <View
      style={{
        paddingHorizontal: padX,
        paddingVertical: 48,
        borderTopWidth: 1,
        borderTopColor: 'rgba(15,23,42,0.06)',
        backgroundColor: '#FFFFFF',
      }}
    >
      <View style={{ maxWidth: 1080, width: '100%', alignSelf: 'center' }}>
        <View
          style={{
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: 24,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <SnapViralLogo size={28} />
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A', letterSpacing: -0.4 }}>Snap</Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#E53935', letterSpacing: -0.4, fontStyle: 'italic' }}>Viral</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: isMobile ? 16 : 24 }}>
            <Pressable onPress={() => router.push('/blog' as any)}>
              <Text style={{ fontSize: 13, color: '#64748B' }}>Blog</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/login')}>
              <Text style={{ fontSize: 13, color: '#64748B' }}>Sign in</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/admin/login' as any)}>
              <Text style={{ fontSize: 13, color: '#64748B' }}>Admin</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/privacy' as any)}>
              <Text style={{ fontSize: 13, color: '#64748B' }}>Privacy</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/terms' as any)}>
              <Text style={{ fontSize: 13, color: '#64748B' }}>Terms</Text>
            </Pressable>
          </View>
        </View>
        <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 32 }}>
          © {new Date().getFullYear()} SnapViral · Built for creators in India
        </Text>
      </View>
    </View>
  );
}
