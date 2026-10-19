/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pastel: {
          peach: "#FFD1DC",
          cream: "#FFFDF9",
          vanilla: "#FFF6E5",
          lavender: "#E8DFF5",
          rose: "#FF7597",
        },
      },
    },
  },
  plugins: [],
};