// Waypoint Clustering Component
// Phase 2.4: Performance optimization for large waypoint sets

import React, { useMemo, useState, useCallback } from 'react';
import { Marker, useMap } from 'react-leaflet';
import L, { DivIcon } from 'leaflet';
import type { Waypoint } from '../../types';
import { cn } from '../../utils/cn';

interface ClusterGroup {
  id: string;
  center: [number, number];
  waypoints: Waypoint[];
  bounds: L.LatLngBounds;
}

interface WaypointClusterProps {
  waypoints: Waypoint[];
  maxDistance: number; // Maximum distance in pixels to cluster points
  minZoom?: number; // Zoom level below which clustering is disabled
  onWaypointClick?: (waypoint: Waypoint) => void;
  renderWaypoint?: (waypoint: Waypoint, index: number) => React.ReactNode;
}

// Create cluster icon
const createClusterIcon = (count: number, size: 'small' | 'medium' | 'large'): DivIcon => {
  const sizeClasses = {
    small: 'w-8 h-8 text-xs',
    medium: 'w-10 h-10 text-sm',
    large: 'w-12 h-12 text-base'
  };

  const bgColor = count < 5 ? 'bg-blue-500' : count < 10 ? 'bg-orange-500' : 'bg-red-500';

  return L.divIcon({
    html: `
      <div class="${cn(
        'flex items-center justify-center rounded-full border-2 border-white',
        'font-bold text-white shadow-lg cursor-pointer transform transition-transform',
        'hover:scale-110 animate-pulse',
        sizeClasses[size],
        bgColor
      )}">
        ${count}
      </div>
    `,
    className: 'waypoint-cluster',
    iconSize: size === 'small' ? [32, 32] : size === 'medium' ? [40, 40] : [48, 48],
    iconAnchor: size === 'small' ? [16, 16] : size === 'medium' ? [20, 20] : [24, 24]
  });
};

// Calculate distance between two points in pixels
const pixelDistance = (
  map: L.Map,
  point1: [number, number],
  point2: [number, number]
): number => {
  const p1 = map.latLngToContainerPoint(point1);
  const p2 = map.latLngToContainerPoint(point2);
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

// Group waypoints into clusters
const clusterWaypoints = (
  waypoints: Waypoint[],
  map: L.Map,
  maxDistance: number
): ClusterGroup[] => {
  if (!map) return [];

  const clusters: ClusterGroup[] = [];
  const processed = new Set<string>();

  waypoints.forEach((waypoint) => {
    if (processed.has(waypoint.id)) return;

    const cluster: ClusterGroup = {
      id: `cluster-${waypoint.id}`,
      center: [waypoint.lat, waypoint.lng],
      waypoints: [waypoint],
      bounds: L.latLngBounds([waypoint.lat, waypoint.lng], [waypoint.lat, waypoint.lng])
    };

    processed.add(waypoint.id);

    // Find nearby waypoints to add to this cluster
    waypoints.forEach((otherWaypoint) => {
      if (processed.has(otherWaypoint.id)) return;

      const distance = pixelDistance(
        map,
        [waypoint.lat, waypoint.lng],
        [otherWaypoint.lat, otherWaypoint.lng]
      );

      if (distance <= maxDistance) {
        cluster.waypoints.push(otherWaypoint);
        cluster.bounds.extend([otherWaypoint.lat, otherWaypoint.lng]);
        processed.add(otherWaypoint.id);
      }
    });

    // Update cluster center to be the centroid
    if (cluster.waypoints.length > 1) {
      const centerLat = cluster.waypoints.reduce((sum, wp) => sum + wp.lat, 0) / cluster.waypoints.length;
      const centerLng = cluster.waypoints.reduce((sum, wp) => sum + wp.lng, 0) / cluster.waypoints.length;
      cluster.center = [centerLat, centerLng];
    }

    clusters.push(cluster);
  });

  return clusters;
};

const WaypointCluster: React.FC<WaypointClusterProps> = ({
  waypoints,
  maxDistance = 50,
  minZoom = 8,
  onWaypointClick,
  renderWaypoint
}) => {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);

  // Update zoom level when map changes
  React.useEffect(() => {
    const handleZoomEnd = () => {
      setZoom(map.getZoom());
    };

    map.on('zoomend', handleZoomEnd);
    return () => {
      map.off('zoomend', handleZoomEnd);
    };
  }, [map]);

  // Calculate clusters based on current zoom and waypoints
  const clusters = useMemo(() => {
    if (zoom >= minZoom || waypoints.length <= 1) {
      // Don't cluster at high zoom levels or with few waypoints
      return waypoints.map(waypoint => ({
        id: `single-${waypoint.id}`,
        center: [waypoint.lat, waypoint.lng] as [number, number],
        waypoints: [waypoint],
        bounds: L.latLngBounds([waypoint.lat, waypoint.lng], [waypoint.lat, waypoint.lng])
      }));
    }

    return clusterWaypoints(waypoints, map, maxDistance);
  }, [waypoints, map, maxDistance, zoom, minZoom]);

  // Handle cluster click
  const handleClusterClick = useCallback((cluster: ClusterGroup) => {
    if (cluster.waypoints.length === 1) {
      // Single waypoint - call the waypoint click handler
      if (onWaypointClick) {
        onWaypointClick(cluster.waypoints[0]);
      }
    } else {
      // Multiple waypoints - zoom to fit the cluster or show details
      if (selectedCluster === cluster.id) {
        // If already selected, zoom to fit
        map.fitBounds(cluster.bounds, { padding: [20, 20] });
        setSelectedCluster(null);
      } else {
        // Select cluster to show details
        setSelectedCluster(cluster.id);
      }
    }
  }, [map, onWaypointClick, selectedCluster]);

  // Get cluster size category
  const getClusterSize = (count: number): 'small' | 'medium' | 'large' => {
    if (count < 5) return 'small';
    if (count < 15) return 'medium';
    return 'large';
  };

  // Render performance optimization: only render visible clusters
  const visibleClusters = useMemo(() => {
    const bounds = map.getBounds();
    return clusters.filter(cluster =>
      bounds.contains(cluster.center) ||
      bounds.intersects(cluster.bounds)
    );
  }, [clusters, map]);

  return (
    <>
      {visibleClusters.map((cluster) => {
        const waypointCount = cluster.waypoints.length;

        if (waypointCount === 1) {
          // Single waypoint - render normally or use custom renderer
          const waypoint = cluster.waypoints[0];
          if (renderWaypoint) {
            return renderWaypoint(waypoint, waypoints.indexOf(waypoint));
          }

          // Default single waypoint rendering
          return (
            <Marker
              key={`waypoint-${waypoint.id}`}
              position={[waypoint.lat, waypoint.lng]}
              eventHandlers={{
                click: () => handleClusterClick(cluster)
              }}
            />
          );
        }

        // Cluster of multiple waypoints
        const clusterIcon = createClusterIcon(waypointCount, getClusterSize(waypointCount));

        return (
          <Marker
            key={cluster.id}
            position={cluster.center}
            icon={clusterIcon}
            eventHandlers={{
              click: () => handleClusterClick(cluster)
            }}
          />
        );
      })}

      {/* Cluster details popup for selected cluster */}
      {selectedCluster && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-md">
          {(() => {
            const cluster = clusters.find(c => c.id === selectedCluster);
            if (!cluster || cluster.waypoints.length <= 1) return null;

            return (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">
                    Cluster ({cluster.waypoints.length} waypoints)
                  </h3>
                  <button
                    onClick={() => setSelectedCluster(null)}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {cluster.waypoints.map((waypoint, index) => (
                    <div
                      key={waypoint.id}
                      className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        if (onWaypointClick) onWaypointClick(waypoint);
                        setSelectedCluster(null);
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="text-sm text-gray-900">{waypoint.name}</span>
                      </div>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => {
                      map.fitBounds(cluster.bounds, { padding: [20, 20] });
                      setSelectedCluster(null);
                    }}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Zoom to Fit All
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </>
  );
};

export default WaypointCluster;