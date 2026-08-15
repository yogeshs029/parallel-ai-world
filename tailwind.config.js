/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /* Cosmic Deep Space Dark Theme (matching target design) */
        background: {
          DEFAULT: '#0B0C14',
          deep: '#07080E',
          surface: '#0F101D',
          card: '#131525',
          elevated: '#17192C',
          hover: '#1B1E36',
          glass: 'rgba(19, 21, 37, 0.75)',
          input: '#15172A',
        },
        border: {
          subtle: 'rgba(255, 255, 255, 0.05)',
          DEFAULT: 'rgba(255, 255, 255, 0.09)',
          bright: 'rgba(255, 255, 255, 0.18)',
          accent: 'rgba(124, 58, 237, 0.4)',
          focus: '#8B5CF6',
        },
        text: {
          primary: '#F8FAFC',
          secondary: '#94A3B8',
          muted: '#64748B',
          dim: '#475569',
        },
        brand: {
          purple: {
            DEFAULT: '#7C3AED',
            light: '#A855F7',
            dark: '#6D28D9',
            subtle: 'rgba(124, 58, 237, 0.15)',
          },
          indigo: {
            DEFAULT: '#6366F1',
            light: '#818CF8',
            subtle: 'rgba(99, 102, 241, 0.15)',
          },
          cyan: {
            DEFAULT: '#0284C7',
            light: '#38BDF8',
            subtle: 'rgba(2, 132, 199, 0.15)',
          },
          emerald: {
            DEFAULT: '#10B981',
            light: '#34D399',
            subtle: 'rgba(16, 185, 129, 0.15)',
          },
          amber: {
            DEFAULT: '#F59E0B',
            light: '#FBBF24',
            subtle: 'rgba(245, 158, 11, 0.15)',
          },
          rose: {
            DEFAULT: '#F43F5E',
            light: '#FB7185',
            subtle: 'rgba(244, 63, 94, 0.15)',
          },
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'SF Pro Display', 'Inter', 'Roboto', 'sans-serif'],
        mono: ['SF Mono', 'JetBrains Mono', 'ui-monospace', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'cosmos-sm': '0 2px 8px rgba(0, 0, 0, 0.3)',
        'cosmos-md': '0 4px 20px rgba(0, 0, 0, 0.45)',
        'cosmos-lg': '0 12px 40px rgba(0, 0, 0, 0.6)',
        'cosmos-glow': '0 0 25px rgba(124, 58, 237, 0.35)',
        'cosmos-glow-sm': '0 0 14px rgba(124, 58, 237, 0.2)',
        'emerald-glow': '0 0 20px rgba(16, 185, 129, 0.25)',
        'purple-glow': '0 0 30px rgba(168, 85, 247, 0.3)',
        'card-subtle': '0 2px 10px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'card-hover': '0 12px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(124, 58, 237, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease both',
        'fade-up': 'fadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
        'orbit-float': 'orbitFloat 6s ease-in-out infinite',
        'glow-pulse': 'glowPulse 4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(0.98)' },
        },
        orbitFloat: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-8px) rotate(3deg)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.4', filter: 'blur(30px)' },
          '50%': { opacity: '0.8', filter: 'blur(45px)' },
        },
      },
    },
  },
  plugins: [],
};
