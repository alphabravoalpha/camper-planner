// Spotlight Overlay Component
// Full-screen SVG overlay with a transparent cutout around the target element.
//
// Z-index is fixed at 9997. Panels that need to appear ABOVE the overlay during
// the tour are boosted via CSS rules in index.css (keyed off body[data-tour-step]).
// The TourTooltip sits at 9999, above everything.

import React from 'react';
import type { CutoutRect } from './useTourPositioning';

interface SpotlightOverlayProps {
  /** The cutout rectangle. null = full dark overlay, no cutout. */
  cutoutRect: CutoutRect | null;
  /** Overlay opacity 0-1 (default 0.6). Lower values let background content show through. */
  overlayOpacity?: number;
  /** Click handler for clicking on the dark overlay area */
  onClick?: () => void;
}

const OVERLAY_Z_INDEX = 9997;

const SpotlightOverlay: React.FC<SpotlightOverlayProps> = ({
  cutoutRect,
  overlayOpacity = 0.6,
  onClick,
}) => {
  return (
    <svg
      className="fixed inset-0 pointer-events-auto"
      style={{
        width: '100vw',
        height: '100vh',
        zIndex: OVERLAY_Z_INDEX,
      }}
    >
      <defs>
        <mask id="spotlight-mask">
          {/* White = visible (overlay shows through), Black = hidden (cutout) */}
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          {cutoutRect && (
            <rect
              x={cutoutRect.x}
              y={cutoutRect.y}
              width={cutoutRect.width}
              height={cutoutRect.height}
              rx={cutoutRect.rx}
              fill="black"
              style={{
                transition: 'all 0.3s ease-out',
              }}
            />
          )}
        </mask>
      </defs>

      {/* Dark overlay with cutout */}
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill={`rgba(0, 0, 0, ${overlayOpacity})`}
        mask="url(#spotlight-mask)"
        onClick={onClick}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
      />

      {/* Highlight border around the cutout */}
      {cutoutRect && (
        <rect
          x={cutoutRect.x}
          y={cutoutRect.y}
          width={cutoutRect.width}
          height={cutoutRect.height}
          rx={cutoutRect.rx}
          fill="none"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="2"
          style={{
            transition: 'all 0.3s ease-out',
          }}
        />
      )}
    </svg>
  );
};

export default SpotlightOverlay;
