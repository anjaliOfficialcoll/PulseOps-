/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#0B1020',
          secondary: '#111827',
          card: '#151E30',
          cardHover: '#1A253C',
          border: '#1E293B',
          borderLight: '#334155',
          primary: '#6366F1',
          primaryHover: '#4F46E5',
          cyan: '#06B6D4',
          success: '#22C55E',
          warning: '#F59E0B',
          critical: '#EF4444',
          text: '#F8FAFC',
          muted: '#94A3B8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}

