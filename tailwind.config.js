/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F2F0E9", // Rice paper nuance
        paper: "#FDFBF7",      // Lighter area
        foreground: "#1C1C1C", // Ink black
        muted: "#57534E",      // Stone gray
        subtle: "#A8A29E",     // Light wash
        border: "#E7E5E4",     // Stone 200
        accent: "#1C1C1C",     // Replaced Seal Red with Ink Black for monochrome request
      },
      fontFamily: {
        sans: [
          "Gill Sans", "Gill Sans MT", "Calibri", "sans-serif"
        ],
        serif: [
          "Songti SC", "Noto Serif SC", "SimSun", "Times New Roman", "serif"
        ],
        kaiti: [
          "Kaiti SC", "STKaiti", "KaiTi", "serif"
        ]
      },
      maxWidth: {
        'prose': '65ch', // Optimization for reading
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
