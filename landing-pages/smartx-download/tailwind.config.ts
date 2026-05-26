import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#F8FAFC',
          muted: '#F1F5F9',
          card: '#FFFFFF',
        },
        ink: {
          DEFAULT: '#0F172A',
          muted: '#475569',
          faint: '#94A3B8',
        },
        brand: {
          blue: '#3B82F6',
          sky: '#38BDF8',
          violet: '#A78BFA',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          'sans-serif',
        ],
        display: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          'sans-serif',
        ],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        soft: '0 4px 24px -4px rgba(59, 130, 246, 0.12), 0 8px 32px -8px rgba(15, 23, 42, 0.08)',
        glow: '0 0 60px -12px rgba(56, 189, 248, 0.35)',
      },
      backgroundImage: {
        'hero-gradient':
          'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(56, 189, 248, 0.18), transparent), linear-gradient(180deg, #E8F4FC 0%, #F5F7FA 45%, #F8FAFC 100%)',
        'card-shine':
          'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.6) 100%)',
      },
    },
  },
  plugins: [],
} satisfies Config;
