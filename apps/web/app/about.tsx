import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  Mail,
  Globe,
  MessageCircle,
  Instagram,
  MapPin,
  Sparkles,
  Code2,
  Smartphone,
  Layers,
} from 'lucide-react-native';
import { SnapViralLogo } from '../components/icons/SnapViralLogo';

// =====================================================================
// Design tokens — kept in lockstep with apps/web/app/index.tsx
// =====================================================================
const KEYFRAMES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Newsreader:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=JetBrains+Mono:wght@400;500;600&display=swap');
:root { --sv-ink: #0A0A0B; --sv-red: #E11D2C; --sv-redhot: #FF2D40; }
html, body { background: #FFFFFF; font-family: Inter, -apple-system, sans-serif; }
* { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
::selection { background: #0A0A0B; color: #FFFFFF; }
@keyframes sv-fade-up { from { opacity: 0; transform: translate3d(0,16px,0); } to { opacity: 1; transform: translate3d(0,0,0); } }
@keyframes sv-rise-in { from { opacity: 0; transform: translate3d(0,24px,0) scale(0.98); filter: blur(4px); } to { opacity: 1; transform: translate3d(0,0,0) scale(1); filter: blur(0); } }
@keyframes sv-pulse-ring { 0%, 100% { box-shadow: 0 0 0 0 rgba(225,29,44,0.55); } 50% { box-shadow: 0 0 0 7px rgba(225,29,44,0); } }
`;

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
  red: '#E11D2C',
  redHot: '#FF2D40',
  redDeep: '#9F0617',
  green: '#16A34A',
  blue: '#2563EB',
  purple: '#7C3AED',
} as const;

// =====================================================================
// Real Blackfox / SnapViral details
// =====================================================================
const FOUNDER = {
  name: 'Parthasarathy Vijayakumar',
  title: 'Founder & CEO',
  org: 'Blackfoxoffice Pvt Ltd',
  photo: '/about/parthasarathy.jpg',
  bio: 'Building SnapViral and the Blackfoxoffice studio — a small team shipping AI-first products for creators. We design, engineer, and ship, end to end.',
  founderEmail: 'partha@blackfoxoffice.com',
  ceoInsta: 'https://www.instagram.com/isarathy_vk',
  ceoInstaHandle: '@isarathy_vk',
};

const COMPANY = {
  name: 'Blackfoxoffice Pvt Ltd',
  website: 'https://www.blackfoxoffice.com',
  websiteLabel: 'www.blackfoxoffice.com',
  insta: 'https://www.instagram.com/blackfoxoffice',
  instaHandle: '@blackfoxoffice',
  whatsapp: '+91 8248974942',
  whatsappLink: 'https://wa.me/918248974942',
  emails: {
    support: 'developer@blackfoxoffice.com',
    sales: 'sales@blackfoxoffice.com',
  },
};

const CAPABILITIES: Array<{ icon: any; title: string; copy: string }> = [
  {
    icon: Layers,
    title: 'SaaS products',
    copy: 'Multi-tenant platforms, billing, dashboards, workflows. We ship the full stack.',
  },
  {
    icon: Code2,
    title: 'Web applications',
    copy: 'React, Next, Node, Python. From admin tools to high-traffic consumer apps.',
  },
  {
    icon: Smartphone,
    title: 'Android development',
    copy: 'Native Kotlin, React Native, Expo. App store delivery and OTA updates.',
  },
];

// =====================================================================
// Page
// =====================================================================
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

export default function AboutPage() {
  useInjectStyles();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1100;
  const padX = isMobile ? 20 : isTablet ? 32 : 48;
  const ctx = { isMobile, isTablet, padX, router };

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 0 }}
      >
        <Header ctx={ctx} />
        <Hero ctx={ctx} />
        <FounderSection ctx={ctx} />
        <CapabilitiesSection ctx={ctx} />
        <ContactSection ctx={ctx} />
        <WhatsAppCTA ctx={ctx} />
        <Footer ctx={ctx} />
      </ScrollView>
    </View>
  );
}

type Ctx = {
  isMobile: boolean;
  isTablet: boolean;
  padX: number;
  router: ReturnType<typeof useRouter>;
};

// =====================================================================
// Header
// =====================================================================
function Header({ ctx }: { ctx: Ctx }) {
  const { isMobile, padX, router } = ctx;
  return (
    <View
      style={{
        paddingHorizontal: padX,
        paddingTop: 16,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: C.hair,
        backgroundColor: 'rgba(255,255,255,0.85)',
        ...({ position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'saturate(180%) blur(14px)' } as any),
      }}
    >
      <View
        style={{
          maxWidth: 1280,
          width: '100%',
          alignSelf: 'center',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Pressable
          onPress={() => router.push('/')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
        >
          <SnapViralLogo size={28} />
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
            <NavLink label="Home" onPress={() => router.push('/')} />
            <NavLink label="Blog" onPress={() => router.push('/blog' as any)} />
            <NavLink label="About" active />
          </View>
        ) : null}

        <Pressable
          onPress={() => router.push('/signup')}
          style={{
            paddingHorizontal: 14,
            height: 36,
            borderRadius: 999,
            backgroundColor: C.ink,
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: FONT.sans, fontSize: 13, color: C.paper, fontWeight: '600' }}>
            Start free
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function NavLink({ label, onPress, active }: { label: string; onPress?: () => void; active?: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <Pressable onPress={onPress} onHoverIn={() => setHover(true)} onHoverOut={() => setHover(false)}>
      <View style={{ height: 36, justifyContent: 'center', position: 'relative' }}>
        <Text
          style={{
            fontFamily: FONT.sans,
            fontSize: 13,
            color: active || hover ? C.ink : C.body,
            fontWeight: active ? '600' : '500',
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
            transform: [{ scaleX: active || hover ? 1 : 0 }] as any,
            ...({ transition: 'transform 280ms cubic-bezier(0.2,0.8,0.2,1)' } as any),
          }}
        />
      </View>
    </Pressable>
  );
}

// =====================================================================
// Hero
// =====================================================================
function Hero({ ctx }: { ctx: Ctx }) {
  const { isMobile, padX } = ctx;
  return (
    <View
      style={{
        paddingHorizontal: padX,
        paddingTop: isMobile ? 64 : 120,
        paddingBottom: isMobile ? 36 : 72,
        backgroundColor: C.paper,
      }}
    >
      <View style={{ maxWidth: 1100, width: '100%', alignSelf: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 }}>
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
            About us
          </Text>
        </View>
        <Text
          style={{
            fontFamily: FONT.serif,
            fontSize: isMobile ? 40 : 72,
            lineHeight: isMobile ? 44 : 78,
            color: C.ink,
            letterSpacing: isMobile ? -1.5 : -3,
            fontWeight: '500',
            ...({ animation: 'sv-rise-in 700ms cubic-bezier(0.2,0.8,0.2,1) both' } as any),
          }}
        >
          Built by a small{' '}
          <Text
            style={{
              fontFamily: FONT.serif,
              fontStyle: 'italic',
              fontSize: isMobile ? 40 : 72,
              lineHeight: isMobile ? 44 : 78,
              color: C.red,
              letterSpacing: isMobile ? -1.5 : -3,
              fontWeight: '500',
            }}
          >
            studio
          </Text>{' '}
          shipping daily.
        </Text>
        <Text
          style={{
            fontFamily: FONT.sans,
            fontSize: isMobile ? 16 : 19,
            color: C.muted,
            lineHeight: isMobile ? 26 : 30,
            marginTop: 24,
            maxWidth: 720,
          }}
        >
          SnapViral is a Blackfoxoffice product. We're a tight team — designers, engineers, and
          operators — turning AI research into tools creators actually use. We also build SaaS,
          web, and Android apps for partners across the world.
        </Text>
      </View>
    </View>
  );
}

// =====================================================================
// Founder
// =====================================================================
function FounderSection({ ctx }: { ctx: Ctx }) {
  const { isMobile, padX } = ctx;
  const [imgOk, setImgOk] = useState(true);
  const initials = FOUNDER.name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View
      style={{
        paddingHorizontal: padX,
        paddingTop: isMobile ? 36 : 72,
        paddingBottom: isMobile ? 36 : 72,
        backgroundColor: C.warm,
        borderTopWidth: 1,
        borderTopColor: C.hair,
        borderBottomWidth: 1,
        borderBottomColor: C.hair,
      }}
    >
      <View
        style={{
          maxWidth: 1100,
          width: '100%',
          alignSelf: 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 28 : 64,
          alignItems: isMobile ? 'flex-start' : 'center',
        }}
      >
        {/* Photo */}
        <View
          style={{
            width: isMobile ? 220 : 360,
            height: isMobile ? 220 : 440,
            borderRadius: 24,
            overflow: 'hidden',
            backgroundColor: C.surface,
            borderWidth: 1,
            borderColor: C.hairline,
            position: 'relative',
            ...({ boxShadow: '0 24px 60px -20px rgba(10,10,11,0.18)' } as any),
          }}
        >
          {imgOk ? (
            <Image
              source={{ uri: FOUNDER.photo }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
              onError={() => setImgOk(false)}
            />
          ) : (
            <View
              style={{
                width: '100%',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: C.ink,
              }}
            >
              <Text
                style={{
                  fontFamily: FONT.serif,
                  fontSize: isMobile ? 64 : 120,
                  fontWeight: '600',
                  color: C.paper,
                }}
              >
                {initials}
              </Text>
            </View>
          )}
          {/* Red accent corner */}
          <View
            style={{
              position: 'absolute',
              top: 14,
              left: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 10,
              height: 24,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.92)',
              borderWidth: 1,
              borderColor: C.hair,
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: C.red,
                ...({ animation: 'sv-pulse-ring 1.6s ease-in-out infinite' } as any),
              }}
            />
            <Text style={{ fontFamily: FONT.mono, fontSize: 10, fontWeight: '700', color: C.ink, letterSpacing: 1 }}>
              CEO · BLACKFOX
            </Text>
          </View>
        </View>

        {/* Bio */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: FONT.mono,
              fontSize: 11,
              fontWeight: '700',
              color: C.muted,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              marginBottom: 14,
            }}
          >
            Founder
          </Text>
          <Text
            style={{
              fontFamily: FONT.serif,
              fontSize: isMobile ? 32 : 48,
              lineHeight: isMobile ? 38 : 54,
              color: C.ink,
              letterSpacing: -1.4,
              fontWeight: '500',
            }}
          >
            {FOUNDER.name}
          </Text>
          <Text
            style={{
              fontFamily: FONT.sans,
              fontSize: 15,
              color: C.red,
              fontWeight: '600',
              marginTop: 8,
            }}
          >
            {FOUNDER.title} · {FOUNDER.org}
          </Text>
          <Text
            style={{
              fontFamily: FONT.sans,
              fontSize: isMobile ? 15 : 17,
              color: C.body,
              lineHeight: isMobile ? 25 : 28,
              marginTop: 22,
              maxWidth: 560,
            }}
          >
            {FOUNDER.bio}
          </Text>

          {/* Founder direct contact */}
          <View
            style={{
              marginTop: 24,
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <ContactPill
              icon={<Mail size={13} color={C.ink} strokeWidth={2.2} />}
              label={FOUNDER.founderEmail}
              onPress={() => Linking.openURL(`mailto:${FOUNDER.founderEmail}`)}
            />
            <ContactPill
              icon={<Instagram size={13} color={C.ink} strokeWidth={2.2} />}
              label={FOUNDER.ceoInstaHandle}
              onPress={() => Linking.openURL(FOUNDER.ceoInsta)}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

function ContactPill({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        height: 36,
        borderRadius: 999,
        backgroundColor: hover ? C.ink : C.paper,
        borderWidth: 1,
        borderColor: hover ? C.ink : C.hairline,
        ...({ transition: 'all 180ms ease' } as any),
      }}
    >
      <View style={{ opacity: hover ? 0 : 1, position: hover ? 'absolute' : 'relative', left: 14 }}>{icon}</View>
      <Text
        style={{
          fontFamily: FONT.mono,
          fontSize: 12,
          color: hover ? C.paper : C.ink,
          fontWeight: '600',
          paddingLeft: hover ? 0 : 0,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// =====================================================================
// Capabilities
// =====================================================================
function CapabilitiesSection({ ctx }: { ctx: Ctx }) {
  const { isMobile, padX } = ctx;
  return (
    <View
      style={{
        paddingHorizontal: padX,
        paddingTop: isMobile ? 56 : 96,
        paddingBottom: isMobile ? 36 : 64,
        backgroundColor: C.paper,
      }}
    >
      <View style={{ maxWidth: 1100, width: '100%', alignSelf: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.purple }} />
          <Text
            style={{
              fontFamily: FONT.mono,
              fontSize: 11,
              fontWeight: '700',
              color: C.purple,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
            }}
          >
            What we also build
          </Text>
        </View>
        <Text
          style={{
            fontFamily: FONT.serif,
            fontSize: isMobile ? 28 : 44,
            lineHeight: isMobile ? 34 : 50,
            color: C.ink,
            letterSpacing: -1.2,
            fontWeight: '500',
            marginBottom: isMobile ? 28 : 44,
            maxWidth: 760,
          }}
        >
          We're a software studio. SnapViral is just{' '}
          <Text style={{ fontStyle: 'italic', color: C.red }}>one</Text> of the things we ship.
        </Text>

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: isMobile ? 14 : 20,
          }}
        >
          {CAPABILITIES.map((cap) => {
            const Icon = cap.icon;
            return (
              <View
                key={cap.title}
                style={{
                  flexBasis: isMobile ? '100%' : `calc(33.333% - ${(20 * 2) / 3}px)` as any,
                  padding: 26,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: C.hairline,
                  backgroundColor: C.warm,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: C.paper,
                    borderWidth: 1,
                    borderColor: C.hairline,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 18,
                  }}
                >
                  <Icon size={20} color={C.ink} strokeWidth={1.8} />
                </View>
                <Text
                  style={{
                    fontFamily: FONT.sans,
                    fontSize: 17,
                    fontWeight: '700',
                    color: C.ink,
                    letterSpacing: -0.3,
                    marginBottom: 8,
                  }}
                >
                  {cap.title}
                </Text>
                <Text
                  style={{
                    fontFamily: FONT.sans,
                    fontSize: 14,
                    color: C.muted,
                    lineHeight: 22,
                  }}
                >
                  {cap.copy}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// Contact (emails, website, socials)
// =====================================================================
function ContactSection({ ctx }: { ctx: Ctx }) {
  const { isMobile, padX } = ctx;
  const cards: Array<{
    eyebrow: string;
    label: string;
    value: string;
    icon: any;
    onPress: () => void;
    accent: string;
  }> = [
    {
      eyebrow: 'Founder',
      label: 'CEO direct',
      value: FOUNDER.founderEmail,
      icon: Mail,
      accent: C.red,
      onPress: () => Linking.openURL(`mailto:${FOUNDER.founderEmail}`),
    },
    {
      eyebrow: 'Support',
      label: 'Help & technical issues',
      value: COMPANY.emails.support,
      icon: Mail,
      accent: C.blue,
      onPress: () => Linking.openURL(`mailto:${COMPANY.emails.support}`),
    },
    {
      eyebrow: 'Sales',
      label: 'Software development enquiries',
      value: COMPANY.emails.sales,
      icon: Mail,
      accent: C.green,
      onPress: () => Linking.openURL(`mailto:${COMPANY.emails.sales}`),
    },
    {
      eyebrow: 'Website',
      label: 'Blackfoxoffice',
      value: COMPANY.websiteLabel,
      icon: Globe,
      accent: C.purple,
      onPress: () => Linking.openURL(COMPANY.website),
    },
    {
      eyebrow: 'Company',
      label: 'Instagram',
      value: COMPANY.instaHandle,
      icon: Instagram,
      accent: C.redHot,
      onPress: () => Linking.openURL(COMPANY.insta),
    },
    {
      eyebrow: 'CEO',
      label: 'Instagram',
      value: FOUNDER.ceoInstaHandle,
      icon: Instagram,
      accent: C.redDeep,
      onPress: () => Linking.openURL(FOUNDER.ceoInsta),
    },
  ];

  return (
    <View
      style={{
        paddingHorizontal: padX,
        paddingTop: isMobile ? 36 : 64,
        paddingBottom: isMobile ? 36 : 64,
        backgroundColor: C.paper,
        borderTopWidth: 1,
        borderTopColor: C.hair,
      }}
    >
      <View style={{ maxWidth: 1100, width: '100%', alignSelf: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.green }} />
          <Text
            style={{
              fontFamily: FONT.mono,
              fontSize: 11,
              fontWeight: '700',
              color: C.green,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
            }}
          >
            Get in touch
          </Text>
        </View>
        <Text
          style={{
            fontFamily: FONT.serif,
            fontSize: isMobile ? 28 : 44,
            lineHeight: isMobile ? 34 : 50,
            color: C.ink,
            letterSpacing: -1.2,
            fontWeight: '500',
            marginBottom: isMobile ? 24 : 36,
          }}
        >
          Reach out, anytime.
        </Text>

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: isMobile ? 12 : 16,
          }}
        >
          {cards.map((card) => (
            <ContactCard key={card.value} {...card} isMobile={isMobile} />
          ))}
        </View>
      </View>
    </View>
  );
}

function ContactCard({
  eyebrow,
  label,
  value,
  icon: Icon,
  onPress,
  accent,
  isMobile,
}: {
  eyebrow: string;
  label: string;
  value: string;
  icon: any;
  onPress: () => void;
  accent: string;
  isMobile: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={{
        flexBasis: isMobile ? '100%' : `calc(33.333% - ${(16 * 2) / 3}px)` as any,
        padding: 22,
        borderRadius: 18,
        backgroundColor: C.paper,
        borderWidth: 1,
        borderColor: hover ? C.ink : C.hairline,
        ...({
          transition: 'border-color 200ms ease, transform 240ms cubic-bezier(0.2,0.8,0.2,1)',
          transform: hover ? 'translateY(-2px)' : 'translateY(0)',
          boxShadow: hover ? '0 18px 36px -16px rgba(10,10,11,0.20)' : '0 1px 2px rgba(10,10,11,0.04)',
        } as any),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <Text
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            fontWeight: '700',
            color: accent,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
          }}
        >
          {eyebrow}
        </Text>
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            backgroundColor: hover ? accent : C.surface,
            alignItems: 'center',
            justifyContent: 'center',
            ...({ transition: 'background-color 200ms ease' } as any),
          }}
        >
          <Icon size={14} color={hover ? C.paper : C.ink} strokeWidth={2} />
        </View>
      </View>

      <Text
        style={{
          fontFamily: FONT.sans,
          fontSize: 13,
          color: C.muted,
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: FONT.mono,
          fontSize: 14,
          color: C.ink,
          fontWeight: '600',
        }}
      >
        {value}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 16 }}>
        <Text
          style={{
            fontFamily: FONT.sans,
            fontSize: 12,
            color: hover ? C.ink : C.muted,
            fontWeight: '600',
            ...({ transition: 'color 180ms ease' } as any),
          }}
        >
          Open
        </Text>
        <ArrowRight size={12} color={hover ? C.ink : C.muted} strokeWidth={2.4} />
      </View>
    </Pressable>
  );
}

// =====================================================================
// WhatsApp CTA
// =====================================================================
function WhatsAppCTA({ ctx }: { ctx: Ctx }) {
  const { isMobile, padX } = ctx;
  const [hover, setHover] = useState(false);
  return (
    <View
      style={{
        paddingHorizontal: padX,
        paddingTop: isMobile ? 36 : 64,
        paddingBottom: isMobile ? 56 : 96,
        backgroundColor: C.paper,
      }}
    >
      <View
        style={{
          maxWidth: 1100,
          width: '100%',
          alignSelf: 'center',
          borderRadius: 28,
          overflow: 'hidden',
          backgroundColor: C.ink,
          ...({
            backgroundImage:
              'radial-gradient(120% 140% at 0% 0%, rgba(225,29,44,0.20) 0%, rgba(0,0,0,0) 60%), radial-gradient(120% 140% at 100% 100%, rgba(255,45,64,0.16) 0%, rgba(0,0,0,0) 60%)',
          } as any),
          padding: isMobile ? 28 : 56,
        }}
      >
        <View
          style={{
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'center',
            justifyContent: 'space-between',
            gap: isMobile ? 24 : 32,
          }}
        >
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#25D366' }} />
              <Text
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 11,
                  fontWeight: '700',
                  color: '#25D366',
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                }}
              >
                WhatsApp
              </Text>
            </View>
            <Text
              style={{
                fontFamily: FONT.serif,
                fontSize: isMobile ? 30 : 44,
                lineHeight: isMobile ? 36 : 50,
                color: C.paper,
                letterSpacing: -1.2,
                fontWeight: '500',
                marginBottom: 12,
              }}
            >
              Talk to the team{' '}
              <Text style={{ fontStyle: 'italic', color: '#FF7A8A' }}>directly</Text>.
            </Text>
            <Text
              style={{
                fontFamily: FONT.sans,
                fontSize: 15,
                color: 'rgba(255,255,255,0.65)',
                lineHeight: 24,
                maxWidth: 540,
              }}
            >
              Got a SaaS, web, or Android project? Drop us a message — we'll reply within a few
              hours during work-week.
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginTop: 20,
              }}
            >
              <MapPin size={13} color="rgba(255,255,255,0.55)" strokeWidth={1.8} />
              <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
                Chennai, India · open globally
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => Linking.openURL(COMPANY.whatsappLink)}
            onHoverIn={() => setHover(true)}
            onHoverOut={() => setHover(false)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingHorizontal: 24,
              height: 56,
              borderRadius: 999,
              backgroundColor: '#25D366',
              ...({
                transition: 'transform 180ms cubic-bezier(0.2,0.8,0.2,1), box-shadow 180ms ease',
                transform: hover ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: hover
                  ? '0 16px 36px -10px rgba(37,211,102,0.55)'
                  : '0 8px 20px -8px rgba(37,211,102,0.45)',
              } as any),
            }}
          >
            <MessageCircle size={20} color={C.paper} strokeWidth={2.2} />
            <View>
              <Text
                style={{
                  fontFamily: FONT.sans,
                  fontSize: 13,
                  fontWeight: '700',
                  color: C.paper,
                  letterSpacing: -0.2,
                }}
              >
                Message us on WhatsApp
              </Text>
              <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
                {COMPANY.whatsapp}
              </Text>
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// =====================================================================
// Footer (slim — main footer lives on landing)
// =====================================================================
function Footer({ ctx }: { ctx: Ctx }) {
  const { isMobile, padX, router } = ctx;
  return (
    <View
      style={{
        paddingHorizontal: padX,
        paddingTop: 36,
        paddingBottom: 28,
        borderTopWidth: 1,
        borderTopColor: C.hair,
        backgroundColor: C.warm,
      }}
    >
      <View
        style={{
          maxWidth: 1280,
          width: '100%',
          alignSelf: 'center',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: 14,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <SnapViralLogo size={22} />
          <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: C.muted }}>
            © {new Date().getFullYear()} SnapViral · A Blackfoxoffice product
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 18, flexWrap: 'wrap' }}>
          <Pressable onPress={() => router.push('/')}>
            <Text style={{ fontFamily: FONT.sans, fontSize: 12, color: C.body, fontWeight: '500' }}>Home</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/blog' as any)}>
            <Text style={{ fontFamily: FONT.sans, fontSize: 12, color: C.body, fontWeight: '500' }}>Blog</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/privacy' as any)}>
            <Text style={{ fontFamily: FONT.sans, fontSize: 12, color: C.body, fontWeight: '500' }}>Privacy</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/terms' as any)}>
            <Text style={{ fontFamily: FONT.sans, fontSize: 12, color: C.body, fontWeight: '500' }}>Terms</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
