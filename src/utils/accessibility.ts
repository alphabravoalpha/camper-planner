// Accessibility Utilities and Enhancements
// Phase 6.3: Comprehensive accessibility improvements for WCAG compliance

import { useEffect, useRef, useState } from 'react';

// Screen reader announcements
export class ScreenReaderAnnouncer {
  private static instance: ScreenReaderAnnouncer;
  private announceElement: HTMLElement | null = null;

  static getInstance(): ScreenReaderAnnouncer {
    if (!ScreenReaderAnnouncer.instance) {
      ScreenReaderAnnouncer.instance = new ScreenReaderAnnouncer();
    }
    return ScreenReaderAnnouncer.instance;
  }

  constructor() {
    this.createAnnounceElement();
  }

  private createAnnounceElement() {
    if (typeof window === 'undefined') return;

    this.announceElement = document.createElement('div');
    this.announceElement.setAttribute('aria-live', 'polite');
    this.announceElement.setAttribute('aria-atomic', 'true');
    this.announceElement.setAttribute('aria-hidden', 'false');
    this.announceElement.className = 'sr-only';
    this.announceElement.style.position = 'absolute';
    this.announceElement.style.left = '-10000px';
    this.announceElement.style.width = '1px';
    this.announceElement.style.height = '1px';
    this.announceElement.style.overflow = 'hidden';

    document.body.appendChild(this.announceElement);
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (!this.announceElement) return;

    this.announceElement.setAttribute('aria-live', priority);

    // Clear previous message
    this.announceElement.textContent = '';

    // Announce new message after a brief delay to ensure screen readers pick it up
    setTimeout(() => {
      if (this.announceElement) {
        this.announceElement.textContent = message;
      }
    }, 100);

    // Clear message after announcement
    setTimeout(() => {
      if (this.announceElement) {
        this.announceElement.textContent = '';
      }
    }, 1000);
  }
}

// Hook for screen reader announcements
export const useAnnounce = () => {
  const announcer = ScreenReaderAnnouncer.getInstance();

  return (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    announcer.announce(message, priority);
  };
};

// Keyboard navigation utilities
export const keyboardNavigation = {
  // Common keyboard event handlers
  handleEnterKey: (callback: () => void) => (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      callback();
    }
  },

  handleSpaceKey: (callback: () => void) => (event: React.KeyboardEvent) => {
    if (event.key === ' ') {
      event.preventDefault();
      callback();
    }
  },

  handleEscapeKey: (callback: () => void) => (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      callback();
    }
  },

  handleArrowKeys: (callbacks: {
    up?: () => void;
    down?: () => void;
    left?: () => void;
    right?: () => void;
  }) => (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowUp':
        if (callbacks.up) {
          event.preventDefault();
          callbacks.up();
        }
        break;
      case 'ArrowDown':
        if (callbacks.down) {
          event.preventDefault();
          callbacks.down();
        }
        break;
      case 'ArrowLeft':
        if (callbacks.left) {
          event.preventDefault();
          callbacks.left();
        }
        break;
      case 'ArrowRight':
        if (callbacks.right) {
          event.preventDefault();
          callbacks.right();
        }
        break;
    }
  },

  // Tab management
  trapFocus: (containerRef: React.RefObject<HTMLElement>) => {
    const focusableElements = containerRef.current?.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
    );

    if (!focusableElements || focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    return (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };
  }
};

// Focus management hooks
export const useFocusTrap = (isActive: boolean) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const handleKeyDown = keyboardNavigation.trapFocus(containerRef);

    document.addEventListener('keydown', handleKeyDown);

    // Focus first focusable element
    const focusableElements = containerRef.current.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
    );

    if (focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive]);

  return containerRef;
};

export const useAutoFocus = (shouldFocus: boolean = true) => {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (shouldFocus && elementRef.current) {
      elementRef.current.focus();
    }
  }, [shouldFocus]);

  return elementRef;
};

// ARIA utilities
export const aria = {
  // Generate unique IDs for ARIA relationships
  generateId: (prefix: string = 'aria') => `${prefix}-${Math.random().toString(36).substr(2, 9)}`,

  // Common ARIA attributes
  labelledBy: (id: string) => ({ 'aria-labelledby': id }),
  describedBy: (id: string) => ({ 'aria-describedby': id }),
  expanded: (expanded: boolean) => ({ 'aria-expanded': expanded }),
  selected: (selected: boolean) => ({ 'aria-selected': selected }),
  pressed: (pressed: boolean) => ({ 'aria-pressed': pressed }),
  checked: (checked: boolean) => ({ 'aria-checked': checked }),
  disabled: (disabled: boolean) => ({ 'aria-disabled': disabled }),
  hidden: (hidden: boolean) => ({ 'aria-hidden': hidden }),
  live: (level: 'off' | 'polite' | 'assertive') => ({ 'aria-live': level }),
  role: (role: string) => ({ role }),

  // Complex ARIA patterns
  combobox: (expanded: boolean, hasPopup: boolean = true) => ({
    role: 'combobox',
    'aria-expanded': expanded,
    'aria-haspopup': hasPopup ? 'listbox' : false,
  }),

  listbox: (multiselectable: boolean = false) => ({
    role: 'listbox',
    'aria-multiselectable': multiselectable,
  }),

  option: (selected: boolean = false) => ({
    role: 'option',
    'aria-selected': selected,
  }),

  tab: (selected: boolean = false, controls?: string) => ({
    role: 'tab',
    'aria-selected': selected,
    ...(controls && { 'aria-controls': controls }),
  }),

  tabpanel: (labelledBy?: string) => ({
    role: 'tabpanel',
    ...(labelledBy && { 'aria-labelledby': labelledBy }),
  }),

  dialog: (labelledBy?: string, describedBy?: string) => ({
    role: 'dialog',
    'aria-modal': true,
    ...(labelledBy && { 'aria-labelledby': labelledBy }),
    ...(describedBy && { 'aria-describedby': describedBy }),
  }),

  button: (pressed?: boolean, expanded?: boolean) => ({
    role: 'button',
    ...(pressed !== undefined && { 'aria-pressed': pressed }),
    ...(expanded !== undefined && { 'aria-expanded': expanded }),
  }),
};

// Color contrast utilities
export const colorContrast = {
  // Check if color combination meets WCAG AA standards
  checkContrast: (foreground: string, background: string): boolean => {
    // This is a simplified check - in production, use a proper color contrast library
    const fgLum = colorContrast.getLuminance(foreground);
    const bgLum = colorContrast.getLuminance(background);
    const ratio = (Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05);
    return ratio >= 4.5; // WCAG AA standard
  },

  getLuminance: (color: string): number => {
    // Simplified luminance calculation
    // In production, use a proper color manipulation library
    const rgb = colorContrast.hexToRgb(color);
    if (!rgb) return 0;

    const { r, g, b } = rgb;
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  hexToRgb: (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },
};

// Reduced motion utilities
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

// Text utilities for accessibility
export const textUtilities = {
  // Truncate text while preserving meaning
  truncate: (text: string, maxLength: number, suffix: string = '...'): string => {
    if (text.length <= maxLength) return text;

    const truncated = text.slice(0, maxLength - suffix.length);
    const lastSpace = truncated.lastIndexOf(' ');

    if (lastSpace > 0) {
      return truncated.slice(0, lastSpace) + suffix;
    }

    return truncated + suffix;
  },

  // Generate accessible labels
  generateLabel: (text: string, context?: string): string => {
    if (context) {
      return `${text} ${context}`;
    }
    return text;
  },

  // Create screen reader friendly descriptions
  createDescription: (parts: string[]): string => {
    return parts.filter(Boolean).join('. ') + '.';
  },
};

// Accessibility testing utilities
export const a11yTest = {
  // Check if element has accessible name
  hasAccessibleName: (element: HTMLElement): boolean => {
    const ariaLabel = element.getAttribute('aria-label');
    const ariaLabelledBy = element.getAttribute('aria-labelledby');
    const title = element.getAttribute('title');
    const textContent = element.textContent?.trim();
    const altText = (element as HTMLImageElement).alt;

    return !!(ariaLabel || ariaLabelledBy || title || textContent || altText);
  },

  // Check if interactive element has focus indicator
  hasFocusIndicator: (element: HTMLElement): boolean => {
    const computedStyles = window.getComputedStyle(element, ':focus');
    const outline = computedStyles.outline;
    const boxShadow = computedStyles.boxShadow;

    return outline !== 'none' || boxShadow !== 'none';
  },

  // Validate tab order
  validateTabOrder: (container: HTMLElement): HTMLElement[] => {
    const focusableElements = container.querySelectorAll(
      'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );

    return Array.from(focusableElements) as HTMLElement[];
  },
};

// Export all utilities
export default {
  ScreenReaderAnnouncer,
  useAnnounce,
  keyboardNavigation,
  useFocusTrap,
  useAutoFocus,
  aria,
  colorContrast,
  useReducedMotion,
  textUtilities,
  a11yTest,
};