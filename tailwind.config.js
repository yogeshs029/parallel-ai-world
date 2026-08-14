/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#0b0f19',
          deep: '#070a12',
          surface: '#111827',
          card: '#161f33',
          elevated: '#1e2942',
          hover: '#263454',
        },
        border: {
          subtle: 'rgba(255, 255, 255, 0.06)',
          DEFAULT: '#1f293d',
          bright: '#334155',
          accent: 'rgba(139, 92, 246, 0.3)',
        },
        text: {
          primary: '#f8fafc',
          secondary: '#94a3b8',
          muted: '#64748b',
          dim: '#475569',
        },
        brand: {
          purple: {
            DEFAULT: '#8b5cf6',
            light: '#a78bfa',
            dark: '#7c3aed',
            subtle: 'rgba(139, 92, 246, 0.12)',
          },
          cyan: {
            DEFAULT: '#06b6d4',
            light: '#38bdf8',
            subtle: 'rgba(6, 182, 212, 0.12)',
          },
          emerald: {
            DEFAULT: '#10b981',
            light: '#34d399',
            subtle: 'rgba(16, 185, 129, 0.12)',
          },
          amber: {
            DEFAULT: '#f59e0b',
            light: '#fbbf24',
            subtle: 'rgba(245, 158, 11, 0.12)',
          },
          rose: {
            DEFAULT: '#f43f5e',
            light: '#fb7185',
            subtle: 'rgba(244, 63, 94, 0.12)',
          },
        },
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'brand-glow': '0 0 24px -4px rgba(139, 92, 246, 0.25)',
        'emerald-glow': '0 0 20px -4px rgba(16, 185, 129, 0.25)',
        'card-subtle': '0 4px 20px -2px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 12px 30px -4px rgba(0, 0, 0, 0.5), 0 0 20px -4px rgba(139, 92, 246, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
