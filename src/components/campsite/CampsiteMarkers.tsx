// Campsite Markers Component
// Phase 4.1: Display campsite data on map with proper markers and info

import React, { useEffect, useState, useCallback } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { MapPin, Phone, Globe, Tent, Truck, ParkingCircle } from 'lucide-react';
import * as L from 'leaflet';
import '../../types/leaflet';
import { campsiteService } from '../../services/CampsiteService';
import { useRouteStore } from '../../store';
import { FeatureFlags } from '../../config';
import {
  type Campsite,
  type CampsiteRequest,
  type CampsiteType,
} from '../../services/CampsiteService';

interface CampsiteMarkersProps {
  bounds?: L.LatLngBounds;
  visibleTypes?: CampsiteType[];
  maxResults?: number;
  onCampsiteClick?: (campsite: Campsite) => void;
}

// Inline SVG for HTML strings
const svgStr = (path: string, size = 16) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;

const MARKER_SVG: Record<CampsiteType, string> = {
  campsite: svgStr('<path d="M3 20 12 4l9 16Z"/><path d="M12 4v16"/>'),
  caravan_site: svgStr(
    '<path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"/><path d="M14 17h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>'
  ),
  aire: svgStr('<circle cx="12" cy="12" r="10"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>'),
  parking: svgStr(
    '<rect x="1" y="3" width="22" height="18" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>'
  ),
};

// Custom campsite icons
const createCampsiteIcon = (type: CampsiteType, vehicleCompatible: boolean = true) => {
  const color = vehicleCompatible ? '#27ae60' : '#e63946'; // green for compatible, red for incompatible

  return L.divIcon({
    className: 'campsite-marker',
    html: `<div style="
      background: ${color};
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    ">${MARKER_SVG[type]}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

const CampsiteMarkers: React.FC<CampsiteMarkersProps> = ({
  bounds,
  visibleTypes = ['campsite', 'caravan_site', 'aire'],
  maxResults = 100,
  onCampsiteClick,
}) => {
  const [campsites, setCampsites] = useState<Campsite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { calculatedRoute } = useRouteStore();

  // Load campsites for current bounds
  const loadCampsites = useCallback(
    async (searchBounds: L.LatLngBounds) => {
      if (!FeatureFlags.CAMPSITE_DISPLAY) return;

      setIsLoading(true);
      setError(null);

      try {
        const request: CampsiteRequest = {
          bounds: {
            north: searchBounds.getNorth(),
            south: searchBounds.getSouth(),
            east: searchBounds.getEast(),
            west: searchBounds.getWest(),
          },
          types: visibleTypes,
          maxResults,
          includeDetails: true,
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
    },
    [visibleTypes, maxResults]
  );

  // Load campsites when bounds change
  useEffect(() => {
    if (bounds) {
      loadCampsites(bounds);
    }
  }, [bounds, loadCampsites]);

  // Auto-load campsites around route
  useEffect(() => {
    if (calculatedRoute?.routes?.[0]?.geometry && !bounds) {
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
      const buffer = 0.1; // degrees
      const routeBounds = L.latLngBounds(
        [minLat - buffer, minLng - buffer],
        [maxLat + buffer, maxLng + buffer]
      );

      loadCampsites(routeBounds);
    }
  }, [calculatedRoute, bounds, loadCampsites]);

  // Don't render if feature disabled
  if (!FeatureFlags.CAMPSITE_DISPLAY) return null;

  return (
    <>
      {campsites.map(campsite => (
        <Marker
          key={campsite.id}
          position={[campsite.lat, campsite.lng]}
          // @ts-expect-error - React-Leaflet v4 types don't include icon prop but it works at runtime
          icon={createCampsiteIcon(campsite.type, campsite.vehicleCompatible)}
          eventHandlers={{
            click: () => onCampsiteClick?.(campsite),
          }}
        >
          <Popup
            // @ts-expect-error - className prop works at runtime but missing from React-Leaflet types
            className="campsite-popup"
            maxWidth={300}
          >
            <div className="p-3">
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-neutral-900 text-sm leading-tight">
                  {campsite.name || `${campsite.type} #${campsite.id}`}
                </h3>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    campsite.vehicleCompatible
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {campsite.vehicleCompatible ? '✓ Compatible' : '⚠ Check Size'}
                </span>
              </div>

              {/* Type indicator */}
              <div className="flex items-center mb-2">
                <span className="mr-2">
                  {campsite.type === 'campsite' ? (
                    <Tent className="w-5 h-5" />
                  ) : campsite.type === 'caravan_site' ? (
                    <Truck className="w-5 h-5" />
                  ) : (
                    <ParkingCircle className="w-5 h-5" />
                  )}
                </span>
                <span className="text-xs text-neutral-600 capitalize">
                  {campsite.type.replace('_', ' ')}
                </span>
              </div>

              {/* Basic info */}
              <div className="space-y-1 text-xs text-neutral-700">
                {campsite.address && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {campsite.address}
                  </div>
                )}

                {campsite.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {campsite.phone}
                  </div>
                )}

                {campsite.website && (
                  <div className="flex items-center gap-1">
                    <Globe className="w-3 h-3" />{' '}
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

                {campsite.opening_hours && <div>🕒 {campsite.opening_hours}</div>}
              </div>

              {/* Amenities */}
              {campsite.amenities && Object.keys(campsite.amenities).length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-medium text-neutral-900 mb-1">Amenities:</div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(campsite.amenities).map(([key, value]) =>
                      value === true ? (
                        <span
                          key={key}
                          className="px-1.5 py-0.5 bg-primary-100 text-primary-800 text-xs rounded"
                        >
                          {key.replace(/_/g, ' ')}
                        </span>
                      ) : null
                    )}
                  </div>
                </div>
              )}

              {/* Vehicle restrictions warning */}
              {!campsite.vehicleCompatible && campsite.restrictions && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                  <div className="text-xs font-medium text-red-800 mb-1">Vehicle Restrictions:</div>
                  <div className="text-xs text-red-700">
                    {campsite.access?.max_height && (
                      <div>Max height: {campsite.access.max_height}m</div>
                    )}
                    {campsite.access?.max_weight && (
                      <div>Max weight: {campsite.access.max_weight}t</div>
                    )}
                    {campsite.access?.max_length && (
                      <div>Max length: {campsite.access.max_length}m</div>
                    )}
                    {!campsite.access?.motorhome && <div>No motorhomes</div>}
                    {!campsite.access?.caravan && <div>No caravans</div>}
                  </div>
                </div>
              )}

              {/* Data source */}
              <div className="mt-3 pt-2 border-t border-neutral-200 text-xs text-neutral-500">
                Data from {campsite.source} • ID: {campsite.osmId || campsite.id}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Loading indicator */}
      {isLoading && (
        <div className="fixed top-4 right-4 bg-white shadow-lg rounded-lg p-3 z-[1000]">
          <div className="flex items-center space-x-2 text-sm text-neutral-700">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent"></div>
            <span>Loading campsites...</span>
          </div>
        </div>
      )}

      {/* Error indicator */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-50 border border-red-200 shadow-lg rounded-lg p-3 z-[1000]">
          <div className="flex items-center space-x-2 text-sm text-red-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <span>Error loading campsites: {error}</span>
          </div>
        </div>
      )}
    </>
  );
};

export default CampsiteMarkers;
