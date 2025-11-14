// Simplified Campsite Layer Component
// Phase 4.2: Campsite display with basic clustering (no external dependencies)

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { useMap } from 'react-leaflet';
import * as L from 'leaflet';
import { campsiteService } from '../../services/CampsiteService';
import type { CampsiteRequest, CampsiteType } from '../../services/CampsiteService';
import { CampsiteAdapter } from '../../adapters/CampsiteAdapter';
import type { UICampsite } from '../../adapters/CampsiteAdapter';
import { CampsiteFilterService } from '../../services/CampsiteFilterService';
import { useRouteStore, useVehicleStore, useUIStore } from '../../store';
import { FeatureFlags } from '../../config';
import type { CampsiteFilterState } from './CampsiteFilter';
import { createCampsiteIcon } from './CampsiteIcons';

export interface SimpleCampsiteLayerProps {
  visibleTypes: CampsiteType[];
  maxResults: number;
  vehicleCompatibleOnly: boolean;
  searchQuery?: string;
  isVisible: boolean;
  onCampsiteClick?: (campsite: UICampsite) => void;
  onCampsitesLoaded?: (count: number, campsites?: UICampsite[]) => void;
  isMobile?: boolean;
  filterState?: CampsiteFilterState;
}

interface ClusteredCampsite extends UICampsite {
  clusterId?: string;
  isCluster?: boolean;
  clusterCount?: number;
  clusterCampsites?: UICampsite[];
}

// Simple clustering algorithm
function clusterCampsites(campsites: UICampsite[], zoom: number, isMobile: boolean = false): ClusteredCampsite[] {
  const maxDistance = isMobile ?
    (zoom > 12 ? 30 : zoom > 10 ? 50 : 80) :
    (zoom > 12 ? 40 : zoom > 10 ? 60 : 100); // pixels

  const clusters: ClusteredCampsite[] = [];
  const processed = new Set<number>();

  for (const campsite of campsites) {
    if (processed.has(campsite.id)) continue;

    const cluster: UICampsite[] = [campsite];
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
        id: -(clusters.length + 1), // Use negative IDs for clusters to avoid collision with real campsite IDs
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
  const { addNotification: _addNotification } = useUIStore();

  const [campsites, setCampsites] = useState<UICampsite[]>([]);
  const [_isLoading, setIsLoading] = useState(false);
  const [_error, setError] = useState<string | null>(null);
  const [selectedCampsiteId, setSelectedCampsiteId] = useState<number | null>(null);
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
        campsites as any, // TODO: Fix type mismatch between UICampsite and Campsite
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
    return clusterCampsites(filteredCampsites as UICampsite[], zoom, isMobile);
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
        maxResults
      };

      const serviceResponse = await campsiteService.searchCampsites(request);
      const uiResponse = CampsiteAdapter.toUIResponse(serviceResponse, profile);

      if (uiResponse.status === 'success') {
        setCampsites(uiResponse.campsites);
        onCampsitesLoaded?.(uiResponse.campsites.length, uiResponse.campsites);
      } else {
        throw new Error(uiResponse.error || 'Failed to load campsites');
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

    routeGeometry.coordinates.forEach((coord: number[]) => {
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
        maxResults
      };

      const serviceResponse = await campsiteService.searchCampsites(request);
      const uiResponse = CampsiteAdapter.toUIResponse(serviceResponse, profile);

      if (uiResponse.status === 'success') {
        setCampsites(uiResponse.campsites);
        onCampsitesLoaded?.(uiResponse.campsites.length, uiResponse.campsites);
      } else {
        throw new Error(uiResponse.error || 'Failed to load campsites');
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
        const clusterCampsite = campsite as ClusteredCampsite;
        const isSelected = selectedCampsiteId === campsite.id;
        const isCluster = clusterCampsite.isCluster;

        // Create cluster icon for grouped campsites
        const icon = isCluster
          ? (L as any).divIcon({
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
                  ${clusterCampsite.clusterCount}
                </div>
              `,
              className: 'campsite-cluster-icon',
              iconSize: [isMobile ? 32 : 40, isMobile ? 32 : 40],
              iconAnchor: [isMobile ? 16 : 20, isMobile ? 16 : 20]
            })
          : createCampsiteIcon({
              campsite: clusterCampsite,
              vehicleCompatible: clusterCampsite.vehicleCompatible,
              isSelected,
              isMobile,
              size: isMobile ? 'small' : 'medium'
            });

        return (
          <Marker
            key={campsite.id}
            position={[clusterCampsite.location.lat, clusterCampsite.location.lng]}
            {...({ icon } as any)}
            eventHandlers={{
              click: () => {
                setSelectedCampsiteId(campsite.id);
                if (isCluster) {
                  // Zoom to cluster bounds
                  if (clusterCampsite.clusterCampsites) {
                    const bounds = (L as any).latLngBounds(
                      clusterCampsite.clusterCampsites.map((c: UICampsite) => [c.location.lat, c.location.lng])
                    );
                    map.fitBounds(bounds, { padding: [20, 20] });
                  }
                } else {
                  onCampsiteClick?.(clusterCampsite);
                }
              }
            }}
          >
            <Popup {...({ className: "campsite-popup" } as any)} maxWidth={isMobile ? 250 : 300}>
              {isCluster ? (
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 text-sm mb-2">
                    {clusterCampsite.clusterCount} Campsites
                  </h3>
                  <p className="text-xs text-gray-600 mb-2">
                    Click to zoom in and see individual campsites
                  </p>
                  <div className="space-y-1">
                    {clusterCampsite.clusterCampsites?.slice(0, 3).map((c: UICampsite, idx: number) => (
                      <div key={idx} className="text-xs text-gray-700">
                        • {c.name || c.type.replace('_', ' ')}
                      </div>
                    ))}
                    {clusterCampsite.clusterCampsites && clusterCampsite.clusterCampsites.length > 3 && (
                      <div className="text-xs text-gray-500">
                        and {clusterCampsite.clusterCampsites.length - 3} more...
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="campsite-popup-content p-3 min-w-0">
                  {/* Enhanced popup content same as before */}
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 text-sm leading-tight pr-2">
                      {clusterCampsite.name || `${clusterCampsite.type.replace('_', ' ')} #${clusterCampsite.id}`}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                      clusterCampsite.vehicleCompatible
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {clusterCampsite.vehicleCompatible ? '✓ Compatible' : '⚠ Check Size'}
                    </span>
                  </div>

                  <div className="mb-2">
                    <div className="text-xs text-gray-600 capitalize mb-1">
                      {clusterCampsite.type.replace('_', ' ')}
                    </div>

                    {clusterCampsite.address && (
                      <div className="text-xs text-gray-700 mb-1">📍 {clusterCampsite.address}</div>
                    )}
                    {clusterCampsite.phone && (
                      <div className="text-xs text-gray-700 mb-1">📞 {clusterCampsite.phone}</div>
                    )}
                    {clusterCampsite.website && (
                      <div className="text-xs text-gray-700 mb-1">
                        🌐 <a href={clusterCampsite.website} target="_blank" rel="noopener noreferrer"
                           className="text-blue-600 hover:text-blue-800 underline">Website</a>
                      </div>
                    )}
                    {clusterCampsite.openingHours && (
                      <div className="text-xs text-gray-700 mb-1">🕒 {clusterCampsite.openingHours}</div>
                    )}
                  </div>

                  {/* Amenities */}
                  {clusterCampsite.amenities && Object.keys(clusterCampsite.amenities).length > 0 && (
                    <div className="mb-2">
                      <div className="text-xs font-medium text-gray-900 mb-1">Amenities:</div>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(clusterCampsite.amenities).filter(([_, available]) => available).map(([amenity]) => (
                          <span key={amenity} className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                            {amenity.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vehicle restrictions */}
                  {!clusterCampsite.vehicleCompatible && clusterCampsite.restrictions && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                      <div className="text-xs font-medium text-red-800 mb-1">⚠️ Vehicle Restrictions:</div>
                      <div className="text-xs text-red-700">
                        {clusterCampsite.restrictions.maxHeight && (
                          <div>Max height: {clusterCampsite.restrictions.maxHeight}m</div>
                        )}
                        {clusterCampsite.restrictions.maxWidth && (
                          <div>Max width: {clusterCampsite.restrictions.maxWidth}m</div>
                        )}
                        {clusterCampsite.restrictions.maxLength && (
                          <div>Max length: {clusterCampsite.restrictions.maxLength}m</div>
                        )}
                        {clusterCampsite.restrictions.maxWeight && (
                          <div>Max weight: {clusterCampsite.restrictions.maxWeight}t</div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                    Data from {clusterCampsite.source} • ID: {clusterCampsite.osmId || clusterCampsite.id}
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