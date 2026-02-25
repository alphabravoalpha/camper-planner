// Campsite Layer Component
// Phase 4.2: Complete campsite display with clustering and search

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useMap } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import '../../types/leaflet';
import { campsiteService } from '../../services/CampsiteService';
import { useRouteStore, useVehicleStore } from '../../store';
import { FeatureFlags } from '../../config';
import {
  type Campsite,
  type CampsiteRequest,
  type CampsiteType,
} from '../../services/CampsiteService';
import { createCampsiteIcon, createClusterIcon } from './CampsiteIcons';

// Marker clustering types are defined in src/types/leaflet-cluster.d.ts

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
  isMobile = false,
}) => {
  const map = useMap();
  const { calculatedRoute } = useRouteStore();
  const { profile } = useVehicleStore();
  const [campsites, setCampsites] = useState<Campsite[]>([]);
  const [, setIsLoading] = useState(false);
  const [, setError] = useState<string | null>(null);
  const [selectedCampsiteId, setSelectedCampsiteId] = useState<number | null>(null);
  const [clusterGroup, setClusterGroup] = useState<L.LayerGroup | null>(null);

  // Initialize marker cluster group
  useEffect(() => {
    if (!map || !FeatureFlags.CAMPSITE_DISPLAY) return;

    // @ts-expect-error - markerClusterGroup is added by leaflet.markercluster plugin and not in base Leaflet types
    const cluster = L.markerClusterGroup({
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
      },
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
          west: bounds.getWest(),
        },
        types: visibleTypes,
        maxResults,
        includeDetails: true,
        vehicleFilter: profile || undefined,
      };

      const response = await campsiteService.searchCampsites(request);

      if (response.status === 'success') {
        setCampsites(response.campsites);
      } else {
        throw new Error(response.error || 'Failed to load campsites');
      }
    } catch (err) {
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

    setIsLoading(true);
    setError(null);

    try {
      const request: CampsiteRequest = {
        bounds: {
          north: maxLat + buffer,
          south: minLat - buffer,
          east: maxLng + buffer,
          west: minLng - buffer,
        },
        types: visibleTypes,
        maxResults,
        includeDetails: true,
        vehicleFilter: profile || undefined,
      };

      const response = await campsiteService.searchCampsites(request);

      if (response.status === 'success') {
        setCampsites(response.campsites);
      } else {
        throw new Error(response.error || 'Failed to load campsites');
      }
    } catch (err) {
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

      const marker = L.marker([campsite.lat, campsite.lng], {
        icon: createCampsiteIcon({
          campsite,
          vehicleCompatible: campsite.vehicleCompatible,
          isSelected,
          isMobile,
          size: isMobile ? 'small' : 'medium',
        }),
      });

      // Create enhanced popup content
      const popupContent = createCampsitePopup(campsite, profile);
      marker.bindPopup(popupContent, {
        maxWidth: isMobile ? 250 : 300,
        className: 'campsite-popup',
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
  }, [
    filteredCampsites,
    clusterGroup,
    selectedCampsiteId,
    onCampsiteClick,
    onCampsitesLoaded,
    profile,
    isMobile,
  ]);

  // Don't render anything (this is a data layer)
  return null;
};

// Inline SVG icon helper for HTML string templates (Leaflet popups)
const svgIcon = (path: string, size = 14) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle">${path}</svg>`;

const SVG_ICONS = {
  zap: svgIcon('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'),
  wifi: svgIcon(
    '<path d="M5 13a10 10 0 0 1 14 0"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>'
  ),
  droplets: svgIcon(
    '<path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>'
  ),
  bath: svgIcon(
    '<path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><line x1="10" y1="5" x2="8" y2="7"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="7" y1="19" x2="7" y2="21"/><line x1="17" y1="19" x2="17" y2="21"/>'
  ),
  glassWater: svgIcon(
    '<path d="M15.2 22H8.8a2 2 0 0 1-2-1.79L5 3h14l-1.81 17.21A2 2 0 0 1 15.2 22z"/><path d="M6 12a5 5 0 0 1 6 0 5 5 0 0 0 6 0"/>'
  ),
  trash2: svgIcon(
    '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'
  ),
  shirt: svgIcon(
    '<path d="M20.38 3.46 16 2 12 5 8 2 3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>'
  ),
  utensils: svgIcon(
    '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>'
  ),
  shoppingCart: svgIcon(
    '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>'
  ),
  baby: svgIcon(
    '<path d="M9 12h.01"/><path d="M15 12h.01"/><path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/><path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"/>'
  ),
  waves: svgIcon(
    '<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>'
  ),
  dog: svgIcon(
    '<path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5"/><path d="M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.239-2.5"/><path d="M8 14v.5"/><path d="M16 14v.5"/><path d="M11.25 16.25h1.5L12 17l-.75-.75Z"/><path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444c0-1.061-.162-2.2-.493-3.309m-9.243-6.082A8.801 8.801 0 0 1 12 5c.78 0 1.5.108 2.161.306"/>'
  ),
  mapPin: svgIcon(
    '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>'
  ),
  phone: svgIcon(
    '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>'
  ),
  globe: svgIcon(
    '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'
  ),
  alertTriangle: svgIcon(
    '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'
  ),
};

// Enhanced popup content creation
function createCampsitePopup(campsite: Campsite, _vehicleProfile?: unknown): string {
  const amenityIcons: Record<string, string> = {
    electricity: SVG_ICONS.zap,
    wifi: SVG_ICONS.wifi,
    shower: SVG_ICONS.droplets,
    toilets: SVG_ICONS.bath,
    drinking_water: SVG_ICONS.glassWater,
    waste_disposal: SVG_ICONS.trash2,
    laundry: SVG_ICONS.shirt,
    restaurant: SVG_ICONS.utensils,
    shop: SVG_ICONS.shoppingCart,
    playground: SVG_ICONS.baby,
    swimming_pool: SVG_ICONS.waves,
    pet_allowed: SVG_ICONS.dog,
  };

  const amenitiesHtml = campsite.amenities
    ? Object.entries(campsite.amenities)
        .filter(([_, available]) => available)
        .map(
          ([amenity]) => `
      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary-100 text-primary-800 mr-1 mb-1">
        ${amenityIcons[amenity] || '•'} ${amenity.replace(/_/g, ' ')}
      </span>
    `
        )
        .join('')
    : '';

  const restrictionsHtml =
    !campsite.vehicleCompatible && campsite.access
      ? `
    <div class="mt-2 p-2 bg-red-50 border border-red-200 rounded">
      <div class="text-xs font-medium text-red-800 mb-1">${SVG_ICONS.alertTriangle} Vehicle Restrictions:</div>
      <div class="text-xs text-red-700">
        ${campsite.access.max_height ? `Max height: ${campsite.access.max_height}m<br>` : ''}
        ${campsite.access.max_weight ? `Max weight: ${campsite.access.max_weight}t<br>` : ''}
        ${campsite.access.max_length ? `Max length: ${campsite.access.max_length}m<br>` : ''}
        ${!campsite.access.motorhome ? `No motorhomes<br>` : ''}
        ${!campsite.access.caravan ? `No caravans` : ''}
      </div>
    </div>
  `
      : '';

  return `
    <div class="campsite-popup-content p-3 min-w-0">
      <!-- Header -->
      <div class="flex items-start justify-between mb-2">
        <h3 class="font-medium text-neutral-900 text-sm leading-tight pr-2">
          ${campsite.name || `${campsite.type.replace('_', ' ')} #${campsite.id}`}
        </h3>
        <span class="px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
          campsite.vehicleCompatible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }">
          ${campsite.vehicleCompatible ? '✓ Compatible' : '⚠ Check Size'}
        </span>
      </div>

      <!-- Type and basic info -->
      <div class="mb-2">
        <div class="text-xs text-neutral-600 capitalize mb-1">
          ${campsite.type.replace('_', ' ')}
        </div>

        ${campsite.address ? `<div class="text-xs text-neutral-700 mb-1">${SVG_ICONS.mapPin} ${campsite.address}</div>` : ''}
        ${campsite.phone ? `<div class="text-xs text-neutral-700 mb-1">${SVG_ICONS.phone} ${campsite.phone}</div>` : ''}
        ${
          campsite.website
            ? `
          <div class="text-xs text-neutral-700 mb-1">
            ${SVG_ICONS.globe} <a href="${campsite.website}" target="_blank" rel="noopener noreferrer"
               class="text-primary-600 hover:text-primary-800 underline">Website</a>
          </div>`
            : ''
        }
        ${campsite.opening_hours ? `<div class="text-xs text-neutral-700 mb-1">🕒 ${campsite.opening_hours}</div>` : ''}
      </div>

      <!-- Amenities -->
      ${
        amenitiesHtml
          ? `
        <div class="mb-2">
          <div class="text-xs font-medium text-neutral-900 mb-1">Amenities:</div>
          <div class="flex flex-wrap">
            ${amenitiesHtml}
          </div>
        </div>
      `
          : ''
      }

      <!-- Vehicle restrictions -->
      ${restrictionsHtml}

      <!-- Data source -->
      <div class="mt-2 pt-2 border-t border-neutral-200 text-xs text-neutral-500">
        Data from ${campsite.source} • ID: ${campsite.osmId || campsite.id}
      </div>
    </div>
  `;
}

export default CampsiteLayer;
