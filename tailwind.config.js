export default {content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#fbf7f3',
          deep: '#f4ece5',
        },
        ink: {
          DEFAULT: '#1d1420',
          soft: '#4a3c46',
          muted: '#7d707a',
        },
        berry: {
          50: '#fdf2f5',
          100: '#fbe4ea',
          200: '#f4c2d1',
          300: '#e894ae',
          400: '#d5607f',
          500: '#ac2b57',
          600: '#8f1f47',
          700: '#711738',
        },
        plum: {
          500: '#4c1630',
          600: '#3a1025',
          700: '#280a19',
        },
        sand: '#e8ddd2',
        moss: '#3f6b52',
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
