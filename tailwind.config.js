/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FAFAFA",
        foreground: "#111111", 
        muted: "#444444",
        subtle: "#888888",
        border: "#E5E5E5",
      },
      fontFamily: {
        sans: [
          "-apple-system", 
          "BlinkMacSystemFont", 
          "Segoe UI", 
          "Roboto", 
          "Helvetica", 
          "Arial", 
          "sans-serif"
        ],
        serif: [
          "Georgia",
          "Cambria",
          "Times New Roman",
          "Times",
          "serif"
        ]
      },
      maxWidth: {
        'prose': '720px',
      }
    },
  },
  plugins: [],
}
