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
          DEFAULT: '#F4F7F4', // Soft coconut green light
          deep: '#E8EFE8',    // Coconut green deep
        },
        ink: {
          DEFAULT: '#2B1C1A', // Warmer dark text
          soft: '#5C4844',
          muted: '#8F7C78',
        },
        berry: { // Terracotta tones (Primary Action)
          50: '#FFF5F2',
          100: '#FFE6DF',
          200: '#FFC8B9',
          300: '#FFA18A',
          400: '#F87556',
          500: '#E05A3B', // Terracotta
          600: '#BE3E21',
          700: '#992E16',
        },
        plum: { // Maroon tones (Deep accents)
          500: '#8C2730', // Maroon
          600: '#6A1A21',
          700: '#4D1016',
        },
        sand: '#E3D7AE', // Mustard tinted warm sand
        moss: '#009688', // Vibrant teal
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
