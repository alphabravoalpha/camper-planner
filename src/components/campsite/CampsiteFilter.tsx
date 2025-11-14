// Campsite Filter Component
// Phase 4.3: Comprehensive filtering and search functionality

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FeatureFlags } from '../../config';
import type { CampsiteType } from '../../services/CampsiteService';
import type { UICampsite } from '../../adapters/CampsiteAdapter';
import { useRouteStore, useVehicleStore } from '../../store';
import { cn } from '../../utils/cn';

export interface CampsiteFilterState {
  // Type filtering
  visibleTypes: CampsiteType[];

  // Amenity filtering
  amenities: {
    electricity: boolean;
    wifi: boolean;
    shower: boolean;
    toilets: boolean;
    drinking_water: boolean;
    waste_disposal: boolean;
    laundry: boolean;
    restaurant: boolean;
    shop: boolean;
    playground: boolean;
    swimming_pool: boolean;
    pet_allowed: boolean;
  };

  // Advanced filtering
  vehicleCompatibleOnly: boolean;
  routeOnlyMode: boolean;
  maxDistanceFromRoute: number; // km
  openNow: boolean;
  freeOnly: boolean;
  acceptsReservations: boolean;

  // Search
  searchQuery: string;
  searchLocation: string;

  // Display
  maxResults: number;
  sortBy: 'distance' | 'name' | 'rating' | 'relevance';
}

export interface CampsiteFilterProps {
  className?: string;
  filterState: CampsiteFilterState;
  onFilterChange: (filterState: CampsiteFilterState) => void;
  onSearchChange?: (query: string) => void;
  onCampsiteSelect?: (campsite: UICampsite) => void;
  campsiteCount?: number;
  isLoading?: boolean;
}

// Default filter state
export const DEFAULT_FILTER_STATE: CampsiteFilterState = {
  visibleTypes: ['campsite', 'caravan_site', 'aire'],
  amenities: {
    electricity: false,
    wifi: false,
    shower: false,
    toilets: false,
    drinking_water: false,
    waste_disposal: false,
    laundry: false,
    restaurant: false,
    shop: false,
    playground: false,
    swimming_pool: false,
    pet_allowed: false,
  },
  vehicleCompatibleOnly: false,
  routeOnlyMode: false,
  maxDistanceFromRoute: 20,
  openNow: false,
  freeOnly: false,
  acceptsReservations: false,
  searchQuery: '',
  searchLocation: '',
  maxResults: 100,
  sortBy: 'distance'
};

// Campsite type configurations
const CAMPSITE_TYPES = [
  {
    type: 'campsite' as CampsiteType,
    label: 'Campsites',
    icon: '⛺',
    description: 'Traditional camping with tents/caravans'
  },
  {
    type: 'caravan_site' as CampsiteType,
    label: 'Caravan Sites',
    icon: '🚐',
    description: 'Sites specifically for caravans/motorhomes'
  },
  {
    type: 'aire' as CampsiteType,
    label: 'Aires de Service',
    icon: '🅿️',
    description: 'Motorhome service areas with facilities'
  }
];

// Amenity configurations
const AMENITY_OPTIONS = [
  { key: 'electricity' as keyof CampsiteFilterState['amenities'], label: 'Electricity', icon: '⚡' },
  { key: 'wifi' as keyof CampsiteFilterState['amenities'], label: 'WiFi', icon: '📶' },
  { key: 'shower' as keyof CampsiteFilterState['amenities'], label: 'Showers', icon: '🚿' },
  { key: 'toilets' as keyof CampsiteFilterState['amenities'], label: 'Toilets', icon: '🚻' },
  { key: 'drinking_water' as keyof CampsiteFilterState['amenities'], label: 'Drinking Water', icon: '🚰' },
  { key: 'waste_disposal' as keyof CampsiteFilterState['amenities'], label: 'Waste Disposal', icon: '🗑️' },
  { key: 'laundry' as keyof CampsiteFilterState['amenities'], label: 'Laundry', icon: '👕' },
  { key: 'restaurant' as keyof CampsiteFilterState['amenities'], label: 'Restaurant', icon: '🍽️' },
  { key: 'shop' as keyof CampsiteFilterState['amenities'], label: 'Shop', icon: '🛒' },
  { key: 'playground' as keyof CampsiteFilterState['amenities'], label: 'Playground', icon: '🎠' },
  { key: 'swimming_pool' as keyof CampsiteFilterState['amenities'], label: 'Swimming Pool', icon: '🏊' },
  { key: 'pet_allowed' as keyof CampsiteFilterState['amenities'], label: 'Pets Allowed', icon: '🐕' },
];

const SORT_OPTIONS = [
  { value: 'distance' as const, label: 'Distance from route' },
  { value: 'name' as const, label: 'Name A-Z' },
  { value: 'rating' as const, label: 'Rating' },
  { value: 'relevance' as const, label: 'Search relevance' }
];

const MAX_RESULTS_OPTIONS = [25, 50, 100, 200, 500];
const DISTANCE_OPTIONS = [5, 10, 20, 50, 100]; // km

const CampsiteFilter: React.FC<CampsiteFilterProps> = ({
  className,
  filterState,
  onFilterChange,
  onSearchChange,
  onCampsiteSelect: _onCampsiteSelect,
  campsiteCount = 0,
  isLoading = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'types' | 'amenities' | 'advanced' | 'search'>('types');
  const { calculatedRoute } = useRouteStore();
  const { profile: _profile } = useVehicleStore();

  // Persist filter state to localStorage
  const persistFilters = useCallback((filters: CampsiteFilterState) => {
    try {
      localStorage.setItem('camper-planner-campsite-filters', JSON.stringify(filters));
    } catch (error) {
      console.warn('Failed to persist campsite filters:', error);
    }
  }, []);

  // Load persisted filter state
  useEffect(() => {
    try {
      const saved = localStorage.getItem('camper-planner-campsite-filters');
      if (saved) {
        const parsedFilters = JSON.parse(saved);
        // Merge with default state to handle new filter options
        const mergedFilters = { ...DEFAULT_FILTER_STATE, ...parsedFilters };
        onFilterChange(mergedFilters);
      }
    } catch (error) {
      console.warn('Failed to load persisted filters:', error);
    }
  }, [onFilterChange]);

  // Update filter state and persist
  const updateFilter = useCallback(<K extends keyof CampsiteFilterState>(
    key: K,
    value: CampsiteFilterState[K]
  ) => {
    const newState = { ...filterState, [key]: value };
    onFilterChange(newState);
    persistFilters(newState);
  }, [filterState, onFilterChange, persistFilters]);

  // Toggle campsite type
  const toggleType = useCallback((type: CampsiteType) => {
    const newTypes = filterState.visibleTypes.includes(type)
      ? filterState.visibleTypes.filter(t => t !== type)
      : [...filterState.visibleTypes, type];
    updateFilter('visibleTypes', newTypes);
  }, [filterState.visibleTypes, updateFilter]);

  // Toggle amenity
  const toggleAmenity = useCallback((amenity: keyof CampsiteFilterState['amenities']) => {
    const newAmenities = {
      ...filterState.amenities,
      [amenity]: !filterState.amenities[amenity]
    };
    updateFilter('amenities', newAmenities);
  }, [filterState.amenities, updateFilter]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    onFilterChange(DEFAULT_FILTER_STATE);
    persistFilters(DEFAULT_FILTER_STATE);
  }, [onFilterChange, persistFilters]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;

    // Type filters (if not all types selected)
    if (filterState.visibleTypes.length !== CAMPSITE_TYPES.length) count++;

    // Amenity filters
    count += Object.values(filterState.amenities).filter(Boolean).length;

    // Advanced filters
    if (filterState.vehicleCompatibleOnly) count++;
    if (filterState.routeOnlyMode) count++;
    if (filterState.openNow) count++;
    if (filterState.freeOnly) count++;
    if (filterState.acceptsReservations) count++;

    // Search filters
    if (filterState.searchQuery.trim()) count++;
    if (filterState.searchLocation.trim()) count++;

    return count;
  }, [filterState]);

  // Route availability
  const hasRoute = calculatedRoute?.routes?.[0]?.geometry;

  // Don't render if feature disabled
  if (!FeatureFlags.CAMPSITE_DISPLAY) return null;

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="text-lg">🔍</div>
          <h3 className="text-sm font-medium text-gray-900">Campsite Filters</h3>
          {activeFilterCount > 0 && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
              {activeFilterCount} active
            </span>
          )}
          {campsiteCount > 0 && (
            <span className="text-xs text-gray-500">
              ({campsiteCount} results)
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Clear filters */}
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-red-600 hover:text-red-800 font-medium"
            >
              Clear All
            </button>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
          )}

          {/* Expand/collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <svg
              className={cn('w-4 h-4 transform transition-transform', isExpanded && 'rotate-180')}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Quick filters (compact view) */}
      {!isExpanded && (
        <div className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Type toggles */}
              {CAMPSITE_TYPES.map(({ type, icon, label }) => (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all',
                    filterState.visibleTypes.includes(type)
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 bg-gray-50 text-gray-400 hover:border-gray-400'
                  )}
                  title={label}
                >
                  <span className="text-sm">{icon}</span>
                </button>
              ))}

              {/* Route only mode */}
              {hasRoute && (
                <button
                  onClick={() => updateFilter('routeOnlyMode', !filterState.routeOnlyMode)}
                  className={cn(
                    'px-2 py-1 text-xs font-medium rounded transition-colors',
                    filterState.routeOnlyMode
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  📍 Route only
                </button>
              )}
            </div>

            <div className="text-xs text-gray-500">
              Max: {filterState.maxResults}
            </div>
          </div>
        </div>
      )}

      {/* Expanded view */}
      {isExpanded && (
        <div className="border-b border-gray-200">
          {/* Tab navigation */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            {[
              { id: 'types', label: 'Types', icon: '🏕️' },
              { id: 'amenities', label: 'Amenities', icon: '⚡' },
              { id: 'advanced', label: 'Advanced', icon: '⚙️' },
              { id: 'search', label: 'Search', icon: '🔍' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'flex-1 flex items-center justify-center space-x-1 py-3 px-2 text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <span className="text-sm">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-4 space-y-4">
            {/* Types tab */}
            {activeTab === 'types' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">Campsite Types</h4>
                  <button
                    onClick={() => {
                      const allSelected = filterState.visibleTypes.length === CAMPSITE_TYPES.length;
                      updateFilter('visibleTypes', allSelected ? [] : CAMPSITE_TYPES.map(t => t.type));
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {filterState.visibleTypes.length === CAMPSITE_TYPES.length ? 'None' : 'All'}
                  </button>
                </div>

                {CAMPSITE_TYPES.map(({ type, label, icon, description }) => (
                  <label key={type} className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterState.visibleTypes.includes(type)}
                      onChange={() => toggleType(type)}
                      className="mt-1 h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{icon}</span>
                        <span className="text-sm font-medium text-gray-900">{label}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {/* Amenities tab */}
            {activeTab === 'amenities' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">Required Amenities</h4>
                  <button
                    onClick={() => {
                      const allSelected = Object.values(filterState.amenities).every(Boolean);
                      const newAmenities = Object.keys(filterState.amenities).reduce((acc, key) => ({
                        ...acc,
                        [key]: !allSelected
                      }), {} as CampsiteFilterState['amenities']);
                      updateFilter('amenities', newAmenities);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {Object.values(filterState.amenities).every(Boolean) ? 'None' : 'All'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {AMENITY_OPTIONS.map(({ key, label, icon }) => (
                    <label key={key} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filterState.amenities[key]}
                        onChange={() => toggleAmenity(key)}
                        className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                      />
                      <span className="text-sm">{icon}</span>
                      <span className="text-sm text-gray-900">{label}</span>
                    </label>
                  ))}
                </div>

                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                  💡 Only campsites with ALL selected amenities will be shown
                </div>
              </div>
            )}

            {/* Advanced tab */}
            {activeTab === 'advanced' && (
              <div className="space-y-4">
                {/* Vehicle compatibility */}
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterState.vehicleCompatibleOnly}
                    onChange={(e) => updateFilter('vehicleCompatibleOnly', e.target.checked)}
                    className="mt-1 h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Vehicle Compatible Only</div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Show only campsites that can accommodate your vehicle dimensions
                    </p>
                  </div>
                </label>

                {/* Route only mode */}
                {hasRoute && (
                  <div className="space-y-2">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filterState.routeOnlyMode}
                        onChange={(e) => updateFilter('routeOnlyMode', e.target.checked)}
                        className="mt-1 h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">Show Along Route Only</div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Filter campsites within distance of your planned route
                        </p>
                      </div>
                    </label>

                    {filterState.routeOnlyMode && (
                      <div className="ml-7">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Max Distance from Route: {filterState.maxDistanceFromRoute}km
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="range"
                            min={5}
                            max={100}
                            step={5}
                            value={filterState.maxDistanceFromRoute}
                            onChange={(e) => updateFilter('maxDistanceFromRoute', parseInt(e.target.value))}
                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <select
                            value={filterState.maxDistanceFromRoute}
                            onChange={(e) => updateFilter('maxDistanceFromRoute', parseInt(e.target.value))}
                            className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                          >
                            {DISTANCE_OPTIONS.map(distance => (
                              <option key={distance} value={distance}>{distance}km</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Additional filters */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterState.openNow}
                      onChange={(e) => updateFilter('openNow', e.target.checked)}
                      className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-900">Open Now</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterState.freeOnly}
                      onChange={(e) => updateFilter('freeOnly', e.target.checked)}
                      className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-900">Free Only</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterState.acceptsReservations}
                      onChange={(e) => updateFilter('acceptsReservations', e.target.checked)}
                      className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-900">Accepts Reservations</span>
                  </label>
                </div>

                {/* Max results and sorting */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Max Results
                    </label>
                    <select
                      value={filterState.maxResults}
                      onChange={(e) => updateFilter('maxResults', parseInt(e.target.value))}
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                    >
                      {MAX_RESULTS_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Sort By
                    </label>
                    <select
                      value={filterState.sortBy}
                      onChange={(e) => updateFilter('sortBy', e.target.value as CampsiteFilterState['sortBy'])}
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                    >
                      {SORT_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Search tab */}
            {activeTab === 'search' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search by Name
                  </label>
                  <input
                    type="text"
                    value={filterState.searchQuery}
                    onChange={(e) => {
                      updateFilter('searchQuery', e.target.value);
                      onSearchChange?.(e.target.value);
                    }}
                    placeholder="Search campsite names..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search by Location
                  </label>
                  <input
                    type="text"
                    value={filterState.searchLocation}
                    onChange={(e) => updateFilter('searchLocation', e.target.value)}
                    placeholder="City, region, or address..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div className="p-3 bg-gray-50 border border-gray-200 rounded text-xs">
                  <div className="font-medium text-gray-900 mb-1">Search Tips:</div>
                  <ul className="space-y-0.5 text-gray-700">
                    <li>• Use partial names for broader results</li>
                    <li>• Search by city or region names</li>
                    <li>• Combine with other filters for precise results</li>
                    <li>• Clear search to see all campsites in area</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CampsiteFilter;