// Campsite Layer Component
// Phase 4.2: Complete campsite display with clustering and search

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import { campsiteService } from '../../services/CampsiteService';
import type { Campsite, CampsiteRequest, CampsiteType } from '../../services/CampsiteService';
import { useRouteStore, useVehicleStore, useUIStore } from '../../store';
import { FeatureFlags } from '../../config';
import { createCampsiteIcon, createClusterIcon } from './CampsiteIcons';

// Extend leaflet types for marker clustering
declare module 'leaflet' {
  namespace MarkerClusterGroup {
    interface MarkerClusterGroupOptions {
      chunkedLoading?: boolean;
      chunkProgress?: (processed: number, total: number, elapsed: number) => void;
      maxClusterRadius?: number;
      disableClusteringAtZoom?: number;
      spiderfyOnMaxZoom?: boolean;
      showCoverageOnHover?: boolean;
      zoomToBoundsOnClick?: boolean;
      removeOutsideVisibleBounds?: boolean;
      iconCreateFunction?: (cluster: any) => L.DivIcon;
    }
  }

  function markerClusterGroup(options?: MarkerClusterGroup.MarkerClusterGroupOptions): any;
}

export interface CampsiteLayerProps {
  visibleTypes: CampsiteType[];
  maxResults: number;
  vehicleCompatibleOnly: boolean;
  searchQuery?: string;
  isVisible: boolean;
  onCampsiteClick?: (campsite: Campsite) => void;
  onCampsitesLoaded?: (count: number) => void;
  isMobile?: boolean;
}

const CampsiteLayer: React.FC<CampsiteLayerProps> = ({
  visibleTypes,
  maxResults,
  vehicleCompatibleOnly,
  searchQuery = '',
  isVisible,
  onCampsiteClick,
  onCampsitesLoaded,
  isMobile = false
}) => {
  const map = useMap();
  const { calculatedRoute } = useRouteStore();
  const { profile } = useVehicleStore();
  const { addNotification } = useUIStore();

  const [campsites, setCampsites] = useState<Campsite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCampsiteId, setSelectedCampsiteId] = useState<string | null>(null);
  const [clusterGroup, setClusterGroup] = useState<any>(null);

  // Initialize marker cluster group
  useEffect(() => {
    if (!map || !FeatureFlags.CAMPSITE_DISPLAY) return;

    const cluster = (L as any).markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: isMobile ? 60 : 80,
      disableClusteringAtZoom: isMobile ? 15 : 16,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      removeOutsideVisibleBounds: true,
      iconCreateFunction: createClusterIcon,
      chunkProgress: (processed: number, total: number) => {
        if (processed === total) {
          onCampsitesLoaded?.(total);
        }
      }
    });

    setClusterGroup(cluster);

    if (isVisible) {
      map.addLayer(cluster);
    }

    return () => {
      if (map.hasLayer(cluster)) {
        map.removeLayer(cluster);
      }
    };
  }, [map, isVisible, isMobile, onCampsitesLoaded]);

  // Toggle layer visibility
  useEffect(() => {
    if (!clusterGroup || !map) return;

    if (isVisible && !map.hasLayer(clusterGroup)) {
      map.addLayer(clusterGroup);
    } else if (!isVisible && map.hasLayer(clusterGroup)) {
      map.removeLayer(clusterGroup);
    }
  }, [isVisible, clusterGroup, map]);

  // Filter campsites based on search and compatibility
  const filteredCampsites = useMemo(() => {
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
  }, [campsites, vehicleCompatibleOnly, searchQuery, visibleTypes]);

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
      } else {
        throw new Error(response.error || 'Failed to load campsites');
      }
    } catch (err) {
      console.error('Error loading campsites:', err);
      setError(err instanceof Error ? err.message : 'Failed to load campsites');
      setCampsites([]);
    } finally {
      setIsLoading(false);
    }
  }, [map, visibleTypes, maxResults, profile, isVisible]);

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
      } else {
        throw new Error(response.error || 'Failed to load campsites');
      }
    } catch (err) {
      console.error('Error loading route campsites:', err);
      setError(err instanceof Error ? err.message : 'Failed to load campsites');
      setCampsites([]);
    } finally {
      setIsLoading(false);
    }
  }, [calculatedRoute, visibleTypes, maxResults, profile, isVisible]);

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

  // Update markers when filtered campsites change
  useEffect(() => {
    if (!clusterGroup) return;

    // Clear existing markers
    clusterGroup.clearLayers();

    // Add filtered campsite markers
    filteredCampsites.forEach(campsite => {
      const isSelected = selectedCampsiteId === campsite.id;

      const marker = L.marker(
        [campsite.location.lat, campsite.location.lng],
        {
          icon: createCampsiteIcon({
            campsite,
            vehicleCompatible: campsite.vehicleCompatible,
            isSelected,
            isMobile,
            size: isMobile ? 'small' : 'medium'
          })
        }
      );

      // Create enhanced popup content
      const popupContent = createCampsitePopup(campsite, profile);
      marker.bindPopup(popupContent, {
        maxWidth: isMobile ? 250 : 300,
        className: 'campsite-popup'
      });

      // Handle marker click
      marker.on('click', () => {
        setSelectedCampsiteId(campsite.id);
        onCampsiteClick?.(campsite);
      });

      clusterGroup.addLayer(marker);
    });

    // Notify parent of loaded count
    onCampsitesLoaded?.(filteredCampsites.length);
  }, [filteredCampsites, clusterGroup, selectedCampsiteId, onCampsiteClick, profile, isMobile]);

  // Don't render anything (this is a data layer)
  return null;
};

// Enhanced popup content creation
function createCampsitePopup(campsite: Campsite, vehicleProfile?: any): string {
  const amenityIcons: Record<string, string> = {
    electricity: '⚡',
    wifi: '📶',
    shower: '🚿',
    toilets: '🚻',
    drinking_water: '🚰',
    waste_disposal: '🗑️',
    laundry: '👕',
    restaurant: '🍽️',
    shop: '🛒',
    playground: '🎠',
    swimming_pool: '🏊',
    pet_allowed: '🐕'
  };

  const amenitiesHtml = campsite.amenities ? Object.entries(campsite.amenities)
    .filter(([_, available]) => available)
    .map(([amenity]) => `
      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 mr-1 mb-1">
        ${amenityIcons[amenity] || '•'} ${amenity.replace(/_/g, ' ')}
      </span>
    `).join('') : '';

  const restrictionsHtml = !campsite.vehicleCompatible && campsite.restrictions ? `
    <div class="mt-2 p-2 bg-red-50 border border-red-200 rounded">
      <div class="text-xs font-medium text-red-800 mb-1">⚠️ Vehicle Restrictions:</div>
      <div class="text-xs text-red-700">
        ${campsite.restrictions.maxHeight ? `Max height: ${campsite.restrictions.maxHeight}m<br>` : ''}
        ${campsite.restrictions.maxWidth ? `Max width: ${campsite.restrictions.maxWidth}m<br>` : ''}
        ${campsite.restrictions.maxLength ? `Max length: ${campsite.restrictions.maxLength}m<br>` : ''}
        ${campsite.restrictions.maxWeight ? `Max weight: ${campsite.restrictions.maxWeight}t` : ''}
      </div>
    </div>
  ` : '';

  return `
    <div class="campsite-popup-content p-3 min-w-0">
      <!-- Header -->
      <div class="flex items-start justify-between mb-2">
        <h3 class="font-medium text-gray-900 text-sm leading-tight pr-2">
          ${campsite.name || `${campsite.type.replace('_', ' ')} #${campsite.id}`}
        </h3>
        <span class="px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
          campsite.vehicleCompatible
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }">
          ${campsite.vehicleCompatible ? '✓ Compatible' : '⚠ Check Size'}
        </span>
      </div>

      <!-- Type and basic info -->
      <div class="mb-2">
        <div class="text-xs text-gray-600 capitalize mb-1">
          ${campsite.type.replace('_', ' ')}
        </div>

        ${campsite.address ? `<div class="text-xs text-gray-700 mb-1">📍 ${campsite.address}</div>` : ''}
        ${campsite.phone ? `<div class="text-xs text-gray-700 mb-1">📞 ${campsite.phone}</div>` : ''}
        ${campsite.website ? `
          <div class="text-xs text-gray-700 mb-1">
            🌐 <a href="${campsite.website}" target="_blank" rel="noopener noreferrer"
               class="text-blue-600 hover:text-blue-800 underline">Website</a>
          </div>` : ''}
        ${campsite.openingHours ? `<div class="text-xs text-gray-700 mb-1">🕒 ${campsite.openingHours}</div>` : ''}
      </div>

      <!-- Amenities -->
      ${amenitiesHtml ? `
        <div class="mb-2">
          <div class="text-xs font-medium text-gray-900 mb-1">Amenities:</div>
          <div class="flex flex-wrap">
            ${amenitiesHtml}
          </div>
        </div>
      ` : ''}

      <!-- Vehicle restrictions -->
      ${restrictionsHtml}

      <!-- Data source -->
      <div class="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
        Data from ${campsite.source} • ID: ${campsite.osmId || campsite.id}
      </div>
    </div>
  `;
}

export default CampsiteLayer;