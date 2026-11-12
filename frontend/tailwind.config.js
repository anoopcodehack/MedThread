/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(214.3 31.8% 91.4%)",
        background: "hsl(0 0% 100%)",
        foreground: "hsl(222.2 84% 4.9%)",
        primary: {
          DEFAULT: "#0284c7",
          foreground: "#ffffff",
        },
        clinical: {
          blue: "#0284c7",
          green: "#059669",
          amber: "#d97706",
          rose: "#e11d48",
          slate: "#475569"
        }
      },
    },
  },
  plugins: [],
}
