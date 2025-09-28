// Simplified Campsite Layer Component
// Phase 4.2: Campsite display with basic clustering (no external dependencies)

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { campsiteService } from '../../services/CampsiteService';
import { CampsiteFilterService } from '../../services/CampsiteFilterService';
import { useRouteStore, useVehicleStore, useUIStore } from '../../store';
import { FeatureFlags } from '../../config';
import { Campsite, CampsiteRequest, CampsiteType } from '../../services/CampsiteService';
import { CampsiteFilterState } from './CampsiteFilter';
import { createCampsiteIcon } from './CampsiteIcons';

export interface SimpleCampsiteLayerProps {
  visibleTypes: CampsiteType[];
  maxResults: number;
  vehicleCompatibleOnly: boolean;
  searchQuery?: string;
  isVisible: boolean;
  onCampsiteClick?: (campsite: Campsite) => void;
  onCampsitesLoaded?: (count: number, campsites?: Campsite[]) => void;
  isMobile?: boolean;
  filterState?: CampsiteFilterState;
}

interface ClusteredCampsite extends Campsite {
  clusterId?: string;
  isCluster?: boolean;
  clusterCount?: number;
  clusterCampsites?: Campsite[];
}

// Simple clustering algorithm
function clusterCampsites(campsites: Campsite[], zoom: number, isMobile: boolean = false): ClusteredCampsite[] {
  const maxDistance = isMobile ?
    (zoom > 12 ? 30 : zoom > 10 ? 50 : 80) :
    (zoom > 12 ? 40 : zoom > 10 ? 60 : 100); // pixels

  const clusters: ClusteredCampsite[] = [];
  const processed = new Set<string>();

  for (const campsite of campsites) {
    if (processed.has(campsite.id)) continue;

    const cluster: Campsite[] = [campsite];
    processed.add(campsite.id);

    // Find nearby campsites
    for (const other of campsites) {
      if (processed.has(other.id) || other.id === campsite.id) continue;

      const distance = calculatePixelDistance(
        campsite.location.lat, campsite.location.lng,
        other.location.lat, other.location.lng,
        zoom
      );

      if (distance < maxDistance) {
        cluster.push(other);
        processed.add(other.id);
      }
    }

    if (cluster.length > 1) {
      // Create cluster marker
      const centerLat = cluster.reduce((sum, c) => sum + c.location.lat, 0) / cluster.length;
      const centerLng = cluster.reduce((sum, c) => sum + c.location.lng, 0) / cluster.length;

      clusters.push({
        ...campsite,
        id: `cluster_${clusters.length}`,
        location: { lat: centerLat, lng: centerLng },
        name: `${cluster.length} campsites`,
        isCluster: true,
        clusterCount: cluster.length,
        clusterCampsites: cluster
      });
    } else {
      // Single campsite
      clusters.push(campsite);
    }
  }

  return clusters;
}

// Calculate pixel distance for clustering
function calculatePixelDistance(lat1: number, lng1: number, lat2: number, lng2: number, zoom: number): number {
  const earthRadius = 6371000; // meters
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  const deltaLat = (lat2 - lat1) * Math.PI / 180;
  const deltaLng = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceMeters = earthRadius * c;

  // Convert to pixels at current zoom level
  const metersPerPixel = 156543.03392 * Math.cos(lat1Rad) / Math.pow(2, zoom);
  return distanceMeters / metersPerPixel;
}

const SimpleCampsiteLayer: React.FC<SimpleCampsiteLayerProps> = ({
  visibleTypes,
  maxResults,
  vehicleCompatibleOnly,
  searchQuery = '',
  isVisible,
  onCampsiteClick,
  onCampsitesLoaded,
  isMobile = false,
  filterState
}) => {
  const map = useMap();
  const { calculatedRoute } = useRouteStore();
  const { profile } = useVehicleStore();
  const { addNotification } = useUIStore();

  const [campsites, setCampsites] = useState<Campsite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCampsiteId, setSelectedCampsiteId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(map.getZoom());

  // Track zoom changes for clustering
  useEffect(() => {
    const handleZoomEnd = () => setZoom(map.getZoom());
    map.on('zoomend', handleZoomEnd);
    return () => map.off('zoomend', handleZoomEnd);
  }, [map]);

  // Filter campsites based on filter state or fallback to props
  const filteredCampsites = useMemo(() => {
    if (filterState) {
      // Use advanced filtering
      const routeGeometry = calculatedRoute?.routes?.[0]?.geometry;
      const mapCenter = map ? [map.getCenter().lat, map.getCenter().lng] as [number, number] : undefined;

      return CampsiteFilterService.filterCampsites(
        campsites,
        filterState,
        routeGeometry,
        mapCenter
      );
    } else {
      // Fallback to basic filtering for backwards compatibility
      let filtered = campsites;

      // Filter by vehicle compatibility
      if (vehicleCompatibleOnly) {
        filtered = filtered.filter(campsite => campsite.vehicleCompatible);
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(campsite =>
          campsite.name?.toLowerCase().includes(query) ||
          campsite.address?.toLowerCase().includes(query) ||
          campsite.type.toLowerCase().includes(query) ||
          Object.keys(campsite.amenities || {}).some(amenity =>
            amenity.toLowerCase().includes(query)
          )
        );
      }

      // Filter by visible types
      filtered = filtered.filter(campsite => visibleTypes.includes(campsite.type));

      return filtered;
    }
  }, [campsites, vehicleCompatibleOnly, searchQuery, visibleTypes, filterState, calculatedRoute, map]);

  // Cluster campsites based on zoom level
  const clusteredCampsites = useMemo(() => {
    if (!isVisible || zoom >= 15) return filteredCampsites; // No clustering at high zoom
    return clusterCampsites(filteredCampsites, zoom, isMobile);
  }, [filteredCampsites, zoom, isVisible, isMobile]);

  // Load campsites for current map bounds
  const loadCampsites = useCallback(async () => {
    if (!map || !FeatureFlags.CAMPSITE_DISPLAY || !isVisible) return;

    setIsLoading(true);
    setError(null);

    try {
      const bounds = map.getBounds();

      const request: CampsiteRequest = {
        bounds: {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest()
        },
        types: visibleTypes,
        maxResults,
        includeDetails: true,
        vehicleProfile: profile || undefined
      };

      const response = await campsiteService.searchCampsites(request);

      if (response.status === 'success') {
        setCampsites(response.campsites);
        onCampsitesLoaded?.(response.campsites.length, response.campsites);
      } else {
        throw new Error(response.error || 'Failed to load campsites');
      }
    } catch (err) {
      console.error('Error loading campsites:', err);
      setError(err instanceof Error ? err.message : 'Failed to load campsites');
      setCampsites([]);
      onCampsitesLoaded?.(0, []);
    } finally {
      setIsLoading(false);
    }
  }, [map, visibleTypes, maxResults, profile, isVisible, onCampsitesLoaded]);

  // Auto-load campsites around route
  const loadCampsitesAroundRoute = useCallback(async () => {
    if (!calculatedRoute?.routes?.[0]?.geometry || !isVisible) return;

    const routeGeometry = calculatedRoute.routes[0].geometry;

    // Calculate bounding box from route geometry
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;

    routeGeometry.coordinates.forEach(coord => {
      const [lng, lat] = coord;
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    });

    // Add buffer around route (approximately 10km)
    const buffer = 0.1;

    setIsLoading(true);
    setError(null);

    try {
      const request: CampsiteRequest = {
        bounds: {
          north: maxLat + buffer,
          south: minLat - buffer,
          east: maxLng + buffer,
          west: minLng - buffer
        },
        types: visibleTypes,
        maxResults,
        includeDetails: true,
        vehicleProfile: profile || undefined
      };

      const response = await campsiteService.searchCampsites(request);

      if (response.status === 'success') {
        setCampsites(response.campsites);
        onCampsitesLoaded?.(response.campsites.length, response.campsites);
      } else {
        throw new Error(response.error || 'Failed to load campsites');
      }
    } catch (err) {
      console.error('Error loading route campsites:', err);
      setError(err instanceof Error ? err.message : 'Failed to load campsites');
      setCampsites([]);
      onCampsitesLoaded?.(0, []);
    } finally {
      setIsLoading(false);
    }
  }, [calculatedRoute, visibleTypes, maxResults, profile, isVisible, onCampsitesLoaded]);

  // Load campsites when map moves or parameters change
  useEffect(() => {
    if (!isVisible) return;

    const handleMoveEnd = () => {
      const timer = setTimeout(loadCampsites, 1000); // Debounce
      return () => clearTimeout(timer);
    };

    map.on('moveend', handleMoveEnd);

    // Initial load
    loadCampsites();

    return () => {
      map.off('moveend', handleMoveEnd);
    };
  }, [map, loadCampsites, isVisible]);

  // Load campsites around route when route changes
  useEffect(() => {
    if (calculatedRoute && isVisible) {
      loadCampsitesAroundRoute();
    }
  }, [calculatedRoute, loadCampsitesAroundRoute, isVisible]);

  // Don't render if not visible
  if (!isVisible || !FeatureFlags.CAMPSITE_DISPLAY) return null;

  return (
    <>
      {clusteredCampsites.map(campsite => {
        const isSelected = selectedCampsiteId === campsite.id;
        const isCluster = campsite.isCluster;

        // Create cluster icon for grouped campsites
        const icon = isCluster
          ? L.divIcon({
              html: `
                <div style="
                  width: ${isMobile ? 32 : 40}px;
                  height: ${isMobile ? 32 : 40}px;
                  background: linear-gradient(135deg, #22c55e, #16a34a);
                  border: 3px solid #ffffff;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: ${isMobile ? 10 : 12}px;
                  font-weight: bold;
                  color: white;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                  cursor: pointer;
                ">
                  ${campsite.clusterCount}
                </div>
              `,
              className: 'campsite-cluster-icon',
              iconSize: [isMobile ? 32 : 40, isMobile ? 32 : 40],
              iconAnchor: [isMobile ? 16 : 20, isMobile ? 16 : 20]
            })
          : createCampsiteIcon({
              campsite,
              vehicleCompatible: campsite.vehicleCompatible,
              isSelected,
              isMobile,
              size: isMobile ? 'small' : 'medium'
            });

        return (
          <Marker
            key={campsite.id}
            position={[campsite.location.lat, campsite.location.lng]}
            icon={icon}
            eventHandlers={{
              click: () => {
                setSelectedCampsiteId(campsite.id);
                if (isCluster) {
                  // Zoom to cluster bounds
                  if (campsite.clusterCampsites) {
                    const bounds = L.latLngBounds(
                      campsite.clusterCampsites.map(c => [c.location.lat, c.location.lng])
                    );
                    map.fitBounds(bounds, { padding: [20, 20] });
                  }
                } else {
                  onCampsiteClick?.(campsite);
                }
              }
            }}
          >
            <Popup className="campsite-popup" maxWidth={isMobile ? 250 : 300}>
              {isCluster ? (
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 text-sm mb-2">
                    {campsite.clusterCount} Campsites
                  </h3>
                  <p className="text-xs text-gray-600 mb-2">
                    Click to zoom in and see individual campsites
                  </p>
                  <div className="space-y-1">
                    {campsite.clusterCampsites?.slice(0, 3).map((c, idx) => (
                      <div key={idx} className="text-xs text-gray-700">
                        • {c.name || c.type.replace('_', ' ')}
                      </div>
                    ))}
                    {campsite.clusterCampsites && campsite.clusterCampsites.length > 3 && (
                      <div className="text-xs text-gray-500">
                        and {campsite.clusterCampsites.length - 3} more...
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="campsite-popup-content p-3 min-w-0">
                  {/* Enhanced popup content same as before */}
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 text-sm leading-tight pr-2">
                      {campsite.name || `${campsite.type.replace('_', ' ')} #${campsite.id}`}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                      campsite.vehicleCompatible
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {campsite.vehicleCompatible ? '✓ Compatible' : '⚠ Check Size'}
                    </span>
                  </div>

                  <div className="mb-2">
                    <div className="text-xs text-gray-600 capitalize mb-1">
                      {campsite.type.replace('_', ' ')}
                    </div>

                    {campsite.address && (
                      <div className="text-xs text-gray-700 mb-1">📍 {campsite.address}</div>
                    )}
                    {campsite.phone && (
                      <div className="text-xs text-gray-700 mb-1">📞 {campsite.phone}</div>
                    )}
                    {campsite.website && (
                      <div className="text-xs text-gray-700 mb-1">
                        🌐 <a href={campsite.website} target="_blank" rel="noopener noreferrer"
                           className="text-blue-600 hover:text-blue-800 underline">Website</a>
                      </div>
                    )}
                    {campsite.openingHours && (
                      <div className="text-xs text-gray-700 mb-1">🕒 {campsite.openingHours}</div>
                    )}
                  </div>

                  {/* Amenities */}
                  {campsite.amenities && Object.keys(campsite.amenities).length > 0 && (
                    <div className="mb-2">
                      <div className="text-xs font-medium text-gray-900 mb-1">Amenities:</div>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(campsite.amenities).filter(([_, available]) => available).map(([amenity]) => (
                          <span key={amenity} className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                            {amenity.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vehicle restrictions */}
                  {!campsite.vehicleCompatible && campsite.restrictions && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                      <div className="text-xs font-medium text-red-800 mb-1">⚠️ Vehicle Restrictions:</div>
                      <div className="text-xs text-red-700">
                        {campsite.restrictions.maxHeight && (
                          <div>Max height: {campsite.restrictions.maxHeight}m</div>
                        )}
                        {campsite.restrictions.maxWidth && (
                          <div>Max width: {campsite.restrictions.maxWidth}m</div>
                        )}
                        {campsite.restrictions.maxLength && (
                          <div>Max length: {campsite.restrictions.maxLength}m</div>
                        )}
                        {campsite.restrictions.maxWeight && (
                          <div>Max weight: {campsite.restrictions.maxWeight}t</div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                    Data from {campsite.source} • ID: {campsite.osmId || campsite.id}
                  </div>
                </div>
              )}
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

export default SimpleCampsiteLayer;