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
        gold: {
          DEFAULT: '#D4AF37',
          light: '#E8C878',
          dark: '#B8941F',
        },
        sage: {
          DEFAULT: '#5B7D70',
          dark: '#3D5A52',
          light: '#7A9B8C',
        },
        charcoal: {
          DEFAULT: '#1A1D1F',
          light: '#2A2F33',
        },
        cream: '#F5F1E8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Montserrat', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
