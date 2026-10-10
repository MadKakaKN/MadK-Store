/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#b9ddfe',
          300: '#7cc2fd',
          400: '#36a3fa',
          500: '#0c87eb',
          600: '#026bc8',
          700: '#0355a2',
          800: '#074885',
          900: '#0c3d6e',
          950: '#082749',
        },
      },
    },
  },
  plugins: [],
};
