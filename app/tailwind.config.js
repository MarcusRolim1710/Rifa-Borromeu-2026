/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        borromeu: {
          900: '#0E1E3A',
          800: '#14295A',
          700: '#D98E2E',
          600: '#B86F1B',
          500: '#F0C27A',
          100: '#EAE0CC',
          50: '#F7F2E6',
        },
        night: '#14295A',
        accent: '#D98E2E',
        stoneCapela: '#F7F2E6',
      },
      fontFamily: {
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        capela: '18px',
        'capela-sm': '12px',
      },
    },
  },
  plugins: [],
}
