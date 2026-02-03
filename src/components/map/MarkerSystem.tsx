// Marker System Framework
// Foundation for waypoints and campsite markers in Phase 2+

import React, { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L, { DivIcon } from 'leaflet';
import { cn } from '@/utils/cn';

// Marker types for different features
export type MarkerType = 'waypoint' | 'campsite' | 'aire' | 'poi' | 'current-location';

export interface BaseMarker {
  id: string;
  lat: number;
  lng: number;
  type: MarkerType;
  title: string;
  description?: string;
}

export interface WaypointMarker extends BaseMarker {
  type: 'waypoint';
  order: number;
  isDestination?: boolean;
}

export interface CampsiteMarker extends BaseMarker {
  type: 'campsite';
  amenities?: string[];
  rating?: number;
  price?: string;
}

export interface AireMarker extends BaseMarker {
  type: 'aire';
  services?: string[];
  cost?: 'free' | 'paid';
}

export interface POIMarker extends BaseMarker {
  type: 'poi';
  category: 'fuel' | 'restaurant' | 'attraction' | 'shop' | 'service';
}

export interface CurrentLocationMarker extends BaseMarker {
  type: 'current-location';
  accuracy?: number;
}

export type AnyMarker = WaypointMarker | CampsiteMarker | AireMarker | POIMarker | CurrentLocationMarker;

// Custom marker icons
const createCustomIcon = (type: MarkerType, options: {
  color?: string;
  text?: string | number;
  size?: 'sm' | 'md' | 'lg';
}): DivIcon => {
  const { color, text, size = 'md' } = options;

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  const iconColors = {
    waypoint: 'bg-blue-600 border-blue-700',
    campsite: 'bg-green-600 border-green-700',
    aire: 'bg-orange-600 border-orange-700',
    poi: 'bg-purple-600 border-purple-700',
    'current-location': 'bg-red-600 border-red-700'
  };

  const iconClass = cn(
    'flex items-center justify-center rounded-full border-2 text-white font-bold shadow-lg',
    sizeClasses[size],
    color || iconColors[type]
  );

  return L.divIcon({
    html: `<div class="${iconClass}">${text || getMarkerSymbol(type)}</div>`,
    className: 'custom-marker',
    iconSize: size === 'sm' ? [24, 24] : size === 'lg' ? [40, 40] : [32, 32],
    iconAnchor: size === 'sm' ? [12, 12] : size === 'lg' ? [20, 20] : [16, 16],
    popupAnchor: [0, size === 'sm' ? -12 : size === 'lg' ? -20 : -16]
  });
};

const getMarkerSymbol = (type: MarkerType): string => {
  switch (type) {
    case 'waypoint': return '●';
    case 'campsite': return '⛺';
    case 'aire': return 'P';
    case 'poi': return 'ℹ';
    case 'current-location': return '📍';
    default: return '●';
  }
};

interface MarkerComponentProps {
  marker: AnyMarker;
  onClick?: (marker: AnyMarker) => void;
  isDraggable?: boolean;
  onDragEnd?: (marker: AnyMarker, newLat: number, newLng: number) => void;
}

const MarkerComponent: React.FC<MarkerComponentProps> = ({
  marker,
  onClick,
  isDraggable = false,
  onDragEnd
}) => {
  const icon = useMemo(() => {
    const options: { color?: string; text?: string | number; size?: 'sm' | 'md' | 'lg' } = {};

    // Customize based on marker type
    if (marker.type === 'waypoint') {
      const waypoint = marker as WaypointMarker;
      options.text = waypoint.order.toString();
      options.color = waypoint.isDestination ? 'bg-red-600 border-red-700' : undefined;
    }

    return createCustomIcon(marker.type, options);
  }, [marker]);

  const handleDragEnd = (e: any) => {
    if (onDragEnd) {
      const newLat = e.target.getLatLng().lat;
      const newLng = e.target.getLatLng().lng;
      onDragEnd(marker, newLat, newLng);
    }
  };

  const renderPopupContent = () => {
    const baseContent = (
      <div className="min-w-48">
        <h3 className="font-semibold text-gray-900 mb-1">{marker.title}</h3>
        {marker.description && (
          <p className="text-sm text-gray-600 mb-2">{marker.description}</p>
        )}
        <div className="text-xs text-gray-500">
          {marker.lat.toFixed(6)}, {marker.lng.toFixed(6)}
        </div>
      </div>
    );

    // Add type-specific content
    switch (marker.type) {
      case 'waypoint':
        const waypoint = marker as WaypointMarker;
        return (
          <div>
            {baseContent}
            <div className="mt-2 text-xs">
              <span className={cn(
                'px-2 py-1 rounded text-white',
                waypoint.isDestination ? 'bg-red-600' : 'bg-blue-600'
              )}>
                {waypoint.isDestination ? 'Destination' : `Waypoint ${waypoint.order}`}
              </span>
            </div>
          </div>
        );

      case 'campsite':
        const campsite = marker as CampsiteMarker;
        return (
          <div>
            {baseContent}
            {campsite.amenities && campsite.amenities.length > 0 && (
              <div className="mt-2">
                <div className="text-xs text-gray-500 mb-1">Amenities:</div>
                <div className="flex flex-wrap gap-1">
                  {campsite.amenities.slice(0, 3).map((amenity, index) => (
                    <span key={index} className="px-1 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                      {amenity}
                    </span>
                  ))}
                  {campsite.amenities.length > 3 && (
                    <span className="text-xs text-gray-400">
                      +{campsite.amenities.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
            {campsite.rating && (
              <div className="mt-2 text-xs">
                Rating: {'★'.repeat(campsite.rating)}{'☆'.repeat(5 - campsite.rating)}
              </div>
            )}
          </div>
        );

      case 'aire':
        const aire = marker as AireMarker;
        return (
          <div>
            {baseContent}
            <div className="mt-2 text-xs">
              <span className={cn(
                'px-2 py-1 rounded text-white',
                aire.cost === 'free' ? 'bg-green-600' : 'bg-orange-600'
              )}>
                {aire.cost === 'free' ? 'Free' : 'Paid'} Aire
              </span>
            </div>
          </div>
        );

      case 'current-location':
        const location = marker as CurrentLocationMarker;
        return (
          <div>
            {baseContent}
            {location.accuracy && (
              <div className="mt-2 text-xs text-gray-500">
                Accuracy: ±{location.accuracy}m
              </div>
            )}
          </div>
        );

      default:
        return baseContent;
    }
  };

  return (
    <Marker
      position={[marker.lat, marker.lng]}
      // @ts-ignore - React-Leaflet v4 prop compatibility
          icon={icon}
      draggable={isDraggable}
      eventHandlers={{
        click: () => onClick?.(marker),
        dragend: handleDragEnd
      }}
    >
      <Popup>
        {renderPopupContent()}
      </Popup>
    </Marker>
  );
};

interface MarkerSystemProps {
  markers: AnyMarker[];
  onMarkerClick?: (marker: AnyMarker) => void;
  draggableTypes?: MarkerType[];
  onMarkerDragEnd?: (marker: AnyMarker, newLat: number, newLng: number) => void;
}

const MarkerSystem: React.FC<MarkerSystemProps> = ({
  markers,
  onMarkerClick,
  draggableTypes = [],
  onMarkerDragEnd
}) => {
  return (
    <>
      {markers.map((marker) => (
        <MarkerComponent
          key={marker.id}
          marker={marker}
          onClick={onMarkerClick}
          isDraggable={draggableTypes.includes(marker.type)}
          onDragEnd={onMarkerDragEnd}
        />
      ))}
    </>
  );
};

export default MarkerSystem;

// Helper functions for creating markers
export const createWaypointMarker = (
  lat: number,
  lng: number,
  order: number,
  title?: string
): WaypointMarker => ({
  id: `waypoint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  lat,
  lng,
  type: 'waypoint',
  title: title || `Waypoint ${order}`,
  order,
  isDestination: false
});

export const createCampsiteMarker = (
  lat: number,
  lng: number,
  title: string,
  data?: Partial<CampsiteMarker>
): CampsiteMarker => ({
  id: `campsite-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  lat,
  lng,
  type: 'campsite',
  title,
  ...data
});

export const createCurrentLocationMarker = (
  lat: number,
  lng: number,
  accuracy?: number
): CurrentLocationMarker => ({
  id: `current-location-${Date.now()}`,
  lat,
  lng,
  type: 'current-location',
  title: 'Your Location',
  accuracy
});