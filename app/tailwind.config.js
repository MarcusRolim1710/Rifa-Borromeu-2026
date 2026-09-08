/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        borromeu: {
          900: '#2a0f14',
          800: '#5c1a24',
          700: '#7a2330',
          600: '#9e2d3d',
          500: '#c73a4e',
          100: '#fdf0f1',
          50: '#fef7f7',
        },
        sand: '#f4f1ea',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

