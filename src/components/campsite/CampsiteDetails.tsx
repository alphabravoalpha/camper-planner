// Campsite Details Component
// Redesigned: Single scrollable layout with complete traveler information + booking

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { FeatureFlags } from '../../config';
import { type Campsite } from '../../services/CampsiteService';
import { bookingService, type BookingLink } from '../../services/BookingService';
import { useRouteStore, useVehicleStore, useUIStore } from '../../store';
import { cn } from '../../utils/cn';

export interface CampsiteDetailsProps {
  campsite: Campsite;
  onClose?: () => void;
  onAddAsWaypoint?: (campsite: Campsite) => void;
  onExportData?: (campsite: Campsite) => void;
  className?: string;
}

// Amenity configuration with icons and labels
const AMENITY_CONFIG: Record<string, { icon: string; label: string }> = {
  electricity: { icon: '⚡', label: 'Power' },
  wifi: { icon: '📶', label: 'WiFi' },
  showers: { icon: '🚿', label: 'Showers' },
  toilets: { icon: '🚻', label: 'Toilets' },
  drinking_water: { icon: '🚰', label: 'Water' },
  waste_disposal: { icon: '🗑️', label: 'Waste' },
  laundry: { icon: '👕', label: 'Laundry' },
  restaurant: { icon: '🍽️', label: 'Food' },
  shop: { icon: '🛒', label: 'Shop' },
  playground: { icon: '🎠', label: 'Kids' },
  swimming_pool: { icon: '🏊', label: 'Pool' },
  pet_allowed: { icon: '🐕', label: 'Pets OK' }
};

// Key amenities to show at the top (most important for travelers)
const KEY_AMENITIES = ['electricity', 'showers', 'wifi', 'toilets', 'drinking_water', 'waste_disposal', 'shop', 'restaurant'];

const CampsiteDetails: React.FC<CampsiteDetailsProps> = ({
  campsite,
  onClose,
  onAddAsWaypoint,
  onExportData,
  className
}) => {
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const bookingSectionRef = useRef<HTMLDivElement>(null);

  const { addWaypoint, waypoints } = useRouteStore();
  const { profile } = useVehicleStore();
  const { addNotification } = useUIStore();

  // Check if campsite is already a waypoint
  const isWaypoint = waypoints.some(wp =>
    Math.abs(wp.lat - campsite.lat) < 0.0001 &&
    Math.abs(wp.lng - campsite.lng) < 0.0001
  );

  // Handle adding campsite as waypoint
  const handleAddAsWaypoint = useCallback(() => {
    if (isWaypoint) {
      addNotification({
        type: 'warning',
        message: 'This campsite is already in your route'
      });
      return;
    }

    const waypoint = {
      id: `campsite_${campsite.id}`,
      lat: campsite.lat,
      lng: campsite.lng,
      name: campsite.name || `${campsite.type} #${campsite.id}`,
      type: 'waypoint' as const
    };

    addWaypoint(waypoint);
    onAddAsWaypoint?.(campsite);

    addNotification({
      type: 'success',
      message: `Added ${waypoint.name} to your route`
    });
  }, [campsite, isWaypoint, addWaypoint, onAddAsWaypoint, addNotification]);

  // Handle Book Now - scroll to booking section or open website
  const handleBookNow = useCallback(() => {
    if (campsite.contact?.website) {
      window.open(campsite.contact.website, '_blank');
    } else if (bookingSectionRef.current) {
      bookingSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [campsite.contact?.website]);

  // Copy coordinates to clipboard
  const handleCopyCoords = useCallback(() => {
    const coords = `${campsite.lat.toFixed(6)}, ${campsite.lng.toFixed(6)}`;
    navigator.clipboard.writeText(coords);
    addNotification({
      type: 'success',
      message: 'Coordinates copied to clipboard'
    });
  }, [campsite.lat, campsite.lng, addNotification]);

  // Handle data export
  const handleExport = useCallback(() => {
    const exportData = {
      campsite: {
        id: campsite.id,
        name: campsite.name,
        type: campsite.type,
        location: { lat: campsite.lat, lng: campsite.lng },
        address: campsite.address,
        phone: campsite.contact?.phone,
        website: campsite.contact?.website,
        email: campsite.contact?.email,
        openingHours: campsite.opening_hours,
        amenities: campsite.amenities,
        access: campsite.access,
        source: campsite.source
      },
      exportedAt: new Date().toISOString(),
      exportedBy: 'European Camper Trip Planner'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `campsite_${campsite.id}_${campsite.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'unnamed'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onExportData?.(campsite);
    addNotification({
      type: 'success',
      message: 'Campsite data exported successfully'
    });
  }, [campsite, onExportData, addNotification]);

  // Generate affiliate booking links via BookingService
  const affiliateLinks: BookingLink[] = useMemo(() => {
    if (!FeatureFlags.AFFILIATE_LINKS) return [];
    return bookingService.generateBookingLinks(campsite);
  }, [campsite]);

  // Get directions URL
  const getDirectionsUrl = () => {
    return `https://www.google.com/maps/dir/?api=1&destination=${campsite.lat},${campsite.lng}`;
  };

  // Check if there are vehicle restrictions that conflict with user's vehicle
  const hasRestrictions = campsite.access && (
    campsite.access.max_height || campsite.access.max_length || campsite.access.max_weight
  );

  const hasConflict = profile && hasRestrictions && (
    (campsite.access?.max_height && profile.height > campsite.access.max_height) ||
    (campsite.access?.max_length && profile.length > campsite.access.max_length) ||
    (campsite.access?.max_weight && profile.weight > campsite.access.max_weight)
  );

  // Get available and unavailable amenities
  const allAmenities = campsite.amenities ? Object.entries(campsite.amenities) : [];
  const availableAmenities = allAmenities.filter(([_, available]) => available).map(([key]) => key);
  const keyAmenitiesAvailable = KEY_AMENITIES.filter(key =>
    campsite.amenities && campsite.amenities[key as keyof typeof campsite.amenities]
  );

  // Don't render if feature disabled
  if (!FeatureFlags.CAMPSITE_DISPLAY) return null;

  // Detect mobile device
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  return (
    <div className={cn(
      'bg-white shadow-lg border border-neutral-200 overflow-hidden flex flex-col',
      isMobile ? 'rounded-t-2xl' : 'rounded-lg',
      className
    )}>
      {/* Drag handle for mobile */}
      {isMobile && (
        <div className="flex justify-center py-2 bg-neutral-50">
          <div className="w-12 h-1 bg-neutral-300 rounded-full"></div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">
              {campsite.name || `${campsite.type.replace('_', ' ')} #${campsite.id}`}
            </h2>
            <div className="flex items-center space-x-2 mt-1 text-sm text-green-100">
              <span className="capitalize">{campsite.type.replace('_', ' ')}</span>
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                campsite.access?.motorhome
                  ? 'bg-green-700 text-green-100'
                  : 'bg-orange-500 text-white'
              )}>
                {campsite.access?.motorhome ? '✓ Vehicle OK' : '⚠ Check Size'}
              </span>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-green-700 rounded transition-colors ml-2"
              aria-label="Close details"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Primary action buttons */}
        <div className={cn(
          'flex items-center gap-2 mt-3',
          isMobile && 'flex-col w-full'
        )}>
          <button
            onClick={handleAddAsWaypoint}
            disabled={isWaypoint}
            className={cn(
              'flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors',
              isMobile ? 'w-full' : 'flex-1',
              isWaypoint
                ? 'bg-green-700 text-green-300 cursor-default'
                : 'bg-white text-green-600 hover:bg-green-50 active:bg-green-100'
            )}
          >
            {isWaypoint ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>In Route</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add to Route</span>
              </>
            )}
          </button>

          <button
            onClick={handleBookNow}
            className={cn(
              'flex items-center justify-center gap-2 px-4 py-2.5 bg-green-700 text-white rounded-lg font-medium hover:bg-green-800 transition-colors',
              isMobile ? 'w-full' : 'flex-1'
            )}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Book Now</span>
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Key Amenities Grid - Quick visual scan */}
        {keyAmenitiesAvailable.length > 0 && (
          <div className="p-4 border-b border-neutral-100">
            <div className="flex flex-wrap gap-2">
              {keyAmenitiesAvailable.slice(0, 8).map(amenity => {
                const config = AMENITY_CONFIG[amenity];
                return (
                  <div
                    key={amenity}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 text-green-800 rounded-lg text-sm"
                    title={config?.label || amenity}
                  >
                    <span className="text-base">{config?.icon || '•'}</span>
                    <span className="font-medium">{config?.label || amenity.replace(/_/g, ' ')}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Facts - Address, Hours */}
        <div className="p-4 space-y-3 border-b border-neutral-100">
          {/* Address */}
          {campsite.address && (
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-neutral-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm text-neutral-700">{campsite.address}</span>
            </div>
          )}

          {/* Opening hours */}
          {campsite.opening_hours && (
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-neutral-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-neutral-700">{campsite.opening_hours}</span>
            </div>
          )}

          {/* Campsite type description if no other info */}
          {!campsite.address && !campsite.opening_hours && (
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-neutral-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="text-sm text-neutral-500 italic">
                {campsite.type === 'aire' ? 'Motorhome service area with facilities' :
                 campsite.type === 'caravan_site' ? 'Caravan and motorhome site' :
                 'Camping site'}
              </span>
            </div>
          )}
        </div>

        {/* Vehicle Restrictions Warning */}
        {hasRestrictions && (
          <div className={cn(
            'p-4 border-b',
            hasConflict ? 'bg-red-50 border-red-100' : 'bg-orange-50 border-orange-100'
          )}>
            <div className="flex items-start gap-3">
              <svg className={cn(
                'w-5 h-5 mt-0.5 flex-shrink-0',
                hasConflict ? 'text-red-600' : 'text-orange-600'
              )} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <div className={cn(
                  'text-sm font-medium',
                  hasConflict ? 'text-red-800' : 'text-orange-800'
                )}>
                  {hasConflict ? 'Vehicle may not fit!' : 'Size restrictions'}
                </div>
                <div className={cn(
                  'text-sm mt-1 space-y-0.5',
                  hasConflict ? 'text-red-700' : 'text-orange-700'
                )}>
                  {campsite.access?.max_height && (
                    <div className="flex items-center gap-2">
                      <span>Max height: {campsite.access.max_height}m</span>
                      {profile && (
                        <span className={cn(
                          'text-xs px-1.5 py-0.5 rounded',
                          profile.height > campsite.access.max_height
                            ? 'bg-red-200 text-red-800'
                            : 'bg-green-200 text-green-800'
                        )}>
                          You: {profile.height}m
                        </span>
                      )}
                    </div>
                  )}
                  {campsite.access?.max_length && (
                    <div className="flex items-center gap-2">
                      <span>Max length: {campsite.access.max_length}m</span>
                      {profile && (
                        <span className={cn(
                          'text-xs px-1.5 py-0.5 rounded',
                          profile.length > campsite.access.max_length
                            ? 'bg-red-200 text-red-800'
                            : 'bg-green-200 text-green-800'
                        )}>
                          You: {profile.length}m
                        </span>
                      )}
                    </div>
                  )}
                  {campsite.access?.max_weight && (
                    <div className="flex items-center gap-2">
                      <span>Max weight: {campsite.access.max_weight}t</span>
                      {profile && (
                        <span className={cn(
                          'text-xs px-1.5 py-0.5 rounded',
                          profile.weight > campsite.access.max_weight
                            ? 'bg-red-200 text-red-800'
                            : 'bg-green-200 text-green-800'
                        )}>
                          You: {profile.weight}t
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vehicle Compatible Message */}
        {campsite.access?.motorhome && profile && !hasRestrictions && (
          <div className="p-4 bg-green-50 border-b border-green-100">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div className="text-sm text-green-800">
                <span className="font-medium">Compatible</span>
                <span className="text-green-700"> with your {profile.height}m × {profile.length}m vehicle</span>
              </div>
            </div>
          </div>
        )}

        {/* All Amenities - Expandable */}
        {allAmenities.length > 0 && (
          <div className="border-b border-neutral-100">
            <button
              onClick={() => setShowAllAmenities(!showAllAmenities)}
              className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-sm font-medium text-neutral-700">
                  All Amenities ({availableAmenities.length}/{allAmenities.length} available)
                </span>
              </div>
              <svg
                className={cn('w-5 h-5 text-neutral-400 transition-transform', showAllAmenities && 'rotate-180')}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showAllAmenities && (
              <div className="px-4 pb-4">
                {/* Note about data source */}
                {availableAmenities.length === 0 && (
                  <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                    ℹ️ Amenity data not available from OpenStreetMap. Check the campsite website for details.
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {allAmenities.map(([amenity, available]) => {
                    const config = AMENITY_CONFIG[amenity];
                    // Show ✓ for confirmed, ? for unknown (false could mean "no data" not "definitely no")
                    const isConfirmed = available === true;
                    return (
                      <div
                        key={amenity}
                        className={cn(
                          'flex items-center gap-2 p-2 rounded text-sm',
                          isConfirmed
                            ? 'bg-green-50 text-green-800 border border-green-200'
                            : 'bg-neutral-50 text-neutral-500 border border-neutral-200'
                        )}
                      >
                        <span className="text-base">{config?.icon || '•'}</span>
                        <span className="flex-1 capitalize">{config?.label || amenity.replace(/_/g, ' ')}</span>
                        {isConfirmed ? (
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="w-4 h-4 flex items-center justify-center text-neutral-400 font-medium text-xs">?</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Contact Section - Collapsible */}
        {(campsite.contact?.phone || campsite.contact?.website || campsite.contact?.email) && (
          <div className="border-b border-neutral-100">
            <button
              onClick={() => setShowContact(!showContact)}
              className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-sm font-medium text-neutral-700">Contact Details</span>
              </div>
              <svg
                className={cn('w-5 h-5 text-neutral-400 transition-transform', showContact && 'rotate-180')}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showContact && (
              <div className="px-4 pb-4 space-y-3">
                {campsite.contact?.phone && (
                  <a
                    href={`tel:${campsite.contact.phone.replace(/[^\d+]/g, '')}`}
                    className="flex items-center gap-3 text-primary-600 hover:text-primary-800 text-sm"
                  >
                    <span>📞</span>
                    <span>{campsite.contact.phone}</span>
                  </a>
                )}
                {campsite.contact?.email && (
                  <a
                    href={`mailto:${campsite.contact.email}`}
                    className="flex items-center gap-3 text-primary-600 hover:text-primary-800 text-sm"
                  >
                    <span>✉️</span>
                    <span>{campsite.contact.email}</span>
                  </a>
                )}
                {campsite.contact?.website && (
                  <a
                    href={campsite.contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-primary-600 hover:text-primary-800 text-sm"
                  >
                    <span>🌐</span>
                    <span className="truncate">{campsite.contact.website.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* Booking Section */}
        <div ref={bookingSectionRef} className="p-4 border-b border-neutral-100">
          <h3 className="text-sm font-medium text-neutral-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Book This Campsite
          </h3>

          {/* Direct booking link if website available — always shown first */}
          {campsite.contact?.website && (
            <a
              href={campsite.contact.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium mb-3"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>Visit Official Website</span>
            </a>
          )}

          {/* Affiliate booking links — powered by BookingService */}
          {affiliateLinks.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-neutral-500 mb-2">Search on booking platforms:</div>
              {affiliateLinks.map((link) => (
                <a
                  key={link.provider.id}
                  href={link.url}
                  target="_blank"
                  rel="sponsored noopener noreferrer"
                  className="w-full flex items-center justify-between p-3 border border-primary-200 bg-primary-50 text-primary-800 hover:bg-primary-100 rounded-lg text-sm transition-colors"
                  onClick={() => {
                    bookingService.trackBookingClick(link.provider.id, String(campsite.id));
                  }}
                >
                  <span>{link.provider.name}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ))}
              {/* Affiliate disclosure */}
              <p className="text-[10px] text-neutral-400 mt-1.5 leading-relaxed">
                We may earn a small commission from bookings at no extra cost to you.
              </p>
            </div>
          )}

          {/* Show non-affiliate fallback if no affiliate links configured */}
          {affiliateLinks.length === 0 && !campsite.contact?.website && (
            <p className="text-sm text-neutral-500 italic">
              No booking links available. Try searching for this campsite online.
            </p>
          )}

          {/* Booking tips */}
          <div className="mt-4 p-3 bg-primary-50 border border-primary-200 rounded-lg text-xs text-primary-800">
            <div className="font-medium mb-1">Booking Tips:</div>
            <ul className="space-y-0.5">
              <li>Check availability directly with the campsite</li>
              <li>Book in advance during peak season</li>
              <li>Confirm vehicle size restrictions</li>
            </ul>
          </div>
        </div>

        {/* Directions Section */}
        <div className="p-4 border-b border-neutral-100">
          <a
            href={getDirectionsUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span>Get Directions in Google Maps</span>
          </a>
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-50">
          <div className="flex items-center justify-between text-xs text-neutral-500 mb-3">
            <div className="flex items-center gap-2">
              <span>Data from {campsite.source || 'OpenStreetMap'}</span>
            </div>
            <button
              onClick={handleCopyCoords}
              className="flex items-center gap-1 text-neutral-400 hover:text-neutral-600 transition-colors"
              title="Copy coordinates"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <span>Copy coords</span>
            </button>
          </div>

          {/* Export button */}
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-neutral-300 rounded-lg text-sm text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export Campsite Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampsiteDetails;
