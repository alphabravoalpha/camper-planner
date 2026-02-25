// Tour Positioning Hook
// Measures target DOM elements and calculates spotlight cutout + tooltip positions

import { useState, useEffect, useCallback } from 'react';
import type { TooltipPosition } from './tourSteps';

const GAP = 16; // px between cutout and tooltip
const TOOLTIP_WIDTH = 320;
const TOOLTIP_HEIGHT_ESTIMATE = 320;
const VIEWPORT_PADDING = 16;

export interface CutoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
  rx: number;
}

export interface TourPositionResult {
  /** The padded rectangle for the SVG cutout. null = no target (center mode). */
  cutoutRect: CutoutRect | null;
  /** Inline style for the tooltip card */
  tooltipStyle: React.CSSProperties;
  /** Whether the target element was found and visible in the DOM */
  isTargetFound: boolean;
}

function isElementVisible(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return false;
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  return true;
}

function calculateTooltipPosition(
  cutout: CutoutRect | null,
  preferred: TooltipPosition,
  viewportWidth: number,
  viewportHeight: number
): React.CSSProperties {
  // Center mode — no cutout with explicit center
  if (!cutout && preferred === 'center') {
    return {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    };
  }

  // Corner mode — no cutout but non-center preferred (e.g. waypoints step)
  // Positions tooltip in bottom-right corner so the map content stays visible
  if (!cutout) {
    return {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
    };
  }

  let top = 0;
  let left = 0;
  let resolvedPosition = preferred;

  // Try preferred position, flip if it doesn't fit
  if (resolvedPosition === 'below') {
    top = cutout.y + cutout.height + GAP;
    left = cutout.x + cutout.width / 2 - TOOLTIP_WIDTH / 2;
    if (top + TOOLTIP_HEIGHT_ESTIMATE > viewportHeight - VIEWPORT_PADDING) {
      resolvedPosition = 'above';
    }
  }

  if (resolvedPosition === 'above') {
    top = cutout.y - TOOLTIP_HEIGHT_ESTIMATE - GAP;
    left = cutout.x + cutout.width / 2 - TOOLTIP_WIDTH / 2;
    if (top < VIEWPORT_PADDING) {
      // Can't fit above either — just go below and let it scroll
      top = cutout.y + cutout.height + GAP;
    }
  }

  if (resolvedPosition === 'right') {
    top = cutout.y + cutout.height / 2 - TOOLTIP_HEIGHT_ESTIMATE / 2;
    left = cutout.x + cutout.width + GAP;
    if (left + TOOLTIP_WIDTH > viewportWidth - VIEWPORT_PADDING) {
      resolvedPosition = 'left';
    }
  }

  if (resolvedPosition === 'left') {
    top = cutout.y + cutout.height / 2 - TOOLTIP_HEIGHT_ESTIMATE / 2;
    left = cutout.x - TOOLTIP_WIDTH - GAP;
    if (left < VIEWPORT_PADDING) {
      // Can't fit left either — center horizontally below
      top = cutout.y + cutout.height + GAP;
      left = cutout.x + cutout.width / 2 - TOOLTIP_WIDTH / 2;
    }
  }

  // Clamp to viewport bounds
  left = Math.max(VIEWPORT_PADDING, Math.min(left, viewportWidth - TOOLTIP_WIDTH - VIEWPORT_PADDING));
  top = Math.max(VIEWPORT_PADDING, Math.min(top, viewportHeight - TOOLTIP_HEIGHT_ESTIMATE - VIEWPORT_PADDING));

  return {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`,
  };
}

export function useTourPositioning(
  targetSelector: string | null,
  tooltipPosition: TooltipPosition,
  spotlightPadding: number = 12,
  _step?: number // Forces re-measure when the active step changes (demo actions may alter DOM)
): TourPositionResult {
  const [result, setResult] = useState<TourPositionResult>({
    cutoutRect: null,
    tooltipStyle: {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    },
    isTargetFound: false,
  });

  const measure = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isMobile = vw < 640; // matches Tailwind's sm: breakpoint

    // No target → use preferred position (center or corner).
    // On mobile, always center since corner positioning can overflow.
    if (!targetSelector) {
      setResult({
        cutoutRect: null,
        tooltipStyle: calculateTooltipPosition(null, isMobile ? 'center' : tooltipPosition, vw, vh),
        isTargetFound: false,
      });
      return;
    }

    const el = document.querySelector(targetSelector);

    // Target not found or hidden (e.g. mobile) → center mode
    if (!el || !isElementVisible(el) || isMobile) {
      setResult({
        cutoutRect: null,
        tooltipStyle: calculateTooltipPosition(null, 'center', vw, vh),
        isTargetFound: false,
      });
      return;
    }

    const rect = el.getBoundingClientRect();
    const cutout: CutoutRect = {
      x: rect.x - spotlightPadding,
      y: rect.y - spotlightPadding,
      width: rect.width + spotlightPadding * 2,
      height: rect.height + spotlightPadding * 2,
      rx: 12,
    };

    const tooltipStyle = calculateTooltipPosition(cutout, tooltipPosition, vw, vh);

    setResult({
      cutoutRect: cutout,
      tooltipStyle,
      isTargetFound: true,
    });
  }, [targetSelector, tooltipPosition, spotlightPadding, _step]);

  // Measure on mount, on selector/position change, and on resize
  useEffect(() => {
    // Initial measure after a short delay to let the DOM settle
    const initialTimer = setTimeout(measure, 50);
    // Second measure to catch elements that appear after demo actions (onEnter runs at 100ms)
    const secondTimer = setTimeout(measure, 250);
    // Third measure as a safety net for slow panel animations
    const thirdTimer = setTimeout(measure, 500);

    const handleResize = () => measure();
    window.addEventListener('resize', handleResize);

    // ResizeObserver on body for layout shifts
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(measure);
      observer.observe(document.body);
    }

    return () => {
      clearTimeout(initialTimer);
      clearTimeout(secondTimer);
      clearTimeout(thirdTimer);
      window.removeEventListener('resize', handleResize);
      observer?.disconnect();
    };
  }, [measure]);

  return result;
}
