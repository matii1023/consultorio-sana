/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        sana: {
          50:  '#F7F5FA',
          100: '#EDE8F3',
          200: '#DBD1E6',
          300: '#C4B4D4',
          400: '#A997BE',
          500: '#9C8BA7',  // color principal del logo
          600: '#85718F',
          700: '#6B5B7A',
          800: '#4E4359',
          900: '#312A3A',
        },
        cream: '#FAF8FB',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -4px rgba(156, 139, 167, 0.15)',
        'card': '0 2px 12px -2px rgba(156, 139, 167, 0.12)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}