// Campsite Filter Component
// Phase 4.3: Comprehensive filtering and search functionality

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Tent,
  Truck,
  ParkingCircle,
  Zap,
  Wifi,
  Droplets,
  Bath,
  GlassWater,
  Trash2,
  Shirt,
  UtensilsCrossed,
  ShoppingCart,
  Baby,
  Waves,
  Dog,
  Search,
  Settings,
  Lightbulb,
  MapPin,
} from 'lucide-react';
import { FeatureFlags } from '../../config';
import { type CampsiteType, type Campsite } from '../../services/CampsiteService';
import { useRouteStore } from '../../store';
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
  onCampsiteSelect?: (campsite: Campsite) => void;
  campsiteCount?: number;
  isLoading?: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components -- Utility function co-located with the component that uses it
export const getDefaultFilterState = (): CampsiteFilterState => ({
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
  sortBy: 'distance',
});

// Campsite type configurations
const CAMPSITE_TYPES = [
  {
    type: 'campsite' as CampsiteType,
    labelKey: 'campsites.types.campsites',
    icon: Tent,
    descKey: 'campsites.types.campsitesDesc',
  },
  {
    type: 'caravan_site' as CampsiteType,
    labelKey: 'campsites.types.caravanSites',
    icon: Truck,
    descKey: 'campsites.types.caravanSitesDesc',
  },
  {
    type: 'aire' as CampsiteType,
    labelKey: 'campsites.types.airesDeService',
    icon: ParkingCircle,
    descKey: 'campsites.types.airesDeServiceDesc',
  },
];

// Amenity configurations
const AMENITY_OPTIONS = [
  {
    key: 'electricity' as keyof CampsiteFilterState['amenities'],
    labelKey: 'campsites.electricity',
    icon: Zap,
  },
  { key: 'wifi' as keyof CampsiteFilterState['amenities'], labelKey: 'campsites.wifi', icon: Wifi },
  {
    key: 'shower' as keyof CampsiteFilterState['amenities'],
    labelKey: 'campsites.amenity.showers',
    icon: Droplets,
  },
  {
    key: 'toilets' as keyof CampsiteFilterState['amenities'],
    labelKey: 'campsites.amenity.toilets',
    icon: Bath,
  },
  {
    key: 'drinking_water' as keyof CampsiteFilterState['amenities'],
    labelKey: 'campsites.amenity.drinkingWater',
    icon: GlassWater,
  },
  {
    key: 'waste_disposal' as keyof CampsiteFilterState['amenities'],
    labelKey: 'campsites.amenity.wasteDisposal',
    icon: Trash2,
  },
  {
    key: 'laundry' as keyof CampsiteFilterState['amenities'],
    labelKey: 'campsites.laundry',
    icon: Shirt,
  },
  {
    key: 'restaurant' as keyof CampsiteFilterState['amenities'],
    labelKey: 'campsites.restaurant',
    icon: UtensilsCrossed,
  },
  {
    key: 'shop' as keyof CampsiteFilterState['amenities'],
    labelKey: 'campsites.shop',
    icon: ShoppingCart,
  },
  {
    key: 'playground' as keyof CampsiteFilterState['amenities'],
    labelKey: 'campsites.playground',
    icon: Baby,
  },
  {
    key: 'swimming_pool' as keyof CampsiteFilterState['amenities'],
    labelKey: 'campsites.swimmingPool',
    icon: Waves,
  },
  {
    key: 'pet_allowed' as keyof CampsiteFilterState['amenities'],
    labelKey: 'campsites.amenity.petsAllowed',
    icon: Dog,
  },
];

const SORT_OPTIONS = [
  { value: 'distance' as const, labelKey: 'campsites.filter.sortDistance' },
  { value: 'name' as const, labelKey: 'campsites.filter.sortName' },
  { value: 'rating' as const, labelKey: 'campsites.filter.sortRating' },
  { value: 'relevance' as const, labelKey: 'campsites.filter.sortRelevance' },
];

const MAX_RESULTS_OPTIONS = [25, 50, 100, 200, 500];
const DISTANCE_OPTIONS = [5, 10, 20, 50, 100]; // km

const CampsiteFilter: React.FC<CampsiteFilterProps> = ({
  className,
  filterState,
  onFilterChange,
  onSearchChange,
  campsiteCount = 0,
  isLoading = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'types' | 'amenities' | 'advanced' | 'search'>(
    'types'
  );
  const { calculatedRoute } = useRouteStore();
  const { t } = useTranslation();

  // Persist filter state to localStorage
  const persistFilters = useCallback((filters: CampsiteFilterState) => {
    try {
      localStorage.setItem('camper-planner-campsite-filters', JSON.stringify(filters));
    } catch {
      // Silently fail - localStorage persistence is non-critical
    }
  }, []);

  // Load persisted filter state
  useEffect(() => {
    try {
      const saved = localStorage.getItem('camper-planner-campsite-filters');
      if (saved) {
        const parsedFilters = JSON.parse(saved);
        // Merge with default state to handle new filter options
        const mergedFilters = { ...getDefaultFilterState(), ...parsedFilters };
        onFilterChange(mergedFilters);
      }
    } catch {
      // Silently fail - loading persisted filters is non-critical
    }
  }, [onFilterChange]);

  // Update filter state and persist
  const updateFilter = useCallback(
    <K extends keyof CampsiteFilterState>(key: K, value: CampsiteFilterState[K]) => {
      const newState = { ...filterState, [key]: value };
      onFilterChange(newState);
      persistFilters(newState);
    },
    [filterState, onFilterChange, persistFilters]
  );

  // Toggle campsite type
  const toggleType = useCallback(
    (type: CampsiteType) => {
      const newTypes = filterState.visibleTypes.includes(type)
        ? filterState.visibleTypes.filter(t => t !== type)
        : [...filterState.visibleTypes, type];
      updateFilter('visibleTypes', newTypes);
    },
    [filterState.visibleTypes, updateFilter]
  );

  // Toggle amenity
  const toggleAmenity = useCallback(
    (amenity: keyof CampsiteFilterState['amenities']) => {
      const newAmenities = {
        ...filterState.amenities,
        [amenity]: !filterState.amenities[amenity],
      };
      updateFilter('amenities', newAmenities);
    },
    [filterState.amenities, updateFilter]
  );

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    const defaultState = getDefaultFilterState();
    onFilterChange(defaultState);
    persistFilters(defaultState);
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
    <div className={cn('bg-white rounded-xl shadow-soft', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-neutral-100">
        <div className="flex items-center space-x-2">
          <Search className="w-5 h-5 text-neutral-600" />
          <h3 className="text-sm font-display font-semibold text-neutral-900">
            {t('campsites.filter.heading')}
          </h3>
          {activeFilterCount > 0 && (
            <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded-full text-xs font-medium">
              {t('campsites.filter.active', { count: activeFilterCount })}
            </span>
          )}
          {campsiteCount > 0 && (
            <span className="text-xs text-neutral-500">
              {t('campsites.filter.results', { count: campsiteCount })}
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
              {t('campsites.filter.clearAll')}
            </button>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent"></div>
          )}

          {/* Expand/collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <svg
              className={cn('w-4 h-4 transform transition-transform', isExpanded && 'rotate-180')}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
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
              {CAMPSITE_TYPES.map(({ type, icon: Icon, labelKey }) => (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all',
                    filterState.visibleTypes.includes(type)
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-neutral-300 bg-neutral-50 text-neutral-400 hover:border-neutral-400'
                  )}
                  title={t(labelKey)}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}

              {/* Route only mode */}
              {hasRoute && (
                <button
                  onClick={() => updateFilter('routeOnlyMode', !filterState.routeOnlyMode)}
                  className={cn(
                    'px-2 py-1 text-xs font-medium rounded transition-colors',
                    filterState.routeOnlyMode
                      ? 'bg-primary-100 text-primary-800'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  )}
                >
                  <MapPin className="w-3 h-3 inline mr-0.5" /> {t('campsites.filter.routeOnly')}
                </button>
              )}
            </div>

            <div className="text-xs text-neutral-500">
              {t('campsites.controls.max', { max: filterState.maxResults })}
            </div>
          </div>
        </div>
      )}

      {/* Expanded view */}
      {isExpanded && (
        <div className="border-b border-neutral-200">
          {/* Tab navigation */}
          <div className="flex border-b border-neutral-200 bg-neutral-50">
            {(
              [
                { id: 'types', labelKey: 'campsites.filter.typesTab', icon: Tent },
                { id: 'amenities', labelKey: 'campsites.filter.amenitiesTab', icon: Zap },
                { id: 'advanced', labelKey: 'campsites.filter.advancedTab', icon: Settings },
                { id: 'search', labelKey: 'campsites.filter.searchTab', icon: Search },
              ] as const
            ).map(tab => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex-1 flex items-center justify-center space-x-1 py-3 px-2 text-sm font-medium transition-colors',
                    activeTab === tab.id
                      ? 'text-primary-600 border-b-2 border-primary-600 bg-white'
                      : 'text-neutral-500 hover:text-neutral-700'
                  )}
                >
                  <TabIcon className="w-4 h-4" />
                  <span>{t(tab.labelKey)}</span>
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="p-4 space-y-4">
            {/* Types tab */}
            {activeTab === 'types' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-neutral-900">
                    {t('campsites.types.label')}
                  </h4>
                  <button
                    onClick={() => {
                      const allSelected = filterState.visibleTypes.length === CAMPSITE_TYPES.length;
                      updateFilter(
                        'visibleTypes',
                        allSelected ? [] : CAMPSITE_TYPES.map(ct => ct.type)
                      );
                    }}
                    className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                  >
                    {filterState.visibleTypes.length === CAMPSITE_TYPES.length
                      ? t('campsites.filter.none')
                      : t('campsites.filter.all')}
                  </button>
                </div>

                {CAMPSITE_TYPES.map(({ type, labelKey, icon: Icon, descKey }) => (
                  <label
                    key={type}
                    htmlFor={`filter-type-${type}`}
                    className="flex items-start space-x-3 cursor-pointer"
                  >
                    <input
                      id={`filter-type-${type}`}
                      type="checkbox"
                      checked={filterState.visibleTypes.includes(type)}
                      onChange={() => toggleType(type)}
                      className="mt-1 h-4 w-4 text-green-600 rounded border-neutral-300 focus:ring-green-500"
                    />
                    <Icon className="w-4 h-4 mt-1" />
                    <span className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-neutral-900">{t(labelKey)}</span>
                      <p className="text-xs text-neutral-500 mt-0.5">{t(descKey)}</p>
                    </span>
                  </label>
                ))}
              </div>
            )}

            {/* Amenities tab */}
            {activeTab === 'amenities' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-neutral-900">
                    {t('campsites.filter.requiredAmenities')}
                  </h4>
                  <button
                    onClick={() => {
                      const allSelected = Object.values(filterState.amenities).every(Boolean);
                      const newAmenities = Object.keys(filterState.amenities).reduce(
                        (acc, key) => ({
                          ...acc,
                          [key]: !allSelected,
                        }),
                        {} as CampsiteFilterState['amenities']
                      );
                      updateFilter('amenities', newAmenities);
                    }}
                    className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                  >
                    {Object.values(filterState.amenities).every(Boolean)
                      ? t('campsites.filter.none')
                      : t('campsites.filter.all')}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {AMENITY_OPTIONS.map(({ key, labelKey, icon: Icon }) => (
                    <label key={key} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filterState.amenities[key]}
                        onChange={() => toggleAmenity(key)}
                        className="h-4 w-4 text-green-600 rounded border-neutral-300 focus:ring-green-500"
                      />
                      <Icon className="w-4 h-4" />
                      <span className="text-sm text-neutral-900">{t(labelKey)}</span>
                    </label>
                  ))}
                </div>

                <div className="mt-3 p-2 bg-primary-50 rounded-lg text-xs text-primary-800 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 flex-shrink-0" />{' '}
                  {t('campsites.filter.amenitiesHint')}
                </div>
              </div>
            )}

            {/* Advanced tab */}
            {activeTab === 'advanced' && (
              <div className="space-y-4">
                {/* Vehicle compatibility */}
                <label
                  htmlFor="filter-vehicle-compatible"
                  className="flex items-start space-x-3 cursor-pointer"
                >
                  <input
                    id="filter-vehicle-compatible"
                    type="checkbox"
                    checked={filterState.vehicleCompatibleOnly}
                    onChange={e => updateFilter('vehicleCompatibleOnly', e.target.checked)}
                    className="mt-1 h-4 w-4 text-green-600 rounded border-neutral-300 focus:ring-green-500"
                  />
                  <span className="flex-1">
                    {t('campsites.filter.vehicleCompatibleOnly')}
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {t('campsites.filter.vehicleCompatibleHint')}
                    </p>
                  </span>
                </label>

                {/* Route only mode */}
                {hasRoute && (
                  <div className="space-y-2">
                    <label
                      htmlFor="filter-route-only"
                      className="flex items-start space-x-3 cursor-pointer"
                    >
                      <input
                        id="filter-route-only"
                        type="checkbox"
                        checked={filterState.routeOnlyMode}
                        onChange={e => updateFilter('routeOnlyMode', e.target.checked)}
                        className="mt-1 h-4 w-4 text-green-600 rounded border-neutral-300 focus:ring-green-500"
                      />
                      <span className="flex-1">
                        {t('campsites.filter.showAlongRoute')}
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {t('campsites.filter.routeFilterHint')}
                        </p>
                      </span>
                    </label>

                    {filterState.routeOnlyMode && (
                      <div className="ml-7">
                        <label className="block text-xs font-medium text-neutral-700 mb-1">
                          {t('campsites.filter.maxDistance', {
                            distance: filterState.maxDistanceFromRoute,
                          })}
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="range"
                            min={5}
                            max={100}
                            step={5}
                            value={filterState.maxDistanceFromRoute}
                            onChange={e =>
                              updateFilter('maxDistanceFromRoute', parseInt(e.target.value))
                            }
                            className="flex-1 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <select
                            value={filterState.maxDistanceFromRoute}
                            onChange={e =>
                              updateFilter('maxDistanceFromRoute', parseInt(e.target.value))
                            }
                            className="text-xs border border-neutral-300 rounded px-2 py-1 bg-white"
                          >
                            {DISTANCE_OPTIONS.map(distance => (
                              <option key={distance} value={distance}>
                                {distance}km
                              </option>
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
                      onChange={e => updateFilter('openNow', e.target.checked)}
                      className="h-4 w-4 text-green-600 rounded border-neutral-300 focus:ring-green-500"
                    />
                    <span className="text-sm text-neutral-900">
                      {t('campsites.filter.openNow')}
                    </span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterState.freeOnly}
                      onChange={e => updateFilter('freeOnly', e.target.checked)}
                      className="h-4 w-4 text-green-600 rounded border-neutral-300 focus:ring-green-500"
                    />
                    <span className="text-sm text-neutral-900">
                      {t('campsites.filter.freeOnly')}
                    </span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterState.acceptsReservations}
                      onChange={e => updateFilter('acceptsReservations', e.target.checked)}
                      className="h-4 w-4 text-green-600 rounded border-neutral-300 focus:ring-green-500"
                    />
                    <span className="text-sm text-neutral-900">
                      {t('campsites.filter.acceptsReservations')}
                    </span>
                  </label>
                </div>

                {/* Max results and sorting */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="filter-max-results"
                      className="block text-xs font-medium text-neutral-700 mb-1"
                    >
                      {t('campsites.filter.maxResults')}
                    </label>
                    <select
                      id="filter-max-results"
                      value={filterState.maxResults}
                      onChange={e => updateFilter('maxResults', parseInt(e.target.value))}
                      className="w-full text-sm border border-neutral-300 rounded px-2 py-1 bg-white"
                    >
                      {MAX_RESULTS_OPTIONS.map(option => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="filter-sort-by"
                      className="block text-xs font-medium text-neutral-700 mb-1"
                    >
                      {t('campsites.filter.sortBy')}
                    </label>
                    <select
                      id="filter-sort-by"
                      value={filterState.sortBy}
                      onChange={e =>
                        updateFilter('sortBy', e.target.value as CampsiteFilterState['sortBy'])
                      }
                      className="w-full text-sm border border-neutral-300 rounded px-2 py-1 bg-white"
                    >
                      {SORT_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {t(option.labelKey)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Map Legend */}
                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded mt-4">
                  <div className="text-xs font-medium text-neutral-700 mb-2">
                    {t('campsites.legend.title')}
                  </div>
                  <div className="space-y-2">
                    {/* Campsite type legend */}
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-6 flex-shrink-0">
                        <svg viewBox="0 0 20 28" className="w-full h-full">
                          <path
                            d="M10 0C4.5 0 0 4.5 0 10c0 7.5 10 18 10 18s10-10.5 10-18C20 4.5 15.5 0 10 0z"
                            fill="#27ae60"
                            stroke="#1a8a4b"
                            strokeWidth="1.5"
                          />
                        </svg>
                      </div>
                      <span className="text-xs text-neutral-700">
                        {t('campsites.legend.campsite')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-6 flex-shrink-0">
                        <svg viewBox="0 0 20 28" className="w-full h-full">
                          <path
                            d="M10 0C4.5 0 0 4.5 0 10c0 7.5 10 18 10 18s10-10.5 10-18C20 4.5 15.5 0 10 0z"
                            fill="#2794a8"
                            stroke="#1e7a8d"
                            strokeWidth="1.5"
                          />
                        </svg>
                      </div>
                      <span className="text-xs text-neutral-700">
                        {t('campsites.legend.caravanSite')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-6 flex-shrink-0">
                        <svg viewBox="0 0 20 28" className="w-full h-full">
                          <path
                            d="M10 0C4.5 0 0 4.5 0 10c0 7.5 10 18 10 18s10-10.5 10-18C20 4.5 15.5 0 10 0z"
                            fill="#7c5cbf"
                            stroke="#6b47b0"
                            strokeWidth="1.5"
                          />
                        </svg>
                      </div>
                      <span className="text-xs text-neutral-700">{t('campsites.legend.aire')}</span>
                    </div>

                    {/* Status indicators */}
                    <div className="pt-2 mt-2 border-t border-neutral-200">
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-6 flex-shrink-0">
                          <svg viewBox="0 0 20 28" className="w-full h-full">
                            <path
                              d="M10 0C4.5 0 0 4.5 0 10c0 7.5 10 18 10 18s10-10.5 10-18C20 4.5 15.5 0 10 0z"
                              fill="#e63946"
                              stroke="#d32535"
                              strokeWidth="1.5"
                            />
                          </svg>
                        </div>
                        <span className="text-xs text-neutral-700">
                          {t('campsites.legend.mayNotFit')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                          <div className="w-4 h-4 rounded-full bg-green-500 text-white text-[8px] font-bold flex items-center justify-center border-2 border-white shadow">
                            3
                          </div>
                        </div>
                        <span className="text-xs text-neutral-700">
                          {t('campsites.legend.clustered')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Search tab */}
            {activeTab === 'search' && (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="filter-search-name"
                    className="block text-sm font-medium text-neutral-700 mb-2"
                  >
                    {t('campsites.filter.searchByName')}
                  </label>
                  <input
                    id="filter-search-name"
                    type="text"
                    value={filterState.searchQuery}
                    onChange={e => {
                      updateFilter('searchQuery', e.target.value);
                      onSearchChange?.(e.target.value);
                    }}
                    placeholder={t('campsites.filter.searchNamePlaceholder')}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="filter-search-location"
                    className="block text-sm font-medium text-neutral-700 mb-2"
                  >
                    {t('campsites.filter.searchByLocation')}
                  </label>
                  <input
                    id="filter-search-location"
                    type="text"
                    value={filterState.searchLocation}
                    onChange={e => updateFilter('searchLocation', e.target.value)}
                    placeholder={t('campsites.filter.searchLocationPlaceholder')}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded text-xs">
                  <div className="font-medium text-neutral-900 mb-1">
                    {t('campsites.filter.searchTips')}
                  </div>
                  <ul className="space-y-0.5 text-neutral-700">
                    <li>• {t('campsites.filter.searchTip1')}</li>
                    <li>• {t('campsites.filter.searchTip2')}</li>
                    <li>• {t('campsites.filter.searchTip3')}</li>
                    <li>• {t('campsites.filter.searchTip4')}</li>
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
