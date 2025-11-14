// Map Controls Panel Component
// Phase 2.3: Comprehensive map controls with fullscreen and advanced features

import React, { useState, useCallback } from 'react';
import { cn } from '../../utils/cn';

type LeafletMap = any;
import { useRouteStore, useUIStore } from '../../store';
import { zoomToFitWaypoints, calculateRouteDistance, formatDistance } from '../../utils/mapUtils';
import { useMapKeyboardShortcuts } from '../../hooks/useMapKeyboardShortcuts';

interface MapControlsPanelProps {
  map: LeafletMap | null;
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
    <div className="absolute top-4 right-4 z-30 flex flex-col space-y-2 hidden sm:flex">
      {/* Main Controls */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Zoom Controls */}
        <button
          onClick={handleZoomIn}
          className="block w-10 h-10 flex items-center justify-center hover:bg-gray-50 border-b border-gray-200 transition-colors"
          title="Zoom in (+)"
          aria-label="Zoom in"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        <button
          onClick={handleZoomOut}
          className="block w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
          title="Zoom out (-)"
          aria-label="Zoom out"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
          </svg>
        </button>
      </div>

      {/* Advanced Controls */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Zoom to Fit */}
        <button
          onClick={handleZoomToFit}
          disabled={waypoints.length === 0}
          className={cn(
            "block w-10 h-10 flex items-center justify-center border-b border-gray-200 transition-colors",
            waypoints.length > 0
              ? "hover:bg-gray-50 text-gray-700"
              : "text-gray-300 cursor-not-allowed"
          )}
          title={`Zoom to fit waypoints (Ctrl+F)${waypoints.length === 0 ? ' - Add waypoints first' : ''}`}
          aria-label="Zoom to fit all waypoints"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>

        {/* Reset View */}
        <button
          onClick={onResetView}
          className="block w-10 h-10 flex items-center justify-center hover:bg-gray-50 border-b border-gray-200 transition-colors"
          title="Reset to Europe view (Ctrl+R)"
          aria-label="Reset to Europe view"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a9 9 0 019 9 9 9 0 019-9M12 12V9" />
          </svg>
        </button>

        {/* Layer Control Toggle */}
        <button
          onClick={onToggleLayerControl}
          className={cn(
            "block w-10 h-10 flex items-center justify-center hover:bg-gray-50 border-b border-gray-200 transition-colors",
            !layerControlCollapsed && "bg-blue-50 text-blue-600"
          )}
          title="Toggle layer control (Ctrl+L)"
          aria-label="Toggle map layer control"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={onToggleFullscreen}
          className={cn(
            "block w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors",
            isFullscreen && "bg-blue-50 text-blue-600"
          )}
          title={`${isFullscreen ? 'Exit' : 'Enter'} fullscreen (Alt+F)`}
          aria-label={`${isFullscreen ? 'Exit' : 'Enter'} fullscreen mode`}
        >
          {isFullscreen ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 9h4.5M15 9V4.5M15 9l5.5-5.5M9 15v4.5M9 15H4.5M9 15l-5.5 5.5M15 15h4.5M15 15v4.5m0-4.5l5.5 5.5" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          )}
        </button>
      </div>

      {/* Keyboard Shortcuts Toggle */}
      <button
        onClick={() => setShowShortcuts(!showShortcuts)}
        className={cn(
          "bg-white rounded-lg shadow-md p-2 hover:bg-gray-50 transition-colors",
          showShortcuts && "bg-blue-50 text-blue-600"
        )}
        title="Show keyboard shortcuts"
        aria-label="Toggle keyboard shortcuts help"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      </button>

      {/* Keyboard Shortcuts Panel */}
      {showShortcuts && (
        <div className="bg-white rounded-lg shadow-lg p-4 min-w-64 max-w-sm">
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">Keyboard Shortcuts</h3>
          <div className="space-y-2">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <span className="text-gray-600">{shortcut.description}</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-gray-900 font-mono">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Shortcuts work when not typing in input fields
            </p>
          </div>
        </div>
      )}

      {/* Route Info Panel (when waypoints exist) */}
      {waypoints.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-3 min-w-48">
          <h3 className="font-semibold text-gray-900 mb-2 text-sm">Route Info</h3>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Waypoints:</span>
              <span className="font-medium">{waypoints.length}</span>
            </div>
            {routeDistance > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Distance:</span>
                <span className="font-medium">{formatDistance(routeDistance)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={cn(
                "font-medium",
                waypoints.length >= 2 ? "text-green-600" : "text-orange-600"
              )}>
                {waypoints.length >= 2 ? "Ready for routing" : "Need more waypoints"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapControlsPanel;