/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: '#fffdf5',
        ink: '#2d2d2d',
        brand: { DEFAULT: '#db7c00', 50: '#fff8f0', 100: '#ffecd6', 600: '#db7c00', 700: '#b86800' }
      }
    },
  },
  plugins: [],
}
