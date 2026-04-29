/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#E53935',
          hover: '#C62828',
          dark: '#B71C1C',
          soft: 'rgba(229,57,53,0.12)',
        },
        accent: {
          DEFAULT: '#00E676',
          soft: 'rgba(0,230,118,0.10)',
          border: 'rgba(0,230,118,0.25)',
          muted: '#69F0AE',
        },
        ink: {
          DEFAULT: '#F5F5F5',
          secondary: '#B0BEC5',
          muted: '#78909C',
          subtle: '#546E7A',
          faint: '#37474F',
        },
        surface: {
          DEFAULT: '#121212',
          raised: '#1E1E1E',
          sunken: '#0A0A0A',
          border: '#2A2A2A',
          card: '#181818',
        },
        nav: {
          DEFAULT: '#0A0A0A',
          surface: '#1A1A1A',
          border: '#2A2A2A',
          muted: '#78909C',
          active: '#FFFFFF',
        },
        state: {
          success: { DEFAULT: '#00E676', soft: 'rgba(0,230,118,0.10)' },
          warning: { DEFAULT: '#FFB300', soft: 'rgba(255,179,0,0.10)' },
          error: { DEFAULT: '#EF4444', soft: 'rgba(239,68,68,0.10)' },
          info: { DEFAULT: '#42A5F5', soft: 'rgba(66,165,245,0.10)' },
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
        sm: '0 1px 2px 0 rgba(0,0,0,0.3)',
        DEFAULT: '0 1px 3px 0 rgba(0,0,0,0.4), 0 1px 2px -1px rgba(0,0,0,0.3)',
        md: '0 4px 6px -1px rgba(0,0,0,0.4), 0 2px 4px -2px rgba(0,0,0,0.3)',
        lg: '0 10px 15px -3px rgba(0,0,0,0.4), 0 4px 6px -4px rgba(0,0,0,0.3)',
        overlay: '0 20px 25px -5px rgba(0,0,0,0.5), 0 8px 10px -6px rgba(0,0,0,0.4)',
        glow: '0 0 20px rgba(229,57,53,0.15)',
      },
    },
  },
  plugins: [],
};
