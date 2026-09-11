export default {content: [
  './index.html',
  './app/**/*.{js,ts,jsx,tsx}',
  './components/**/*.{js,ts,jsx,tsx}',
  './lib/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#050505', // Almost black
          deep: '#111111',    // Slightly lighter for cards/surfaces
        },
        ink: {
          DEFAULT: '#FFFFFF', // Pure white text
          soft: '#E2E8F0',    // Light slate for secondary text
          muted: '#94A3B8',   // Slate-400 for muted text
        },
        berry: { // Now Blue (Primary Action)
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9', // Main Blue
          600: '#0284C7',
          700: '#0369A1',
        },
        plum: { // Now Pink (Accents)
          500: '#EC4899', // Main Pink
          600: '#DB2777',
          700: '#BE185D',
        },
        sand: '#1E293B', // dark slate for borders
        moss: '#06B6D4', // cyan-500
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(29,20,32,0.04), 0 12px 32px -20px rgba(29,20,32,0.28)',
        lift: '0 24px 60px -30px rgba(76,22,48,0.45)',
      },
      transitionTimingFunction: {
        soft: 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
    },
  },
}
