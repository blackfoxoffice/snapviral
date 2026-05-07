import type { ProjectLanguage } from '@newsflow/shared';

// Single source of truth for all language pickers in the app.
// `native` is shown alongside the English label so users can identify their
// own language at a glance. `regions` is a hint for grouping in pickers.
export interface LanguageOption {
  value: ProjectLanguage;
  label: string;       // English label
  native: string;      // Native script label
  region: 'south' | 'north' | 'east' | 'west' | 'global';
}

export const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  { value: 'ta', label: 'Tamil',     native: 'தமிழ்',   region: 'south' },
  { value: 'kn', label: 'Kannada',   native: 'ಕನ್ನಡ',    region: 'south' },
  { value: 'te', label: 'Telugu',    native: 'తెలుగు',   region: 'south' },
  { value: 'ml', label: 'Malayalam', native: 'മലയാളം',  region: 'south' },
  { value: 'hi', label: 'Hindi',     native: 'हिन्दी',     region: 'north' },
  { value: 'mr', label: 'Marathi',   native: 'मराठी',     region: 'west'  },
  { value: 'gu', label: 'Gujarati',  native: 'ગુજરાતી',   region: 'west'  },
  { value: 'bn', label: 'Bengali',   native: 'বাংলা',     region: 'east'  },
  { value: 'pa', label: 'Punjabi',   native: 'ਪੰਜਾਬੀ',    region: 'north' },
  { value: 'en', label: 'English',   native: 'English',  region: 'global' },
] as const;

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
export const LANG_SELECT_OPTIONS: { value: ProjectLanguage; label: string }[] = LANGUAGE_OPTIONS.map(
  (o) => ({
    value: o.value,
    label: `${o.label} · ${o.native}`,
  }),
);
