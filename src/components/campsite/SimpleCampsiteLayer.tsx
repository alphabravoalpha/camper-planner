// Simplified Campsite Layer Component
// Phase 4.2: Campsite display with basic clustering (no external dependencies)

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { useMap } from 'react-leaflet';
import * as L from 'leaflet';
import { campsiteService } from '../../services/CampsiteService';
import { CampsiteFilterService } from '../../services/CampsiteFilterService';
import { useRouteStore, useVehicleStore, useUIStore } from '../../store';
import { FeatureFlags } from '../../config';
import { useAnalytics } from '../../utils/analytics';
import {
  type Campsite,
  type CampsiteRequest,
  type CampsiteType,
} from '../../services/CampsiteService';
import { type CampsiteFilterState } from './CampsiteFilter';
import { createCampsiteIcon, createClusterIcon } from './CampsiteIcons';
import { CheckCircle, AlertTriangle } from 'lucide-react';

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
  highlightedCampsiteId?: string | null;
  selectedCampsiteId?: string | null;
}

interface ClusteredCampsite extends Campsite {
  clusterId?: string;
  isCluster?: boolean;
  clusterCount?: number;
  clusterCampsites?: Campsite[];
  location?: { lat: number; lng: number };
}

// Grid-based clustering algorithm — O(n) instead of O(n²)
// Uses a spatial grid where each cell maps to the pixel-distance threshold,
// then merges adjacent cells to form clusters.
function clusterCampsites(
  campsites: Campsite[],
  zoom: number,
  isMobile: boolean = false
): ClusteredCampsite[] {
  if (campsites.length === 0) return [];

  // Clustering distance in pixels — only cluster when markers would truly overlap
  const maxDistancePx = isMobile
    ? zoom > 12
      ? 15
      : zoom > 10
        ? 25
        : 40
    : zoom > 12
      ? 20
      : zoom > 10
        ? 30
        : 50;

  // Convert pixel distance to approximate degrees for grid cell sizing
  // metersPerPixel at equator = 156543.03392 / 2^zoom, adjusted by avg latitude
  const avgLat = campsites.reduce((sum, c) => sum + c.lat, 0) / campsites.length;
  const metersPerPixel = (156543.03392 * Math.cos((avgLat * Math.PI) / 180)) / Math.pow(2, zoom);
  const cellSizeMeters = maxDistancePx * metersPerPixel;
  const cellSizeDeg = cellSizeMeters / 111320; // approximate meters per degree

  if (cellSizeDeg <= 0) return campsites;

  // Build spatial grid — each campsite goes into exactly one cell
  const grid = new Map<string, Campsite[]>();
  for (const campsite of campsites) {
    const cellX = Math.floor(campsite.lng / cellSizeDeg);
    const cellY = Math.floor(campsite.lat / cellSizeDeg);
    const key = `${cellX}_${cellY}`;
    const cell = grid.get(key);
    if (cell) {
      cell.push(campsite);
    } else {
      grid.set(key, [campsite]);
    }
  }

  // Merge each cell with its 8 neighbors to form clusters
  const clusters: ClusteredCampsite[] = [];
  const processedCells = new Set<string>();

  for (const [key, cellCampsites] of grid) {
    if (processedCells.has(key)) continue;
    processedCells.add(key);

    const [cellXStr, cellYStr] = key.split('_');
    const cellX = parseInt(cellXStr);
    const cellY = parseInt(cellYStr);

    // Gather campsites from this cell and unprocessed neighbors
    const clusterMembers = [...cellCampsites];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        const neighborKey = `${cellX + dx}_${cellY + dy}`;
        if (processedCells.has(neighborKey)) continue;
        const neighborCampsites = grid.get(neighborKey);
        if (neighborCampsites) {
          clusterMembers.push(...neighborCampsites);
          processedCells.add(neighborKey);
        }
      }
    }

    if (clusterMembers.length > 1) {
      const centerLat = clusterMembers.reduce((sum, c) => sum + c.lat, 0) / clusterMembers.length;
      const centerLng = clusterMembers.reduce((sum, c) => sum + c.lng, 0) / clusterMembers.length;
      clusters.push({
        ...clusterMembers[0],
        id: Date.now() + clusters.length,
        location: { lat: centerLat, lng: centerLng },
        name: `${clusterMembers.length} campsites`,
        isCluster: true,
        clusterCount: clusterMembers.length,
        clusterCampsites: clusterMembers,
      });
    } else {
      clusters.push(clusterMembers[0]);
    }
  }

  return clusters;
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
  filterState,
  highlightedCampsiteId,
  selectedCampsiteId,
}) => {
  const map = useMap();
  const { calculatedRoute, waypoints, addWaypoint } = useRouteStore();
  const { profile } = useVehicleStore();
  const { addNotification } = useUIStore();
  const { trackFeature } = useAnalytics();

  // Check if a campsite is already in the route
  const isCampsiteInRoute = useCallback(
    (campsite: Campsite): boolean => {
      return waypoints.some(
        wp => Math.abs(wp.lat - campsite.lat) < 0.0001 && Math.abs(wp.lng - campsite.lng) < 0.0001
      );
    },
    [waypoints]
  );

  // Add a campsite as a waypoint
  const handleAddToRoute = useCallback(
    (campsite: Campsite, e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent popup from closing

      if (isCampsiteInRoute(campsite)) {
        addNotification({
          type: 'warning',
          message: `${campsite.name || 'This campsite'} is already in your route`,
        });
        return;
      }

      const newWaypoint = {
        id: `campsite-${campsite.id}-${Date.now()}`,
        lat: campsite.lat,
        lng: campsite.lng,
        type: 'campsite' as const,
        name: campsite.name || `${campsite.type.replace('_', ' ')} #${campsite.id}`,
        notes: campsite.address || '',
      };

      addWaypoint(newWaypoint);
      addNotification({
        type: 'success',
        message: `Added "${newWaypoint.name}" to your route`,
      });
    },
    [addWaypoint, addNotification, isCampsiteInRoute]
  );

  const [campsites, setCampsites] = useState<Campsite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{
    message: string;
    suggestion?: string;
    retryable?: boolean;
  } | null>(null);
  // const [selectedCampsiteId, setSelectedCampsiteId] = useState<number | null>(null); // Unused for now
  const [zoom, setZoom] = useState(map.getZoom());

  // Progressive rendering — show markers in batches for faster perceived load
  const BATCH_SIZE = 80;
  const [visibleBatchCount, setVisibleBatchCount] = useState(0);

  // Track zoom changes for clustering
  useEffect(() => {
    const handleZoomEnd = () => setZoom(map.getZoom());
    map.on('zoomend', handleZoomEnd);
    return () => {
      map.off('zoomend', handleZoomEnd);
    };
  }, [map]);

  // Classify errors and provide helpful user-facing messages
  const classifyError = useCallback(
    (err: unknown): { message: string; suggestion?: string; retryable?: boolean } => {
      if (!(err instanceof Error)) {
        return {
          message: 'Failed to load campsites',
          suggestion: 'Please try again or zoom to a different area.',
          retryable: true,
        };
      }

      const errorMsg = err.message.toLowerCase();

      // Timeout errors
      if (errorMsg.includes('timeout')) {
        return {
          message: 'Request timed out while loading campsites',
          suggestion: 'The area may be too large. Try zooming in to search a smaller area.',
          retryable: true,
        };
      }

      // Network errors
      if (errorMsg.includes('failed to fetch') || errorMsg.includes('network')) {
        return {
          message: 'Network connection failed',
          suggestion: 'Please check your internet connection and try again.',
          retryable: true,
        };
      }

      // Rate limit errors
      if (errorMsg.includes('rate limit') || errorMsg.includes('too many requests')) {
        return {
          message: 'Too many requests',
          suggestion: 'Please wait a moment before searching again.',
          retryable: true,
        };
      }

      // Bounding box too large
      if (errorMsg.includes('bounding box too large')) {
        return {
          message: 'Search area too large',
          suggestion: 'Please zoom in to search a smaller area.',
          retryable: false,
        };
      }

      // No data found
      if (errorMsg.includes('no data') || errorMsg.includes('404')) {
        return {
          message: 'No campsites found in this area',
          suggestion: 'Try zooming out or searching a different location.',
          retryable: false,
        };
      }

      // Server errors
      if (errorMsg.includes('http 5')) {
        return {
          message: 'Campsite service temporarily unavailable',
          suggestion: 'Please try again in a few moments.',
          retryable: true,
        };
      }

      // Default error
      return {
        message: err.message || 'Failed to load campsites',
        suggestion: 'Please try again. If the problem persists, try zooming to a different area.',
        retryable: true,
      };
    },
    []
  );

  // Helper function to check if a campsite is compatible with the user's vehicle
  const isVehicleCompatible = useCallback(
    (campsite: Campsite): boolean => {
      // If no vehicle profile is set, assume all campsites are compatible
      if (!profile) return true;

      // Only use dimensional restrictions (max_height, max_length, max_weight)
      // These are explicit and reliable when present in OSM data
      // NOTE: We intentionally DON'T check access.motorhome/caravan because most
      // OSM campsites don't have this tag, and the parseBoolean() function returns
      // false for undefined values, which would incorrectly filter out ALL untagged campsites

      // Height check - reject if vehicle is too tall
      if (profile.height && campsite.access?.max_height) {
        if (profile.height > campsite.access.max_height) return false;
      }

      // Length check - reject if vehicle is too long
      if (profile.length && campsite.access?.max_length) {
        if (profile.length > campsite.access.max_length) return false;
      }

      // Weight check - reject if vehicle is too heavy
      if (profile.weight && campsite.access?.max_weight) {
        if (profile.weight > campsite.access.max_weight) return false;
      }

      // If no explicit size restrictions found that exceed vehicle dimensions, assume compatible
      return true;
    },
    [profile]
  );

  // Filter campsites based on filter state or fallback to props
  const filteredCampsites = useMemo(() => {
    // eslint-disable-next-line no-constant-condition -- Advanced filtering temporarily disabled until fixed
    if (filterState && false) {
      // Use advanced filtering
      const routeGeometry = calculatedRoute?.routes?.[0]?.geometry;
      const mapCenter = map
        ? ([map.getCenter().lat, map.getCenter().lng] as [number, number])
        : undefined;

      const advancedFiltered = filterState
        ? CampsiteFilterService.filterCampsites(
            campsites,
            filterState as CampsiteFilterState,
            routeGeometry,
            mapCenter
          )
        : campsites;

      return advancedFiltered;
    } else {
      // First, compute vehicleCompatible for all campsites based on current vehicle profile
      let filtered = campsites.map(campsite => ({
        ...campsite,
        vehicleCompatible: isVehicleCompatible(campsite),
      }));

      // Filter by vehicle compatibility if the option is enabled
      if (vehicleCompatibleOnly) {
        filtered = filtered.filter(campsite => campsite.vehicleCompatible);
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          campsite =>
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
  }, [
    campsites,
    vehicleCompatibleOnly,
    searchQuery,
    visibleTypes,
    filterState,
    calculatedRoute,
    map,
    isVehicleCompatible,
  ]);

  // Cluster campsites based on zoom level
  const clusteredCampsites = useMemo(() => {
    if (!isVisible || zoom >= 15) return filteredCampsites; // No clustering at high zoom
    const result = clusterCampsites(filteredCampsites, zoom, isMobile);

    return result;
  }, [filteredCampsites, zoom, isVisible, isMobile]);

  // Progressive rendering: show first batch immediately, then fill in the rest
  useEffect(() => {
    if (clusteredCampsites.length === 0) {
      setVisibleBatchCount(0);
      return;
    }

    // Show first batch immediately
    setVisibleBatchCount(BATCH_SIZE);

    if (clusteredCampsites.length <= BATCH_SIZE) return;

    // Render remaining batches using requestAnimationFrame
    let currentBatch = BATCH_SIZE;
    let rafId: number;

    const renderNextBatch = () => {
      currentBatch += BATCH_SIZE;
      setVisibleBatchCount(Math.min(currentBatch, clusteredCampsites.length));

      if (currentBatch < clusteredCampsites.length) {
        rafId = requestAnimationFrame(renderNextBatch);
      }
    };

    rafId = requestAnimationFrame(renderNextBatch);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [clusteredCampsites]);

  // Slice campsites to current visible batch
  const visibleCampsites = useMemo(
    () => clusteredCampsites.slice(0, visibleBatchCount),
    [clusteredCampsites, visibleBatchCount]
  );

  // Load campsites for current map bounds
  const loadCampsites = useCallback(async () => {
    if (!map || !FeatureFlags.CAMPSITE_DISPLAY || !isVisible) return;

    // Only load campsites at reasonable zoom levels (7+ for performance and API limits)
    const currentZoom = map.getZoom();
    if (currentZoom < 7) return;

    setIsLoading(true);
    setError(null);

    try {
      const bounds = map.getBounds();

      // Validate bounds before making API call
      if (!bounds) {
        setIsLoading(false);
        return;
      }

      const north = bounds.getNorth();
      const south = bounds.getSouth();
      const east = bounds.getEast();
      const west = bounds.getWest();

      // Validate bound values
      if (
        typeof north === 'undefined' ||
        typeof south === 'undefined' ||
        typeof east === 'undefined' ||
        typeof west === 'undefined' ||
        isNaN(north) ||
        isNaN(south) ||
        isNaN(east) ||
        isNaN(west)
      ) {
        setIsLoading(false);
        return;
      }

      // Add a 10% buffer around viewport for smoother panning
      const latBuffer = (north - south) * 0.1;
      const lngBuffer = (east - west) * 0.1;

      const request: CampsiteRequest = {
        bounds: {
          north: north + latBuffer,
          south: south - latBuffer,
          east: east + lngBuffer,
          west: west - lngBuffer,
        },
        types: visibleTypes,
        maxResults,
        includeDetails: true,
        vehicleFilter: profile || undefined,
      };

      const response = await campsiteService.searchCampsites(request);

      if (response.status === 'success') {
        setCampsites(response.campsites);
        onCampsitesLoaded?.(response.campsites.length, response.campsites);
        trackFeature('campsite_search', 'completed', { results: response.campsites.length });
      } else {
        // Show error but keep existing campsites visible
        const errorInfo = classifyError(new Error(response.error || 'Failed to load campsites'));
        setError(errorInfo);
      }
    } catch (err) {
      const errorInfo = classifyError(err);
      setError(errorInfo);
      // Don't clear existing campsites on error — keep showing what we had
    } finally {
      setIsLoading(false);
    }
  }, [
    map,
    visibleTypes,
    maxResults,
    profile,
    isVisible,
    onCampsitesLoaded,
    classifyError,
    trackFeature,
  ]);

  // Auto-load campsites around route, splitting large bboxes into tiles
  const loadCampsitesAroundRoute = useCallback(async () => {
    if (!calculatedRoute?.routes?.[0]?.geometry || !isVisible) return;

    const routeGeometry = calculatedRoute.routes[0].geometry;

    // Calculate bounding box from route geometry
    let minLat = Infinity,
      maxLat = -Infinity;
    let minLng = Infinity,
      maxLng = -Infinity;

    routeGeometry.coordinates.forEach((coord: [number, number]) => {
      const [lng, lat] = coord;
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    });

    // Add buffer around route (approximately 10km)
    const buffer = 0.1;
    const south = minLat - buffer;
    const north = maxLat + buffer;
    const west = minLng - buffer;
    const east = maxLng + buffer;

    // Split into tiles if the bbox exceeds the 4.5-degree API limit
    const maxSpan = 4.5;
    const tiles: { north: number; south: number; east: number; west: number }[] = [];
    for (let latStart = south; latStart < north; latStart += maxSpan) {
      for (let lngStart = west; lngStart < east; lngStart += maxSpan) {
        tiles.push({
          south: latStart,
          north: Math.min(latStart + maxSpan, north),
          west: lngStart,
          east: Math.min(lngStart + maxSpan, east),
        });
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch all tiles in parallel and merge results
      const allCampsites: Campsite[] = [];
      const seenIds = new Set<number>();

      const tileResults = await Promise.allSettled(
        tiles.map(bounds =>
          campsiteService.searchCampsites({
            bounds,
            types: visibleTypes,
            maxResults,
            includeDetails: true,
            vehicleFilter: profile || undefined,
          })
        )
      );

      for (const result of tileResults) {
        if (result.status === 'fulfilled' && result.value.status === 'success') {
          for (const campsite of result.value.campsites) {
            if (!seenIds.has(campsite.id)) {
              seenIds.add(campsite.id);
              allCampsites.push(campsite);
            }
          }
        }
      }

      setCampsites(allCampsites);
      onCampsitesLoaded?.(allCampsites.length, allCampsites);
    } catch (err) {
      const errorInfo = classifyError(err);
      setError(errorInfo);
      // Don't clear existing campsites on error — keep showing what we had
    } finally {
      setIsLoading(false);
    }
  }, [
    calculatedRoute,
    visibleTypes,
    maxResults,
    profile,
    isVisible,
    onCampsitesLoaded,
    classifyError,
  ]);

  // Refs to track last loaded bounds for intelligent load-skipping
  const lastLoadedBoundsRef = useRef<L.LatLngBounds | null>(null);
  const lastLoadedZoomRef = useRef<number>(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load campsites when map moves — includes loadCampsites in deps so handler is always fresh
  useEffect(() => {
    if (!isVisible || !map) return;

    const handleMoveEnd = () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        const currentBounds = map.getBounds();
        const currentZoom = map.getZoom();

        // Skip loading if the movement is minor and zoom hasn't changed significantly
        const lastBounds = lastLoadedBoundsRef.current;
        const lastZoom = lastLoadedZoomRef.current;
        if (lastBounds && Math.abs(currentZoom - lastZoom) < 1) {
          const boundsExpansion = 0.2; // 20% threshold — overlap-aware cache handles the rest
          const latDiff =
            Math.abs(currentBounds.getSouth() - lastBounds.getSouth()) +
            Math.abs(currentBounds.getNorth() - lastBounds.getNorth());
          const lngDiff =
            Math.abs(currentBounds.getWest() - lastBounds.getWest()) +
            Math.abs(currentBounds.getEast() - lastBounds.getEast());
          const latRange = lastBounds.getNorth() - lastBounds.getSouth();
          const lngRange = lastBounds.getEast() - lastBounds.getWest();

          if (latDiff < latRange * boundsExpansion && lngDiff < lngRange * boundsExpansion) {
            return;
          }
        }

        // Update tracking refs
        lastLoadedBoundsRef.current = currentBounds;
        lastLoadedZoomRef.current = currentZoom;
        loadCampsites();
      }, 300);
    };

    map.on('moveend', handleMoveEnd);

    // Initial load
    loadCampsites();

    return () => {
      map.off('moveend', handleMoveEnd);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [map, isVisible, loadCampsites]);

  // Load campsites around route when route changes
  useEffect(() => {
    if (calculatedRoute && isVisible) {
      loadCampsitesAroundRoute();
    }
  }, [calculatedRoute, isVisible, loadCampsitesAroundRoute]);

  // Don't render if not visible
  if (!isVisible || !FeatureFlags.CAMPSITE_DISPLAY) return null;

  return (
    <>
      {/* Loading indicator */}
      {isLoading && (
        <div
          className="fixed top-24 right-4 z-50 bg-white shadow-lg rounded-lg px-4 py-3 flex items-center space-x-3 animate-fade-in"
          style={{ pointerEvents: 'none' }}
        >
          <div className="animate-spin h-5 w-5 border-[2.5px] border-primary-200 border-t-primary-600 rounded-full"></div>
          <div>
            <span className="text-sm font-medium text-neutral-800">Loading campsites...</span>
            {campsites.length > 0 && (
              <div className="text-xs text-neutral-500 mt-0.5">{campsites.length} found so far</div>
            )}
          </div>
        </div>
      )}

      {/* Progressive rendering indicator */}
      {!isLoading && visibleBatchCount > 0 && visibleBatchCount < clusteredCampsites.length && (
        <div
          className="fixed top-24 right-4 z-50 bg-white/90 backdrop-blur-sm shadow-md rounded-lg px-3 py-2 animate-fade-in"
          style={{ pointerEvents: 'none' }}
        >
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-neutral-600">
              Showing {visibleBatchCount} of {clusteredCampsites.length}...
            </span>
          </div>
        </div>
      )}

      {/* Error indicator with retry */}
      {error && !isLoading && (
        <div className="fixed top-24 right-4 z-50 max-w-sm bg-red-50 shadow-lg rounded-lg p-4 border border-red-200 animate-slide-in-right">
          <div className="flex items-start space-x-3">
            <svg
              className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-red-900">{error.message}</h4>
              {error.suggestion && <p className="text-xs text-red-700 mt-1">{error.suggestion}</p>}
              <div className="flex items-center space-x-2 mt-2">
                {error.retryable && (
                  <button
                    onClick={() => {
                      setError(null);
                      loadCampsites();
                    }}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-white border border-red-300 rounded hover:bg-red-50 transition-colors"
                  >
                    <svg
                      className="w-3 h-3 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Retry
                  </button>
                )}
                <button
                  onClick={() => setError(null)}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 hover:text-red-900"
                >
                  Dismiss
                </button>
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {visibleCampsites.map(campsite => {
        const isHighlighted = highlightedCampsiteId === campsite.id.toString();
        const isSelected = selectedCampsiteId === campsite.id.toString();
        const isCluster = (campsite as ClusteredCampsite).isCluster;

        // Check if this campsite is already in the route
        const campsiteInRoute = isCampsiteInRoute(campsite);

        // Create custom icon for this campsite/cluster
        const customIcon = isCluster
          ? createClusterIcon({
              getChildCount: () => (campsite as ClusteredCampsite).clusterCount || 0,
            })
          : createCampsiteIcon({
              campsite,
              vehicleCompatible: campsite.vehicleCompatible,
              isSelected,
              isHighlighted,
              isInRoute: campsiteInRoute,
              isMobile,
              showTooltip: true,
            });

        return (
          <Marker
            key={campsite.id}
            position={
              isCluster && (campsite as ClusteredCampsite).location
                ? [
                    (campsite as ClusteredCampsite).location!.lat,
                    (campsite as ClusteredCampsite).location!.lng,
                  ]
                : [campsite.lat, campsite.lng]
            }
            // @ts-expect-error - React-Leaflet v4 types don't include icon prop but it works
            icon={customIcon}
            eventHandlers={{
              click: () => {
                // setSelectedCampsiteId(campsite.id); // Unused for now
                if (isCluster) {
                  // Zoom to cluster bounds
                  if ((campsite as ClusteredCampsite).clusterCampsites) {
                    const bounds = L.latLngBounds(
                      (campsite as ClusteredCampsite).clusterCampsites!.map((c: Campsite) => [
                        c.lat,
                        c.lng,
                      ])
                    );
                    map.fitBounds(bounds, { padding: [20, 20] });
                  }
                } else {
                  onCampsiteClick?.(campsite);
                }
              },
            }}
          >
            <Popup>
              {isCluster ? (
                <div className="p-3">
                  <h3 className="font-medium text-neutral-900 text-sm mb-2">
                    {(campsite as ClusteredCampsite).clusterCount} Campsites
                  </h3>
                  <p className="text-xs text-neutral-600 mb-2">
                    Click to zoom in and see individual campsites
                  </p>
                  <div className="space-y-1">
                    {(campsite as ClusteredCampsite).clusterCampsites
                      ?.slice(0, 3)
                      .map((c: Campsite, idx: number) => (
                        <div key={idx} className="text-xs text-neutral-700">
                          • {c.name || c.type.replace('_', ' ')}
                        </div>
                      ))}
                    {(campsite as ClusteredCampsite).clusterCampsites &&
                      (campsite as ClusteredCampsite).clusterCampsites!.length > 3 && (
                        <div className="text-xs text-neutral-500">
                          and {(campsite as ClusteredCampsite).clusterCampsites!.length - 3} more...
                        </div>
                      )}
                  </div>
                </div>
              ) : (
                <div className="campsite-popup-content p-3 min-w-0">
                  {/* Enhanced popup content same as before */}
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-neutral-900 text-sm leading-tight pr-2">
                      {campsite.name || `${campsite.type.replace('_', ' ')} #${campsite.id}`}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                        campsite.vehicleCompatible
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {campsite.vehicleCompatible ? (
                        <>
                          <CheckCircle className="inline-block w-3 h-3 mr-1" /> Compatible
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="inline-block w-3 h-3 mr-1" /> Check Size
                        </>
                      )}
                    </span>
                  </div>

                  <div className="mb-2">
                    <div className="text-xs text-neutral-600 capitalize mb-1">
                      {campsite.type.replace('_', ' ')}
                    </div>

                    {campsite.address && (
                      <div className="text-xs text-neutral-700 mb-1">📍 {campsite.address}</div>
                    )}
                    {campsite.phone && (
                      <div className="text-xs text-neutral-700 mb-1">📞 {campsite.phone}</div>
                    )}
                    {campsite.website && (
                      <div className="text-xs text-neutral-700 mb-1">
                        🌐{' '}
                        <a
                          href={campsite.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-800 underline"
                        >
                          Website
                        </a>
                      </div>
                    )}
                    {campsite.opening_hours && (
                      <div className="text-xs text-neutral-700 mb-1">
                        🕒 {campsite.opening_hours}
                      </div>
                    )}
                  </div>

                  {/* Amenities */}
                  {campsite.amenities && Object.keys(campsite.amenities).length > 0 && (
                    <div className="mb-2">
                      <div className="text-xs font-medium text-neutral-900 mb-1">Amenities:</div>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(campsite.amenities)
                          .filter(([_, available]) => available)
                          .map(([amenity]) => (
                            <span
                              key={amenity}
                              className="px-1.5 py-0.5 bg-primary-100 text-primary-800 text-xs rounded"
                            >
                              {amenity.replace(/_/g, ' ')}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Vehicle restrictions */}
                  {!campsite.vehicleCompatible && campsite.restrictions && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                      <div className="text-xs font-medium text-red-800 mb-1">
                        <AlertTriangle className="inline-block w-3 h-3 mr-1" /> Vehicle
                        Restrictions:
                      </div>
                      <div className="text-xs text-red-700">{campsite.restrictions}</div>
                    </div>
                  )}

                  {/* Add to Route button */}
                  <div className="mt-3 pt-2 border-t border-neutral-200">
                    {isCampsiteInRoute(campsite) ? (
                      <div className="flex items-center justify-center py-2 px-3 bg-green-50 text-green-700 rounded-md text-xs font-medium">
                        <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Already in route
                      </div>
                    ) : (
                      <button
                        onClick={e => handleAddToRoute(campsite, e)}
                        className="w-full flex items-center justify-center py-2 px-3 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium transition-colors"
                      >
                        <svg
                          className="w-4 h-4 mr-1.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        Add to Route
                      </button>
                    )}
                  </div>

                  <div className="mt-2 text-xs text-neutral-500">
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
