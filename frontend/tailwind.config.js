/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
       fontFamily: {
        display: ['"Instrument Sans"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        paper: '#F8FAFC',
        card: '#FFFFFF',
        ink: '#0F2922',
        muted: '#5B6F69',
        line: '#E2E8E6',
        brand: { DEFAULT: '#0F2922', dark: '#081A15', soft: '#E6F1EE' },
        cv: { DEFAULT: '#D97706', ink: '#A85A05', soft: '#FEF3E2' },
        ok: { DEFAULT: '#10B981', ink: '#047857', soft: '#E3F8F0' },
      },
      boxShadow: { soft: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.12)' },
    },
  },
  plugins: [],
}
