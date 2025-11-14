// Waypoint Manager Component
// Phase 2.2: Enhanced waypoint system with drag-and-drop, editing, and context menu

import React, { useCallback, useState } from 'react';
import { Marker, Popup, useMapEvents } from 'react-leaflet';
import * as L from 'leaflet';
import { useRouteStore, useMapStore, useUIStore } from '../../store';
import type { Waypoint } from '../../types';
import { cn } from '../../utils/cn';
import ContextMenu from '../ui/ContextMenu';
import type { ContextMenuItem } from '../ui/ContextMenu';
import ConfirmDialog from '../ui/ConfirmDialog';
import RouteVisualization from './RouteVisualization';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

// Enhanced waypoint icon creation with improved visual feedback
const createWaypointIcon = (type: 'start' | 'waypoint' | 'end', index: number, isSelected = false, isDragging = false): any => {
  const iconColors = {
    start: 'bg-green-500 border-green-600 text-white shadow-green-200',
    waypoint: 'bg-blue-500 border-blue-600 text-white shadow-blue-200',
    end: 'bg-red-500 border-red-600 text-white shadow-red-200'
  };

  const iconSymbols = {
    start: '🚩',
    waypoint: index.toString(),
    end: '🏁'
  };

  const baseClass = cn(
    'flex items-center justify-center rounded-full border-3 font-bold cursor-pointer relative',
    'w-12 h-12 text-base transform transition-all duration-200',
    iconColors[type]
  );

  const effectsClass = cn(
    isSelected && 'scale-125 ring-4 ring-white ring-opacity-60',
    isDragging && 'scale-110 shadow-2xl z-50',
    !isDragging && !isSelected && 'hover:scale-105 hover:shadow-lg shadow-md'
  );

  return (L as any).divIcon({
    html: `
      <div class="${baseClass} ${effectsClass}">
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
          <div class="absolute -inset-2 rounded-full border-2 border-dashed border-yellow-400 bg-yellow-100 bg-opacity-20"></div>
        ` : ''}
      </div>
    `,
    className: cn('waypoint-marker', isDragging && 'dragging'),
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -24]
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
  onDragEnd: (id: string, newLat: number, newLng: number) => void;
}

const WaypointMarker: React.FC<WaypointMarkerProps> = ({
  waypoint,
  index,
  onDelete,
  onUpdate,
  onInsertAfter,
  onDragEnd
}) => {
  const { selectedWaypoint, setSelectedWaypoint } = useMapStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(waypoint.name);
  const [editedNotes, setEditedNotes] = useState(waypoint.notes || '');
  const [isDragging, setIsDragging] = useState(false);
  const [_isHovered, setIsHovered] = useState(false);

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
  }, []);

  const handleDragEnd = useCallback((e: any) => {
    setIsDragging(false);
    const newLat = e.target.getLatLng().lat;
    const newLng = e.target.getLatLng().lng;
    onDragEnd(waypoint.id, newLat, newLng);
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
  }, [waypoint.id, waypoint.name, waypoint.notes, editedName, editedNotes, onUpdate]);

  const handleCancelEdit = useCallback(() => {
    setEditedName(waypoint.name);
    setEditedNotes(waypoint.notes || '');
    setIsEditing(false);
  }, [waypoint.name, waypoint.notes]);

  const handleInsertBefore = useCallback(() => {
    const newWaypoint = createWaypoint(
      waypoint.lat - 0.01,
      waypoint.lng - 0.01,
      'waypoint',
      index
    );
    onInsertAfter(newWaypoint, waypoint.id);
  }, [waypoint, index, onInsertAfter]);

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

  const icon = createWaypointIcon(waypoint.type, index + 1, isSelected, isDragging);

  return (
    <>
      <Marker
        position={[waypoint.lat, waypoint.lng]}
        {...({ icon: icon } as any)}
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
        <Popup>
          <div className="min-w-72 p-2">
            {/* Waypoint Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span
                  className={cn(
                    'px-2 py-1 rounded text-xs font-semibold',
                    waypoint.type === 'start' && 'bg-green-100 text-green-800',
                    waypoint.type === 'waypoint' && 'bg-blue-100 text-blue-800',
                    waypoint.type === 'end' && 'bg-red-100 text-red-800'
                  )}
                >
                  {waypoint.type === 'start' ? 'START' :
                   waypoint.type === 'end' ? 'END' :
                   `WAYPOINT ${index + 1}`}
                </span>
                <span className="text-xs text-gray-500">
                  Drag to move
                </span>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                title="Edit waypoint"
                aria-label="Edit waypoint"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>

            {isEditing ? (
              /* Edit Mode */
              <>
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter waypoint name"
                    autoFocus
                  />
                </div>

                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                    placeholder="Add notes about this waypoint..."
                  />
                </div>

                <div className="flex space-x-2 pt-2 border-t border-gray-200">
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex-1 px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              /* View Mode */
              <>
                <div className="mb-3">
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    {waypoint.name}
                  </div>
                  {waypoint.notes && (
                    <div className="text-xs text-gray-600 bg-gray-50 rounded p-2">
                      {waypoint.notes}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Coordinates
                  </label>
                  <div className="text-xs text-gray-600 font-mono">
                    <div>Lat: {waypoint.lat.toFixed(6)}</div>
                    <div>Lng: {waypoint.lng.toFixed(6)}</div>
                  </div>
                </div>

                <div className="flex space-x-2 pt-2 border-t border-gray-200">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setSelectedWaypoint(null)}
                    className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                  >
                    Close
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
  onAddWaypoint: (lat: number, lng: number) => void;
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onAddWaypoint }) => {
  useMapEvents({
    click: (e: any) => {
      onAddWaypoint(e.latlng.lat, e.latlng.lng);
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
    isValidForRouting: _isValidForRouting
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

  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

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
      {/* Map click handler for adding waypoints */}
      <MapClickHandler onAddWaypoint={handleAddWaypoint} />

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
    </>
  );
};

export default WaypointManager;