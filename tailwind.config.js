/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0D291C',
          primary: '#143D2B',
          light: '#1E563D',
          surface: '#296E50',
          accent: '#D4AF37',
          gold: '#D4AF37',
          goldLight: '#E5C158',
          goldDark: '#AA8822',
        },
        slate: {
          50: '#F8FAFC',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(20, 61, 43, 0.06)',
        'gold': '0 4px 20px -2px rgba(212, 175, 55, 0.25)',
      }
    },
  },
  plugins: [],
}
