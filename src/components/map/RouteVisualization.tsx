// Route Visualization Component
// Phase 3.2: Enhanced route visualization with calculated routing data

import React, { useMemo } from 'react';
import { Polyline, Marker } from 'react-leaflet';
import L, { DivIcon } from 'leaflet';
import { useRouteStore } from '../../store';
import type { Waypoint } from '../../types';
import type { RouteResponse, RestrictedSegment } from '../../services/RoutingService';
import { FeatureFlags } from '../../config';
import { cn } from '../../utils/cn';

// Create direction arrow icon
const createDirectionArrowIcon = (rotation: number): DivIcon => {
  return L.divIcon({
    html: `
      <div class="relative w-6 h-6 flex items-center justify-center">
        <div
          class="w-4 h-4 bg-blue-500 text-white flex items-center justify-center rounded-full shadow-md transform transition-transform"
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

// Create restriction warning icon
const createRestrictionIcon = (restriction: RestrictedSegment): DivIcon => {
  const getRestrictionColor = (severity: 'warning' | 'error') => {
    return severity === 'error' ? '#dc2626' : '#f59e0b'; // red-600 or amber-500
  };

  const getRestrictionSymbol = (type: string) => {
    switch (type) {
      case 'height': return '↕️';
      case 'width': return '↔️';
      case 'weight': return '⚖️';
      case 'length': return '📏';
      default: return '⚠️';
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
  const getWaypointStyle = () => {
    if (waypoint.type === 'start') return 'bg-green-500 border-green-600';
    if (waypoint.type === 'end') return 'bg-red-500 border-red-600';
    return 'bg-blue-500 border-blue-600';
  };

  const getWaypointLabel = () => {
    if (waypoint.type === 'start') return 'S';
    if (waypoint.type === 'end') return 'E';
    return (index + 1).toString();
  };

  const numberIcon = L.divIcon({
    html: `
      <div class="relative">
        <!-- Main number circle -->
        <div class="${cn(
          'w-8 h-8 rounded-full border-2 text-white font-bold text-sm',
          'flex items-center justify-center shadow-lg',
          'transform hover:scale-110 transition-transform duration-200',
          getWaypointStyle()
        )}">
          ${getWaypointLabel()}
        </div>

        <!-- Pulse animation for active waypoint -->
        <div class="${cn(
          'absolute inset-0 rounded-full border-2 animate-ping opacity-30',
          getWaypointStyle()
        )}"></div>

        <!-- Route progress indicator -->
        ${total > 1 ? `
          <div class="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <div class="w-1 h-3 bg-gray-300 rounded-full">
              <div
                class="w-full bg-blue-500 rounded-full transition-all duration-300"
                style="height: ${((index + 1) / total) * 100}%"
              ></div>
            </div>
          </div>
        ` : ''}
      </div>
    `,
    className: 'waypoint-number-overlay',
    iconSize: [32, 40],
    iconAnchor: [16, 20],
    popupAnchor: [0, -20]
  });

  return (
    <Marker
      position={[waypoint.lat, waypoint.lng]}
      icon={numberIcon}
      zIndexOffset={2000} // Highest priority - above everything
    />
  );
};

// Calculate route visualization component - displays actual calculated routes
const CalculatedRouteDisplay: React.FC<{ route: RouteResponse }> = ({ route }) => {
  if (!route || !route.routes || route.routes.length === 0) return null;

  const routeData = route.routes[0]; // Use first route

  // Extract coordinates from the route geometry
  const routeCoordinates = useMemo(() => {
    if (!routeData.geometry || !routeData.geometry.coordinates) return [];

    // Convert from [lng, lat] to [lat, lng] for Leaflet
    return routeData.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
  }, [routeData]);

  // Determine route color based on service and vehicle profile
  const getRouteColor = () => {
    if (route.restrictions?.cannotAccommodate) {
      return '#dc2626'; // red-600 for impossible routes
    }
    if (route.restrictions?.violatedDimensions.length) {
      return '#f59e0b'; // amber-500 for restricted routes
    }
    if (route.warnings && route.warnings.length > 0) {
      return '#f59e0b'; // amber-500 for warnings (fallback service)
    }
    if (route.metadata.service === 'openrouteservice') {
      return '#059669'; // emerald-600 for primary service
    }
    return '#3b82f6'; // blue-500 for OSRM fallback
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
        color="#ffffff"
        weight={8}
        opacity={0.6}
        className="calculated-route-outline"
        interactive={false}
      />

      {/* Main calculated route polyline */}
      <Polyline
        positions={routeCoordinates}
        color={getRouteColor()}
        weight={6}
        opacity={0.8}
        className="calculated-route"
        dashArray={getDashArray()}
      />

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
              icon={icon}
              zIndexOffset={3000} // Highest priority - above everything else
            />
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
      {routeSegments.map((segment, index) => {
        const bearing = calculateBearing(segment.start.lat, segment.start.lng, segment.end.lat, segment.end.lng);
        const midpoint = calculateMidpoint(segment.start.lat, segment.start.lng, segment.end.lat, segment.end.lng);
        const arrowIcon = createDirectionArrowIcon(bearing);
        const segmentColor = getSegmentColor(segment.segmentIndex, segment.totalSegments);

        return (
          <React.Fragment key={`segment-${segment.start.id}-${segment.end.id}`}>
            {/* Route line */}
            <Polyline
              positions={[[segment.start.lat, segment.start.lng], [segment.end.lat, segment.end.lng]]}
              color={segmentColor}
              weight={4}
              opacity={0.6}
              className="straight-line-route"
              dashArray="8, 4" // Dashed to indicate it's not a calculated route
            />

            {/* Direction arrow at midpoint */}
            <Marker
              position={midpoint}
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
  const { waypoints, calculatedRoute } = useRouteStore();

  // Don't render if no waypoints
  if (waypoints.length === 0) return null;

  return (
    <>
      {/* Display calculated route if available and routing is enabled */}
      {FeatureFlags.BASIC_ROUTING && calculatedRoute ? (
        <CalculatedRouteDisplay route={calculatedRoute} />
      ) : waypoints.length >= 2 ? (
        /* Fallback to straight lines if no calculated route */
        <StraightLineRouteDisplay waypoints={waypoints} />
      ) : null}

      {/* Enhanced waypoint numbers overlay - always show */}
      {waypoints.map((waypoint, index) => (
        <WaypointNumber
          key={`number-${waypoint.id}`}
          waypoint={waypoint}
          index={index}
          total={waypoints.length}
        />
      ))}
    </>
  );
};

export default RouteVisualization;