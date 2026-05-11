/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}", // Esto busca en todas las subcarpetas del proyecto
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}