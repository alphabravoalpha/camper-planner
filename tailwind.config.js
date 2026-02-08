/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Outdoor/camping color palette
      colors: {
        primary: {
          50: '#f0f7f4',
          100: '#d9ede2',
          200: '#b3dbc5',
          300: '#80c4a0',
          400: '#4fa97a',
          500: '#2d8a5e',
          600: '#236e4a',
          700: '#1d5a3d',
          800: '#174832',
          900: '#0f3324',
        },
        accent: {
          50: '#fef7ed',
          100: '#fdecd3',
          200: '#fbd5a5',
          300: '#f8b96d',
          400: '#f59a3e',
          500: '#e8811d',
          600: '#cc6714',
          700: '#a94d12',
          800: '#8a3d14',
          900: '#723414',
        },
        neutral: {
          50: '#faf9f7',
          100: '#f4f2ef',
          200: '#e8e5e0',
          300: '#d5d0c9',
          400: '#a9a29a',
          500: '#7a7268',
          600: '#5e5750',
          700: '#44403b',
          800: '#2c2924',
          900: '#1a1815',
        },
        success: {
          50: '#f0f7f4',
          100: '#d9ede2',
          200: '#b3dbc5',
          300: '#80c4a0',
          400: '#4fa97a',
          500: '#2d8a5e',
          600: '#236e4a',
          700: '#1d5a3d',
          800: '#174832',
          900: '#0f3324',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
      },
      // Typography for European language support
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'Fira Sans',
          'Droid Sans',
          'Helvetica Neue',
          'sans-serif'
        ],
        mono: [
          'SF Mono',
          'Monaco',
          'Inconsolata',
          'Roboto Mono',
          'source-code-pro',
          'Menlo',
          'Consolas',
          'Liberation Mono',
          'Courier New',
          'monospace'
        ]
      },
      // Layout utilities for map interface
      height: {
        'screen-header': 'calc(100vh - 4rem)',
        'screen-nav': 'calc(100vh - 5rem)',
        'map': 'calc(100vh - 8rem)',
      },
      width: {
        'sidebar': '20rem',
        'sidebar-wide': '24rem',
        'sidebar-collapsed': '4rem',
      },
      maxWidth: {
        'sidebar': '20rem',
        'content': '1200px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '92': '23rem',
        '96': '24rem',
      },
      zIndex: {
        'map': 10,
        'sidebar': 20,
        'header': 30,
        'dropdown': 35,
        'modal': 40,
        'tooltip': 50,
      },
      // Animation and transitions
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      // Box shadows - warm-toned for depth
      boxShadow: {
        'soft': '0 2px 8px 0 rgba(44, 41, 36, 0.06)',
        'medium': '0 4px 16px 0 rgba(44, 41, 36, 0.1)',
        'hard': '0 8px 30px 0 rgba(44, 41, 36, 0.14)',
        'float': '0 12px 40px -4px rgba(44, 41, 36, 0.12)',
      },
      // Border radius for modern look
      borderRadius: {
        'xl': '1.125rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      }
    },
  },
  plugins: [],
}
