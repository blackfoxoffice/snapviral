import type { ProjectLanguage } from '@newsflow/shared';

// =====================================================================
// Language catalog — aligned with the ElevenLabs multilingual v2 model
// (32 languages) plus the v3 South Asian additions we ship voices for.
//
// Single source of truth for every language picker in the app. Order is
// curated: Indic / South Asian first (primary audience), then English,
// then the rest grouped by region.
// =====================================================================

export type LanguageRegion =
  | 'south_asia'
  | 'global'
  | 'europe'
  | 'mena'
  | 'east_asia'
  | 'se_asia';

export interface LanguageOption {
  value: ProjectLanguage;
  label: string;       // English label
  native: string;      // Native script label
  region: LanguageRegion;
  rtl?: boolean;       // Right-to-left scripts
}

export const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  // ===== South Asian (primary audience) =====
  { value: 'ta',  label: 'Tamil',      native: 'தமிழ்',     region: 'south_asia' },
  { value: 'hi',  label: 'Hindi',      native: 'हिन्दी',     region: 'south_asia' },
  { value: 'kn',  label: 'Kannada',    native: 'ಕನ್ನಡ',     region: 'south_asia' },
  { value: 'te',  label: 'Telugu',     native: 'తెలుగు',    region: 'south_asia' },
  { value: 'ml',  label: 'Malayalam',  native: 'മലയാളം',   region: 'south_asia' },
  { value: 'bn',  label: 'Bengali',    native: 'বাংলা',     region: 'south_asia' },
  { value: 'mr',  label: 'Marathi',    native: 'मराठी',     region: 'south_asia' },
  { value: 'gu',  label: 'Gujarati',   native: 'ગુજરાતી',   region: 'south_asia' },
  { value: 'pa',  label: 'Punjabi',    native: 'ਪੰਜਾਬੀ',    region: 'south_asia' },
  { value: 'ur',  label: 'Urdu',       native: 'اردو',     region: 'south_asia', rtl: true },

  // ===== Global lingua franca =====
  { value: 'en',  label: 'English',    native: 'English',  region: 'global' },

  // ===== Western European =====
  { value: 'es',  label: 'Spanish',    native: 'Español',         region: 'europe' },
  { value: 'fr',  label: 'French',     native: 'Français',        region: 'europe' },
  { value: 'de',  label: 'German',     native: 'Deutsch',         region: 'europe' },
  { value: 'it',  label: 'Italian',    native: 'Italiano',        region: 'europe' },
  { value: 'pt',  label: 'Portuguese', native: 'Português',       region: 'europe' },
  { value: 'nl',  label: 'Dutch',      native: 'Nederlands',      region: 'europe' },

  // ===== Northern / Central / Eastern European =====
  { value: 'pl',  label: 'Polish',     native: 'Polski',          region: 'europe' },
  { value: 'sv',  label: 'Swedish',    native: 'Svenska',         region: 'europe' },
  { value: 'da',  label: 'Danish',     native: 'Dansk',           region: 'europe' },
  { value: 'fi',  label: 'Finnish',    native: 'Suomi',           region: 'europe' },
  { value: 'no',  label: 'Norwegian',  native: 'Norsk',           region: 'europe' },
  { value: 'ro',  label: 'Romanian',   native: 'Română',          region: 'europe' },
  { value: 'hu',  label: 'Hungarian',  native: 'Magyar',          region: 'europe' },
  { value: 'cs',  label: 'Czech',      native: 'Čeština',         region: 'europe' },
  { value: 'sk',  label: 'Slovak',     native: 'Slovenčina',      region: 'europe' },
  { value: 'hr',  label: 'Croatian',   native: 'Hrvatski',        region: 'europe' },
  { value: 'bg',  label: 'Bulgarian',  native: 'Български',       region: 'europe' },
  { value: 'el',  label: 'Greek',      native: 'Ελληνικά',        region: 'europe' },
  { value: 'tr',  label: 'Turkish',    native: 'Türkçe',          region: 'europe' },
  { value: 'ru',  label: 'Russian',    native: 'Русский',         region: 'europe' },
  { value: 'uk',  label: 'Ukrainian',  native: 'Українська',      region: 'europe' },

  // ===== MENA =====
  { value: 'ar',  label: 'Arabic',     native: 'العربية',         region: 'mena', rtl: true },

  // ===== East Asia =====
  { value: 'zh',  label: 'Chinese',    native: '中文',            region: 'east_asia' },
  { value: 'ja',  label: 'Japanese',   native: '日本語',           region: 'east_asia' },
  { value: 'ko',  label: 'Korean',     native: '한국어',           region: 'east_asia' },

  // ===== South-East Asia =====
  { value: 'vi',  label: 'Vietnamese', native: 'Tiếng Việt',      region: 'se_asia' },
  { value: 'id',  label: 'Indonesian', native: 'Bahasa Indonesia',region: 'se_asia' },
  { value: 'ms',  label: 'Malay',      native: 'Bahasa Melayu',   region: 'se_asia' },
  { value: 'fil', label: 'Filipino',   native: 'Filipino',        region: 'se_asia' },
] as const;

export const REGION_LABEL: Record<LanguageRegion, string> = {
  south_asia: 'South Asian',
  global: 'Global',
  europe: 'European',
  mena: 'Middle East & North Africa',
  east_asia: 'East Asian',
  se_asia: 'South-East Asian',
};

export const LANGUAGE_LABEL: Record<ProjectLanguage, string> = LANGUAGE_OPTIONS.reduce(
  (acc, o) => {
    acc[o.value] = o.label;
    return acc;
  },
  {} as Record<ProjectLanguage, string>,
);

export const LANGUAGE_NATIVE: Record<ProjectLanguage, string> = LANGUAGE_OPTIONS.reduce(
  (acc, o) => {
    acc[o.value] = o.native;
    return acc;
  },
  {} as Record<ProjectLanguage, string>,
);

// Plain Select-shaped options for the existing <Select> component.
// "Tamil · தமிழ்" — English label first so it's findable by a creator
// who types "ta", with native script alongside for self-recognition.
export const LANG_SELECT_OPTIONS: { value: ProjectLanguage; label: string }[] = LANGUAGE_OPTIONS.map(
  (o) => ({
    value: o.value,
    label: `${o.label} · ${o.native}`,
  }),
);

// Grouped options when the picker wants to show a region heading.
export const LANG_OPTIONS_BY_REGION: Record<LanguageRegion, LanguageOption[]> = LANGUAGE_OPTIONS.reduce(
  (acc, o) => {
    (acc[o.region] ||= []).push(o);
    return acc;
  },
  {} as Record<LanguageRegion, LanguageOption[]>,
);
