/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#E53935',
          hover: '#D32F2F',
          dark: '#B71C1C',
          soft: 'rgba(229,57,53,0.10)',
        },
        accent: {
          DEFAULT: '#00C853',
          soft: 'rgba(0,200,83,0.10)',
          border: 'rgba(0,200,83,0.25)',
          muted: '#43A047',
        },
        // Ink (foreground / text) — slate scale on light bg
        ink: {
          DEFAULT: '#0F172A',     // primary text
          secondary: '#334155',   // body / labels
          muted: '#64748B',       // captions
          subtle: '#94A3B8',      // metadata
          faint: '#CBD5E1',       // dividers / borders inline
        },
        // Surface (background) — neutral light scale
        surface: {
          DEFAULT: '#FAFAFA',     // app background
          raised: '#F4F4F5',      // hovered rows / inputs
          sunken: '#FFFFFF',      // very subtle highlight (cards on grey)
          border: '#E4E4E7',      // dividers / card borders
          card: '#FFFFFF',        // card surfaces
        },
        // Top nav / sidebar
        nav: {
          DEFAULT: '#FFFFFF',
          surface: '#F4F4F5',
          border: '#E4E4E7',
          muted: '#64748B',
          active: '#0F172A',
        },
        state: {
          success: { DEFAULT: '#00C853', soft: 'rgba(0,200,83,0.10)' },
          warning: { DEFAULT: '#F59E0B', soft: 'rgba(245,158,11,0.10)' },
          error: { DEFAULT: '#EF4444', soft: 'rgba(239,68,68,0.10)' },
          info: { DEFAULT: '#2563EB', soft: 'rgba(37,99,235,0.10)' },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '10px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
        '3xl': '28px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(15,23,42,0.04)',
        DEFAULT: '0 2px 8px -2px rgba(15,23,42,0.05), 0 1px 3px -1px rgba(15,23,42,0.03)',
        md: '0 6px 16px -4px rgba(15,23,42,0.08), 0 2px 6px -2px rgba(15,23,42,0.04)',
        lg: '0 14px 28px -6px rgba(15,23,42,0.10), 0 4px 12px -3px rgba(15,23,42,0.05)',
        xl: '0 24px 48px -12px rgba(15,23,42,0.18)',
        overlay: '0 32px 64px -12px rgba(15,23,42,0.20)',
        glow: '0 0 40px rgba(229,57,53,0.25)',
        'brand-soft': '0 8px 24px -8px rgba(229,57,53,0.30)',
      },
    },
  },
  plugins: [],
};
