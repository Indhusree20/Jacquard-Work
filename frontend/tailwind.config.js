/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        indigo: {
          950: '#0f172a',
          900: '#1e1b4b',
          850: '#282467',
          800: '#312e81',
          700: '#4338ca',
          600: '#4f46e5',
          500: '#6366f1',
          100: '#e0e7ff',
          50: '#eef2ff',
        },
        madder: {
          50: '#fdf2f2',
          100: '#fde8e8',
          200: '#fbd5d5',
          300: '#f8b4b4',
          400: '#f98080',
          500: '#e02424',
          600: '#c81e1e',
          700: '#9b1c1c',
          800: '#771d1d',
          900: '#5c1616',
        },
        ochre: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        loom: {
          50: '#faf9f6',
          100: '#f5f3ee',
          200: '#ebe6dc',
          300: '#ded5c5',
          400: '#c7b9a2',
          500: '#aa977d',
          600: '#8c775d',
          700: '#6f5d47',
          800: '#564736',
          900: '#3c3125',
        },
        thari: {
          warm: '#faf8f5',
          border: '#e7e2d9',
          subtle: '#f2eee6',
          thread: '#d1c7b7',
          silk: '#fcfbf8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Tamil', 'system-ui', '-apple-system', 'sans-serif'],
        tamil: ['Noto Sans Tamil', 'Inter', 'sans-serif'],
        serif: ['Cinzel', 'Georgia', 'serif'],
      },
      boxShadow: {
        'craft-xs': '0 1px 2px 0 rgba(30, 27, 75, 0.04)',
        'craft-sm': '0 2px 4px 0 rgba(30, 27, 75, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'craft': '0 4px 16px -2px rgba(30, 27, 75, 0.06), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'craft-hover': '0 10px 24px -3px rgba(30, 27, 75, 0.09), 0 4px 8px -2px rgba(0, 0, 0, 0.04)',
        'craft-lg': '0 16px 32px -4px rgba(30, 27, 75, 0.1), 0 6px 12px -2px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
