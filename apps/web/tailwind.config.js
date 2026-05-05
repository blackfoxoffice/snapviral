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
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '10px',
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(15,23,42,0.04)',
        DEFAULT: '0 1px 3px 0 rgba(15,23,42,0.06), 0 1px 2px -1px rgba(15,23,42,0.04)',
        md: '0 4px 6px -1px rgba(15,23,42,0.08), 0 2px 4px -2px rgba(15,23,42,0.04)',
        lg: '0 10px 15px -3px rgba(15,23,42,0.08), 0 4px 6px -4px rgba(15,23,42,0.04)',
        overlay: '0 20px 25px -5px rgba(15,23,42,0.10), 0 8px 10px -6px rgba(15,23,42,0.06)',
        glow: '0 0 20px rgba(229,57,53,0.20)',
      },
    },
  },
  plugins: [],
};
