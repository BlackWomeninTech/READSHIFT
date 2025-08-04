/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,js}',
  ],
  theme: {
    extend: {
      colors: {
        'rs-green': '#57C83E',
        'rs-blue': '#4A85F6',
        'rs-purple': '#8A44B0',
        'rs-orange': '#F77B2F',
        'rs-yellow': '#FDBB3D',
        'rs-light': '#F8F9FA',
        'rs-dark': '#2C3E50',
        },
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
      },
      animation: {
        'float-up': 'float-up 4s ease-out forwards',
      },
      keyframes: {
        'float-up': {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-300px)', opacity: '0' },
        },
      },
    },
  },

  plugins: [],
}