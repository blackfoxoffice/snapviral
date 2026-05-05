import { Redirect, useRouter } from 'expo-router';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import {
  ArrowRight,
  Wand2,
  Mic2,
  Image as ImageIcon,
  Upload,
  Calendar,
  Globe,
  ShieldCheck,
} from 'lucide-react-native';
import { useAuth } from '../lib/auth';
import { NewsflowLogo } from '../components/icons/NewsflowLogo';

// Light-theme color palette (only applied on the public landing page)
const C = {
  bg: '#FAFAFA',
  bgSubtle: '#F4F4F5',
  card: '#FFFFFF',
  border: '#E5E7EB',
  borderSoft: '#F1F1F1',
  ink: '#0F172A',
  inkSecondary: '#334155',
  inkMuted: '#64748B',
  inkSubtle: '#94A3B8',
  brand: '#E53935',
  brandSoft: 'rgba(229,57,53,0.08)',
  brandBorder: 'rgba(229,57,53,0.20)',
};

export default function Index() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}>
        <ActivityIndicator color={C.brand} />
      </View>
    );
  }

  if (session) return <Redirect href="/dashboard" />;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} showsVerticalScrollIndicator={false}>
      {/* Top bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: isMobile ? 20 : 48,
          paddingTop: 24,
          paddingBottom: 8,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <NewsflowLogo size={28} />
          <Text style={{ fontSize: 16, fontWeight: '700', color: C.ink, letterSpacing: -0.3 }}>
            Newsflow Studio
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable
            onPress={() => router.push('/login')}
            style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 }}
          >
            <Text style={{ fontSize: 13, color: C.inkSecondary }}>Sign in</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/signup')}
            style={{ backgroundColor: C.brand, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6 }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>Get started</Text>
          </Pressable>
        </View>
      </View>

      {/* Hero */}
      <View
        style={{
          width: '100%',
          maxWidth: 1080,
          alignSelf: 'center',
          paddingHorizontal: isMobile ? 20 : 48,
          paddingTop: isMobile ? 56 : 96,
          paddingBottom: 56,
        }}
      >
        <View
          style={{
            alignSelf: 'flex-start',
            marginBottom: 24,
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: C.brandBorder,
            backgroundColor: C.brandSoft,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.brand }} />
          <Text
            style={{ fontSize: 11, fontWeight: '700', color: C.brand, textTransform: 'uppercase', letterSpacing: 1.5 }}
          >
            Tamil · English · Hindi
          </Text>
        </View>

        <Text
          style={{
            fontSize: isMobile ? 36 : 56,
            lineHeight: isMobile ? 44 : 64,
            fontWeight: '700',
            color: C.ink,
            letterSpacing: -1.2,
          }}
        >
          Turn any source into a finished{' '}
          <Text style={{ color: C.brand }}>news Short.</Text>
        </Text>

        <Text
          style={{
            color: C.inkSecondary,
            marginTop: 20,
            fontSize: isMobile ? 15 : 18,
            maxWidth: 620,
            lineHeight: isMobile ? 24 : 28,
          }}
        >
          Paste competitor URLs, your own script, or just a topic. Newsflow Studio writes the script in your language, generates visuals, narrates it, and delivers a 9:16 video — ready to publish or schedule on YouTube.
        </Text>

        <View
          style={{
            marginTop: 32,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            flexWrap: isMobile ? 'wrap' : 'nowrap',
          }}
        >
          <Pressable
            onPress={() => router.push('/signup')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: C.brand,
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 8,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Start creating free</Text>
            <ArrowRight size={14} color="#fff" />
          </Pressable>
          <Pressable
            onPress={() => router.push('/login')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: C.card,
              borderWidth: 1,
              borderColor: C.border,
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 8,
            }}
          >
            <Text style={{ fontSize: 14, color: C.inkSecondary }}>Sign in</Text>
          </Pressable>
        </View>

        <View style={{ marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={13} color={C.inkMuted} />
          <Text style={{ fontSize: 12, color: C.inkMuted }}>
            Transcripts only. We never reuse competitors' video, audio, or images.
          </Text>
        </View>
      </View>

      {/* Pipeline strip */}
      <View
        style={{
          width: '100%',
          maxWidth: 1080,
          alignSelf: 'center',
          paddingHorizontal: isMobile ? 20 : 48,
          paddingBottom: isMobile ? 56 : 96,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: C.inkSubtle,
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            marginBottom: 16,
          }}
        >
          One click — six steps
        </Text>
        <View
          style={{
            backgroundColor: C.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: C.border,
            overflow: 'hidden',
            flexDirection: isMobile ? 'column' : 'row',
          }}
        >
          <PipelineStep n={1} title="Ingest" desc="URLs, script, or topic" Icon={Globe} accent="#3B82F6" first isMobile={isMobile} />
          <PipelineStep n={2} title="Script" desc="Gemini in your language" Icon={Wand2} accent={C.brand} isMobile={isMobile} />
          <PipelineStep n={3} title="Visuals" desc="Cinematic 9:16 imagery" Icon={ImageIcon} accent="#F59E0B" isMobile={isMobile} />
          <PipelineStep n={4} title="Voice" desc="ElevenLabs narration" Icon={Mic2} accent="#A855F7" isMobile={isMobile} />
          <PipelineStep n={5} title="Compose" desc="Subtitled, branded MP4" Icon={Upload} accent="#10B981" isMobile={isMobile} />
          <PipelineStep n={6} title="Publish" desc="YouTube, on schedule" Icon={Calendar} accent={C.brand} isMobile={isMobile} last />
        </View>
      </View>

      {/* Features */}
      <View
        style={{
          width: '100%',
          maxWidth: 1080,
          alignSelf: 'center',
          paddingHorizontal: isMobile ? 20 : 48,
          paddingBottom: isMobile ? 56 : 96,
        }}
      >
        <Text
          style={{
            fontSize: isMobile ? 24 : 32,
            fontWeight: '700',
            color: C.ink,
            letterSpacing: -0.6,
            marginBottom: 32,
          }}
        >
          Everything a creator needs.{'\n'}Nothing they don't.
        </Text>
        <View
          style={{
            flexDirection: isMobile ? 'column' : 'row',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <Feature
            title="Multi-language scripting"
            body="Native Tamil, English and Hindi narration with timed character alignment so subtitles land on the syllable."
            isMobile={isMobile}
          />
          <Feature
            title="Real web research"
            body="Perplexity Sonar Pro pulls cited sources, then Gemini turns the briefing into a script — no copying competitors."
            isMobile={isMobile}
          />
          <Feature
            title="YouTube native"
            body="Connect once. Publish now or schedule for later. AI-generated titles, descriptions, and tags optimized for Shorts."
            isMobile={isMobile}
          />
          <Feature
            title="Vault-encrypted secrets"
            body="API keys are stored in Supabase Vault with libsodium / AES-256. Even admins see only the last 4 characters."
            isMobile={isMobile}
          />
        </View>
      </View>

      {/* Final CTA */}
      <View
        style={{
          width: '100%',
          maxWidth: 1080,
          alignSelf: 'center',
          paddingHorizontal: isMobile ? 20 : 48,
          paddingBottom: isMobile ? 56 : 96,
        }}
      >
        <View
          style={{
            backgroundColor: C.brandSoft,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: C.brandBorder,
            padding: 32,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: isMobile ? 22 : 28,
              fontWeight: '700',
              color: C.ink,
              textAlign: 'center',
              letterSpacing: -0.5,
              marginBottom: 8,
            }}
          >
            Make your first video in five minutes.
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: C.inkMuted,
              textAlign: 'center',
              marginBottom: 24,
              maxWidth: 440,
            }}
          >
            Free to start. No credit card. Bring your own YouTube channel.
          </Text>
          <Pressable
            onPress={() => router.push('/signup')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: C.brand,
              paddingHorizontal: 24,
              paddingVertical: 14,
              borderRadius: 8,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Get started — it's free</Text>
            <ArrowRight size={14} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* Footer */}
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: C.border,
          paddingHorizontal: isMobile ? 20 : 48,
          paddingVertical: 32,
          backgroundColor: C.bgSubtle,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 1080,
            alignSelf: 'center',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'center',
            justifyContent: isMobile ? 'flex-start' : 'space-between',
            gap: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <NewsflowLogo size={20} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: C.inkSecondary }}>Newsflow Studio</Text>
            <Text style={{ fontSize: 12, color: C.inkSubtle }}>© 2026</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
            <Pressable onPress={() => router.push('/privacy' as any)}>
              <Text style={{ fontSize: 12, color: C.inkMuted }}>Privacy</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/terms' as any)}>
              <Text style={{ fontSize: 12, color: C.inkMuted }}>Terms</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/login')}>
              <Text style={{ fontSize: 12, color: C.inkMuted }}>Sign in</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function PipelineStep({
  n,
  title,
  desc,
  Icon,
  accent,
  first,
  last,
  isMobile,
}: {
  n: number;
  title: string;
  desc: string;
  Icon: any;
  accent: string;
  first?: boolean;
  last?: boolean;
  isMobile: boolean;
}) {
  return (
    <View
      style={{
        flex: 1,
        padding: 16,
        borderLeftWidth: !isMobile && !first ? 1 : 0,
        borderTopWidth: isMobile && !first ? 1 : 0,
        borderColor: C.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: `${accent}1A`,
          }}
        >
          <Icon size={11} color={accent} />
        </View>
        <Text
          style={{
            fontSize: 10,
            fontWeight: '700',
            color: C.inkSubtle,
            textTransform: 'uppercase',
            letterSpacing: 1.5,
          }}
        >
          {String(n).padStart(2, '0')}
        </Text>
      </View>
      <Text style={{ fontSize: 14, fontWeight: '600', color: C.ink }}>{title}</Text>
      <Text style={{ fontSize: 11, color: C.inkMuted, marginTop: 2 }}>{desc}</Text>
    </View>
  );
}

function Feature({ title, body, isMobile }: { title: string; body: string; isMobile: boolean }) {
  return (
    <View
      style={{
        flexBasis: isMobile ? '100%' : '48%',
        flexGrow: 1,
        backgroundColor: C.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: C.border,
        padding: 20,
      }}
    >
      <Text style={{ fontSize: 15, fontWeight: '600', color: C.ink, marginBottom: 8 }}>{title}</Text>
      <Text style={{ fontSize: 13, color: C.inkMuted, lineHeight: 20 }}>{body}</Text>
    </View>
  );
}
