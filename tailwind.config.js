/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        aires: {
          green: '#B4C234',
          gray: '#536B7A',
          lightGray: '#F5F7F9',
          darkGray: '#2A3B47',
          blue: '#1F3B4C',
          lightBlue: '#4682B4'
        }
      }
    },
  },
  plugins: [],
};