/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#172035',
        brand: { 50: '#eef2ff', 100: '#e0e7ff', 500: '#635bff', 600: '#5046e5', 700: '#4338ca' },
        mint: { 400: '#2dd4bf', 500: '#14b8a6' },
      },
      boxShadow: { soft: '0 16px 40px -20px rgba(24, 32, 53, .28)' },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
