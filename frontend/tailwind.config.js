/** @type {import('tailwindcss').Config} */
export default {
  important: '#root',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Outfit"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
