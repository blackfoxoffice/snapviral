import { View, Text, Pressable, ScrollView } from 'react-native';
import {
  Newspaper,
  Landmark,
  Trophy,
  Cpu,
  Film,
  TrendingUp,
  HeartPulse,
  GraduationCap,
  Globe2,
  MapPin,
  Flame,
  Sparkles,
  type LucideIcon,
} from 'lucide-react-native';
import type { ProjectLanguage } from '@newsflow/shared';

interface Suggestion {
  category: string;
  Icon: LucideIcon;
  accent: string;
  examplesByLang: Partial<Record<ProjectLanguage, string[]>> & { en: string[] };
}

// Curated, news-flavored prompts. The picker fills the topic field with one
// example from the chosen category (rotates through examples on repeat clicks).
const SUGGESTIONS: Suggestion[] = [
  {
    category: 'Breaking news',
    Icon: Flame,
    accent: '#E53935',
    examplesByLang: {
      en: [
        'Today\'s top headline',
        'Major story breaking in the last 24 hours',
        'Big political development today',
      ],
      ta: [
        'இன்றைய முக்கிய செய்தி',
        '24 மணி நேரத்தில் வெளிவந்த பெரிய செய்தி',
      ],
      hi: [
        'आज की प्रमुख खबर',
        'पिछले 24 घंटे की बड़ी ख़बर',
      ],
    },
  },
  {
    category: 'Politics',
    Icon: Landmark,
    accent: '#2563EB',
    examplesByLang: {
      en: ['TN election 2026 update', 'Latest Lok Sabha development', 'PM\'s announcement today'],
      ta: ['தமிழ்நாடு தேர்தல் 2026 புதுப்பிப்பு', 'இன்றைய பிரதமர் அறிவிப்பு'],
      hi: ['लोकसभा 2026 अपडेट', 'आज प्रधानमंत्री की घोषणा'],
    },
  },
  {
    category: 'Tamil cinema',
    Icon: Film,
    accent: '#A855F7',
    examplesByLang: {
      en: ['Latest Kollywood release', 'Vijay\'s new film announcement', 'Box office collection update'],
      ta: ['சமீபத்திய கோலிவுட் வெளியீடு', 'விஜய்யின் புதிய படம்'],
      hi: ['कोलीवुड की ताज़ा रिलीज़'],
    },
  },
  {
    category: 'Sports',
    Icon: Trophy,
    accent: '#F59E0B',
    examplesByLang: {
      en: ['IPL 2026 latest match', 'Indian cricket team news', 'Chennai Super Kings update'],
      ta: ['ஐபிஎல் 2026 சமீபத்திய போட்டி', 'சிஎஸ்கே செய்தி'],
      hi: ['आईपीएल 2026 ताज़ा मैच', 'टीम इंडिया की खबर'],
    },
  },
  {
    category: 'Tech & startups',
    Icon: Cpu,
    accent: '#10B981',
    examplesByLang: {
      en: ['Latest AI announcement', 'Indian startup funding news', 'New Apple/Samsung launch'],
      ta: ['சமீபத்திய AI அறிவிப்பு', 'இந்திய ஸ்டார்ட்அப் நிதி செய்தி'],
      hi: ['ताज़ा AI घोषणा', 'भारतीय स्टार्टअप फंडिंग'],
    },
  },
  {
    category: 'Business & markets',
    Icon: TrendingUp,
    accent: '#0EA5E9',
    examplesByLang: {
      en: ['Sensex/Nifty close today', 'Major IPO this week', 'Big merger or acquisition'],
      ta: ['சென்செக்ஸ் / நிஃப்டி இறுதி', 'இந்த வாரம் முக்கிய IPO'],
      hi: ['सेंसेक्स/निफ्टी आज की क्लोज़', 'इस सप्ताह का प्रमुख IPO'],
    },
  },
  {
    category: 'Entertainment',
    Icon: Sparkles,
    accent: '#EC4899',
    examplesByLang: {
      en: ['Bollywood news today', 'OTT release this week', 'Celebrity headline'],
      ta: ['சமீபத்திய OTT வெளியீடு', 'பாலிவுட் செய்தி'],
      hi: ['आज की बॉलीवुड खबर', 'इस सप्ताह OTT रिलीज़'],
    },
  },
  {
    category: 'World news',
    Icon: Globe2,
    accent: '#6366F1',
    examplesByLang: {
      en: ['Major international headline', 'Update from a global conflict', 'US/UK politics today'],
      ta: ['சர்வதேச முக்கிய தலைப்பு', 'அமெரிக்க அரசியல் இன்று'],
      hi: ['प्रमुख अंतरराष्ट्रीय खबर', 'अमेरिकी राजनीति आज'],
    },
  },
  {
    category: 'Tamil Nadu local',
    Icon: MapPin,
    accent: '#14B8A6',
    examplesByLang: {
      en: ['Chennai weather alert', 'Tamil Nadu local infrastructure update', 'Tamil Nadu government scheme'],
      ta: ['சென்னை வானிலை எச்சரிக்கை', 'தமிழ்நாடு அரசு திட்டம்'],
      hi: ['चेन्नई मौसम अलर्ट', 'तमिलनाडु सरकार की योजना'],
    },
  },
  {
    category: 'Health',
    Icon: HeartPulse,
    accent: '#EF4444',
    examplesByLang: {
      en: ['New health study results', 'Disease outbreak update', 'Wellness research finding'],
      ta: ['புதிய சுகாதார ஆய்வு முடிவுகள்'],
      hi: ['नया स्वास्थ्य अध्ययन'],
    },
  },
  {
    category: 'Education',
    Icon: GraduationCap,
    accent: '#8B5CF6',
    examplesByLang: {
      en: ['NEET / JEE results update', 'Education policy change', 'Top university news'],
      ta: ['NEET / JEE முடிவுகள்', 'கல்விக் கொள்கை மாற்றம்'],
      hi: ['NEET / JEE रिज़ल्ट अपडेट'],
    },
  },
  {
    category: 'General news',
    Icon: Newspaper,
    accent: '#64748B',
    examplesByLang: {
      en: ['Random important story today', 'Trending news', 'Notable update worth covering'],
      ta: ['இன்றைய முக்கிய செய்தி', 'பிரபலமான செய்தி'],
      hi: ['आज की महत्वपूर्ण खबर', 'ट्रेंडिंग खबर'],
    },
  },
];

interface Props {
  language: ProjectLanguage;
  selected?: string;
  onPick: (topic: string) => void;
}

export function TopicSuggestions({ language, selected, onPick }: Props) {
  return (
    <View>
      <Text className="text-[12px] font-semibold text-ink-secondary mb-2 uppercase tracking-wide">
        Popular topics
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 8, gap: 8 }}
      >
        {SUGGESTIONS.map((s) => {
          const examples = s.examplesByLang[language] ?? s.examplesByLang.en;
          const isSelected = selected ? examples.includes(selected) : false;
          const Icon = s.Icon;
          return (
            <Pressable
              key={s.category}
              onPress={() => {
                // Rotate through examples on repeat clicks
                const idx = examples.indexOf(selected ?? '');
                const next = examples[(idx + 1) % examples.length] ?? examples[0]!;
                onPick(next);
              }}
              className="flex-row items-center gap-2 rounded-full px-3 py-2"
              style={{
                backgroundColor: isSelected ? `${s.accent}1A` : '#FFFFFF',
                borderWidth: 1,
                borderColor: isSelected ? s.accent : '#E4E4E7',
              }}
            >
              <Icon size={13} color={s.accent} />
              <Text
                className="text-[12px]"
                style={{ color: isSelected ? s.accent : '#334155', fontWeight: isSelected ? '600' : '500' }}
              >
                {s.category}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Text className="text-[10px] text-ink-subtle mt-1.5">
        Tap a chip to fill the topic — tap again to cycle through more examples.
      </Text>
    </View>
  );
}
