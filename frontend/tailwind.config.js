/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Sora', 'Inter', 'ui-sans-serif', 'system-ui']
      },
      colors: {
        ember: {
          50: '#fff7ed',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c'
        }
      },
      boxShadow: {
        glow: '0 24px 90px rgba(249, 115, 22, 0.22)'
      }
    },
  },
  plugins: [],
}
