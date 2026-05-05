/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './screens/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './navigation/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2DD4BF',
        'primary-dark': '#0D9488',
        background: '#111418',
        surface: '#1C1F2A',
        'surface-light': '#252836',
      },
    },
  },
  plugins: [],
};
