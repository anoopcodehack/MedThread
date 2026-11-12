/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: "#16472E",
        "forest-dark": "#103923",
        sage: "#DCE9D9",
        cream: "#F5F7F2",
        muted: "#78877C",
      },
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        heading: ["Manrope", "sans-serif"],
      },
    },
  },
  plugins: [],
};