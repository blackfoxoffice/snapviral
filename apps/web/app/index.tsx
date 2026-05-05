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

export default function Index() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator color="#E53935" />
      </View>
    );
  }

  // Logged-in users always go to the dashboard
  if (session) return <Redirect href="/dashboard" />;

  // Public landing page
  return (
    <ScrollView className="flex-1 bg-surface" showsVerticalScrollIndicator={false}>
      {/* Top bar */}
      <View
        className="flex-row items-center justify-between"
        style={{ paddingHorizontal: isMobile ? 20 : 48, paddingTop: 24, paddingBottom: 8 }}
      >
        <View className="flex-row items-center gap-2.5">
          <NewsflowLogo size={28} />
          <Text className="text-[16px] font-bold text-ink tracking-tight">Newsflow Studio</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => router.push('/login')}
            className="rounded-md px-3 py-2 hover:bg-surface-raised"
          >
            <Text className="text-[13px] text-ink-secondary">Sign in</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/signup')}
            className="rounded-md px-3.5 py-2"
            style={{ backgroundColor: '#E53935' }}
          >
            <Text className="text-[13px] font-semibold text-white">Get started</Text>
          </Pressable>
        </View>
      </View>

      {/* Hero */}
      <View
        className="mx-auto w-full max-w-[1080px]"
        style={{ paddingHorizontal: isMobile ? 20 : 48, paddingTop: isMobile ? 56 : 96, paddingBottom: 56 }}
      >
        <View className="self-start mb-6 rounded-full px-3 py-1 border border-brand/25 bg-brand-soft flex-row items-center gap-2">
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#E53935' }} />
          <Text className="text-[11px] font-semibold text-brand uppercase tracking-widest">
            Tamil · English · Hindi
          </Text>
        </View>
        <Text
          className={`font-bold text-ink ${isMobile ? 'text-[36px] leading-[44px]' : 'text-[56px] leading-[64px]'}`}
          style={{ letterSpacing: -1.2 }}
        >
          Turn any source into a finished{' '}
          <Text style={{ color: '#E53935' }}>news Short.</Text>
        </Text>
        <Text
          className={`text-ink-muted mt-5 ${isMobile ? 'text-[15px]' : 'text-[18px]'}`}
          style={{ maxWidth: 620, lineHeight: isMobile ? 24 : 28 }}
        >
          Paste competitor URLs, your own script, or just a topic. Newsflow Studio writes the script in your language, generates visuals, narrates it, and delivers a 9:16 video — ready to publish or schedule on YouTube.
        </Text>

        <View className={`mt-8 flex-row items-center gap-3 ${isMobile ? 'flex-wrap' : ''}`}>
          <Pressable
            onPress={() => router.push('/signup')}
            className="flex-row items-center gap-2 rounded-lg px-5 py-3"
            style={{ backgroundColor: '#E53935' }}
          >
            <Text className="text-[14px] font-semibold text-white">Start creating free</Text>
            <ArrowRight size={14} color="#fff" />
          </Pressable>
          <Pressable
            onPress={() => router.push('/login')}
            className="flex-row items-center gap-2 rounded-lg px-5 py-3"
            style={{ backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#2A2A2A' }}
          >
            <Text className="text-[14px] text-ink-secondary">Sign in</Text>
          </Pressable>
        </View>

        <View className="mt-6 flex-row items-center gap-2">
          <ShieldCheck size={13} color="#78909C" />
          <Text className="text-[12px] text-ink-muted">
            Transcripts only. We never reuse competitors' video, audio, or images.
          </Text>
        </View>
      </View>

      {/* Pipeline strip */}
      <View
        className="mx-auto w-full max-w-[1080px]"
        style={{ paddingHorizontal: isMobile ? 20 : 48, paddingBottom: isMobile ? 56 : 96 }}
      >
        <Text className="text-[11px] font-bold text-ink-subtle uppercase tracking-widest mb-4">
          One click — six steps
        </Text>
        <View
          className={`rounded-2xl overflow-hidden ${isMobile ? '' : 'flex-row'}`}
          style={{ backgroundColor: '#161616', borderWidth: 1, borderColor: '#222' }}
        >
          <PipelineStep n={1} title="Ingest" desc="URLs, script, or topic" Icon={Globe} accent="#42A5F5" first isMobile={isMobile} />
          <PipelineStep n={2} title="Script" desc="Gemini Flash in your language" Icon={Wand2} accent="#FF1744" isMobile={isMobile} />
          <PipelineStep n={3} title="Visuals" desc="Cinematic 9:16 imagery" Icon={ImageIcon} accent="#FFB300" isMobile={isMobile} />
          <PipelineStep n={4} title="Voice" desc="ElevenLabs voiceover" Icon={Mic2} accent="#AB47BC" isMobile={isMobile} />
          <PipelineStep n={5} title="Compose" desc="Subtitled, branded MP4" Icon={Upload} accent="#00E676" isMobile={isMobile} />
          <PipelineStep n={6} title="Publish" desc="YouTube, on schedule" Icon={Calendar} accent="#E53935" isMobile={isMobile} last />
        </View>
      </View>

      {/* Features */}
      <View
        className="mx-auto w-full max-w-[1080px]"
        style={{ paddingHorizontal: isMobile ? 20 : 48, paddingBottom: isMobile ? 56 : 96 }}
      >
        <Text
          className={`font-bold text-ink ${isMobile ? 'text-[24px]' : 'text-[32px]'} mb-8`}
          style={{ letterSpacing: -0.6 }}
        >
          Everything a creator needs.{'\n'}Nothing they don't.
        </Text>
        <View className={`gap-4 ${isMobile ? '' : 'flex-row flex-wrap'}`}>
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
        className="mx-auto w-full max-w-[1080px]"
        style={{ paddingHorizontal: isMobile ? 20 : 48, paddingBottom: isMobile ? 56 : 96 }}
      >
        <View
          className="rounded-2xl overflow-hidden p-8 items-center"
          style={{
            backgroundColor: 'rgba(229,57,53,0.05)',
            borderWidth: 1,
            borderColor: 'rgba(229,57,53,0.2)',
          }}
        >
          <Text
            className={`font-bold text-ink text-center ${isMobile ? 'text-[22px]' : 'text-[28px]'} mb-2`}
            style={{ letterSpacing: -0.5 }}
          >
            Make your first video in five minutes.
          </Text>
          <Text className="text-[14px] text-ink-muted text-center mb-6 max-w-[440px]">
            Free to start. No credit card. Bring your own YouTube channel.
          </Text>
          <Pressable
            onPress={() => router.push('/signup')}
            className="flex-row items-center gap-2 rounded-lg px-6 py-3.5"
            style={{ backgroundColor: '#E53935' }}
          >
            <Text className="text-[14px] font-semibold text-white">Get started — it's free</Text>
            <ArrowRight size={14} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* Footer */}
      <View
        className="border-t border-surface-border"
        style={{ paddingHorizontal: isMobile ? 20 : 48, paddingVertical: 32 }}
      >
        <View
          className={`mx-auto w-full max-w-[1080px] ${isMobile ? '' : 'flex-row items-center justify-between'}`}
          style={isMobile ? { gap: 16 } : {}}
        >
          <View className="flex-row items-center gap-2.5">
            <NewsflowLogo size={20} />
            <Text className="text-[13px] font-semibold text-ink-secondary">Newsflow Studio</Text>
            <Text className="text-[12px] text-ink-subtle">© 2026</Text>
          </View>
          <View className="flex-row items-center gap-5">
            <Pressable onPress={() => router.push('/privacy' as any)}>
              <Text className="text-[12px] text-ink-muted">Privacy</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/terms' as any)}>
              <Text className="text-[12px] text-ink-muted">Terms</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/login')}>
              <Text className="text-[12px] text-ink-muted">Sign in</Text>
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
      className="flex-1 p-4"
      style={{
        borderLeftWidth: !isMobile && !first ? 1 : 0,
        borderTopWidth: isMobile && !first ? 1 : 0,
        borderColor: '#222',
      }}
    >
      <View className="flex-row items-center gap-2 mb-2">
        <View
          className="items-center justify-center rounded-md"
          style={{ width: 22, height: 22, backgroundColor: `${accent}20` }}
        >
          <Icon size={11} color={accent} />
        </View>
        <Text
          className="text-[10px] font-bold text-ink-subtle uppercase tracking-widest"
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {String(n).padStart(2, '0')}
        </Text>
      </View>
      <Text className="text-[14px] font-semibold text-ink">{title}</Text>
      <Text className="text-[11px] text-ink-muted mt-0.5">{desc}</Text>
    </View>
  );
}

function Feature({ title, body, isMobile }: { title: string; body: string; isMobile: boolean }) {
  return (
    <View
      className="rounded-xl p-5"
      style={{
        flexBasis: isMobile ? '100%' : '48%',
        flexGrow: 1,
        backgroundColor: '#161616',
        borderWidth: 1,
        borderColor: '#222',
      }}
    >
      <Text className="text-[15px] font-semibold text-ink mb-2">{title}</Text>
      <Text className="text-[13px] text-ink-muted leading-relaxed">{body}</Text>
    </View>
  );
}
