// Responsive Design Utilities and Testing
// Phase 6.3: Mobile responsiveness optimization and device testing

import { useState, useEffect } from 'react';

// Breakpoint definitions that match Tailwind CSS
export const breakpoints = {
  sm: 640, // Small devices (landscape phones, 640px and up)
  md: 768, // Medium devices (tablets, 768px and up)
  lg: 1024, // Large devices (desktops, 1024px and up)
  xl: 1280, // Extra large devices (large desktops, 1280px and up)
  '2xl': 1536, // 2X Large devices (larger desktops, 1536px and up)
} as const;

// Device categories for testing
export const deviceCategories = {
  mobile: {
    portrait: { minWidth: 320, maxWidth: 767, orientation: 'portrait' },
    landscape: { minWidth: 568, maxWidth: 1024, orientation: 'landscape' },
  },
  tablet: {
    portrait: { minWidth: 768, maxWidth: 1024, orientation: 'portrait' },
    landscape: { minWidth: 1024, maxWidth: 1366, orientation: 'landscape' },
  },
  desktop: {
    small: { minWidth: 1024, maxWidth: 1279 },
    medium: { minWidth: 1280, maxWidth: 1535 },
    large: { minWidth: 1536, maxWidth: Infinity },
  },
} as const;

// Common device specifications for testing
export const commonDevices = {
  // Mobile phones
  'iPhone SE': { width: 375, height: 667, pixelRatio: 2 },
  'iPhone 12': { width: 390, height: 844, pixelRatio: 3 },
  'iPhone 12 Pro Max': { width: 428, height: 926, pixelRatio: 3 },
  'Samsung Galaxy S21': { width: 384, height: 854, pixelRatio: 2.75 },
  'Google Pixel 5': { width: 393, height: 851, pixelRatio: 2.75 },

  // Tablets
  iPad: { width: 768, height: 1024, pixelRatio: 2 },
  'iPad Pro 11"': { width: 834, height: 1194, pixelRatio: 2 },
  'iPad Pro 12.9"': { width: 1024, height: 1366, pixelRatio: 2 },
  'Samsung Galaxy Tab': { width: 800, height: 1280, pixelRatio: 2 },

  // Desktop/Laptop
  'MacBook Air': { width: 1440, height: 900, pixelRatio: 2 },
  'MacBook Pro 16"': { width: 1728, height: 1117, pixelRatio: 2 },
  'Desktop 1080p': { width: 1920, height: 1080, pixelRatio: 1 },
  'Desktop 1440p': { width: 2560, height: 1440, pixelRatio: 1 },
  'Desktop 4K': { width: 3840, height: 2160, pixelRatio: 1 },
} as const;

// Hook for responsive behavior
export const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setWindowSize({ width, height });
      setOrientation(height > width ? 'portrait' : 'landscape');
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial values

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getCurrentBreakpoint = () => {
    const { width } = windowSize;

    if (width >= breakpoints['2xl']) return '2xl';
    if (width >= breakpoints.xl) return 'xl';
    if (width >= breakpoints.lg) return 'lg';
    if (width >= breakpoints.md) return 'md';
    if (width >= breakpoints.sm) return 'sm';
    return 'xs';
  };

  const isBreakpoint = (breakpoint: keyof typeof breakpoints) => {
    return windowSize.width >= breakpoints[breakpoint];
  };

  const isMobile = windowSize.width < breakpoints.md;
  const isTablet = windowSize.width >= breakpoints.md && windowSize.width < breakpoints.lg;
  const isDesktop = windowSize.width >= breakpoints.lg;

  const getDeviceCategory = () => {
    if (isMobile) return 'mobile';
    if (isTablet) return 'tablet';
    return 'desktop';
  };

  return {
    windowSize,
    orientation,
    currentBreakpoint: getCurrentBreakpoint(),
    isBreakpoint,
    isMobile,
    isTablet,
    isDesktop,
    deviceCategory: getDeviceCategory(),
  };
};

// Responsive container utilities
export const responsiveContainers = {
  // Standard container with responsive padding
  container: () => `
    mx-auto max-w-7xl
    px-4 sm:px-6 lg:px-8
  `,

  // Tight container for mobile-first design
  containerTight: () => `
    mx-auto max-w-6xl
    px-3 sm:px-4 md:px-6 lg:px-8
  `,

  // Wide container for full-width sections
  containerWide: () => `
    mx-auto max-w-none
    px-4 sm:px-6 lg:px-8 xl:px-12
  `,

  // Section spacing that adapts to screen size
  sectionSpacing: () => `
    py-8 sm:py-12 lg:py-16 xl:py-20
  `,

  // Card grid that adapts to screen size
  responsiveGrid: () => `
    grid grid-cols-1
    sm:grid-cols-2
    lg:grid-cols-3
    xl:grid-cols-4
    gap-4 sm:gap-6 lg:gap-8
  `,

  // Responsive flex layouts
  responsiveFlex: () => `
    flex flex-col
    sm:flex-row
    gap-4 sm:gap-6
  `,
};

// Text scaling utilities
export const responsiveText = {
  // Heading scales
  h1: () => `
    text-2xl sm:text-3xl lg:text-4xl xl:text-5xl
    font-bold
    leading-tight sm:leading-tight lg:leading-tight
  `,

  h2: () => `
    text-xl sm:text-2xl lg:text-3xl xl:text-4xl
    font-semibold
    leading-tight sm:leading-tight lg:leading-tight
  `,

  h3: () => `
    text-lg sm:text-xl lg:text-2xl xl:text-3xl
    font-semibold
    leading-tight sm:leading-tight
  `,

  h4: () => `
    text-base sm:text-lg lg:text-xl xl:text-2xl
    font-medium
    leading-normal
  `,

  // Body text scales
  body: () => `
    text-sm sm:text-base lg:text-lg
    leading-normal sm:leading-relaxed
  `,

  bodySmall: () => `
    text-xs sm:text-sm lg:text-base
    leading-normal
  `,

  // Caption text
  caption: () => `
    text-xs sm:text-sm
    leading-tight
  `,
};

// Responsive spacing utilities
export const responsiveSpacing = {
  // Margin scales
  marginY: {
    sm: () => 'my-2 sm:my-3 lg:my-4',
    md: () => 'my-4 sm:my-6 lg:my-8',
    lg: () => 'my-6 sm:my-8 lg:my-12',
    xl: () => 'my-8 sm:my-12 lg:my-16',
  },

  marginX: {
    sm: () => 'mx-2 sm:mx-3 lg:mx-4',
    md: () => 'mx-4 sm:mx-6 lg:mx-8',
    lg: () => 'mx-6 sm:mx-8 lg:mx-12',
    xl: () => 'mx-8 sm:mx-12 lg:mx-16',
  },

  // Padding scales
  paddingY: {
    sm: () => 'py-2 sm:py-3 lg:py-4',
    md: () => 'py-4 sm:py-6 lg:py-8',
    lg: () => 'py-6 sm:py-8 lg:py-12',
    xl: () => 'py-8 sm:py-12 lg:py-16',
  },

  paddingX: {
    sm: () => 'px-2 sm:px-3 lg:px-4',
    md: () => 'px-4 sm:px-6 lg:px-8',
    lg: () => 'px-6 sm:px-8 lg:px-12',
    xl: () => 'px-8 sm:px-12 lg:px-16',
  },

  // Gap scales for flex/grid
  gap: {
    sm: () => 'gap-2 sm:gap-3 lg:gap-4',
    md: () => 'gap-4 sm:gap-6 lg:gap-8',
    lg: () => 'gap-6 sm:gap-8 lg:gap-12',
    xl: () => 'gap-8 sm:gap-12 lg:gap-16',
  },
};

// Component sizing utilities
export const responsiveSizing = {
  // Button sizes that scale with breakpoints
  button: {
    sm: () => 'px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm',
    md: () => 'px-3 py-2 text-sm sm:px-4 sm:py-2 sm:text-base',
    lg: () => 'px-4 py-2 text-base sm:px-6 sm:py-3 sm:text-lg',
    xl: () => 'px-6 py-3 text-lg sm:px-8 sm:py-4 sm:text-xl',
  },

  // Input sizes
  input: {
    sm: () => 'px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm',
    md: () => 'px-3 py-2 text-sm sm:px-4 sm:py-2 sm:text-base',
    lg: () => 'px-4 py-2 text-base sm:px-4 sm:py-3 sm:text-lg',
  },

  // Icon sizes
  icon: {
    xs: () => 'w-3 h-3 sm:w-4 sm:h-4',
    sm: () => 'w-4 h-4 sm:w-5 sm:h-5',
    md: () => 'w-5 h-5 sm:w-6 sm:h-6',
    lg: () => 'w-6 h-6 sm:w-8 sm:h-8',
    xl: () => 'w-8 h-8 sm:w-10 sm:h-10',
  },
};

// Mobile-specific utilities
export const mobileUtils = {
  // Touch target sizes (minimum 44px for accessibility)
  touchTarget: () => 'min-h-[44px] min-w-[44px]',

  // Safe area handling for mobile devices
  safeArea: () => `
    pb-safe-bottom
    pl-safe-left
    pr-safe-right
  `,

  // Mobile-optimized scrolling
  mobileScroll: () => `
    overflow-auto
    -webkit-overflow-scrolling: touch
    scroll-behavior: smooth
  `,

  // Mobile-friendly tap highlights
  tapHighlight: () => `
    -webkit-tap-highlight-color: transparent
    select-none
  `,

  // Prevent zoom on iOS
  preventZoom: () => `
    touch-action: manipulation
  `,
};

// Responsive layout patterns
export const layoutPatterns = {
  // Two-column layout that stacks on mobile
  twoColumn: () => `
    grid grid-cols-1 lg:grid-cols-2
    gap-6 lg:gap-8
  `,

  // Three-column layout with progressive stacking
  threeColumn: () => `
    grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
    gap-4 md:gap-6 lg:gap-8
  `,

  // Sidebar layout
  sidebar: () => `
    grid grid-cols-1 lg:grid-cols-4
    gap-6 lg:gap-8
  `,

  sidebarContent: () => `
    lg:col-span-3
  `,

  sidebarSidebar: () => `
    lg:col-span-1
  `,

  // Header layout
  header: () => `
    flex flex-col sm:flex-row
    items-start sm:items-center
    justify-between
    gap-4 sm:gap-6
  `,

  // Card layout
  cardGrid: () => `
    grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
    gap-4 sm:gap-6 lg:gap-8
  `,

  // List layout that adapts to screen size
  adaptiveList: () => `
    space-y-3 sm:space-y-4
    sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0
    lg:grid-cols-3 lg:gap-6
  `,
};

// Responsive testing utilities
export const testingUtils = {
  // Log current viewport information
  logViewportInfo: () => {
    if (typeof window !== 'undefined') {
      // Viewport info collected silently for testing
      void {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
        orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
      };
    }
  },

  // Test if element is visible in viewport
  isElementInViewport: (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  // Get element's responsive behavior
  getElementResponsiveBehavior: (element: HTMLElement) => {
    const computedStyle = window.getComputedStyle(element);
    return {
      display: computedStyle.display,
      flexDirection: computedStyle.flexDirection,
      gridTemplateColumns: computedStyle.gridTemplateColumns,
      width: computedStyle.width,
      height: computedStyle.height,
      padding: computedStyle.padding,
      margin: computedStyle.margin,
    };
  },

  // Simulate different viewport sizes
  simulateViewport: (_width: number, _height: number) => {
    if (typeof window !== 'undefined' && window.screen) {
      // This is for testing/debugging purposes only
      // Simulating viewport: use Playwright or Cypress in real testing
      // In a real testing environment, you'd use tools like Playwright or Cypress
      // to actually change the viewport size
    }
  },
};

// Performance utilities for responsive design
export const performanceUtils = {
  // Lazy load images based on viewport
  shouldLoadImage: (element: HTMLElement, offset: number = 100) => {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    return rect.top <= windowHeight + offset;
  },

  // Debounce resize events
  debounceResize: (callback: () => void, delay: number = 250) => {
    let timeoutId: number;

    return () => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(callback, delay);
    };
  },

  // Throttle scroll events
  throttleScroll: (callback: () => void, delay: number = 16) => {
    let isThrottled = false;

    return () => {
      if (!isThrottled) {
        callback();
        isThrottled = true;
        setTimeout(() => {
          isThrottled = false;
        }, delay);
      }
    };
  },
};

// Export all utilities
export default {
  breakpoints,
  deviceCategories,
  commonDevices,
  useResponsive,
  responsiveContainers,
  responsiveText,
  responsiveSpacing,
  responsiveSizing,
  mobileUtils,
  layoutPatterns,
  testingUtils,
  performanceUtils,
};
