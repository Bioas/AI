/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Noto Sans Thai', 'system-ui', 'sans-serif'],
      },
      colors: {
        lime: {
          50: '#f4f9e6',
          100: '#e5f0c4',
          200: '#d4e88e',
          300: '#cbe54e',
          400: '#b8d63a',
          500: '#a3c639',
          600: '#84a129',
          700: '#62791e',
          800: '#435316',
          900: '#2a350c',
        },
        surface: '#f6f7f4',
        sidebar: '#202124',
      },
      boxShadow: {
        soft: '0 2px 15px -3px rgba(0, 0, 0, 0.04), 0 10px 20px -2px rgba(0, 0, 0, 0.03)',
        glow: '0 4px 25px -5px rgba(203, 229, 78, 0.25), 0 10px 20px -5px rgba(203, 229, 78, 0.05)',
        card: '0 1px 3px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.03), 0 8px 20px -6px rgba(203,229,78,0.12)',
        'card-hover': '0 4px 20px rgba(203,229,78,0.15), 0 8px 32px -8px rgba(203,229,78,0.18)',
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        slideInRight: {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        fadeInUp: 'fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        scaleIn: 'scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        slideInRight: 'slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        float: 'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
