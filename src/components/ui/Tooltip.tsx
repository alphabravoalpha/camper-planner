// Tooltip Component
// Phase 2.4: Contextual help and accessibility-focused tooltips

import React, { useState, useRef, useEffect, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right' | 'auto';
export type TooltipSize = 'sm' | 'md' | 'lg';
export type TooltipVariant = 'default' | 'info' | 'warning' | 'error' | 'success';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: TooltipPosition;
  size?: TooltipSize;
  variant?: TooltipVariant;
  delay?: number;
  disabled?: boolean;
  className?: string;
  maxWidth?: string;
  showArrow?: boolean;
  trigger?: 'hover' | 'click' | 'focus';
  interactive?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'auto',
  size = 'md',
  variant = 'default',
  delay = 500,
  disabled = false,
  className,
  maxWidth = '300px',
  showArrow = true,
  trigger = 'hover',
  interactive = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState<TooltipPosition>(position);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Variant styles
  const variantStyles = {
    default: 'bg-neutral-900 text-white border-neutral-700',
    info: 'bg-primary-600 text-white border-primary-500',
    warning: 'bg-yellow-600 text-white border-yellow-500',
    error: 'bg-red-600 text-white border-red-500',
    success: 'bg-green-600 text-white border-green-500'
  };

  // Size styles
  const sizeStyles = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-3'
  };

  // Calculate optimal position
  const calculatePosition = (rect: DOMRect): TooltipPosition => {
    if (position !== 'auto') return position;

    const { innerWidth, innerHeight } = window;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    // Check available space in each direction
    const spaceTop = rect.top - scrollY;
    const spaceBottom = innerHeight - (rect.bottom - scrollY);
    const spaceLeft = rect.left - scrollX;
    const spaceRight = innerWidth - (rect.right - scrollX);

    // Prioritize positions with most space
    if (spaceBottom >= 60) return 'bottom';
    if (spaceTop >= 60) return 'top';
    if (spaceRight >= 150) return 'right';
    if (spaceLeft >= 150) return 'left';

    return 'bottom'; // fallback
  };

  // Calculate tooltip coordinates
  const calculateCoords = (triggerRect: DOMRect, pos: TooltipPosition) => {
    const tooltipElement = tooltipRef.current;
    if (!tooltipElement) return { x: 0, y: 0 };

    const tooltipRect = tooltipElement.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    let x = 0;
    let y = 0;

    switch (pos) {
      case 'top':
        x = triggerRect.left + scrollX + (triggerRect.width / 2) - (tooltipRect.width / 2);
        y = triggerRect.top + scrollY - tooltipRect.height - 8;
        break;
      case 'bottom':
        x = triggerRect.left + scrollX + (triggerRect.width / 2) - (tooltipRect.width / 2);
        y = triggerRect.bottom + scrollY + 8;
        break;
      case 'left':
        x = triggerRect.left + scrollX - tooltipRect.width - 8;
        y = triggerRect.top + scrollY + (triggerRect.height / 2) - (tooltipRect.height / 2);
        break;
      case 'right':
        x = triggerRect.right + scrollX + 8;
        y = triggerRect.top + scrollY + (triggerRect.height / 2) - (tooltipRect.height / 2);
        break;
    }

    // Keep tooltip within viewport bounds
    const padding = 8;
    x = Math.max(padding, Math.min(x, window.innerWidth + scrollX - tooltipRect.width - padding));
    y = Math.max(padding, Math.min(y, window.innerHeight + scrollY - tooltipRect.height - padding));

    return { x, y };
  };

  // Show tooltip
  const showTooltip = () => {
    if (disabled || !content) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const triggerElement = triggerRef.current;
      if (!triggerElement) return;

      const triggerRect = triggerElement.getBoundingClientRect();
      const optimalPosition = calculatePosition(triggerRect);

      setActualPosition(optimalPosition);
      setIsVisible(true);

      // Calculate coordinates after the tooltip is rendered
      requestAnimationFrame(() => {
        const newCoords = calculateCoords(triggerRect, optimalPosition);
        setCoords(newCoords);
      });
    }, delay);
  };

  // Hide tooltip
  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!interactive) {
      setIsVisible(false);
    } else {
      // Delay hiding for interactive tooltips
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 100);
    }
  };

  // Event handlers
  const handleMouseEnter = () => {
    if (trigger === 'hover') showTooltip();
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') hideTooltip();
  };

  const handleClick = () => {
    if (trigger === 'click') {
      if (isVisible) {
        hideTooltip();
      } else {
        showTooltip();
      }
    }
  };

  const handleFocus = () => {
    if (trigger === 'focus') showTooltip();
  };

  const handleBlur = () => {
    if (trigger === 'focus') hideTooltip();
  };

  const handleTooltipMouseEnter = () => {
    if (interactive && timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleTooltipMouseLeave = () => {
    if (interactive) hideTooltip();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Arrow component
  const Arrow = ({ position: pos }: { position: TooltipPosition }) => {
    if (!showArrow) return null;

    const arrowClasses = {
      top: 'border-l-transparent border-r-transparent border-b-0 border-t-8 border-t-neutral-900 bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full',
      bottom: 'border-l-transparent border-r-transparent border-t-0 border-b-8 border-b-neutral-900 top-0 left-1/2 transform -translate-x-1/2 -translate-y-full',
      left: 'border-t-transparent border-b-transparent border-r-0 border-l-8 border-l-neutral-900 right-0 top-1/2 transform translate-x-full -translate-y-1/2',
      right: 'border-t-transparent border-b-transparent border-l-0 border-r-8 border-r-neutral-900 left-0 top-1/2 transform -translate-x-full -translate-y-1/2'
    };

    return (
      <div
        className={cn(
          'absolute w-0 h-0',
          arrowClasses[pos as keyof typeof arrowClasses] || arrowClasses.bottom
        )}
        style={{
          borderColor: variant === 'default' ? 'rgb(17 24 39)' : variantStyles[variant].split(' ')[0].replace('bg-', 'rgb(')
        }}
      />
    );
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="inline-block"
      >
        {children}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className={cn(
            'fixed z-50 rounded-lg border shadow-lg transition-opacity duration-200',
            'pointer-events-auto select-text',
            variantStyles[variant],
            sizeStyles[size],
            className
          )}
          style={{
            left: coords.x,
            top: coords.y,
            maxWidth,
            pointerEvents: interactive ? 'auto' : 'none'
          }}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
        >
          {content}
          <Arrow position={actualPosition} />
        </div>
      )}
    </>
  );
};

export default Tooltip;