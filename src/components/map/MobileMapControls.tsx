// Mobile Map Controls Component
// Phase 2.3: Touch-optimized controls for mobile devices

import React, { useState, useCallback, useEffect } from 'react';
import { Map as LeafletMap } from 'leaflet';
import { cn } from '../../utils/cn';
import { useRouteStore, useUIStore } from '../../store';
import { zoomToFitWaypoints } from '../../utils/mapUtils';

interface MobileMapControlsProps {
  map: LeafletMap | null;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onResetView: () => void;
  onToggleLayerControl: () => void;
  className?: string;
}

const MobileMapControls: React.FC<MobileMapControlsProps> = ({
  map,
  isFullscreen,
  onToggleFullscreen,
  onResetView,
  onToggleLayerControl,
  className
}) => {
  const { waypoints } = useRouteStore();
  const { addNotification } = useUIStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleZoomIn = useCallback(() => {
    if (map) {
      map.zoomIn();
    }
  }, [map]);

  const handleZoomOut = useCallback(() => {
    if (map) {
      map.zoomOut();
    }
  }, [map]);

  const handleZoomToFit = useCallback(() => {
    if (!map || waypoints.length === 0) {
      addNotification({
        type: 'warning',
        message: 'Add waypoints to use zoom to fit'
      });
      return;
    }

    const success = zoomToFitWaypoints(map, waypoints, {
      padding: [60, 60], // Larger padding for mobile
      maxZoom: 14, // Lower max zoom for mobile
      animate: true,
      duration: 800
    });

    if (success) {
      addNotification({
        type: 'success',
        message: 'Zoomed to fit waypoints'
      });
    }

    setIsExpanded(false);
  }, [map, waypoints, addNotification]);

  const handleToggleFullscreen = useCallback(() => {
    onToggleFullscreen();
    setIsExpanded(false);
  }, [onToggleFullscreen]);

  const handleResetView = useCallback(() => {
    onResetView();
    setIsExpanded(false);
  }, [onResetView]);

  const handleToggleLayerControl = useCallback(() => {
    onToggleLayerControl();
    setIsExpanded(false);
  }, [onToggleLayerControl]);

  // Don't render on desktop
  if (!isMobile) {
    return null;
  }

  return (
    <div className={cn(
      "fixed bottom-16 right-4 z-40 flex flex-col items-end space-y-2",
      "sm:hidden", // Only show on mobile/tablet
      className
    )}>
      {/* Expanded Controls */}
      {isExpanded && (
        <div className="bg-white rounded-lg shadow-lg p-2 grid grid-cols-2 gap-2 animate-fade-in">
          {/* Zoom to Fit */}
          <button
            onClick={handleZoomToFit}
            disabled={waypoints.length === 0}
            className={cn(
              "flex flex-col items-center justify-center h-16 w-16 rounded-lg transition-colors",
              waypoints.length > 0
                ? "bg-primary-50 hover:bg-primary-100 text-primary-600 active:bg-primary-200"
                : "bg-neutral-50 text-neutral-300 cursor-not-allowed"
            )}
          >
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            <span className="text-xs font-medium">Fit</span>
          </button>

          {/* Reset View */}
          <button
            onClick={handleResetView}
            className="flex flex-col items-center justify-center h-16 w-16 rounded-lg bg-neutral-50 hover:bg-neutral-100 text-neutral-600 active:bg-neutral-200 transition-colors"
          >
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a9 9 0 019 9 9 9 0 019-9M12 12V9" />
            </svg>
            <span className="text-xs font-medium">Reset</span>
          </button>

          {/* Layer Control */}
          <button
            onClick={handleToggleLayerControl}
            className="flex flex-col items-center justify-center h-16 w-16 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-600 active:bg-purple-200 transition-colors"
          >
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span className="text-xs font-medium">Layers</span>
          </button>

          {/* Fullscreen */}
          <button
            onClick={handleToggleFullscreen}
            className={cn(
              "flex flex-col items-center justify-center h-16 w-16 rounded-lg transition-colors",
              isFullscreen
                ? "bg-primary-100 text-primary-700 active:bg-primary-200"
                : "bg-green-50 hover:bg-green-100 text-green-600 active:bg-green-200"
            )}
          >
            {isFullscreen ? (
              <>
                <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 9h4.5M15 9V4.5M15 9l5.5-5.5M9 15v4.5M9 15H4.5M9 15l-5.5 5.5M15 15h4.5M15 15v4.5m0-4.5l5.5 5.5" />
                </svg>
                <span className="text-xs font-medium">Exit</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                <span className="text-xs font-medium">Full</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Main Floating Controls */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Zoom Controls */}
        <div className="flex">
          <button
            onClick={handleZoomIn}
            className="w-12 h-12 flex items-center justify-center hover:bg-neutral-50 active:bg-neutral-100 border-r border-neutral-200 transition-colors"
            aria-label="Zoom in"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          <button
            onClick={handleZoomOut}
            className="w-12 h-12 flex items-center justify-center hover:bg-neutral-50 active:bg-neutral-100 transition-colors"
            aria-label="Zoom out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
            </svg>
          </button>
        </div>
      </div>

      {/* More Options Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-12 h-12 bg-primary-600 text-white rounded-lg shadow-lg flex items-center justify-center transition-all",
          isExpanded
            ? "bg-neutral-600 rotate-45"
            : "hover:bg-primary-700 active:bg-primary-800"
        )}
        aria-label={isExpanded ? "Close more options" : "Open more options"}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>

      {/* Touch Instructions removed — the floating "Plan a Trip" button serves this purpose */}
    </div>
  );
};

export default MobileMapControls;