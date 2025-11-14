// Animation and Transition Utilities
// Phase 6.3: Professional animations and micro-interactions

import { cn } from './cn';
import { useReducedMotion } from './accessibility';

// Animation presets that respect reduced motion preferences
export const animations = {
  // Fade animations
  fadeIn: (reducedMotion: boolean = false) => cn(
    'transition-opacity duration-300 ease-out',
    reducedMotion ? '' : 'animate-fade-in'
  ),

  fadeOut: (reducedMotion: boolean = false) => cn(
    'transition-opacity duration-300 ease-out',
    reducedMotion ? '' : 'animate-fade-out'
  ),

  // Scale animations
  scaleIn: (reducedMotion: boolean = false) => cn(
    'transition-transform duration-300 ease-out',
    reducedMotion ? '' : 'animate-scale-in'
  ),

  scaleOut: (reducedMotion: boolean = false) => cn(
    'transition-transform duration-300 ease-out',
    reducedMotion ? '' : 'animate-scale-out'
  ),

  // Slide animations
  slideInUp: (reducedMotion: boolean = false) => cn(
    'transition-transform duration-500 ease-out',
    reducedMotion ? '' : 'animate-slide-up'
  ),

  slideInDown: (reducedMotion: boolean = false) => cn(
    'transition-transform duration-500 ease-out',
    reducedMotion ? '' : 'animate-slide-down'
  ),

  slideInLeft: (reducedMotion: boolean = false) => cn(
    'transition-transform duration-500 ease-out',
    reducedMotion ? '' : 'animate-slide-left'
  ),

  slideInRight: (reducedMotion: boolean = false) => cn(
    'transition-transform duration-500 ease-out',
    reducedMotion ? '' : 'animate-slide-right'
  ),

  // Bounce animation
  bounce: (reducedMotion: boolean = false) => cn(
    reducedMotion ? '' : 'animate-bounce'
  ),

  // Pulse animation
  pulse: (reducedMotion: boolean = false) => cn(
    reducedMotion ? '' : 'animate-pulse'
  ),

  // Spin animation
  spin: (reducedMotion: boolean = false) => cn(
    reducedMotion ? '' : 'animate-spin'
  ),

  // Shake animation for errors
  shake: (reducedMotion: boolean = false) => cn(
    reducedMotion ? '' : 'animate-shake'
  ),

  // Wiggle animation for attention
  wiggle: (reducedMotion: boolean = false) => cn(
    reducedMotion ? '' : 'animate-wiggle'
  ),
};

// Transition presets
export const transitions = {
  // Standard transitions
  fast: 'transition-all duration-150 ease-out',
  normal: 'transition-all duration-300 ease-out',
  slow: 'transition-all duration-500 ease-out',

  // Specific property transitions
  colors: 'transition-colors duration-200 ease-out',
  opacity: 'transition-opacity duration-300 ease-out',
  transform: 'transition-transform duration-300 ease-out',
  shadow: 'transition-shadow duration-200 ease-out',

  // Easing functions
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
};

// Micro-interaction utilities
export const microInteractions = {
  // Button interactions
  buttonPress: (reducedMotion: boolean = false) => cn(
    'transition-transform duration-150 ease-out',
    reducedMotion ? '' : 'active:scale-95'
  ),

  buttonHover: (reducedMotion: boolean = false) => cn(
    'transition-all duration-200 ease-out',
    reducedMotion ? 'hover:bg-opacity-90' : 'hover:scale-105 hover:shadow-lg'
  ),

  // Card interactions
  cardHover: (reducedMotion: boolean = false) => cn(
    'transition-all duration-300 ease-out',
    reducedMotion ? 'hover:bg-gray-50' : 'hover:scale-105 hover:shadow-xl'
  ),

  cardPress: (reducedMotion: boolean = false) => cn(
    'transition-transform duration-150 ease-out',
    reducedMotion ? '' : 'active:scale-98'
  ),

  // Input interactions
  inputFocus: () => cn(
    'transition-all duration-200 ease-out',
    'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
  ),

  // Icon interactions
  iconSpin: (reducedMotion: boolean = false) => cn(
    reducedMotion ? '' : 'hover:animate-spin'
  ),

  iconBounce: (reducedMotion: boolean = false) => cn(
    reducedMotion ? '' : 'hover:animate-bounce'
  ),

  // Loading interactions
  loadingPulse: (reducedMotion: boolean = false) => cn(
    reducedMotion ? 'opacity-70' : 'animate-pulse'
  ),

  loadingSpin: (reducedMotion: boolean = false) => cn(
    reducedMotion ? '' : 'animate-spin'
  ),
};

// Complex animation sequences
export const sequences = {
  // Staggered animations for lists
  staggeredFadeIn: (index: number, reducedMotion: boolean = false) => ({
    className: cn(
      'transition-all duration-500 ease-out',
      reducedMotion ? '' : 'animate-fade-in'
    ),
    style: reducedMotion ? {} : {
      animationDelay: `${index * 100}ms`,
      animationFillMode: 'both'
    }
  }),

  // Progressive reveal
  progressiveReveal: (delay: number = 0, reducedMotion: boolean = false) => ({
    className: cn(
      'transition-all duration-700 ease-out',
      reducedMotion ? '' : 'animate-slide-up'
    ),
    style: reducedMotion ? {} : {
      animationDelay: `${delay}ms`,
      animationFillMode: 'both'
    }
  }),

  // Typewriter effect for text
  typewriter: (text: string, _speed: number = 50, reducedMotion: boolean = false) => {
    if (reducedMotion) return text;

    // This would be implemented with a custom hook in React
    return text;
  },
};

// React hooks for animations
export const useAnimations = () => {
  const prefersReducedMotion = useReducedMotion();

  return {
    // Standard animations that respect reduced motion
    fadeIn: animations.fadeIn(prefersReducedMotion),
    fadeOut: animations.fadeOut(prefersReducedMotion),
    scaleIn: animations.scaleIn(prefersReducedMotion),
    scaleOut: animations.scaleOut(prefersReducedMotion),
    slideInUp: animations.slideInUp(prefersReducedMotion),
    slideInDown: animations.slideInDown(prefersReducedMotion),
    slideInLeft: animations.slideInLeft(prefersReducedMotion),
    slideInRight: animations.slideInRight(prefersReducedMotion),
    bounce: animations.bounce(prefersReducedMotion),
    pulse: animations.pulse(prefersReducedMotion),
    spin: animations.spin(prefersReducedMotion),
    shake: animations.shake(prefersReducedMotion),
    wiggle: animations.wiggle(prefersReducedMotion),

    // Micro-interactions
    buttonPress: microInteractions.buttonPress(prefersReducedMotion),
    buttonHover: microInteractions.buttonHover(prefersReducedMotion),
    cardHover: microInteractions.cardHover(prefersReducedMotion),
    cardPress: microInteractions.cardPress(prefersReducedMotion),
    inputFocus: microInteractions.inputFocus(),
    iconSpin: microInteractions.iconSpin(prefersReducedMotion),
    iconBounce: microInteractions.iconBounce(prefersReducedMotion),
    loadingPulse: microInteractions.loadingPulse(prefersReducedMotion),
    loadingSpin: microInteractions.loadingSpin(prefersReducedMotion),

    // Sequences
    staggeredFadeIn: (index: number) => sequences.staggeredFadeIn(index, prefersReducedMotion),
    progressiveReveal: (delay: number = 0) => sequences.progressiveReveal(delay, prefersReducedMotion),

    // Utility
    prefersReducedMotion,
  };
};

// CSS custom properties for dynamic animations
export const cssVariables = {
  setAnimationDuration: (element: HTMLElement, duration: string) => {
    element.style.setProperty('--animation-duration', duration);
  },

  setAnimationDelay: (element: HTMLElement, delay: string) => {
    element.style.setProperty('--animation-delay', delay);
  },

  setAnimationEasing: (element: HTMLElement, easing: string) => {
    element.style.setProperty('--animation-easing', easing);
  },
};

// Performance-optimized animation utilities
export const performanceUtils = {
  // Use will-change for elements that will animate
  willChange: (properties: string[]) => ({
    willChange: properties.join(', ')
  }),

  // Remove will-change after animation
  clearWillChange: (element: HTMLElement) => {
    element.style.willChange = 'auto';
  },

  // Use transform3d for hardware acceleration
  transform3d: (x: number = 0, y: number = 0, z: number = 0) => ({
    transform: `translate3d(${x}px, ${y}px, ${z}px)`
  }),

  // Optimize for animations
  optimizeForAnimation: () => cn(
    'will-change-transform',
    'backface-visibility-hidden',
    'transform-gpu'
  ),
};

// Toast notification animations
export const toastAnimations = {
  enter: (position: 'top' | 'bottom' | 'center' = 'top', reducedMotion: boolean = false) => {
    if (reducedMotion) return 'opacity-100';

    switch (position) {
      case 'top':
        return 'animate-slide-down opacity-100';
      case 'bottom':
        return 'animate-slide-up opacity-100';
      case 'center':
        return 'animate-scale-in opacity-100';
      default:
        return 'animate-fade-in opacity-100';
    }
  },

  exit: (position: 'top' | 'bottom' | 'center' = 'top', reducedMotion: boolean = false) => {
    if (reducedMotion) return 'opacity-0';

    switch (position) {
      case 'top':
        return 'animate-slide-up opacity-0';
      case 'bottom':
        return 'animate-slide-down opacity-0';
      case 'center':
        return 'animate-scale-out opacity-0';
      default:
        return 'animate-fade-out opacity-0';
    }
  },
};

// Modal animations
export const modalAnimations = {
  overlay: {
    enter: (reducedMotion: boolean = false) => cn(
      'transition-opacity duration-300 ease-out',
      reducedMotion ? 'opacity-100' : 'animate-fade-in opacity-100'
    ),
    exit: (reducedMotion: boolean = false) => cn(
      'transition-opacity duration-300 ease-out',
      reducedMotion ? 'opacity-0' : 'animate-fade-out opacity-0'
    ),
  },

  content: {
    enter: (reducedMotion: boolean = false) => cn(
      'transition-all duration-300 ease-out',
      reducedMotion ? 'opacity-100' : 'animate-scale-in opacity-100'
    ),
    exit: (reducedMotion: boolean = false) => cn(
      'transition-all duration-300 ease-out',
      reducedMotion ? 'opacity-0' : 'animate-scale-out opacity-0'
    ),
  },
};

// Page transition animations
export const pageTransitions = {
  fadeTransition: (reducedMotion: boolean = false) => ({
    enter: cn(
      'transition-opacity duration-500 ease-out',
      reducedMotion ? 'opacity-100' : 'animate-fade-in opacity-100'
    ),
    exit: cn(
      'transition-opacity duration-300 ease-out',
      reducedMotion ? 'opacity-0' : 'animate-fade-out opacity-0'
    ),
  }),

  slideTransition: (direction: 'left' | 'right' = 'right', reducedMotion: boolean = false) => ({
    enter: cn(
      'transition-transform duration-500 ease-out',
      reducedMotion ? 'transform-none' :
        direction === 'right' ? 'animate-slide-right' : 'animate-slide-left'
    ),
    exit: cn(
      'transition-transform duration-300 ease-out',
      reducedMotion ? 'transform-none' :
        direction === 'right' ? 'animate-slide-left' : 'animate-slide-right'
    ),
  }),
};

// Export all animation utilities
export default {
  animations,
  transitions,
  microInteractions,
  sequences,
  useAnimations,
  cssVariables,
  performanceUtils,
  toastAnimations,
  modalAnimations,
  pageTransitions,
};