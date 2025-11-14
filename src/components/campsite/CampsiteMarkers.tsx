// Campsite Markers Component
// Phase 4.1: Display campsite data on map with proper markers and info

import React, { useEffect, useState, useCallback } from 'react';
import { Marker, Popup } from 'react-leaflet';
import * as L from 'leaflet';
import { campsiteService } from '../../services/CampsiteService';
import type { CampsiteRequest, CampsiteType } from '../../services/CampsiteService';
import type { UICampsite } from '../../adapters/CampsiteAdapter';
import { campsiteAdapter } from '../../adapters/CampsiteAdapter';
import { useRouteStore, useVehicleStore } from '../../store';
import { FeatureFlags } from '../../config';

interface CampsiteMarkersProps {
  bounds?: any; // Use any for Leaflet bounds to avoid type errors
  visibleTypes?: CampsiteType[];
  maxResults?: number;
  onCampsiteClick?: (campsite: UICampsite) => void;
}

// Custom campsite icons
const createCampsiteIcon = (type: CampsiteType, vehicleCompatible: boolean = true) => {
  const color = vehicleCompatible ? '#22c55e' : '#ef4444'; // green for compatible, red for incompatible
  const iconHtml = type === 'campsite'
    ? '⛺'
    : type === 'caravan_site'
    ? '🚐'
    : '🅿️'; // aires/parking

  return (L as any).divIcon({
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
      font-size: 16px;
    ">${iconHtml}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

const CampsiteMarkers: React.FC<CampsiteMarkersProps> = ({
  bounds,
  visibleTypes = ['campsite', 'caravan_site', 'aire'],
  maxResults = 100,
  onCampsiteClick
}) => {
  const [campsites, setCampsites] = useState<UICampsite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { calculatedRoute } = useRouteStore();
  const { profile } = useVehicleStore();

  // Load campsites for current bounds
  const loadCampsites = useCallback(async (searchBounds: any) => {
    if (!FeatureFlags.CAMPSITE_DISPLAY) return;

    setIsLoading(true);
    setError(null);
    try {
      const request: CampsiteRequest = {
        bounds: {
          north: searchBounds.getNorth(),
          south: searchBounds.getSouth(),
          east: searchBounds.getEast(),
          west: searchBounds.getWest()
        },
        types: visibleTypes,
        maxResults,
        vehicleFilter: profile ? {
          height: profile.height,
          length: profile.length,
          weight: profile.weight,
          motorhome: profile.type === 'motorhome',
          caravan: profile.type === 'caravan'
        } : undefined
      };

      const response = await campsiteService.searchCampsites(request);

      // Convert to UI format using adapter
      const uiResponse = campsiteAdapter.toUIResponse(response, profile);
      setCampsites(uiResponse.campsites);
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading campsites:', err);
      setError(err instanceof Error ? err.message : 'Failed to load campsites');
      setCampsites([]);
      setIsLoading(false);
    }
  }, [visibleTypes, maxResults, profile]);

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
      let minLat = Infinity, maxLat = -Infinity;
      let minLng = Infinity, maxLng = -Infinity;

      routeGeometry.coordinates.forEach((coord: [number, number]) => {
        const [lng, lat] = coord;
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
      });

      // Add buffer around route (approximately 10km)
      const buffer = 0.1; // degrees
      const routeBounds = (L as any).latLngBounds(
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
          position={[campsite.location.lat, campsite.location.lng]}
          icon={createCampsiteIcon(campsite.type, campsite.vehicleCompatible) as any}
          eventHandlers={{
            click: () => onCampsiteClick?.(campsite)
          }}
        >
          <Popup {...({ className: "campsite-popup", maxWidth: 300 } as any)}>
            <div className="p-3">
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-gray-900 text-sm leading-tight">
                  {campsite.name || `${campsite.type} #${campsite.id}`}
                </h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  campsite.vehicleCompatible
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {campsite.vehicleCompatible ? '✓ Compatible' : '⚠ Check Size'}
                </span>
              </div>

              {/* Type indicator */}
              <div className="flex items-center mb-2">
                <span className="text-lg mr-2">
                  {campsite.type === 'campsite' ? '⛺' :
                   campsite.type === 'caravan_site' ? '🚐' : '🅿️'}
                </span>
                <span className="text-xs text-gray-600 capitalize">
                  {campsite.type.replace('_', ' ')}
                </span>
              </div>

              {/* Basic info */}
              <div className="space-y-1 text-xs text-gray-700">
                {campsite.address && (
                  <div>📍 {campsite.address}</div>
                )}

                {campsite.phone && (
                  <div>📞 {campsite.phone}</div>
                )}

                {campsite.website && (
                  <div>
                    🌐 <a
                      href={campsite.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Website
                    </a>
                  </div>
                )}

                {campsite.openingHours && (
                  <div>🕒 {campsite.openingHours}</div>
                )}
              </div>

              {/* Amenities */}
              {campsite.amenities && Object.keys(campsite.amenities).length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-medium text-gray-900 mb-1">Amenities:</div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(campsite.amenities).map(([key, value]) =>
                      value === true ? (
                        <span key={key} className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
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
                    {campsite.restrictions.maxHeight && (
                      <div>Max height: {campsite.restrictions.maxHeight}m</div>
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

              {/* Data source */}
              <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-500">
                Data from {campsite.source} • ID: {campsite.osmId || campsite.id}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Loading indicator */}
      {isLoading && (
        <div className="fixed top-4 right-4 bg-white shadow-lg rounded-lg p-3 z-[1000]">
          <div className="flex items-center space-x-2 text-sm text-gray-700">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            <span>Loading campsites...</span>
          </div>
        </div>
      )}

      {/* Error indicator */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-50 border border-red-200 shadow-lg rounded-lg p-3 z-[1000]">
          <div className="flex items-center space-x-2 text-sm text-red-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span>Error loading campsites: {error}</span>
          </div>
        </div>
      )}
    </>
  );
};

export default CampsiteMarkers;