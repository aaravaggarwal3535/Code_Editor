/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#93c5fd',  // For hover states
          DEFAULT: '#3b82f6', // Primary brand color
          dark: '#2563eb'    // For active states
        },
        secondary: {
          light: '#f9a8d4',
          DEFAULT: '#ec4899',
          dark: '#db2777'
        },
        dark: {
          lighter: '#2d3748',
          DEFAULT: '#1e293b',
          darker: '#0f172a'
        },
        light: {
          lighter: '#f8fafc',
          DEFAULT: '#f1f5f9',
          darker: '#e2e8f0'
        },
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['"Consolas"', '"Courier New"', 'monospace']
      },
    },
  },
  darkMode: 'class', // Enable dark mode with class-based switching
  plugins: [],
}