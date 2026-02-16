// Route Visualization Component
// Phase 3.2: Enhanced route visualization with calculated routing data

import React, { useMemo, useState, useCallback } from 'react';
import { Polyline, Marker, Popup } from 'react-leaflet';
import L, { DivIcon } from 'leaflet';
import { MapPin } from 'lucide-react';
import { useRouteStore, useUIStore } from '../../store';
import { type Waypoint } from '../../types';
import { type RouteResponse, type RestrictedSegment } from '../../services/RoutingService';
import { FeatureFlags } from '../../config';
import { cn } from '../../utils/cn';
import LocationSearch from '../ui/LocationSearch';

// Inline SVG helper for HTML template string contexts (Leaflet divIcon)
const svgIcon = (path: string, size = 14) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle">${path}</svg>`;

// Create direction arrow icon
const createDirectionArrowIcon = (rotation: number): DivIcon => {
  return L.divIcon({
    html: `
      <div class="relative w-6 h-6 flex items-center justify-center">
        <div
          class="w-4 h-4 bg-primary-500 text-white flex items-center justify-center rounded-full shadow-md transform transition-transform"
          style="transform: rotate(${rotation}deg)"
        >
          <svg class="w-2 h-2" fill="currentColor" viewBox="0 0 12 12">
            <path d="M6 1l5 4-5 4V6H1V4h5V1z"/>
          </svg>
        </div>
      </div>
    `,
    className: 'direction-arrow',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

// Calculate bearing between two points for arrow direction
const calculateBearing = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const dLng = lng2 - lng1;
  const dLat = lat2 - lat1;
  const angle = Math.atan2(dLng, dLat) * (180 / Math.PI);
  return (angle + 360) % 360; // Normalize to 0-360
};

// Calculate midpoint between two coordinates
const calculateMidpoint = (lat1: number, lng1: number, lat2: number, lng2: number): [number, number] => {
  return [(lat1 + lat2) / 2, (lng1 + lng2) / 2];
};

// Format distance for display
const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
};

// Format duration for display
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

// Create distance/time label icon
const createRouteInfoIcon = (distance: number, duration: number, isHighlighted = false): DivIcon => {
  const distanceText = formatDistance(distance);
  const durationText = formatDuration(duration);

  return L.divIcon({
    html: `
      <div class="route-info-label ${isHighlighted ? 'highlighted' : ''}">
        <div class="bg-white border-2 border-primary-500 rounded-lg px-2 py-1 shadow-lg text-xs font-medium text-neutral-800">
          <div class="text-primary-600 font-semibold">${distanceText}</div>
          <div class="text-neutral-600">${durationText}</div>
        </div>
      </div>
    `,
    className: 'route-info-marker',
    iconSize: [60, 30],
    iconAnchor: [30, 15]
  });
};

// Create restriction warning icon
const createRestrictionIcon = (restriction: RestrictedSegment): DivIcon => {
  const getRestrictionColor = (severity: 'warning' | 'error') => {
    return severity === 'error' ? '#d32535' : '#e9a100'; // red-600 or amber-500
  };

  const getRestrictionSymbol = (type: string) => {
    switch (type) {
      case 'height': return svgIcon('<path d="M12 2v20"/><path d="m5 5 7-3 7 3"/><path d="m5 19 7 3 7-3"/>', 14);
      case 'width': return svgIcon('<path d="M2 12h20"/><path d="m5 9-3 3 3 3"/><path d="m19 9 3 3-3 3"/>', 14);
      case 'weight': return svgIcon('<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>', 14);
      case 'length': return svgIcon('<path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/>', 14);
      default: return svgIcon('<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>', 14);
    }
  };

  const color = getRestrictionColor(restriction.severity);
  const symbol = getRestrictionSymbol(restriction.restriction);

  return L.divIcon({
    html: `
      <div class="relative">
        <div class="w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-lg animate-pulse"
             style="background-color: ${color}; border-color: ${color}">
          <span class="text-white text-xs font-bold">${symbol}</span>
        </div>
        <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
          <div class="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent"
               style="border-top-color: ${color}"></div>
        </div>
      </div>
    `,
    className: 'restriction-warning-icon',
    iconSize: [32, 36],
    iconAnchor: [16, 36],
    popupAnchor: [0, -36]
  });
};


// Enhanced waypoint numbering overlay
interface WaypointNumberProps {
  waypoint: Waypoint;
  index: number;
  total: number;
}

const WaypointNumber: React.FC<WaypointNumberProps> = ({ waypoint, index, total }) => {
  const { updateWaypoint, removeWaypoint, insertWaypoint, insertBeforeWaypoint, waypoints } = useRouteStore();
  const { addNotification } = useUIStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(waypoint.name || '');
  const [editedNotes, setEditedNotes] = useState(waypoint.notes || '');
  const [stagedLocation, setStagedLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [showLocationSearch, setShowLocationSearch] = useState(false);

  const getWaypointStyle = () => {
    if (waypoint.type === 'start') return 'bg-green-500 border-green-600';
    if (waypoint.type === 'end') return 'bg-red-500 border-red-600';
    return 'bg-primary-500 border-primary-600';
  };

  const handleSaveEdit = useCallback(() => {
    const updates: Partial<Waypoint> = {};

    if (stagedLocation) {
      updates.lat = stagedLocation.lat;
      updates.lng = stagedLocation.lng;
    }

    if (editedName.trim() !== (waypoint.name || '')) {
      updates.name = editedName.trim();
    }

    if (editedNotes !== (waypoint.notes || '')) {
      updates.notes = editedNotes;
    }

    if (Object.keys(updates).length > 0) {
      updateWaypoint(waypoint.id, updates);
      addNotification({
        type: 'success',
        message: stagedLocation ? 'Waypoint location updated' : 'Waypoint updated successfully'
      });
    }

    setIsEditing(false);
    setStagedLocation(null);
    setShowLocationSearch(false);
  }, [waypoint.id, waypoint.name, waypoint.notes, editedName, editedNotes, stagedLocation, updateWaypoint, addNotification]);

  const handleCancelEdit = useCallback(() => {
    setEditedName(waypoint.name || '');
    setEditedNotes(waypoint.notes || '');
    setStagedLocation(null);
    setShowLocationSearch(false);
    setIsEditing(false);
  }, [waypoint.name, waypoint.notes]);

  const handleDelete = useCallback(() => {
    removeWaypoint(waypoint.id);
    addNotification({
      type: 'success',
      message: `Removed ${waypoint.name || 'waypoint'} from route`
    });
  }, [waypoint.id, waypoint.name, removeWaypoint, addNotification]);

  const handleInsertBefore = useCallback(() => {
    // Calculate midpoint between previous waypoint and this one (or offset if first)
    const currentIndex = waypoints.findIndex(wp => wp.id === waypoint.id);
    let lat: number, lng: number;
    if (currentIndex > 0) {
      const prev = waypoints[currentIndex - 1];
      lat = (prev.lat + waypoint.lat) / 2;
      lng = (prev.lng + waypoint.lng) / 2;
    } else {
      lat = waypoint.lat - 0.5;
      lng = waypoint.lng - 0.5;
    }
    const newWaypoint: Waypoint = {
      id: `waypoint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      type: 'waypoint',
      name: `Waypoint ${currentIndex + 1}`
    };
    insertBeforeWaypoint(newWaypoint, waypoint.id);
    addNotification({
      type: 'success',
      message: `Inserted ${newWaypoint.name} before ${waypoint.name || 'waypoint'}`
    });
  }, [waypoint, waypoints, insertBeforeWaypoint, addNotification]);

  const handleInsertAfter = useCallback(() => {
    // Calculate midpoint between this waypoint and next one (or offset if last)
    const currentIndex = waypoints.findIndex(wp => wp.id === waypoint.id);
    let lat: number, lng: number;
    if (currentIndex < waypoints.length - 1) {
      const next = waypoints[currentIndex + 1];
      lat = (waypoint.lat + next.lat) / 2;
      lng = (waypoint.lng + next.lng) / 2;
    } else {
      lat = waypoint.lat + 0.5;
      lng = waypoint.lng + 0.5;
    }
    const newWaypoint: Waypoint = {
      id: `waypoint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      type: 'waypoint',
      name: `Waypoint ${currentIndex + 2}`
    };
    insertWaypoint(newWaypoint, waypoint.id);
    addNotification({
      type: 'success',
      message: `Inserted ${newWaypoint.name} after ${waypoint.name || 'waypoint'}`
    });
  }, [waypoint, waypoints, insertWaypoint, addNotification]);

  const getWaypointLabel = () => {
    if (waypoint.type === 'start') return 'S';
    if (waypoint.type === 'end') return 'E';
    return (index + 1).toString();
  };

  const getWaypointIcon = () => {
    const flagSvg = svgIcon('<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>');
    const tentSvg = svgIcon('<path d="M3 20 12 4l9 16Z"/><path d="M12 4v16"/>');
    const buildingSvg = svgIcon('<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>');
    const pinSvg = svgIcon('<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>');
    if (waypoint.type === 'start') return flagSvg;
    if (waypoint.type === 'end') return flagSvg;
    if (waypoint.type === 'campsite') return tentSvg;
    if (waypoint.type === 'accommodation') return buildingSvg;
    return pinSvg;
  };

  const numberIcon = L.divIcon({
    html: `
      <div class="relative waypoint-marker">
        <!-- Main waypoint container -->
        <div class="${cn(
          'relative w-10 h-10 rounded-full border-3 text-white font-bold text-sm',
          'flex items-center justify-center shadow-lg',
          'transform hover:scale-110 transition-all duration-300',
          'cursor-pointer',
          getWaypointStyle()
        )}">
          <!-- Icon background -->
          <div class="absolute inset-1 rounded-full bg-white bg-opacity-20"></div>

          <!-- Main content -->
          <div class="relative z-10 flex flex-col items-center">
            <div class="text-xs">${getWaypointIcon()}</div>
            <div class="text-xs font-bold -mt-1">${getWaypointLabel()}</div>
          </div>
        </div>

        <!-- Pulse animation for important waypoints -->
        <div class="${cn(
          'absolute inset-0 rounded-full border-2 animate-pulse opacity-20',
          getWaypointStyle()
        )}"></div>

        <!-- Route progress indicator -->
        ${total > 1 ? `
          <div class="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
            <div class="w-2 h-4 bg-neutral-300 rounded-full border border-neutral-400">
              <div
                class="w-full bg-gradient-to-t from-green-500 to-primary-500 rounded-full transition-all duration-500"
                style="height: ${((index + 1) / total) * 100}%"
              ></div>
            </div>
          </div>
        ` : ''}

        <!-- Waypoint name label -->
        <div class="absolute top-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          <div class="bg-white bg-opacity-90 text-neutral-800 text-xs font-medium px-2 py-1 rounded shadow-md border">
            ${waypoint.name || `Stop ${index + 1}`}
          </div>
        </div>
      </div>
    `,
    className: 'enhanced-waypoint-marker',
    iconSize: [40, 60],
    iconAnchor: [20, 30],
    popupAnchor: [0, -30]
  });

  return (
    <Marker
      position={[waypoint.lat, waypoint.lng]}
      // @ts-ignore - React-Leaflet v4 prop compatibility
      icon={numberIcon}
      zIndexOffset={2000} // Highest priority - above everything
    >
      <Popup
        eventHandlers={{
          click: (e: any) => e.originalEvent?.stopPropagation()
        }}
      >
        <div className="p-3 min-w-[250px]" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg" dangerouslySetInnerHTML={{ __html: getWaypointIcon() }} />
              <h3 className="font-semibold text-sm">{waypoint.name || `Waypoint ${index + 1}`}</h3>
            </div>
            {!isEditing && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setIsEditing(true);
                }}
                className="bg-primary-600 text-white hover:bg-primary-700 px-2 py-1 rounded text-xs font-medium transition-colors"
                title="Edit waypoint"
              >
                Edit
              </button>
            )}
          </div>

          {isEditing ? (
            /* Edit Mode */
            <div className="space-y-3">
              <div>
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

              <div>
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
              <div>
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
            </div>
          ) : (
            /* View Mode */
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Type:</span>
                <span className="font-medium capitalize">{waypoint.type.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span>Position:</span>
                <span className="font-medium">{index + 1} of {total}</span>
              </div>
              <div className="flex justify-between">
                <span>Coordinates:</span>
                <span className="font-mono text-xs">{waypoint.lat.toFixed(4)}, {waypoint.lng.toFixed(4)}</span>
              </div>

              {waypoint.visitDate && (
                <div className="flex justify-between">
                  <span>Visit Date:</span>
                  <span className="font-medium">{waypoint.visitDate}</span>
                </div>
              )}

              {waypoint.duration && (
                <div className="flex justify-between">
                  <span>Stay Duration:</span>
                  <span className="font-medium">{waypoint.duration}h</span>
                </div>
              )}

              {waypoint.notes && (
                <div className="mt-2 p-2 bg-neutral-50 rounded text-xs">
                  <div className="font-medium text-neutral-700 mb-1">Notes:</div>
                  <div className="text-neutral-600">{waypoint.notes}</div>
                </div>
              )}

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
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

// Calculate route visualization component - displays actual calculated routes
const CalculatedRouteDisplay: React.FC<{ route: RouteResponse; waypoints?: Waypoint[] }> = ({ route, waypoints: userWaypoints }) => {
  const routeData = route?.routes?.[0]; // Use first route if available

  // Extract coordinates from the route geometry - must be called before early return
  const routeCoordinates = useMemo(() => {
    if (!routeData?.geometry?.coordinates) return [];

    // Convert from [lng, lat] to [lat, lng] for Leaflet
    return routeData.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
  }, [routeData]);

  if (!route || !route.routes || route.routes.length === 0) return null;

  // Determine route color based on service and vehicle profile
  const getRouteColor = () => {
    if (route.restrictions?.cannotAccommodate) {
      return '#d32535'; // error red for impossible routes
    }
    if (route.restrictions?.violatedDimensions.length) {
      return '#e9a100'; // warning amber for restricted routes
    }
    if (route.warnings && route.warnings.length > 0) {
      return '#e9a100'; // warning amber for warnings (fallback service)
    }
    if (route.metadata.service === 'openrouteservice') {
      return '#27ae60'; // success green for primary service
    }
    return '#2794a8'; // teal for OSRM fallback
  };

  // Get dash pattern based on restrictions
  const getDashArray = () => {
    if (route.restrictions?.cannotAccommodate) {
      return "5, 10"; // Heavily dashed for impossible routes
    }
    if (route.restrictions?.violatedDimensions.length) {
      return "10, 5"; // Dashed for restricted routes
    }
    if (route.warnings && route.warnings.length > 0) {
      return "15, 5"; // Light dashed for warnings
    }
    return undefined; // Solid line for normal routes
  };

  if (routeCoordinates.length === 0) return null;

  return (
    <>
      {/* Route outline for better visibility */}
      <Polyline
        positions={routeCoordinates}
        // @ts-ignore - React-Leaflet v4 prop compatibility
          color="#ffffff"
        weight={8}
        opacity={0.6}
        className="calculated-route-outline"
        interactive={false}
      />

      {/* Main calculated route polyline */}
      <Polyline
        positions={routeCoordinates}
        // @ts-ignore - React-Leaflet v4 prop compatibility
          color={getRouteColor()}
        weight={6}
        opacity={0.8}
        className="calculated-route"
        dashArray={getDashArray()}
      />

      {/* Route segment information */}
      {routeData.segments?.map((segment, index) => {
        // Use actual waypoint coordinates for accurate label placement
        // Each segment connects waypoint[index] to waypoint[index+1]
        let midpoint: [number, number] | null = null;

        if (userWaypoints && userWaypoints.length >= 2 && index < userWaypoints.length - 1) {
          // Best: use the actual user waypoint coordinates
          midpoint = calculateMidpoint(
            userWaypoints[index].lat, userWaypoints[index].lng,
            userWaypoints[index + 1].lat, userWaypoints[index + 1].lng
          );
        } else if (routeData.waypoints && routeData.waypoints.length >= 2 && index < routeData.waypoints.length - 1) {
          // Fallback: use waypoint indices into the route coordinates
          const startIdx = routeData.waypoints[index];
          const endIdx = routeData.waypoints[index + 1];
          const segStart = routeCoordinates[startIdx];
          const segEnd = routeCoordinates[Math.min(endIdx, routeCoordinates.length - 1)];
          if (segStart && segEnd) {
            midpoint = calculateMidpoint(segStart[0], segStart[1], segEnd[0], segEnd[1]);
          }
        } else {
          // Last resort: evenly divide coordinates (clamped to valid range)
          const startIdx = Math.floor((index * routeCoordinates.length) / routeData.segments.length);
          const endIdx = Math.min(
            Math.floor(((index + 1) * routeCoordinates.length) / routeData.segments.length),
            routeCoordinates.length - 1
          );
          const segStart = routeCoordinates[startIdx];
          const segEnd = routeCoordinates[endIdx];
          if (segStart && segEnd) {
            midpoint = calculateMidpoint(segStart[0], segStart[1], segEnd[0], segEnd[1]);
          }
        }

        if (midpoint) {
          const infoIcon = createRouteInfoIcon(segment.distance, segment.duration);

          return (
            <Marker
              key={`segment-info-${index}`}
              position={midpoint}
              // @ts-ignore - React-Leaflet v4 prop compatibility
              icon={infoIcon}
              zIndexOffset={1500}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-sm mb-2">Route Segment {index + 1}</h3>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Distance:</span>
                      <span className="font-medium">{formatDistance(segment.distance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-medium">{formatDuration(segment.duration)}</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        }
        return null;
      })}

      {/* Restriction violation indicators */}
      {route.restrictions?.restrictedSegments?.map((restriction, index) => {
        // Calculate midpoint of the restricted segment
        if (restriction.coordinates.length >= 2) {
          const start = restriction.coordinates[0];
          const end = restriction.coordinates[restriction.coordinates.length - 1];
          const midpoint = calculateMidpoint(start[1], start[0], end[1], end[0]); // Note: ORS uses [lng, lat]
          const icon = createRestrictionIcon(restriction);

          return (
            <Marker
              key={`restriction-${index}`}
              position={midpoint}
              // @ts-ignore - React-Leaflet v4 prop compatibility
              icon={icon}
              zIndexOffset={3000} // Highest priority - above everything else
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-sm mb-2 text-red-600">Route Restriction</h3>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="font-medium capitalize">{restriction.restriction}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Severity:</span>
                      <span className={`font-medium capitalize ${
                        restriction.severity === 'error' ? 'text-red-600' : 'text-amber-600'
                      }`}>
                        {restriction.severity}
                      </span>
                    </div>
                    <div className="mt-2 text-neutral-600">
                      {restriction.severity === 'error'
                        ? 'Vehicle cannot pass this section'
                        : 'Caution: Check vehicle dimensions'
                      }
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        }
        return null;
      })}
    </>
  );
};

// Fallback straight-line route display (for when no calculated route available)
const StraightLineRouteDisplay: React.FC<{ waypoints: Waypoint[] }> = ({ waypoints }) => {
  // Calculate route segments
  const routeSegments = useMemo(() => {
    if (waypoints.length < 2) return [];

    const segments = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
      segments.push({
        start: waypoints[i],
        end: waypoints[i + 1],
        segmentIndex: i,
        totalSegments: waypoints.length - 1
      });
    }

    return segments;
  }, [waypoints]);

  // Color gradients from start (green) to end (red)
  const getSegmentColor = (index: number, total: number): string => {
    if (total === 1) return '#94a3b8'; // slate-400 for single segment

    const ratio = index / (total - 1);
    const startColor = { r: 34, g: 197, b: 94 }; // green-500
    const endColor = { r: 239, g: 68, b: 68 }; // red-500

    const r = Math.round(startColor.r + (endColor.r - startColor.r) * ratio);
    const g = Math.round(startColor.g + (endColor.g - startColor.g) * ratio);
    const b = Math.round(startColor.b + (endColor.b - startColor.b) * ratio);

    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <>
      {routeSegments.map((segment, _index) => {
        const bearing = calculateBearing(segment.start.lat, segment.start.lng, segment.end.lat, segment.end.lng);
        const midpoint = calculateMidpoint(segment.start.lat, segment.start.lng, segment.end.lat, segment.end.lng);
        const arrowIcon = createDirectionArrowIcon(bearing);
        const segmentColor = getSegmentColor(segment.segmentIndex, segment.totalSegments);

        return (
          <React.Fragment key={`segment-${segment.start.id}-${segment.end.id}`}>
            {/* Route line */}
            <Polyline
              positions={[[segment.start.lat, segment.start.lng], [segment.end.lat, segment.end.lng]]}
              // @ts-ignore - React-Leaflet v4 prop compatibility
          color={segmentColor}
              weight={4}
              opacity={0.6}
              className="straight-line-route"
              dashArray="8, 4" // Dashed to indicate it's not a calculated route
            />

            {/* Direction arrow at midpoint */}
            <Marker
              position={midpoint}
              // @ts-ignore - React-Leaflet v4 prop compatibility
          icon={arrowIcon}
              zIndexOffset={1000}
            />
          </React.Fragment>
        );
      })}
    </>
  );
};

// Main route visualization component
const RouteVisualization: React.FC = () => {
  const { waypoints: routeWaypoints, calculatedRoute } = useRouteStore();

  // Don't render if no waypoints
  if (routeWaypoints.length === 0) return null;

  return (
    <>
      {/* Display calculated route if available and routing is enabled */}
      {FeatureFlags.BASIC_ROUTING && calculatedRoute ? (
        <CalculatedRouteDisplay route={calculatedRoute} waypoints={routeWaypoints} />
      ) : routeWaypoints.length >= 2 ? (
        /* Fallback to straight lines if no calculated route */
        <StraightLineRouteDisplay waypoints={routeWaypoints} />
      ) : null}

      {/* Enhanced waypoint numbers overlay - always show */}
      {routeWaypoints.map((waypoint, index) => (
        <WaypointNumber
          key={`number-${waypoint.id}`}
          waypoint={waypoint}
          index={index}
          total={routeWaypoints.length}
        />
      ))}
    </>
  );
};

export default RouteVisualization;