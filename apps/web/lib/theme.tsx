import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

// =====================================================================
// User-customisable theme. The sidebar / bottom-tabs / app shell read
// from `useTheme()` to recolor themselves at runtime.
//
// Persistence: localStorage on web, in-memory on native (good enough until
// we wire AsyncStorage). Theme survives reloads, syncs across tabs.
// =====================================================================

export type ThemeMode = 'light' | 'dark' | 'system';

export type SidebarPreset =
  | 'midnight'   // current default — dark navy
  | 'graphite'   // near-black
  | 'paper'      // off-white, like the admin shell
  | 'snow'       // pure white
  | 'ink'        // true black
  | 'brand'      // brand red
  | 'forest'     // deep green
  | 'ocean'      // deep blue
  | 'plum'       // deep purple
  | 'sand'       // warm beige
  | 'custom';    // user picks any hex

// Computed token bundle every consumer reads. Each preset emits its own
// bundle so we don't recompute contrast per render.
export interface SidebarTokens {
  bg: string;
  border: string;
  textActive: string;
  textInactive: string;
  textMuted: string;
  hoverBg: string;
  activeBg: string;
  activeBar: string;     // brand-red strip on the active row
  brand: string;
  isDark: boolean;
}

const PRESET_TOKENS: Record<Exclude<SidebarPreset, 'custom'>, SidebarTokens> = {
  midnight: {
    bg: '#0F1B2D',
    border: 'rgba(255,255,255,0.06)',
    textActive: '#FFFFFF',
    textInactive: 'rgba(255,255,255,0.65)',
    textMuted: 'rgba(255,255,255,0.40)',
    hoverBg: 'rgba(255,255,255,0.06)',
    activeBg: 'rgba(225,29,44,0.18)',
    activeBar: '#FF2D40',
    brand: '#E11D2C',
    isDark: true,
  },
  graphite: {
    bg: '#1A1A1C',
    border: 'rgba(255,255,255,0.06)',
    textActive: '#FFFFFF',
    textInactive: 'rgba(255,255,255,0.65)',
    textMuted: 'rgba(255,255,255,0.40)',
    hoverBg: 'rgba(255,255,255,0.06)',
    activeBg: 'rgba(225,29,44,0.18)',
    activeBar: '#FF2D40',
    brand: '#E11D2C',
    isDark: true,
  },
  ink: {
    bg: '#000000',
    border: 'rgba(255,255,255,0.08)',
    textActive: '#FFFFFF',
    textInactive: 'rgba(255,255,255,0.70)',
    textMuted: 'rgba(255,255,255,0.45)',
    hoverBg: 'rgba(255,255,255,0.08)',
    activeBg: 'rgba(225,29,44,0.20)',
    activeBar: '#FF2D40',
    brand: '#E11D2C',
    isDark: true,
  },
  paper: {
    bg: '#FAFAF7',
    border: 'rgba(15,23,42,0.08)',
    textActive: '#0A0A0B',
    textInactive: '#475569',
    textMuted: '#94A3B8',
    hoverBg: 'rgba(15,23,42,0.04)',
    activeBg: 'rgba(225,29,44,0.08)',
    activeBar: '#E11D2C',
    brand: '#E11D2C',
    isDark: false,
  },
  snow: {
    bg: '#FFFFFF',
    border: 'rgba(15,23,42,0.08)',
    textActive: '#0A0A0B',
    textInactive: '#475569',
    textMuted: '#94A3B8',
    hoverBg: 'rgba(15,23,42,0.04)',
    activeBg: 'rgba(225,29,44,0.08)',
    activeBar: '#E11D2C',
    brand: '#E11D2C',
    isDark: false,
  },
  brand: {
    bg: '#9F0617',
    border: 'rgba(255,255,255,0.10)',
    textActive: '#FFFFFF',
    textInactive: 'rgba(255,255,255,0.70)',
    textMuted: 'rgba(255,255,255,0.45)',
    hoverBg: 'rgba(255,255,255,0.10)',
    activeBg: 'rgba(255,255,255,0.16)',
    activeBar: '#FFE0E2',
    brand: '#FFE0E2',
    isDark: true,
  },
  forest: {
    bg: '#0E2A21',
    border: 'rgba(255,255,255,0.06)',
    textActive: '#FFFFFF',
    textInactive: 'rgba(255,255,255,0.65)',
    textMuted: 'rgba(255,255,255,0.40)',
    hoverBg: 'rgba(255,255,255,0.06)',
    activeBg: 'rgba(225,29,44,0.18)',
    activeBar: '#FF2D40',
    brand: '#E11D2C',
    isDark: true,
  },
  ocean: {
    bg: '#0B1F3A',
    border: 'rgba(255,255,255,0.06)',
    textActive: '#FFFFFF',
    textInactive: 'rgba(255,255,255,0.65)',
    textMuted: 'rgba(255,255,255,0.40)',
    hoverBg: 'rgba(255,255,255,0.06)',
    activeBg: 'rgba(225,29,44,0.18)',
    activeBar: '#FF2D40',
    brand: '#E11D2C',
    isDark: true,
  },
  plum: {
    bg: '#1F0F2E',
    border: 'rgba(255,255,255,0.06)',
    textActive: '#FFFFFF',
    textInactive: 'rgba(255,255,255,0.65)',
    textMuted: 'rgba(255,255,255,0.40)',
    hoverBg: 'rgba(255,255,255,0.06)',
    activeBg: 'rgba(225,29,44,0.18)',
    activeBar: '#FF2D40',
    brand: '#E11D2C',
    isDark: true,
  },
  sand: {
    bg: '#F4EFE6',
    border: 'rgba(15,23,42,0.08)',
    textActive: '#0A0A0B',
    textInactive: '#52525B',
    textMuted: '#A1A1AA',
    hoverBg: 'rgba(15,23,42,0.04)',
    activeBg: 'rgba(225,29,44,0.10)',
    activeBar: '#E11D2C',
    brand: '#E11D2C',
    isDark: false,
  },
};

export const SIDEBAR_PRESETS: Array<{ key: SidebarPreset; label: string; swatch: string; isDark: boolean }> = [
  { key: 'midnight', label: 'Midnight', swatch: '#0F1B2D', isDark: true },
  { key: 'graphite', label: 'Graphite', swatch: '#1A1A1C', isDark: true },
  { key: 'ink',      label: 'Ink',      swatch: '#000000', isDark: true },
  { key: 'ocean',    label: 'Ocean',    swatch: '#0B1F3A', isDark: true },
  { key: 'forest',   label: 'Forest',   swatch: '#0E2A21', isDark: true },
  { key: 'plum',     label: 'Plum',     swatch: '#1F0F2E', isDark: true },
  { key: 'brand',    label: 'Brand',    swatch: '#9F0617', isDark: true },
  { key: 'sand',     label: 'Sand',     swatch: '#F4EFE6', isDark: false },
  { key: 'paper',    label: 'Paper',    swatch: '#FAFAF7', isDark: false },
  { key: 'snow',     label: 'Snow',     swatch: '#FFFFFF', isDark: false },
];

export interface ThemeState {
  mode: ThemeMode;
  sidebarPreset: SidebarPreset;
  sidebarCustomColor: string;     // used only when sidebarPreset === 'custom'
  accent: string;                  // brand accent override (hex)
}

const DEFAULT_THEME: ThemeState = {
  mode: 'light',
  sidebarPreset: 'midnight',
  sidebarCustomColor: '#0F1B2D',
  accent: '#E11D2C',
};

const STORAGE_KEY = 'snapviral.theme.v1';

function safeRead(): Partial<ThemeState> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<ThemeState>;
  } catch {
    return {};
  }
}

function safeWrite(state: ThemeState) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // private browsing / quota — silent
  }
}

// Compute a contrast colour for arbitrary user-picked hex.
function isHexDark(hex: string): boolean {
  const h = hex.replace(/^#/, '');
  if (h.length !== 6) return true;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luma < 0.55;
}

function customTokens(hex: string, accent: string): SidebarTokens {
  const dark = isHexDark(hex);
  return {
    bg: hex,
    border: dark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
    textActive: dark ? '#FFFFFF' : '#0A0A0B',
    textInactive: dark ? 'rgba(255,255,255,0.65)' : '#475569',
    textMuted: dark ? 'rgba(255,255,255,0.40)' : '#94A3B8',
    hoverBg: dark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)',
    activeBg: dark ? `${accent}33` : `${accent}1A`,
    activeBar: dark ? '#FF2D40' : accent,
    brand: accent,
    isDark: dark,
  };
}

interface ThemeContextValue {
  theme: ThemeState;
  sidebar: SidebarTokens;
  setMode: (mode: ThemeMode) => void;
  setSidebarPreset: (preset: SidebarPreset) => void;
  setSidebarCustomColor: (hex: string) => void;
  setAccent: (hex: string) => void;
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeState>(() => ({
    ...DEFAULT_THEME,
    ...safeRead(),
  }));

  // Persist + cross-tab sync
  useEffect(() => {
    safeWrite(theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        setTheme((prev) => ({ ...prev, ...(JSON.parse(e.newValue!) as Partial<ThemeState>) }));
      } catch {
        /* ignore */
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const sidebar = useMemo<SidebarTokens>(() => {
    if (theme.sidebarPreset === 'custom') {
      return customTokens(theme.sidebarCustomColor, theme.accent);
    }
    return PRESET_TOKENS[theme.sidebarPreset];
  }, [theme.sidebarPreset, theme.sidebarCustomColor, theme.accent]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      sidebar,
      setMode: (mode) => setTheme((t) => ({ ...t, mode })),
      setSidebarPreset: (preset) => setTheme((t) => ({ ...t, sidebarPreset: preset })),
      setSidebarCustomColor: (hex) =>
        setTheme((t) => ({ ...t, sidebarCustomColor: hex, sidebarPreset: 'custom' })),
      setAccent: (hex) => setTheme((t) => ({ ...t, accent: hex })),
      resetTheme: () => setTheme(DEFAULT_THEME),
    }),
    [theme, sidebar],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
