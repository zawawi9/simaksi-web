/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./**/*.html",
    "./assets/js/**/*.js",
    "./assets/css/**/*.css"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1E8449',
        accent: '#2ECC71',
        'dark-green': '#145A32',
      }
    },
  },
  plugins: [],
}