import { ScrollView, View, Text, Pressable, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { NewsflowLogo } from '../components/icons/NewsflowLogo';

export default function Privacy() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <ScrollView className="flex-1 bg-surface">
      <View
        className="mx-auto w-full max-w-[760px]"
        style={{ paddingHorizontal: isMobile ? 20 : 40, paddingTop: isMobile ? 24 : 48, paddingBottom: 80 }}
      >
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center gap-2 mb-8 self-start"
        >
          <ArrowLeft size={16} color="#78909C" />
          <Text className="text-[13px] text-ink-muted">Back</Text>
        </Pressable>

        <View className="flex-row items-center gap-2.5 mb-8">
          <NewsflowLogo size={28} />
          <Text className="text-[16px] font-bold text-ink tracking-tight">Newsflow Studio</Text>
        </View>

        <Text className="text-[28px] font-bold text-ink mb-2" style={{ letterSpacing: -0.5 }}>
          Privacy Policy
        </Text>
        <Text className="text-[12px] text-ink-subtle mb-8">Last updated: May 5, 2026</Text>

        <Section title="Overview">
          Newsflow Studio is a video-creation tool that helps creators turn news topics, scripts, or
          public source URLs into short-form videos suitable for YouTube Shorts. This policy
          describes what data we collect, how we use it, and the rights you have over it.
        </Section>

        <Section title="Information we collect">
          <Bullet>
            <Bold>Account info:</Bold> your email and name when you sign up via Supabase Auth.
          </Bullet>
          <Bullet>
            <Bold>Project content:</Bold> titles, topics, scripts, source URLs, and generated assets
            (images, audio, video) you create in the app.
          </Bullet>
          <Bullet>
            <Bold>YouTube channel data:</Bold> if you connect YouTube, we store the OAuth refresh
            token, your channel ID, and channel name so we can upload videos on your behalf.
          </Bullet>
          <Bullet>
            <Bold>Usage data:</Bold> basic logs (request times, errors) for operational debugging.
          </Bullet>
        </Section>

        <Section title="How we use YouTube data">
          When you connect your YouTube account, Newsflow Studio uses Google's YouTube Data API v3
          strictly to: (a) read your channel name/ID for display, and (b) upload videos you
          explicitly choose to publish or schedule. We do not read your watch history, subscriptions,
          comments, or analytics. Use of YouTube data is governed by{' '}
          <Link href="https://www.youtube.com/t/terms">YouTube's Terms of Service</Link> and{' '}
          <Link href="https://policies.google.com/privacy">Google's Privacy Policy</Link>.
        </Section>

        <Section title="How we use your data">
          <Bullet>To generate scripts, voiceovers, images, and final video files for your projects.</Bullet>
          <Bullet>To upload or schedule videos to your YouTube channel when you ask us to.</Bullet>
          <Bullet>To improve product reliability via anonymized error logs.</Bullet>
          <Bullet>We do not sell your data, and we do not use your content to train AI models.</Bullet>
        </Section>

        <Section title="Third-party services">
          We rely on these processors to deliver the product:
          <Bullet><Bold>Supabase</Bold> — authentication, database, file storage.</Bullet>
          <Bullet><Bold>Google / YouTube Data API</Bold> — video uploads.</Bullet>
          <Bullet><Bold>OpenRouter</Bold> — text generation (script writing, metadata).</Bullet>
          <Bullet><Bold>ElevenLabs</Bold> — voiceover synthesis.</Bullet>
          <Bullet><Bold>Vercel</Bold> — web hosting.</Bullet>
        </Section>

        <Section title="Your rights and controls">
          <Bullet>You can disconnect your YouTube account at any time from Settings — this revokes our access immediately.</Bullet>
          <Bullet>You can delete a project, which removes all associated assets from our storage.</Bullet>
          <Bullet>You can delete your account by emailing us; this purges your projects, OAuth tokens, and profile.</Bullet>
        </Section>

        <Section title="Data retention">
          Project assets are retained while your account is active. Deleted projects and revoked
          OAuth tokens are removed immediately. Backups are rotated within 30 days.
        </Section>

        <Section title="Contact">
          For privacy questions or data requests, email{' '}
          <Link href="mailto:Karthikeyanai2000@gmail.com">Karthikeyanai2000@gmail.com</Link>.
        </Section>
      </View>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-6">
      <Text className="text-[16px] font-bold text-ink mb-2.5" style={{ letterSpacing: -0.3 }}>
        {title}
      </Text>
      <Text className="text-[14px] text-ink-secondary leading-relaxed">{children}</Text>
    </View>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <Text className="text-[14px] text-ink-secondary leading-relaxed mt-2">
      {'• '}
      {children}
    </Text>
  );
}

function Bold({ children }: { children: React.ReactNode }) {
  return <Text className="font-semibold text-ink">{children}</Text>;
}

function Link({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Text
      className="text-brand"
      onPress={() => {
        if (typeof window !== 'undefined') window.open(href, '_blank');
      }}
    >
      {children}
    </Text>
  );
}
