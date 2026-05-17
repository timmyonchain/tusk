/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0f',
        accent: '#00d4ff',
        secondary: '#7c3aed',
        'text-primary': '#f8fafc',
        'text-muted': '#64748b',
        card: '#0f1117',
        border: '#1e2130',
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
