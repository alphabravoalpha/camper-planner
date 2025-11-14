// Campsite Details Component
// Phase 4.4: Detailed campsite information panel with trip integration

import React, { useState, useCallback } from 'react';
import { FeatureFlags } from '../../config';
import type { UICampsite } from '../../adapters/CampsiteAdapter';
import { useRouteStore, useVehicleStore, useUIStore } from '../../store';
import { cn } from '../../utils/cn';

export interface CampsiteDetailsProps {
  campsite: UICampsite;
  onClose?: () => void;
  onAddAsWaypoint?: (campsite: UICampsite) => void;
  onExportData?: (campsite: UICampsite) => void;
  className?: string;
  isExpanded?: boolean;
}

// Affiliate link configuration (prepared for booking integrations)
interface AffiliateConfig {
  provider: string;
  baseUrl: string;
  trackingParams: Record<string, string>;
  enabled: boolean;
}

const AFFILIATE_CONFIGS: Record<string, AffiliateConfig> = {
  booking: {
    provider: 'Booking.com',
    baseUrl: 'https://www.booking.com',
    trackingParams: {
      aid: 'camper-planner', // Affiliate ID placeholder
      label: 'camping-search'
    },
    enabled: false // Will be enabled when affiliate partnerships are established
  },
  pitchup: {
    provider: 'Pitchup',
    baseUrl: 'https://www.pitchup.com',
    trackingParams: {
      utm_source: 'camper-planner',
      utm_medium: 'referral'
    },
    enabled: false
  },
  coolcamping: {
    provider: 'Cool Camping',
    baseUrl: 'https://www.coolcamping.com',
    trackingParams: {
      ref: 'camper-planner'
    },
    enabled: false
  }
};

const CampsiteDetails: React.FC<CampsiteDetailsProps> = ({
  campsite,
  onClose,
  onAddAsWaypoint,
  onExportData,
  className,
  isExpanded = false
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'amenities' | 'contact' | 'booking'>('overview');
  const [showFullDescription, setShowFullDescription] = useState(false);
  const { addWaypoint, waypoints } = useRouteStore();
  const { profile } = useVehicleStore();
  const { addNotification } = useUIStore();

  // Check if campsite is already a waypoint
  const isWaypoint = waypoints.some(wp =>
    wp.lat === campsite.lat && wp.lng === campsite.lng
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
      type: 'campsite' as const
    };

    addWaypoint(waypoint);
    onAddAsWaypoint?.(campsite);

    addNotification({
      type: 'success',
      message: `Added ${waypoint.name} to your route`
    });
  }, [campsite, isWaypoint, addWaypoint, onAddAsWaypoint, addNotification]);

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
        restrictions: campsite.restrictions,
        vehicleCompatible: campsite.access?.motorhome || false,
        source: campsite.source,
        osmId: campsite.id
      },
      exportedAt: new Date().toISOString(),
      exportedBy: 'Camper Planner'
    };

    // Create downloadable JSON file
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

  // Generate affiliate booking link
  const generateBookingLink = useCallback((provider: string): string | null => {
    const config = AFFILIATE_CONFIGS[provider];
    if (!config || !config.enabled) return null;

    const params = new URLSearchParams(config.trackingParams);

    // Add campsite-specific search parameters
    if (campsite.name) {
      params.append('ss', campsite.name);
    }

    // Add location if available
    if (campsite.address) {
      params.append('dest_id', campsite.address);
    }

    return `${config.baseUrl}/search?${params.toString()}`;
  }, [campsite]);

  // Format phone number for calling
  const formatPhoneLink = (phone: string): string => {
    const cleaned = phone.replace(/[^\d+]/g, '');
    return `tel:${cleaned}`;
  };

  // Amenity display configuration
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

  // Don't render if feature disabled
  if (!FeatureFlags.CAMPSITE_DISPLAY) return null;

  return (
    <div className={cn(
      'bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden',
      className
    )}>
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">
              {campsite.name || `${campsite.type.replace('_', ' ')} #${campsite.id}`}
            </h2>
            <div className="flex items-center space-x-4 mt-1 text-sm text-green-100">
              <span className="capitalize">{campsite.type.replace('_', ' ')}</span>
              <span className={cn(
                'px-2 py-1 rounded-full text-xs font-medium',
                campsite.access?.motorhome
                  ? 'bg-green-700 text-green-100'
                  : 'bg-red-500 text-white'
              )}>
                {campsite.access?.motorhome ? '✓ Compatible' : '⚠ Check Size'}
              </span>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-green-700 rounded transition-colors"
              aria-label="Close details"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2 mt-3">
          <button
            onClick={handleAddAsWaypoint}
            disabled={isWaypoint}
            className={cn(
              'flex items-center space-x-2 px-3 py-2 rounded text-sm font-medium transition-colors',
              isWaypoint
                ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                : 'bg-white text-green-600 hover:bg-gray-50'
            )}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>{isWaypoint ? 'In Route' : 'Add to Route'}</span>
          </button>

          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-3 py-2 bg-green-700 text-white rounded text-sm font-medium hover:bg-green-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        {[
          { id: 'overview', label: 'Overview', icon: '📋' },
          { id: 'amenities', label: 'Amenities', icon: '⚡' },
          { id: 'contact', label: 'Contact', icon: '📞' },
          { id: 'booking', label: 'Booking', icon: '🔗' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'flex-1 flex items-center justify-center space-x-1 py-3 px-2 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'text-green-600 border-b-2 border-green-600 bg-white'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <span className="text-sm">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Location */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Location</h3>
              <div className="space-y-1 text-sm text-gray-700">
                {campsite.address && (
                  <div className="flex items-start space-x-2">
                    <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{campsite.address}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 01.553-.894L9 2l6 3 6-3v15l-6 3-6-3z" />
                  </svg>
                  <span>
                    {campsite.lat.toFixed(5)}, {campsite.lng.toFixed(5)}
                  </span>
                </div>
              </div>
            </div>

            {/* Opening Hours */}
            {campsite.opening_hours && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Opening Hours</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{campsite.opening_hours}</span>
                </div>
              </div>
            )}

            {/* Vehicle Restrictions */}
            {!campsite.access?.motorhome && campsite.access && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Vehicle Restrictions</h3>
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <svg className="w-4 h-4 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div className="text-sm text-red-800">
                      <div className="font-medium mb-1">Size restrictions apply:</div>
                      <ul className="space-y-0.5">
                        {campsite.access.max_height && (
                          <li>• Max height: {campsite.access.max_height}m</li>
                        )}
                        {campsite.access.max_length && (
                          <li>• Max length: {campsite.access.max_length}m</li>
                        )}
                        {campsite.access.max_weight && (
                          <li>• Max weight: {campsite.access.max_weight}t</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Vehicle Compatibility */}
            {campsite.access?.motorhome && profile && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Vehicle Compatibility</h3>
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <svg className="w-4 h-4 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div className="text-sm text-green-800">
                      <div className="font-medium mb-1">Compatible with your vehicle:</div>
                      <div>
                        {profile.height}m H × {profile.width}m W × {profile.weight}t × {profile.length}m L
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Data Source */}
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Data from {campsite.source}</span>
                <span>ID: {campsite.id}</span>
              </div>
            </div>
          </div>
        )}

        {/* Amenities Tab */}
        {activeTab === 'amenities' && (
          <div className="space-y-4">
            {campsite.amenities && Object.keys(campsite.amenities).length > 0 ? (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Available Amenities</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(campsite.amenities).map(([amenity, available]) => (
                    <div
                      key={amenity}
                      className={cn(
                        'flex items-center space-x-2 p-2 rounded text-sm',
                        available
                          ? 'bg-green-50 text-green-800 border border-green-200'
                          : 'bg-gray-50 text-gray-500 border border-gray-200'
                      )}
                    >
                      <span className="text-base">
                        {amenityIcons[amenity] || '•'}
                      </span>
                      <span className="capitalize">
                        {amenity.replace(/_/g, ' ')}
                      </span>
                      {available && (
                        <svg className="w-3 h-3 text-green-600 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">No amenity information available</p>
              </div>
            )}
          </div>
        )}

        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <div className="space-y-4">
            {campsite.contact?.phone || campsite.contact?.website || campsite.contact?.email ? (
              <div className="space-y-3">
                {campsite.contact?.phone && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Phone</h3>
                    <a
                      href={formatPhoneLink(campsite.contact.phone)}
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{campsite.contact.phone}</span>
                    </a>
                  </div>
                )}

                {campsite.contact?.website && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Website</h3>
                    <a
                      href={campsite.contact.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <span className="truncate">{campsite.contact.website}</span>
                    </a>
                  </div>
                )}

                {campsite.address && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Address</h3>
                    <div className="flex items-start space-x-2 text-sm text-gray-700">
                      <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{campsite.address}</span>
                    </div>
                  </div>
                )}

                {/* Directions button */}
                <div className="pt-3 border-t border-gray-200">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${campsite.lat},${campsite.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 01.553-.894L9 2l6 3 6-3v15l-6 3-6-3z" />
                    </svg>
                    <span>Get Directions</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">No contact information available</p>
              </div>
            )}
          </div>
        )}

        {/* Booking Tab */}
        {activeTab === 'booking' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Booking & Reservations</h3>

              {/* Direct booking link if website available */}
              {campsite.contact?.website && (
                <div className="mb-4">
                  <a
                    href={campsite.contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span>Visit Official Website</span>
                  </a>
                </div>
              )}

              {/* Affiliate booking options (framework for future implementation) */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-gray-700 mb-2">Search on Booking Platforms:</h4>
                {Object.entries(AFFILIATE_CONFIGS).map(([key, config]) => (
                  <button
                    key={key}
                    disabled={!config.enabled}
                    className={cn(
                      'w-full flex items-center justify-between p-3 border rounded-lg text-sm transition-colors',
                      config.enabled
                        ? 'border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100'
                        : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                    )}
                    onClick={() => {
                      if (config.enabled) {
                        const link = generateBookingLink(key);
                        if (link) window.open(link, '_blank');
                      }
                    }}
                  >
                    <span>{config.provider}</span>
                    {config.enabled ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    ) : (
                      <span className="text-xs">Coming Soon</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Booking info */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                <div className="font-medium mb-1">💡 Booking Tips:</div>
                <ul className="space-y-0.5">
                  <li>• Check availability directly with the campsite</li>
                  <li>• Book in advance during peak season</li>
                  <li>• Confirm vehicle size restrictions</li>
                  <li>• Ask about cancellation policies</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampsiteDetails;