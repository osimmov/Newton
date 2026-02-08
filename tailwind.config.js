/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        newton: {
          charcoal: '#1a1a1c',
          surface: '#252528',
          border: '#3a3a3e',
          muted: '#9ca3af',
          text: '#e5e7eb',
          accent: '#6b7280',
        },
      },
    },
  },
  plugins: [],
}
