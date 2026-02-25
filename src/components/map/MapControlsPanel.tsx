// Map Controls Panel Component
// Phase 2.3: Comprehensive map controls with fullscreen and advanced features

import React, { useState, useCallback, useRef, useEffect } from 'react';
import * as L from 'leaflet';
import { cn } from '../../utils/cn';
import { useRouteStore, useUIStore } from '../../store';
import { zoomToFitWaypoints, calculateRouteDistance, formatDistance } from '../../utils/mapUtils';
import { useMapKeyboardShortcuts } from '../../hooks/useMapKeyboardShortcuts';

interface MapControlsPanelProps {
  map: L.Map | null;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onResetView: () => void;
  onToggleLayerControl: () => void;
  layerControlCollapsed: boolean;
}

const MapControlsPanel: React.FC<MapControlsPanelProps> = ({
  map,
  isFullscreen,
  onToggleFullscreen,
  onResetView,
  onToggleLayerControl,
  layerControlCollapsed
}) => {
  const { waypoints } = useRouteStore();
  const { addNotification } = useUIStore();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showOverflow, setShowOverflow] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);

  // Close overflow menu on click outside
  useEffect(() => {
    if (!showOverflow) return;
    const handleClick = (e: MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setShowOverflow(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showOverflow]);

  // Initialize keyboard shortcuts
  const { shortcuts, actions } = useMapKeyboardShortcuts({
    map,
    onToggleFullscreen,
    onToggleLayerControl,
    onResetView
  });

  const handleZoomToFit = useCallback(() => {
    if (!map || waypoints.length === 0) {
      addNotification({
        type: 'warning',
        message: 'Add waypoints to use zoom to fit'
      });
      return;
    }

    const success = zoomToFitWaypoints(map, waypoints, {
      padding: [50, 50],
      maxZoom: 15,
      animate: true,
      duration: 1000
    });

    if (success) {
      addNotification({
        type: 'success',
        message: 'Zoomed to fit all waypoints'
      });
    } else {
      addNotification({
        type: 'error',
        message: 'Failed to zoom to waypoints'
      });
    }
  }, [map, waypoints, addNotification]);

  const handleZoomIn = useCallback(() => {
    if (map) {
      actions.zoomIn();
    }
  }, [map, actions]);

  const handleZoomOut = useCallback(() => {
    if (map) {
      actions.zoomOut();
    }
  }, [map, actions]);

  const routeDistance = calculateRouteDistance(waypoints);

  return (
    <div className="absolute top-4 right-3 z-40 flex flex-col space-y-2 hidden sm:flex">
      {/* Main Controls */}
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-medium overflow-hidden">
        {/* Zoom Controls */}
        <button
          onClick={handleZoomIn}
          className="block w-10 h-10 flex items-center justify-center hover:bg-neutral-50 border-b border-neutral-200 transition-colors"
          title="Zoom in (+)"
          aria-label="Zoom in"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        <button
          onClick={handleZoomOut}
          className="block w-10 h-10 flex items-center justify-center hover:bg-neutral-50 transition-colors"
          title="Zoom out (-)"
          aria-label="Zoom out"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
          </svg>
        </button>
      </div>

      {/* Advanced Controls */}
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-medium overflow-hidden">
        {/* Zoom to Fit */}
        <button
          onClick={handleZoomToFit}
          disabled={waypoints.length === 0}
          className={cn(
            "block w-10 h-10 flex items-center justify-center border-b border-neutral-200 transition-colors",
            waypoints.length > 0
              ? "hover:bg-neutral-50 text-neutral-700"
              : "text-neutral-300 cursor-not-allowed"
          )}
          title={`Zoom to fit waypoints (Ctrl+F)${waypoints.length === 0 ? ' - Add waypoints first' : ''}`}
          aria-label="Zoom to fit all waypoints"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>

        {/* Overflow menu trigger */}
        <div className="relative" ref={overflowRef}>
          <button
            onClick={() => setShowOverflow(!showOverflow)}
            className={cn(
              "block w-10 h-10 flex items-center justify-center hover:bg-neutral-50 transition-colors",
              showOverflow && "bg-neutral-100"
            )}
            title="More options"
            aria-label="More map options"
            aria-expanded={showOverflow}
            aria-haspopup="menu"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>

          {showOverflow && (
            <div className="absolute right-12 top-0 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 min-w-[180px] z-50" role="menu">
              {/* Reset View */}
              <button
                onClick={() => { onResetView(); setShowOverflow(false); }}
                className="flex items-center gap-3 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 w-full"
                role="menuitem"
              >
                Reset to Europe view
              </button>
              {/* Layer Control */}
              <button
                onClick={() => { onToggleLayerControl(); setShowOverflow(false); }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm hover:bg-neutral-50 w-full",
                  !layerControlCollapsed ? "text-primary-600" : "text-neutral-700"
                )}
                role="menuitem"
              >
                Toggle layers
              </button>
              {/* Fullscreen */}
              <button
                onClick={() => { onToggleFullscreen(); setShowOverflow(false); }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm hover:bg-neutral-50 w-full",
                  isFullscreen ? "text-primary-600" : "text-neutral-700"
                )}
                role="menuitem"
              >
                {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              </button>
              <div className="border-t border-neutral-100 my-1" role="separator" />
              {/* Keyboard Shortcuts */}
              <button
                onClick={() => { setShowShortcuts(!showShortcuts); setShowOverflow(false); }}
                className="flex items-center gap-3 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 w-full"
                role="menuitem"
              >
                Keyboard shortcuts
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Keyboard Shortcuts Panel */}
      {showShortcuts && (
        <div className="bg-white rounded-lg shadow-lg p-4 min-w-64 max-w-sm">
          <h3 className="font-display font-semibold text-neutral-900 mb-3 text-sm">Keyboard Shortcuts</h3>
          <div className="space-y-2">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <span className="text-neutral-600">{shortcut.description}</span>
                <kbd className="px-2 py-1 bg-neutral-100 rounded text-neutral-900 font-mono">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-neutral-200">
            <p className="text-xs text-neutral-500">
              Shortcuts work when not typing in input fields
            </p>
          </div>
        </div>
      )}

      {/* Route Info Panel removed - info now shown in RouteCalculator component */}
    </div>
  );
};

export default MapControlsPanel;