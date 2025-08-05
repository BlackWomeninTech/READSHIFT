/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,js}',
  ],  
extend: {
  colors: {
    'primary': '#4A85F6',   // A friendly, primary blue
    'secondary': '#57C83E', // A calm, supportive green
    'accent': '#F77B2F',    // A warm, encouraging orange
    'neutral': '#2C3E50',   // A soft, dark color for text
    'base': '#FEFDFB',      // A very light, warm cream for cards
    'soft-bg': '#F0F2F7'    // A gentle blue-gray for the page background
  },
  fontFamily: {
   nuni: ['Nunito', 'sans-serif'],
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

  plugins:[

  ],
}