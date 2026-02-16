// Waypoint Manager Component
// Phase 2.2: Enhanced waypoint system with drag-and-drop, editing, and context menu

import React, { useCallback, useState } from 'react';
import { Marker, Popup, useMapEvents } from 'react-leaflet';
import L, { DivIcon } from 'leaflet';
import { MapPin } from 'lucide-react';
import { useRouteStore, useMapStore, useUIStore } from '../../store';
import { type Waypoint } from '../../types';
import { cn } from '../../utils/cn';
import ContextMenu, { type ContextMenuItem } from '../ui/ContextMenu';
import ConfirmDialog from '../ui/ConfirmDialog';
import LocationSearch from '../ui/LocationSearch';
import RouteVisualization from './RouteVisualization';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

// Enhanced waypoint icon creation with improved visual feedback and touch optimization
const createWaypointIcon = (type: 'start' | 'waypoint' | 'end', index: number, isSelected = false, isDragging = false, isMobile = false): DivIcon => {
  const iconColors = {
    start: 'bg-green-500 border-green-600 text-white shadow-green-200',
    waypoint: 'bg-primary-500 border-primary-600 text-white shadow-primary-200',
    end: 'bg-red-500 border-red-600 text-white shadow-red-200'
  };

  // Inline SVG icons for Leaflet HTML strings
  const flagSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>';
  const iconSymbols = {
    start: flagSvg,
    waypoint: index.toString(),
    end: flagSvg
  };

  // Larger icons on mobile for better touch targets
  const iconSize = isMobile ? 56 : 48;
  const textSize = isMobile ? 'text-lg' : 'text-base';

  // Use full class names - Tailwind doesn't support dynamic class interpolation
  const sizeClass = isMobile ? 'w-14 h-14' : 'w-12 h-12';

  const baseClass = cn(
    'flex items-center justify-center rounded-full border-3 font-bold cursor-pointer relative touch-manipulation',
    sizeClass,
    textSize,
    'transform transition-all duration-200',
    iconColors[type]
  );

  const effectsClass = cn(
    isSelected && 'scale-125 ring-4 ring-white ring-opacity-60',
    isDragging && 'scale-110 shadow-2xl z-50',
    !isDragging && !isSelected && 'hover:scale-105 active:scale-95 hover:shadow-lg shadow-md'
  );

  // Add extra touch padding on mobile
  const touchPadding = isMobile ? `
    <div class="absolute -inset-2 rounded-full" style="touch-action: none;"></div>
  ` : '';

  return L.divIcon({
    html: `
      <div class="${baseClass} ${effectsClass}">
        ${touchPadding}
        <!-- Main icon content -->
        <span class="relative z-10">${iconSymbols[type]}</span>

        <!-- Pulse effect for start/end points -->
        ${(type === 'start' || type === 'end') ? `
          <div class="absolute inset-0 rounded-full ${iconColors[type].split(' ')[0]} opacity-20 animate-ping"></div>
        ` : ''}

        <!-- Selection indicator -->
        ${isSelected ? `
          <div class="absolute -inset-1 rounded-full border-2 border-white animate-pulse"></div>
        ` : ''}

        <!-- Drag drop zone indicator -->
        ${isDragging ? `
          <div class="absolute -inset-3 rounded-full border-2 border-dashed border-yellow-400 bg-yellow-100 bg-opacity-20"></div>
        ` : ''}
      </div>
    `,
    className: cn('waypoint-marker', isDragging && 'dragging', isMobile && 'touch-target'),
    iconSize: [iconSize, iconSize],
    iconAnchor: [iconSize / 2, iconSize / 2],
    popupAnchor: [0, -iconSize / 2]
  });
};

// Helper function to generate waypoint names
const generateWaypointName = (type: 'start' | 'waypoint' | 'end', index: number): string => {
  switch (type) {
    case 'start':
      return 'Start Point';
    case 'end':
      return 'Destination';
    case 'waypoint':
      return `Waypoint ${index}`;
    default:
      return `Point ${index + 1}`;
  }
};

// Helper function to create waypoint
const createWaypoint = (lat: number, lng: number, type: 'start' | 'waypoint' | 'end', index: number): Waypoint => ({
  id: `waypoint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  lat: Number(lat.toFixed(6)),
  lng: Number(lng.toFixed(6)),
  type,
  name: generateWaypointName(type, index)
});

interface WaypointMarkerProps {
  waypoint: Waypoint;
  index: number;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Waypoint>) => void;
  onInsertAfter: (waypoint: Waypoint, afterId: string) => void;
  onInsertBefore: (waypoint: Waypoint, beforeId: string) => void;
  onDragEnd: (id: string, newLat: number, newLng: number) => void;
}

const WaypointMarker: React.FC<WaypointMarkerProps> = ({
  waypoint,
  index,
  onDelete,
  onUpdate,
  onInsertAfter,
  onInsertBefore,
  onDragEnd
}) => {
  const { selectedWaypoint, setSelectedWaypoint } = useMapStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(waypoint.name);
  const [editedNotes, setEditedNotes] = useState(waypoint.notes || '');
  const [isDragging, setIsDragging] = useState(false);
  const [, setIsHovered] = useState(false);
  const [stagedLocation, setStagedLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [showLocationSearch, setShowLocationSearch] = useState(false);

  // Detect if on mobile/touch device
  const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  const isSelected = selectedWaypoint === waypoint.id;

  const handleMarkerClick = useCallback(() => {
    setSelectedWaypoint(waypoint.id);
  }, [waypoint.id, setSelectedWaypoint]);

  const handleDelete = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    onDelete(waypoint.id);
  }, [waypoint.id, onDelete]);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    // Haptic feedback for touch devices
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }, []);

  const handleDragEnd = useCallback((e: any) => {
    setIsDragging(false);
    const newLat = e.target.getLatLng().lat;
    const newLng = e.target.getLatLng().lng;
    onDragEnd(waypoint.id, newLat, newLng);
    // Haptic feedback for successful drop
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 100, 50]);
    }
  }, [waypoint.id, onDragEnd]);

  const handleMouseOver = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseOut = useCallback(() => {
    setIsHovered(false);
  }, []);

  const handleRightClick = useCallback((e: any) => {
    e.originalEvent.preventDefault();
    const { clientX, clientY } = e.originalEvent;
    setContextMenu({ x: clientX, y: clientY });
  }, []);

  const handleSaveEdit = useCallback(() => {
    const updates: Partial<Waypoint> = {};

    if (stagedLocation) {
      updates.lat = stagedLocation.lat;
      updates.lng = stagedLocation.lng;
    }

    if (editedName.trim() !== waypoint.name) {
      updates.name = editedName.trim();
    }

    if (editedNotes !== (waypoint.notes || '')) {
      updates.notes = editedNotes;
    }

    if (Object.keys(updates).length > 0) {
      onUpdate(waypoint.id, updates);
    }

    setIsEditing(false);
    setStagedLocation(null);
    setShowLocationSearch(false);
  }, [waypoint.id, waypoint.name, waypoint.notes, editedName, editedNotes, stagedLocation, onUpdate]);

  const handleCancelEdit = useCallback(() => {
    setEditedName(waypoint.name);
    setEditedNotes(waypoint.notes || '');
    setStagedLocation(null);
    setShowLocationSearch(false);
    setIsEditing(false);
  }, [waypoint.name, waypoint.notes]);

  const handleInsertBefore = useCallback(() => {
    const newWaypoint = createWaypoint(
      waypoint.lat - 0.01,
      waypoint.lng - 0.01,
      'waypoint',
      index
    );
    onInsertBefore(newWaypoint, waypoint.id);
  }, [waypoint, index, onInsertBefore]);

  const handleInsertAfter = useCallback(() => {
    const newWaypoint = createWaypoint(
      waypoint.lat + 0.01,
      waypoint.lng + 0.01,
      'waypoint',
      index + 1
    );
    onInsertAfter(newWaypoint, waypoint.id);
  }, [waypoint, index, onInsertAfter]);

  // Context menu items
  const contextMenuItems: ContextMenuItem[] = [
    {
      id: 'edit',
      label: 'Edit Waypoint',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      onClick: () => setIsEditing(true),
      shortcut: 'E'
    },
    {
      id: 'insert-before',
      label: 'Insert Before',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      onClick: handleInsertBefore,
      shortcut: 'Shift+↑'
    },
    {
      id: 'insert-after',
      label: 'Insert After',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      onClick: handleInsertAfter,
      shortcut: 'Shift+↓'
    },
    {
      id: 'delete',
      label: 'Delete Waypoint',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      onClick: handleDelete,
      variant: 'danger' as const,
      shortcut: 'Del'
    }
  ];

  // Normalize waypoint type for icon creation
  const iconType: 'start' | 'waypoint' | 'end' =
    waypoint.type === 'campsite' || waypoint.type === 'accommodation' ? 'waypoint' : waypoint.type;
  const icon = createWaypointIcon(iconType, index + 1, isSelected, isDragging, isMobile);

  return (
    <>
      <Marker
        position={[waypoint.lat, waypoint.lng]}
        // @ts-ignore - React-Leaflet v4 prop compatibility
        icon={icon}
        draggable={true}
        eventHandlers={{
          click: handleMarkerClick,
          contextmenu: handleRightClick,
          dragstart: handleDragStart,
          dragend: handleDragEnd,
          mouseover: handleMouseOver,
          mouseout: handleMouseOut
        }}
      >
        <Popup
          eventHandlers={{
            click: (e: any) => e.originalEvent?.stopPropagation()
          }}
        >
          <div className="min-w-72 p-2" onClick={(e) => e.stopPropagation()}>
            {/* Waypoint Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span
                  className={cn(
                    'px-2 py-1 rounded text-xs font-semibold',
                    waypoint.type === 'start' && 'bg-green-100 text-green-800',
                    waypoint.type === 'waypoint' && 'bg-primary-100 text-primary-800',
                    waypoint.type === 'end' && 'bg-red-100 text-red-800'
                  )}
                >
                  {waypoint.type === 'start' ? 'START' :
                   waypoint.type === 'end' ? 'END' :
                   `WAYPOINT ${index + 1}`}
                </span>
                <span className="text-xs text-neutral-500">
                  Drag to move
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setIsEditing(!isEditing);
                }}
                className="bg-primary-600 text-white hover:bg-primary-700 px-3 py-2 rounded text-sm font-bold transition-colors flex items-center space-x-2 border-2 border-primary-800 shadow-lg"
                title="Edit waypoint"
                aria-label="Edit waypoint"
                style={{ minWidth: '80px', zIndex: 1000 }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>EDIT</span>
              </button>
            </div>

            {isEditing ? (
              /* Edit Mode */
              <>
                <div className="mb-3">
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                    className="w-full px-2 py-1 text-sm border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter waypoint name"
                    autoFocus
                  />
                </div>

                <div className="mb-3">
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                    className="w-full px-2 py-1 text-sm border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    rows={3}
                    placeholder="Add notes about this waypoint..."
                  />
                </div>

                {/* Change Location Section */}
                <div className="mb-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setShowLocationSearch(!showLocationSearch);
                    }}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{showLocationSearch ? 'Hide location search' : 'Change location'}</span>
                  </button>

                  {showLocationSearch && (
                    <div className="mt-2">
                      <LocationSearch
                        onLocationSelect={(result) => {
                          const name = result.name || result.display_name.split(',')[0].trim();
                          setStagedLocation({
                            lat: result.lat,
                            lng: result.lng,
                            name
                          });
                          setEditedName(name);
                          setShowLocationSearch(false);
                        }}
                        placeholder="Search new location..."
                      />
                    </div>
                  )}

                  {stagedLocation && (
                    <div className="mt-1.5 text-xs text-green-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>New location: {stagedLocation.name}</span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2 pt-2 border-t border-neutral-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleSaveEdit();
                    }}
                    className="flex-1 px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleCancelEdit();
                    }}
                    className="flex-1 px-3 py-1 text-xs bg-neutral-600 text-white rounded hover:bg-neutral-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              /* View Mode */
              <>
                <div className="mb-3">
                  <div className="text-sm font-medium text-neutral-900 mb-1">
                    {waypoint.name}
                  </div>
                  {waypoint.notes && (
                    <div className="text-xs text-neutral-600 bg-neutral-50 rounded p-2">
                      {waypoint.notes}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Coordinates
                  </label>
                  <div className="text-xs text-neutral-600 font-mono">
                    <div>Lat: {waypoint.lat.toFixed(6)}</div>
                    <div>Lng: {waypoint.lng.toFixed(6)}</div>
                  </div>
                </div>

                <div className="flex space-x-2 pt-2 border-t border-neutral-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleInsertBefore();
                    }}
                    className="flex-1 px-3 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
                    title="Insert a new waypoint before this one"
                  >
                    + Before
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleInsertAfter();
                    }}
                    className="flex-1 px-3 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
                    title="Insert a new waypoint after this one"
                  >
                    + After
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleDelete();
                    }}
                    className="flex-1 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </Popup>
      </Marker>

      {/* Context Menu */}
      <ContextMenu
        isOpen={!!contextMenu}
        position={contextMenu || { x: 0, y: 0 }}
        items={contextMenuItems}
        onClose={() => setContextMenu(null)}
      />
    </>
  );
};

interface MapClickHandlerProps {
  onMapRightClick: (lat: number, lng: number, x: number, y: number) => void;
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onMapRightClick }) => {
  useMapEvents({
    contextmenu: (e: any) => {
      // @ts-ignore - LeafletMouseEvent type compatibility
      e.originalEvent.preventDefault();
      const { lat, lng } = e.latlng;
      const { clientX, clientY } = e.originalEvent;
      onMapRightClick(lat, lng, clientX, clientY);
    },
    dblclick: (e: any) => {
      // @ts-ignore - LeafletMouseEvent type compatibility - Double-click as backup
      const { lat, lng } = e.latlng;
      const { clientX, clientY } = e.originalEvent;
      onMapRightClick(lat, lng, clientX, clientY);
    }
  });

  return null;
};

const WaypointManager: React.FC = () => {
  const {
    waypoints,
    addWaypoint,
    removeWaypoint,
    updateWaypoint,
    insertWaypoint,
    insertBeforeWaypoint
    // clearRoute,
    // undo,
    // redo,
    // canUndo,
    // canRedo,
    // isValidForRouting
  } = useRouteStore();
  const { addNotification } = useUIStore();

  // State for confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // State for map context menu
  const [mapContextMenu, setMapContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    coordinates: { lat: number; lng: number };
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    coordinates: { lat: 0, lng: 0 }
  });

  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  // Handle map right-click for context menu
  const handleMapRightClick = useCallback((lat: number, lng: number, x: number, y: number) => {
    setMapContextMenu({
      isOpen: true,
      position: { x, y },
      coordinates: { lat, lng }
    });
  }, []);

  const handleAddWaypoint = useCallback((lat: number, lng: number) => {
    // Create waypoint with temporary type (will be updated by store)
    const newWaypoint = createWaypoint(lat, lng, 'waypoint', waypoints.length);

    try {
      addWaypoint(newWaypoint);
      addNotification({
        type: 'success',
        message: `Added ${newWaypoint.name} to route`
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to add waypoint'
      });
    }
  }, [waypoints.length, addWaypoint, addNotification]);

  const handleDeleteWaypoint = useCallback((id: string) => {
    const waypoint = waypoints.find(wp => wp.id === id);

    try {
      removeWaypoint(id);
      addNotification({
        type: 'success',
        message: `Removed ${waypoint?.name || 'waypoint'} from route`
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to remove waypoint'
      });
    }
  }, [waypoints, removeWaypoint, addNotification]);

  const handleUpdateWaypoint = useCallback((id: string, updates: Partial<Waypoint>) => {
    try {
      updateWaypoint(id, updates);

      // Show notification for significant updates
      if (updates.name || updates.notes) {
        addNotification({
          type: 'success',
          message: 'Waypoint updated successfully'
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to update waypoint'
      });
    }
  }, [updateWaypoint, addNotification]);

  const handleInsertWaypoint = useCallback((waypoint: Waypoint, afterId: string) => {
    try {
      insertWaypoint(waypoint, afterId);
      addNotification({
        type: 'success',
        message: `Inserted ${waypoint.name} into route`
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to insert waypoint'
      });
    }
  }, [insertWaypoint, addNotification]);

  const handleInsertBeforeWaypoint = useCallback((waypoint: Waypoint, beforeId: string) => {
    try {
      insertBeforeWaypoint(waypoint, beforeId);
      addNotification({
        type: 'success',
        message: `Inserted ${waypoint.name} into route`
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to insert waypoint'
      });
    }
  }, [insertBeforeWaypoint, addNotification]);

  const handleDragEnd = useCallback((id: string, newLat: number, newLng: number) => {
    try {
      updateWaypoint(id, {
        lat: Number(newLat.toFixed(6)),
        lng: Number(newLng.toFixed(6))
      });

      addNotification({
        type: 'success',
        message: 'Waypoint position updated'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to update waypoint position'
      });
    }
  }, [updateWaypoint, addNotification]);


  return (
    <>
      {/* Map right-click handler for context menu - only render if context is available */}
      {typeof window !== 'undefined' && <MapClickHandler onMapRightClick={handleMapRightClick} />}

      {/* Route visualization with connecting lines and direction arrows */}
      <RouteVisualization />

      {/* Render waypoint markers */}
      {waypoints.map((waypoint, index) => (
        <WaypointMarker
          key={waypoint.id}
          waypoint={waypoint}
          index={index}
          onDelete={handleDeleteWaypoint}
          onUpdate={handleUpdateWaypoint}
          onInsertAfter={handleInsertWaypoint}
          onInsertBefore={handleInsertBeforeWaypoint}
          onDragEnd={handleDragEnd}
        />
      ))}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel="Clear All"
        confirmVariant="danger"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Map Context Menu with fixed positioning */}
      {mapContextMenu.isOpen && (
        <div
          className="fixed z-[10000] bg-white rounded-lg shadow-lg border border-neutral-200 py-1 min-w-[160px]"
          style={{
            left: mapContextMenu.position.x,
            top: mapContextMenu.position.y,
          }}
          onMouseLeave={() => setMapContextMenu(prev => ({ ...prev, isOpen: false }))}
        >
          <button
            onClick={() => {
              handleAddWaypoint(mapContextMenu.coordinates.lat, mapContextMenu.coordinates.lng);
              setMapContextMenu(prev => ({ ...prev, isOpen: false }));
            }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Add Waypoint</span>
          </button>
        </div>
      )}

      {/* Click outside to close context menu */}
      {mapContextMenu.isOpen && (
        <div
          className="fixed inset-0 z-[9999]"
          onClick={() => setMapContextMenu(prev => ({ ...prev, isOpen: false }))}
        />
      )}
    </>
  );
};

export default WaypointManager;