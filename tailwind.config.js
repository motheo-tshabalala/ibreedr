/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-green': {
          DEFAULT: '#1F4D3A',
          light: '#2D6B4F',
          dark: '#153528',
        },
        'gold-accent': {
          DEFAULT: '#D4A017',
          light: '#E8B83A',
        },
        'warm-white': {
          DEFAULT: '#F8F7F4',
          dark: '#EDECE7',
        },
        'earth-brown': {
          DEFAULT: '#8B6B43',
          light: '#A8855A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '20px',
      },
    },
  },
  plugins: [],
}