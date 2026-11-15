/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#18181b',
          700: '#09090b',
          800: '#040405',
          900: '#000000',
          950: '#000000',
        },
        sapphire: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        surface: {
          DEFAULT: '#ffffff',
          ground: '#f8fafc',
          subtle: '#f1f5f9',
          card: '#ffffff',
          glass: 'rgba(255, 255, 255, 0.82)',
        },
        retail: {
          brand: '#18181B',
          brandDark: '#09090B',
          price: '#D70018',
          neutralBg: '#FAFAFA',
          cardBorder: '#E4E4E7',
          textMain: '#18181B',
          textMuted: '#71717A',
          success: '#15803D',
        },
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        card: '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        'card-hover': '0 16px 32px -8px rgba(15, 23, 42, 0.1), 0 4px 8px -2px rgba(15, 23, 42, 0.04)',
        'glow-sm': '0 0 20px -5px rgba(37, 99, 235, 0.25)',
        glow: '0 0 35px -5px rgba(37, 99, 235, 0.35)',
      },
      borderRadius: {
        '2.5xl': '1.25rem',
        '3.5xl': '1.75rem',
      },
    },
  },
  plugins: [],
};
