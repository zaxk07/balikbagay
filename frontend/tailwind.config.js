/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"Instrument Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        paper: '#f7f3ec',
        card: '#fffdf8',
        ink: '#1d1a17',
        muted: '#6b645b',
        line: '#e3dccf',
        brand: { DEFAULT: '#b3261e', dark: '#8f1d17', soft: '#f6e1de' },
        ok: '#2f6b4f',
      },
    },
  },
  plugins: [],
}
