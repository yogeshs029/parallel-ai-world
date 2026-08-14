/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /* Apple iOS Light & Material Minimalist color system */
        background: {
          DEFAULT: '#f5f5f7',
          deep: '#eef0f4',
          surface: '#ffffff',
          card: '#ffffff',
          elevated: '#ffffff',
          hover: '#f1f5f9',
          glass: 'rgba(255, 255, 255, 0.85)',
          input: '#f1f5f9',
        },
        border: {
          subtle: 'rgba(0, 0, 0, 0.04)',
          DEFAULT: 'rgba(0, 0, 0, 0.08)',
          bright: 'rgba(0, 0, 0, 0.15)',
          accent: 'rgba(0, 122, 255, 0.3)',
          focus: '#007aff',
        },
        text: {
          primary: '#0f172a',
          secondary: '#475569',
          muted: '#64748b',
          dim: '#94a3b8',
        },
        brand: {
          purple: {
            DEFAULT: '#007aff',
            light: '#3b82f6',
            dark: '#1d4ed8',
            subtle: 'rgba(0, 122, 255, 0.1)',
          },
          indigo: {
            DEFAULT: '#6366f1',
            light: '#818cf8',
            subtle: 'rgba(99, 102, 241, 0.1)',
          },
          cyan: {
            DEFAULT: '#0284c7',
            light: '#38bdf8',
            subtle: 'rgba(2, 132, 199, 0.1)',
          },
          emerald: {
            DEFAULT: '#10b981',
            light: '#34d399',
            subtle: 'rgba(16, 185, 129, 0.1)',
          },
          amber: {
            DEFAULT: '#f59e0b',
            light: '#fbbf24',
            subtle: 'rgba(245, 158, 11, 0.1)',
          },
          rose: {
            DEFAULT: '#f43f5e',
            light: '#fb7185',
            subtle: 'rgba(244, 63, 94, 0.1)',
          },
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'SF Pro Display', 'Inter', 'Roboto', 'sans-serif'],
        mono: ['SF Mono', 'JetBrains Mono', 'ui-monospace', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'cosmos-sm': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'cosmos-md': '0 4px 16px rgba(0, 0, 0, 0.06)',
        'cosmos-lg': '0 10px 30px rgba(0, 0, 0, 0.08)',
        'cosmos-glow': '0 0 20px rgba(0, 122, 255, 0.15)',
        'cosmos-glow-sm': '0 0 12px rgba(0, 122, 255, 0.1)',
        'emerald-glow': '0 0 16px rgba(16, 185, 129, 0.15)',
        'card-subtle': '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.07)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease both',
        'fade-up': 'fadeUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-up': 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-soft': 'pulseSoft 2.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
};
