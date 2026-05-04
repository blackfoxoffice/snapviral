import { ScrollView, View, Text, Pressable, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { NewsflowLogo } from '../components/icons/NewsflowLogo';

export default function Terms() {
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
          Terms of Service
        </Text>
        <Text className="text-[12px] text-ink-subtle mb-8">Last updated: May 5, 2026</Text>

        <Section title="Acceptance">
          By creating an account or using Newsflow Studio, you agree to these terms. If you don't
          agree, don't use the service.
        </Section>

        <Section title="What the service does">
          Newsflow Studio is a creator tool that turns text inputs (topics, scripts, public source
          URLs) into short videos. You can preview the output, edit metadata, and publish or
          schedule uploads to a YouTube channel you own.
        </Section>

        <Section title="Your account">
          <Bullet>You must be 13 or older (or the minimum age in your country) to use this service.</Bullet>
          <Bullet>You're responsible for the accuracy of the email and information you provide.</Bullet>
          <Bullet>You're responsible for all activity under your account, including content uploaded to YouTube.</Bullet>
        </Section>

        <Section title="Acceptable use">
          You may not use Newsflow Studio to create content that:
          <Bullet>Violates copyright or other intellectual property rights.</Bullet>
          <Bullet>Constitutes hate speech, harassment, or incites violence.</Bullet>
          <Bullet>Spreads disinformation, deceptive deepfakes, or fabricated quotes attributed to real people.</Bullet>
          <Bullet>Contains explicit sexual content involving minors, or any other content illegal in your jurisdiction.</Bullet>
          <Bullet>Violates YouTube's Community Guidelines or Terms of Service.</Bullet>
        </Section>

        <Section title="Source URLs">
          When you provide YouTube URLs as input, we fetch only publicly available transcripts. We
          never download or reuse the video, audio, or imagery. The script we generate is rewritten
          from scratch — you are responsible for ensuring the topic and framing comply with fair
          use, defamation, and other applicable laws in your jurisdiction.
        </Section>

        <Section title="YouTube uploads">
          When you connect your YouTube channel, you authorize Newsflow Studio to upload, schedule,
          or set metadata on videos you explicitly publish from this app. We do not auto-publish
          anything you didn't queue. You can revoke access from the Settings page or directly from{' '}
          <Link href="https://myaccount.google.com/permissions">Google Account permissions</Link>.
        </Section>

        <Section title="Your content, your responsibility">
          You retain ownership of the videos you generate. You grant Newsflow Studio only the limited
          rights needed to store, process, and upload that content on your behalf. You confirm that
          you have all necessary rights to the topics, scripts, and source URLs you submit.
        </Section>

        <Section title="No warranty">
          The service is provided "as is." Generated scripts, images, and voiceovers may contain
          factual errors, hallucinations, or stylistic mistakes. Always review videos before
          publishing. We are not liable for misinformation, channel strikes, or any consequences
          arising from content you choose to publish.
        </Section>

        <Section title="Limitation of liability">
          To the maximum extent permitted by law, Newsflow Studio's total liability is limited to
          the amount you paid us in the prior 12 months (or USD 50 if free).
        </Section>

        <Section title="Termination">
          You may delete your account at any time. We may suspend or terminate accounts that violate
          these terms or applicable law. On termination, your projects, OAuth tokens, and profile
          are deleted.
        </Section>

        <Section title="Changes">
          We may update these terms occasionally. Material changes will be announced via email or
          in-app banner. Continued use after a change means you accept the updated terms.
        </Section>

        <Section title="Contact">
          Questions? Email{' '}
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
