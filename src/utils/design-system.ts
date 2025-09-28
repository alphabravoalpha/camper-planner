// Design System Utilities
// Phase 6.3: Comprehensive design consistency and professional polish

import { cn } from './cn';

// Color palette configuration
export const colors = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
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
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
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
    primary: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 focus:ring-gray-500 text-gray-900',
    success: 'bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white',
    warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500 text-white',
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white',
    ghost: 'bg-transparent hover:bg-gray-100 focus:ring-gray-500 text-gray-900',
    link: 'bg-transparent hover:bg-transparent focus:ring-transparent text-blue-600 hover:text-blue-700',
  },
  // Input variants
  input: {
    default: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
    error: 'border-red-300 focus:border-red-500 focus:ring-red-500',
    success: 'border-green-300 focus:border-green-500 focus:ring-green-500',
    disabled: 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed',
  },
  // Card variants
  card: {
    default: 'bg-white border border-gray-200 rounded-lg shadow-sm',
    elevated: 'bg-white border border-gray-200 rounded-lg shadow-md',
    interactive: 'bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer',
    danger: 'bg-red-50 border border-red-200 rounded-lg',
    warning: 'bg-yellow-50 border border-yellow-200 rounded-lg',
    success: 'bg-green-50 border border-green-200 rounded-lg',
    info: 'bg-blue-50 border border-blue-200 rounded-lg',
  },
  // Badge variants
  badge: {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
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
    warning: 'text-yellow-600',
    success: 'text-green-600',
    info: 'text-blue-600',
  }
};

// Component sizing utilities
export const sizing = {
  // Button sizes
  button: {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-4 py-2 text-base',
    xl: 'px-6 py-3 text-base',
  },
  // Input sizes
  input: {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2 text-base',
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
    'inline-flex items-center justify-center font-medium rounded-md',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'transition-colors duration-200',
    variants.button[variant],
    sizing.button[size]
  ),

  // Standard input
  input: (variant: keyof typeof variants.input = 'default', size: keyof typeof sizing.input = 'md') => cn(
    'block w-full rounded-md border',
    'placeholder-gray-400',
    'focus:outline-none focus:ring-1',
    'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
    'transition-colors duration-200',
    variants.input[variant],
    sizing.input[size]
  ),

  // Standard card
  card: (variant: keyof typeof variants.card = 'default') => cn(
    variants.card[variant]
  ),

  // Standard badge
  badge: (variant: keyof typeof variants.badge = 'default') => cn(
    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
    variants.badge[variant]
  ),

  // Form group
  formGroup: () => cn('space-y-1'),

  // Form label
  formLabel: () => cn('block text-sm font-medium text-gray-700'),

  // Form error
  formError: () => cn('text-sm text-red-600'),

  // Form help text
  formHelp: () => cn('text-sm text-gray-500'),

  // Loading spinner
  spinner: (size: keyof typeof sizing.icon = 'md') => cn(
    'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
    sizing.icon[size]
  ),

  // Tab navigation
  tab: (active: boolean = false) => cn(
    'flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors',
    active
      ? 'border-blue-500 text-blue-600'
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
  ),

  // Modal overlay
  modalOverlay: () => cn(
    'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    'transition-opacity duration-300'
  ),

  // Modal content
  modalContent: () => cn(
    'bg-white rounded-lg shadow-xl max-w-md w-full mx-4',
    'transform transition-all duration-300'
  ),

  // Toast notification
  toast: (variant: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const variantStyles = {
      success: 'bg-green-50 border-green-200 text-green-800',
      error: 'bg-red-50 border-red-200 text-red-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800',
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