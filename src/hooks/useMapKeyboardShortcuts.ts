// Map Keyboard Shortcuts Hook
// Enhanced keyboard controls for map operations

import { useEffect, useCallback } from 'react';
import { Map as LeafletMap } from 'leaflet';
import { useRouteStore } from '../store';
import { zoomToFitWaypoints } from '../utils/mapUtils';

interface MapKeyboardShortcutsOptions {
  map: LeafletMap | null;
  onToggleFullscreen?: () => void;
  onToggleLayerControl?: () => void;
  onResetView?: () => void;
}

interface MapShortcut {
  key: string;
  description: string;
  action: () => void;
  available: boolean;
}

export const useMapKeyboardShortcuts = ({
  map,
  onToggleFullscreen,
  onToggleLayerControl,
  onResetView,
}: MapKeyboardShortcutsOptions) => {
  const { waypoints } = useRouteStore();

  // Map navigation actions
  const zoomIn = useCallback(() => {
    if (map) {
      map.zoomIn();
    }
  }, [map]);

  const zoomOut = useCallback(() => {
    if (map) {
      map.zoomOut();
    }
  }, [map]);

  const panUp = useCallback(() => {
    if (map) {
      const center = map.getCenter();
      const zoom = map.getZoom();
      const deltaLat = (180 / Math.pow(2, zoom)) * 0.25; // Adjust pan distance based on zoom
      // @ts-expect-error - Leaflet panTo accepts array coordinates, type definitions are overly strict
      map.panTo([center.lat + deltaLat, center.lng]);
    }
  }, [map]);

  const panDown = useCallback(() => {
    if (map) {
      const center = map.getCenter();
      const zoom = map.getZoom();
      const deltaLat = (180 / Math.pow(2, zoom)) * 0.25;
      // @ts-expect-error - Leaflet panTo accepts array coordinates, type definitions are overly strict
      map.panTo([center.lat - deltaLat, center.lng]);
    }
  }, [map]);

  const panLeft = useCallback(() => {
    if (map) {
      const center = map.getCenter();
      const zoom = map.getZoom();
      const deltaLng = (360 / Math.pow(2, zoom)) * 0.25;
      // @ts-expect-error - Leaflet panTo accepts array coordinates, type definitions are overly strict
      map.panTo([center.lat, center.lng - deltaLng]);
    }
  }, [map]);

  const panRight = useCallback(() => {
    if (map) {
      const center = map.getCenter();
      const zoom = map.getZoom();
      const deltaLng = (360 / Math.pow(2, zoom)) * 0.25;
      // @ts-expect-error - Leaflet panTo accepts array coordinates, type definitions are overly strict
      map.panTo([center.lat, center.lng + deltaLng]);
    }
  }, [map]);

  const zoomToFit = useCallback(() => {
    if (map && waypoints.length > 0) {
      zoomToFitWaypoints(map, waypoints, {
        padding: [50, 50],
        maxZoom: 15,
        animate: true,
        duration: 1000,
      });
    }
  }, [map, waypoints]);

  const resetView = useCallback(() => {
    if (onResetView) {
      onResetView();
    }
  }, [onResetView]);

  const toggleFullscreen = useCallback(() => {
    if (onToggleFullscreen) {
      onToggleFullscreen();
    }
  }, [onToggleFullscreen]);

  const toggleLayerControl = useCallback(() => {
    if (onToggleLayerControl) {
      onToggleLayerControl();
    }
  }, [onToggleLayerControl]);

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement)?.contentEditable === 'true'
      ) {
        return;
      }

      // Check for modifier keys
      const isCtrl = event.ctrlKey || event.metaKey;
      const isShift = event.shiftKey;
      const isAlt = event.altKey;

      // Map navigation shortcuts
      switch (event.key.toLowerCase()) {
        // Zoom controls
        case '+':
        case '=':
          if (!isCtrl) {
            event.preventDefault();
            zoomIn();
          }
          break;

        case '-':
        case '_':
          if (!isCtrl) {
            event.preventDefault();
            zoomOut();
          }
          break;

        // Arrow key navigation
        case 'arrowup':
          if (!isCtrl && !isShift) {
            event.preventDefault();
            panUp();
          }
          break;

        case 'arrowdown':
          if (!isCtrl && !isShift) {
            event.preventDefault();
            panDown();
          }
          break;

        case 'arrowleft':
          if (!isCtrl && !isShift) {
            event.preventDefault();
            panLeft();
          }
          break;

        case 'arrowright':
          if (!isCtrl && !isShift) {
            event.preventDefault();
            panRight();
          }
          break;

        // WASD navigation (alternative to arrows)
        case 'w':
          if (!isCtrl) {
            event.preventDefault();
            panUp();
          }
          break;

        case 's':
          if (!isCtrl) {
            event.preventDefault();
            panDown();
          }
          break;

        case 'a':
          if (!isCtrl) {
            event.preventDefault();
            panLeft();
          }
          break;

        case 'd':
          if (!isCtrl) {
            event.preventDefault();
            panRight();
          }
          break;

        // Special functions
        case 'f':
          if (isCtrl) {
            event.preventDefault();
            zoomToFit();
          } else if (isAlt) {
            event.preventDefault();
            toggleFullscreen();
          }
          break;

        case 'r':
          if (isCtrl) {
            event.preventDefault();
            resetView();
          }
          break;

        case 'l':
          if (isCtrl) {
            event.preventDefault();
            toggleLayerControl();
          }
          break;

        case '0':
          if (!isCtrl) {
            event.preventDefault();
            resetView();
          }
          break;

        // Home key - zoom to fit
        case 'home':
          event.preventDefault();
          zoomToFit();
          break;

        // End key - reset view
        case 'end':
          event.preventDefault();
          resetView();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    zoomIn,
    zoomOut,
    panUp,
    panDown,
    panLeft,
    panRight,
    zoomToFit,
    resetView,
    toggleFullscreen,
    toggleLayerControl,
  ]);

  // Return available shortcuts for display in UI
  const shortcuts: MapShortcut[] = [
    { key: '+/-', description: 'Zoom in/out', action: zoomIn, available: !!map },
    { key: '↑↓←→', description: 'Pan map', action: panUp, available: !!map },
    { key: 'WASD', description: 'Pan map (alternative)', action: panUp, available: !!map },
    {
      key: 'Ctrl+F',
      description: 'Zoom to fit waypoints',
      action: zoomToFit,
      available: waypoints.length > 0,
    },
    { key: 'Ctrl+R', description: 'Reset view', action: resetView, available: !!onResetView },
    {
      key: 'Alt+F',
      description: 'Toggle fullscreen',
      action: toggleFullscreen,
      available: !!onToggleFullscreen,
    },
    {
      key: 'Ctrl+L',
      description: 'Toggle layer control',
      action: toggleLayerControl,
      available: !!onToggleLayerControl,
    },
    {
      key: 'Home',
      description: 'Zoom to fit waypoints',
      action: zoomToFit,
      available: waypoints.length > 0,
    },
    { key: 'End', description: 'Reset view', action: resetView, available: !!onResetView },
    { key: '0', description: 'Reset view', action: resetView, available: !!onResetView },
  ];

  return {
    shortcuts: shortcuts.filter(s => s.available),
    actions: {
      zoomIn,
      zoomOut,
      panUp,
      panDown,
      panLeft,
      panRight,
      zoomToFit,
      resetView,
      toggleFullscreen,
      toggleLayerControl,
    },
  };
};
