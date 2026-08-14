/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /* Cosmos Material background layers */
        background: {
          DEFAULT: '#0d1117',
          deep: '#080c14',
          surface: 'rgba(22, 30, 48, 0.85)',
          card: 'rgba(28, 38, 60, 0.80)',
          elevated: 'rgba(38, 52, 82, 0.90)',
          hover: 'rgba(48, 64, 98, 0.92)',
          glass: 'rgba(255, 255, 255, 0.04)',
          input: 'rgba(15, 22, 38, 0.7)',
        },
        border: {
          subtle: 'rgba(148, 163, 184, 0.08)',
          DEFAULT: 'rgba(148, 163, 184, 0.14)',
          bright: 'rgba(148, 163, 184, 0.28)',
          accent: 'rgba(124, 155, 247, 0.28)',
          focus: 'rgba(124, 155, 247, 0.55)',
        },
        text: {
          primary: '#e8edf8',
          secondary: '#a0aec0',
          muted: '#6b7fa0',
          dim: '#4a5e80',
        },
        brand: {
          purple: {
            DEFAULT: '#7c9bf7',
            light: '#a5bef9',
            dark: '#4a6cf7',
            subtle: 'rgba(124, 155, 247, 0.14)',
          },
          indigo: {
            DEFAULT: '#7c4af7',
            light: '#a78bfa',
            subtle: 'rgba(124, 74, 247, 0.14)',
          },
          cyan: {
            DEFAULT: '#06b6d4',
            light: '#38bdf8',
            subtle: 'rgba(6, 182, 212, 0.14)',
          },
          emerald: {
            DEFAULT: '#10b981',
            light: '#34d399',
            subtle: 'rgba(16, 185, 129, 0.14)',
          },
          amber: {
            DEFAULT: '#f59e0b',
            light: '#fbbf24',
            subtle: 'rgba(245, 158, 11, 0.14)',
          },
          rose: {
            DEFAULT: '#f43f5e',
            light: '#fb7185',
            subtle: 'rgba(244, 63, 94, 0.14)',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'cosmos-sm': '0 2px 12px 0 rgba(0,0,0,0.24)',
        'cosmos-md': '0 4px 24px 0 rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.05)',
        'cosmos-lg': '0 8px 40px 0 rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.06)',
        'cosmos-glow': '0 0 24px -4px rgba(124, 155, 247, 0.3)',
        'cosmos-glow-sm': '0 0 16px -4px rgba(124, 155, 247, 0.22)',
        'emerald-glow': '0 0 20px -4px rgba(16, 185, 129, 0.3)',
        'card-subtle': '0 4px 20px -2px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 12px 30px -4px rgba(0, 0, 0, 0.5), 0 0 20px -4px rgba(124, 155, 247, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.22s ease both',
        'fade-up': 'fadeUp 0.28s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-soft': 'pulseSoft 2.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
    },
  },
  plugins: [],
};
