// Design System Utilities
// European Camper Trip Planner - Mediterranean Teal theme

import { cn } from './cn';

// Color palette configuration - Ocean Teal + Sunset Coral
export const colors = {
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
  error: {
    50: '#fef0f1',
    100: '#fddee0',
    200: '#fcc0c4',
    300: '#f5a3a9',
    400: '#f07580',
    500: '#e63946',
    600: '#d32535',
    700: '#b11c2b',
    800: '#931a28',
    900: '#7c1b27',
  },
  gray: {
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
  }
};

// Typography scale
export const typography = {
  // Font sizes
  text: {
    xs: 'text-xs',     // 12px
    sm: 'text-sm',     // 14px
    base: 'text-base', // 16px
    lg: 'text-lg',     // 18px
    xl: 'text-xl',     // 20px
    '2xl': 'text-2xl', // 24px
    '3xl': 'text-3xl', // 30px
    '4xl': 'text-4xl', // 36px
  },
  // Font weights
  weight: {
    normal: 'font-normal',     // 400
    medium: 'font-medium',     // 500
    semibold: 'font-semibold', // 600
    bold: 'font-bold',         // 700
    extrabold: 'font-extrabold', // 800
  },
  // Line heights
  leading: {
    none: 'leading-none',       // 1
    tight: 'leading-tight',     // 1.25
    snug: 'leading-snug',       // 1.375
    normal: 'leading-normal',   // 1.5
    relaxed: 'leading-relaxed', // 1.625
    loose: 'leading-loose',     // 2
  }
};

// Spacing scale
export const spacing = {
  // Padding
  p: {
    0: 'p-0',
    1: 'p-1',
    2: 'p-2',
    3: 'p-3',
    4: 'p-4',
    5: 'p-5',
    6: 'p-6',
    8: 'p-8',
    10: 'p-10',
    12: 'p-12',
  },
  // Margins
  m: {
    0: 'm-0',
    1: 'm-1',
    2: 'm-2',
    3: 'm-3',
    4: 'm-4',
    5: 'm-5',
    6: 'm-6',
    8: 'm-8',
    10: 'm-10',
    12: 'm-12',
  },
  // Gaps
  gap: {
    1: 'gap-1',
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    5: 'gap-5',
    6: 'gap-6',
    8: 'gap-8',
    10: 'gap-10',
    12: 'gap-12',
  }
};

// Border radius scale
export const borderRadius = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  base: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  full: 'rounded-full',
};

// Shadow scale
export const shadows = {
  sm: 'shadow-sm',
  base: 'shadow',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
  soft: 'shadow-soft',
  medium: 'shadow-medium',
  hard: 'shadow-hard',
  float: 'shadow-float',
  inner: 'shadow-inner',
  none: 'shadow-none',
};

// Animation and transition utilities
export const animations = {
  // Transitions
  transition: {
    none: 'transition-none',
    all: 'transition-all',
    colors: 'transition-colors',
    opacity: 'transition-opacity',
    shadow: 'transition-shadow',
    transform: 'transition-transform',
  },
  // Durations
  duration: {
    75: 'duration-75',
    100: 'duration-100',
    150: 'duration-150',
    200: 'duration-200',
    300: 'duration-300',
    500: 'duration-500',
    700: 'duration-700',
    1000: 'duration-1000',
  },
  // Easing
  ease: {
    linear: 'ease-linear',
    in: 'ease-in',
    out: 'ease-out',
    'in-out': 'ease-in-out',
  },
  // Transform
  scale: {
    0: 'scale-0',
    50: 'scale-50',
    75: 'scale-75',
    90: 'scale-90',
    95: 'scale-95',
    100: 'scale-100',
    105: 'scale-105',
    110: 'scale-110',
    125: 'scale-125',
  }
};

// Component style variants
export const variants = {
  // Button variants
  button: {
    primary: 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 text-white',
    secondary: 'bg-neutral-100 hover:bg-neutral-200 focus:ring-neutral-400 text-neutral-900',
    accent: 'bg-accent-500 hover:bg-accent-600 focus:ring-accent-500 text-white',
    success: 'bg-success-600 hover:bg-success-700 focus:ring-success-500 text-white',
    warning: 'bg-warning-600 hover:bg-warning-700 focus:ring-warning-500 text-white',
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white',
    ghost: 'bg-transparent hover:bg-neutral-100 focus:ring-neutral-400 text-neutral-900',
    link: 'bg-transparent hover:bg-transparent focus:ring-transparent text-primary-600 hover:text-primary-700',
  },
  // Input variants
  input: {
    default: 'border-neutral-200 focus:border-primary-500 focus:ring-primary-200',
    error: 'border-red-300 focus:border-red-500 focus:ring-red-200',
    success: 'border-success-300 focus:border-success-500 focus:ring-success-200',
    disabled: 'bg-neutral-50 border-neutral-200 text-neutral-500 cursor-not-allowed',
  },
  // Card variants
  card: {
    default: 'bg-white rounded-xl border border-neutral-200 shadow-soft',
    elevated: 'bg-white rounded-xl shadow-medium',
    interactive: 'bg-white rounded-xl border border-neutral-200 shadow-soft hover:shadow-medium hover:-translate-y-0.5 transition-all duration-200 cursor-pointer',
    danger: 'bg-red-50 border border-red-200 rounded-xl',
    warning: 'bg-warning-50 border border-warning-200 rounded-xl',
    success: 'bg-success-50 border border-success-200 rounded-xl',
    info: 'bg-primary-50 border border-primary-200 rounded-xl',
  },
  // Badge variants
  badge: {
    default: 'bg-neutral-100 text-neutral-800',
    primary: 'bg-primary-100 text-primary-800',
    accent: 'bg-accent-100 text-accent-800',
    success: 'bg-success-100 text-success-800',
    warning: 'bg-warning-100 text-warning-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-primary-100 text-primary-800',
  }
};

// Responsive design utilities
export const responsive = {
  breakpoints: {
    sm: 'sm:', // 640px
    md: 'md:', // 768px
    lg: 'lg:', // 1024px
    xl: 'xl:', // 1280px
    '2xl': '2xl:', // 1536px
  },
  // Common responsive patterns
  grid: {
    responsive: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    auto: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    equal: 'grid-cols-1 md:grid-cols-2',
  },
  flex: {
    responsive: 'flex-col sm:flex-row',
    stack: 'flex-col',
    row: 'flex-row',
  },
  text: {
    responsive: 'text-sm sm:text-base lg:text-lg',
    center: 'text-center sm:text-left',
  },
  spacing: {
    responsive: 'p-4 sm:p-6 lg:p-8',
    tight: 'p-2 sm:p-4',
    loose: 'p-6 sm:p-8 lg:p-12',
  }
};

// Accessibility utilities
export const accessibility = {
  // Focus styles
  focus: {
    ring: 'focus:outline-none focus:ring-2 focus:ring-offset-2',
    visible: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    within: 'focus-within:ring-2 focus-within:ring-offset-2',
  },
  // Screen reader utilities
  sr: {
    only: 'sr-only',
    focusable: 'sr-only focus:not-sr-only',
  },
  // Semantic colors for screen readers
  semantic: {
    error: 'text-red-600',
    warning: 'text-warning-600',
    success: 'text-success-600',
    info: 'text-primary-600',
  }
};

// Component sizing utilities
export const sizing = {
  // Button sizes
  button: {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3.5 py-2 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-3.5 text-base',
  },
  // Input sizes
  input: {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base',
  },
  // Icon sizes
  icon: {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
    '2xl': 'w-10 h-10',
  }
};

// Common component combinations
export const components = {
  // Standard button
  button: (variant: keyof typeof variants.button = 'primary', size: keyof typeof sizing.button = 'md') => cn(
    'inline-flex items-center justify-center font-display font-semibold rounded-lg',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'transition-all duration-200 active:scale-[0.98]',
    variants.button[variant],
    sizing.button[size]
  ),

  // Standard input
  input: (variant: keyof typeof variants.input = 'default', size: keyof typeof sizing.input = 'md') => cn(
    'block w-full rounded-lg border-2',
    'placeholder-neutral-400',
    'focus:outline-none focus:ring-2',
    'disabled:bg-neutral-50 disabled:text-neutral-500 disabled:cursor-not-allowed',
    'transition-all duration-200',
    variants.input[variant],
    sizing.input[size]
  ),

  // Standard card
  card: (variant: keyof typeof variants.card = 'default') => cn(
    variants.card[variant]
  ),

  // Standard badge
  badge: (variant: keyof typeof variants.badge = 'default') => cn(
    'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-display font-medium',
    variants.badge[variant]
  ),

  // Form group
  formGroup: () => cn('space-y-1'),

  // Form label
  formLabel: () => cn('block text-sm font-medium text-neutral-700'),

  // Form error
  formError: () => cn('text-sm text-red-600'),

  // Form help text
  formHelp: () => cn('text-sm text-neutral-500'),

  // Loading spinner
  spinner: (size: keyof typeof sizing.icon = 'md') => cn(
    'animate-spin rounded-full border-2 border-neutral-300 border-t-primary-600',
    sizing.icon[size]
  ),

  // Tab navigation
  tab: (active: boolean = false) => cn(
    'flex items-center space-x-2 py-4 px-1 border-b-2 font-display font-medium text-sm transition-colors',
    active
      ? 'border-primary-500 text-primary-600'
      : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
  ),

  // Modal overlay
  modalOverlay: () => cn(
    'fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50',
    'transition-opacity duration-300'
  ),

  // Modal content
  modalContent: () => cn(
    'bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 ring-1 ring-black/5',
    'transform transition-all duration-300'
  ),

  // Toast notification
  toast: (variant: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const variantStyles = {
      success: 'bg-success-50 border-success-200 text-success-800',
      error: 'bg-red-50 border-red-200 text-red-800',
      warning: 'bg-warning-50 border-warning-200 text-warning-800',
      info: 'bg-primary-50 border-primary-200 text-primary-800',
    };

    return cn(
      'p-4 rounded-lg border',
      'transform transition-all duration-300',
      variantStyles[variant]
    );
  }
};

// Layout utilities
export const layout = {
  // Container
  container: () => cn('mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'),

  // Section spacing
  section: () => cn('py-8 sm:py-12 lg:py-16'),

  // Grid layouts
  grid: {
    auto: () => cn('grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'),
    equal: () => cn('grid grid-cols-1 gap-6 md:grid-cols-2'),
    sidebar: () => cn('grid grid-cols-1 gap-6 lg:grid-cols-4'),
  },

  // Flex layouts
  flex: {
    center: () => cn('flex items-center justify-center'),
    between: () => cn('flex items-center justify-between'),
    start: () => cn('flex items-start'),
    end: () => cn('flex items-end'),
    col: () => cn('flex flex-col'),
    wrap: () => cn('flex flex-wrap'),
  },

  // Stack layouts
  stack: {
    sm: () => cn('space-y-2'),
    md: () => cn('space-y-4'),
    lg: () => cn('space-y-6'),
    xl: () => cn('space-y-8'),
  }
};

// Utility function to get consistent styles
export const getComponentStyles = {
  button: components.button,
  input: components.input,
  card: components.card,
  badge: components.badge,
  spinner: components.spinner,
  tab: components.tab,
  toast: components.toast,
};

// Export all utilities
export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animations,
  variants,
  responsive,
  accessibility,
  sizing,
  components,
  layout,
  getComponentStyles,
};
