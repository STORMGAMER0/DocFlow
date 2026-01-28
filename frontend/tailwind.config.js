/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb',
          light: '#dbeafe',
          hover: '#1d4ed8',
        },
        success: {
          DEFAULT: '#10b981',
          light: '#d1fae5',
        },
        danger: {
          DEFAULT: '#ef4444',
          light: '#fee2e2',
          hover: '#dc2626',
        },
        warning: {
          DEFAULT: '#f59e0b',
          light: '#fef3c7',
        },
        info: {
          DEFAULT: '#3b82f6',
          light: '#dbeafe',
        },
      },
    },
  },
  plugins: [],
}