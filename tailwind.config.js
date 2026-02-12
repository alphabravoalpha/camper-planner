/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Mediterranean teal color palette
      colors: {
        primary: {
          50: '#f0fafb',
          100: '#d0f0f4',
          200: '#a3e0ea',
          300: '#6cc8d7',
          400: '#3eaec2',
          500: '#2794a8',
          600: '#1e7a8d',
          700: '#1a6275',
          800: '#194f5e',
          900: '#173f4d',
        },
        accent: {
          50: '#fff5f0',
          100: '#ffe4d6',
          200: '#ffc7ad',
          300: '#ffa179',
          400: '#ff7a4a',
          500: '#f25d2a',
          600: '#e04416',
          700: '#ba3312',
          800: '#962c15',
          900: '#7a2916',
        },
        neutral: {
          50: '#f8f9fa',
          100: '#f1f3f5',
          200: '#e2e5e9',
          300: '#ced3da',
          400: '#98a2af',
          500: '#6b7785',
          600: '#556170',
          700: '#3d4754',
          800: '#2b333e',
          900: '#1a2029',
        },
        success: {
          50: '#edfcf2',
          100: '#d1fae0',
          200: '#a7f3c5',
          300: '#6ee7a0',
          400: '#34d278',
          500: '#27ae60',
          600: '#1a8a4b',
          700: '#166d3e',
          800: '#155633',
          900: '#13472b',
        },
        warning: {
          50: '#fef9ec',
          100: '#fdf0c8',
          200: '#fbe08d',
          300: '#f8cb52',
          400: '#f5b72a',
          500: '#e9a100',
          600: '#cc7d00',
          700: '#a95b02',
          800: '#8a4809',
          900: '#723b0c',
        },
      },
      // Typography with display font
      fontFamily: {
        display: [
          'Plus Jakarta Sans',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif'
        ],
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
          'JetBrains Mono',
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
      // Box shadows - cool blue-gray
      boxShadow: {
        'soft': '0 1px 2px 0 rgba(30, 41, 59, 0.04)',
        'medium': '0 4px 8px -2px rgba(30, 41, 59, 0.08), 0 2px 4px -2px rgba(30, 41, 59, 0.04)',
        'hard': '0 12px 24px -4px rgba(30, 41, 59, 0.10), 0 4px 8px -2px rgba(30, 41, 59, 0.04)',
        'float': '0 20px 40px -8px rgba(30, 41, 59, 0.12), 0 8px 16px -4px rgba(30, 41, 59, 0.04)',
      },
      // Border radius
      borderRadius: {
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      }
    },
  },
  plugins: [],
}
