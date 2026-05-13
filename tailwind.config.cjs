/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Noto Sans Thai', 'system-ui', 'sans-serif'],
      },
      colors: {
        medical: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#b9dffb',
          300: '#7cc5f7',
          400: '#36a9f1',
          500: '#0c8ee0',
          600: '#0070be',
          700: '#015a9a',
          800: '#064c80',
          900: '#0b406a',
        },
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        surface: '#f0f5ff',
        sidebar: '#0b1423',
      },
      boxShadow: {
        soft: '0 2px 15px -3px rgba(0, 0, 0, 0.06), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        glow: '0 4px 25px -5px rgba(59, 130, 246, 0.15), 0 10px 20px -5px rgba(59, 130, 246, 0.05)',
        'card': '0 1px 3px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.03), 0 8px 20px -6px rgba(59,130,246,0.08)',
        'card-hover': '0 4px 20px rgba(59,130,246,0.10), 0 8px 32px -8px rgba(59,130,246,0.12)',
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
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        fadeInUp: 'fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        scaleIn: 'scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        slideInRight: 'slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        float: 'float 3s ease-in-out infinite',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
