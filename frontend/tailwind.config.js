/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'galo-black': '#1A1A1A',
        'galo-dark': '#0D0D0D',
        'card-bg': '#2A2A2A',
        'card-border': '#444444',
        'star-gold': '#FFD700',
        'star-gold-dark': '#E6C200',
        'text-primary': '#FFFFFF',
        'text-secondary': '#B0B0B0',
        'text-muted': '#707070',
        'accent-green': '#2ECC71',
        'accent-red': '#E63946',
        'accent-green-container': 'rgba(46, 204, 113, 0.2)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-in-down': {
          from: { opacity: '0', transform: 'translateY(-12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-left': {
          from: { opacity: '0', transform: 'translateX(-12px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease',
        'fade-in-down': 'fade-in-down 0.4s ease',
        'fade-in-up': 'fade-in-up 0.4s ease',
        'fade-in-left': 'fade-in-left 0.4s ease',
      },
    },
  },
  plugins: [],
};
