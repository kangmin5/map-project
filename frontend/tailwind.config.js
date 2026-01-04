/** @type {import('tailwindcss').Config} */
export default {
  // content 배열에 "./index.html"과 "./src/..." 이 정확히 있어야 합니다.
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}