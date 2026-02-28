// Unified Search Component
// Phase 5: Google Maps-style unified search bar at top of map
// Combines location search and campsite search in one interface

import React, { useState, useCallback, useEffect, useRef } from 'react';
import L, { latLng } from 'leaflet';
import { LocateFixed } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { campsiteService } from '../../services/CampsiteService';
import { useRouteStore, useVehicleStore, useUIStore, useMapStore } from '../../store';
import { FeatureFlags } from '../../config';
import { cn } from '../../utils/cn';
import {
  type Campsite,
  type CampsiteRequest,
  type CampsiteType,
} from '../../services/CampsiteService';

export interface UnifiedSearchProps {
  map: L.Map | null;
  visibleTypes: CampsiteType[];
  onCampsiteSelect?: (campsite: Campsite) => void;
  onCampsiteHover?: (campsiteId: string | null) => void;
  onLocationSelect?: (location: { lat: number; lng: number; name: string }) => void;
  onFocusChange?: (focused: boolean) => void;
  className?: string;
}

interface SearchResult {
  type: 'location' | 'campsite';
  id: string;
  name: string;
  description?: string;
  subtitle?: string;
  boundingbox?: [string, string, string, string];
  lat: number;
  lng: number;
  distance?: number;
  campsite?: Campsite;
  vehicleCompatible?: boolean;
}

const POPULAR_DESTINATIONS = [
  { name: 'Barcelona', lat: 41.3874, lng: 2.1686 },
  { name: 'Lake Garda', lat: 45.6383, lng: 10.651 },
  { name: 'Provence', lat: 43.9493, lng: 6.0679 },
  { name: 'Algarve', lat: 37.0179, lng: -7.9304 },
  { name: 'Norwegian Fjords', lat: 61.2, lng: 6.75 },
  { name: 'Tuscany', lat: 43.3188, lng: 11.3308 },
];

const UnifiedSearch: React.FC<UnifiedSearchProps> = ({
  map,
  visibleTypes,
  onCampsiteSelect,
  onCampsiteHover,
  onLocationSelect,
  onFocusChange,
  className,
}) => {
  const { t } = useTranslation();
  const { addWaypoint, waypoints } = useRouteStore();
  const { profile } = useVehicleStore();
  const { addNotification } = useUIStore();
  const { setCenter, setZoom } = useMapStore();

  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentSearchRef = useRef<string>('');
  const pendingAutoSelectRef = useRef(false);

  // Load search history
  useEffect(() => {
    const saved = localStorage.getItem('camper-planner-unified-search-history');
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch {
        // Ignore invalid data
      }
    }
  }, []);

  // Save search to history
  const saveToHistory = useCallback(
    (searchQuery: string) => {
      if (searchQuery.trim().length < 2) return;

      const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(
        0,
        10
      );

      setSearchHistory(newHistory);
      localStorage.setItem('camper-planner-unified-search-history', JSON.stringify(newHistory));
    },
    [searchHistory]
  );

  // Calculate distance between coordinates
  const calculateDistance = useCallback(
    (lat1: number, lng1: number, lat2: number, lng2: number): number => {
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLng = ((lng2 - lng1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    []
  );

  // Check if campsite is in route
  const isCampsiteInRoute = useCallback(
    (campsite: Campsite): boolean => {
      return waypoints.some(
        wp => Math.abs(wp.lat - campsite.lat) < 0.0001 && Math.abs(wp.lng - campsite.lng) < 0.0001
      );
    },
    [waypoints]
  );

  // Perform unified search
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!FeatureFlags.CAMPSITE_DISPLAY || searchQuery.trim().length < 2) {
        setResults([]);
        return;
      }

      if (isSearching && currentSearchRef.current === searchQuery.trim()) {
        return;
      }

      currentSearchRef.current = searchQuery.trim();
      setIsSearching(true);
      setSearchError(null);

      const allResults: SearchResult[] = [];
      let mapCenter = map?.getCenter();
      let geocodedCenter: L.LatLng | null = null;

      try {
        // 1. Try to geocode as location - get multiple results for disambiguation
        let geocodedLocations: Awaited<ReturnType<typeof campsiteService.geocodeLocationMultiple>> =
          [];
        try {
          // Pass current map viewport to bias results toward what the user is viewing
          const bounds = map?.getBounds();
          const viewbox: [number, number, number, number] | undefined = bounds
            ? [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()]
            : undefined;
          geocodedLocations = await campsiteService.geocodeLocationMultiple(
            searchQuery,
            5,
            viewbox
          );
        } catch (geocodeError) {
          console.error('Geocoding failed:', geocodeError);
          setSearchError('Unable to search locations. Please try again.');
          // Continue with campsite search even if geocoding fails
        }

        if (geocodedLocations.length > 0) {
          // Helper function to check if location is in Europe (roughly)
          const isInEurope = (lat: number, lng: number): boolean => {
            return lat >= 34 && lat <= 72 && lng >= -25 && lng <= 45;
          };

          // Sort locations: exact name matches first, then European, then by importance
          const queryLower = searchQuery.toLowerCase().trim();
          const sortedLocations = [...geocodedLocations].sort((a, b) => {
            // Prioritize exact name matches (e.g. "Elba" matches "Elba" over "Elbe")
            const aName = (a.name || '').toLowerCase();
            const bName = (b.name || '').toLowerCase();

            const aExact = aName === queryLower ? 1 : 0;
            const bExact = bName === queryLower ? 1 : 0;
            if (aExact !== bExact) return bExact - aExact;

            const aStarts = aName.startsWith(queryLower) ? 1 : 0;
            const bStarts = bName.startsWith(queryLower) ? 1 : 0;
            if (aStarts !== bStarts) return bStarts - aStarts;

            // Then European locations first
            const aInEurope = isInEurope(a.lat, a.lng);
            const bInEurope = isInEurope(b.lat, b.lng);
            if (aInEurope && !bInEurope) return -1;
            if (!aInEurope && bInEurope) return 1;

            return (b.importance || 0) - (a.importance || 0);
          });

          // Add all location results for user disambiguation
          sortedLocations.forEach(location => {
            allResults.push({
              type: 'location',
              id: `location-${location.lat}-${location.lng}`,
              name: location.name || location.display_name.split(',')[0],
              description: location.display_name, // Full name for tooltip
              subtitle: location.subtitle, // Clean "Region, Country" for display
              boundingbox: location.boundingbox,
              lat: location.lat,
              lng: location.lng,
            });
          });

          // Use the first (best) location as reference for campsite search
          geocodedCenter = latLng(sortedLocations[0].lat, sortedLocations[0].lng);
          mapCenter = geocodedCenter;
        }

        // 2. Search for campsites
        const searchBounds = mapCenter
          ? {
              north: mapCenter.lat + 1,
              south: mapCenter.lat - 1,
              east: mapCenter.lng + 1.5,
              west: mapCenter.lng - 1.5,
            }
          : {
              north: 72,
              south: 34,
              east: 45,
              west: -25,
            };

        const request: CampsiteRequest = {
          bounds: searchBounds,
          types: visibleTypes,
          maxResults: 20,
          includeDetails: true,
          vehicleFilter: profile || undefined,
        };

        const response = await campsiteService.searchCampsites(request);

        if (response.status === 'success') {
          const campsiteResults = response.campsites
            .map(campsite => {
              const distance = mapCenter
                ? calculateDistance(mapCenter.lat, mapCenter.lng, campsite.lat, campsite.lng)
                : undefined;

              return {
                type: 'campsite' as const,
                id: campsite.id.toString(),
                name: campsite.name || `${campsite.type.replace('_', ' ')} #${campsite.id}`,
                description: campsite.address || campsite.type.replace('_', ' '),
                lat: campsite.lat,
                lng: campsite.lng,
                distance,
                campsite,
                vehicleCompatible: campsite.vehicleCompatible,
              };
            })
            .filter(result => {
              // Filter by name match or distance
              const nameMatch =
                result.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                result.description?.toLowerCase().includes(searchQuery.toLowerCase());
              const closeEnough = result.distance !== undefined && result.distance <= 100;
              return nameMatch || closeEnough;
            })
            .sort((a, b) => {
              // Sort by name match first, then distance
              const aNameMatch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) ? 1 : 0;
              const bNameMatch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) ? 1 : 0;
              if (bNameMatch !== aNameMatch) return bNameMatch - aNameMatch;
              return (a.distance ?? Infinity) - (b.distance ?? Infinity);
            })
            .slice(0, 10);

          allResults.push(...campsiteResults);
        }

        setResults(allResults);
        setShowResults(true);

        // Auto-select first result if Enter was pressed before results arrived
        if (pendingAutoSelectRef.current && allResults.length > 0) {
          pendingAutoSelectRef.current = false;
          handleResultSelect(allResults[0]);
        }
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
        pendingAutoSelectRef.current = false;
      } finally {
        setIsSearching(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [map, visibleTypes, profile, calculateDistance, isSearching]
  );

  // Clear results when query is emptied (no auto-search on typing)
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      currentSearchRef.current = '';
    }
  }, [query]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(-1);
    setShowResults(true);
  }, []);

  // Handle result selection
  const handleResultSelect = useCallback(
    (result: SearchResult) => {
      saveToHistory(query);
      setShowResults(false);

      if (result.type === 'location') {
        // Navigate to location using boundingbox for smart zoom
        if (map && result.boundingbox) {
          const [south, north, west, east] = result.boundingbox.map(Number);
          const bounds = L.latLngBounds([south, west], [north, east]);
          map.fitBounds(bounds, { padding: [50, 50], animate: true, maxZoom: 14 });
          // Sync store after fitBounds completes
          map.once('moveend', () => {
            const c = map.getCenter();
            setCenter([c.lat, c.lng]);
            setZoom(map.getZoom());
          });
        } else {
          // Fallback: no boundingbox available
          setCenter([result.lat, result.lng]);
          setZoom(10);
          if (map) {
            map.setView([result.lat, result.lng], 10, { animate: true });
          }
        }
        onLocationSelect?.({ lat: result.lat, lng: result.lng, name: result.name });
        addNotification({
          type: 'success',
          message: `Navigated to ${result.name}`,
        });
      } else if (result.campsite) {
        // Select campsite - update store so MapController stays in sync
        const campsiteZoom = map ? Math.max(map.getZoom(), 14) : 14;
        setCenter([result.lat, result.lng]);
        setZoom(campsiteZoom);
        if (map) {
          map.setView([result.lat, result.lng], campsiteZoom, { animate: true });
        }
        onCampsiteSelect?.(result.campsite);
      }
    },
    [
      map,
      query,
      saveToHistory,
      onLocationSelect,
      onCampsiteSelect,
      addNotification,
      setCenter,
      setZoom,
    ]
  );

  // Add location to route as waypoint
  const handleAddLocationToRoute = useCallback(
    (result: SearchResult, e: React.MouseEvent) => {
      e.stopPropagation();

      // Check if location is already in route
      const alreadyInRoute = waypoints.some(
        wp => Math.abs(wp.lat - result.lat) < 0.0001 && Math.abs(wp.lng - result.lng) < 0.0001
      );

      if (alreadyInRoute) {
        addNotification({
          type: 'warning',
          message: `${result.name} is already in your route`,
        });
        return;
      }

      const waypoint = {
        id: `location-${Date.now()}`,
        lat: result.lat,
        lng: result.lng,
        type: 'waypoint' as const,
        name: result.name,
        notes: result.description || '',
      };

      addWaypoint(waypoint);
      addNotification({
        type: 'success',
        message: `Added "${result.name}" to your route`,
      });

      // Navigate to the location using smart zoom and clear search
      if (map && result.boundingbox) {
        const [south, north, west, east] = result.boundingbox.map(Number);
        const bounds = L.latLngBounds([south, west], [north, east]);
        map.fitBounds(bounds, { padding: [50, 50], animate: true, maxZoom: 14 });
        map.once('moveend', () => {
          const c = map.getCenter();
          setCenter([c.lat, c.lng]);
          setZoom(map.getZoom());
        });
      } else {
        setCenter([result.lat, result.lng]);
        setZoom(10);
        if (map) {
          map.setView([result.lat, result.lng], 10);
        }
      }
      setQuery('');
      setShowResults(false);
    },
    [addWaypoint, addNotification, waypoints, map, setCenter, setZoom]
  );

  // Add campsite to route
  const handleAddToRoute = useCallback(
    (result: SearchResult, e: React.MouseEvent) => {
      e.stopPropagation();

      if (!result.campsite) return;

      if (isCampsiteInRoute(result.campsite)) {
        addNotification({
          type: 'warning',
          message: `${result.name} is already in your route`,
        });
        return;
      }

      const waypoint = {
        id: `campsite-${result.id}-${Date.now()}`,
        lat: result.lat,
        lng: result.lng,
        type: 'campsite' as const,
        name: result.name,
        notes: result.description || '',
      };

      addWaypoint(waypoint);
      addNotification({
        type: 'success',
        message: `Added "${result.name}" to your route`,
      });
      setQuery('');
      setShowResults(false);
    },
    [addWaypoint, addNotification, isCampsiteInRoute]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          if (!showResults || results.length === 0) return;
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          if (!showResults || results.length === 0) return;
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < results.length) {
            // User has arrow-keyed to a specific result — select it
            handleResultSelect(results[selectedIndex]);
          } else if (query.trim().length >= 2) {
            // Trigger search and auto-select first result when it arrives
            pendingAutoSelectRef.current = true;
            currentSearchRef.current = '';
            performSearch(query);
          }
          break;
        case 'Escape':
          setShowResults(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    },
    [showResults, results, selectedIndex, handleResultSelect, query, performSearch]
  );

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    setSelectedIndex(-1);
  }, []);

  // Handle "Use my location" click
  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        setIsLocating(false);
        setShowResults(false);

        setCenter([latitude, longitude]);
        setZoom(12);
        if (map) {
          map.setView([latitude, longitude], 12, { animate: true });
        }

        addNotification({
          type: 'success',
          message: 'Moved to your current location',
        });
      },
      error => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError(
              'Location permission denied. Please allow location access in your browser.'
            );
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location unavailable. Please try again.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out. Please try again.');
            break;
          default:
            setLocationError('Unable to get your location. Please try again.');
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, [map, setCenter, setZoom, addNotification]);

  // Handle popular destination click
  const handlePopularDestinationClick = useCallback(
    (dest: (typeof POPULAR_DESTINATIONS)[number]) => {
      setQuery(dest.name);
      setShowResults(false);
      setCenter([dest.lat, dest.lng]);
      setZoom(10);
      if (map) {
        map.setView([dest.lat, dest.lng], 10, { animate: true });
      }
      addNotification({
        type: 'success',
        message: `Navigated to ${dest.name}`,
      });
    },
    [map, setCenter, setZoom, addNotification]
  );

  // Handle input focus
  const handleInputFocus = useCallback(() => {
    setShowResults(true);
    onFocusChange?.(true);
  }, [onFocusChange]);

  // Handle input blur
  const handleInputBlur = useCallback(() => {
    setTimeout(() => setShowResults(false), 200);
    // Only report blur (unfocused) if search is empty and dropdown is closed
    // This prevents dismissing the EmptyStateCard while the user is mid-search
    setTimeout(() => {
      if (!query.trim() && !showResults) {
        onFocusChange?.(false);
      }
    }, 250);
  }, [onFocusChange, query, showResults]);

  if (!FeatureFlags.CAMPSITE_DISPLAY) return null;

  // Group results by type
  const locationResults = results.filter(r => r.type === 'location');
  const campsiteResults = results.filter(r => r.type === 'campsite');

  return (
    <div className={cn('relative', className)}>
      {/* Search input */}
      <div className="relative">
        <div className="flex items-center bg-white rounded-xl shadow-float border-0 ring-1 ring-black/5 overflow-hidden">
          <div className="pl-4 pr-2 py-3">
            <svg
              className="h-5 w-5 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={t(
              'map.searchPlaceholder',
              'Search a city, region, address, or postcode...'
            )}
            className="flex-1 py-3 pr-2 text-sm bg-transparent border-0 focus:ring-0 focus:outline-none placeholder-neutral-400"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="px-2 py-2 text-neutral-400 hover:text-neutral-600 transition-colors"
              aria-label="Clear search"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
          {isSearching && (
            <div className="px-2">
              <div className="animate-spin h-5 w-5 border-2 border-primary-500 border-t-transparent rounded-full"></div>
            </div>
          )}
          {/* Location icon button — always visible, triggers geolocation */}
          {!isSearching && (
            <button
              onClick={handleUseMyLocation}
              disabled={isLocating}
              className={cn(
                'px-2.5 py-2 text-neutral-400 hover:text-primary-600 transition-colors flex-shrink-0',
                isLocating && 'text-primary-500'
              )}
              aria-label="Use my current location"
              title="Use my current location"
            >
              {isLocating ? (
                <div className="animate-spin h-[18px] w-[18px] border-2 border-primary-500 border-t-transparent rounded-full" />
              ) : (
                <LocateFixed className="h-[18px] w-[18px]" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Results dropdown */}
      {showResults && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-float border-0 ring-1 ring-black/5 z-50 max-h-96 overflow-y-auto"
          onMouseDown={e => e.preventDefault()}
          role="listbox"
          tabIndex={-1}
        >
          {/* Search error message */}
          {searchError && (
            <div className="px-4 py-3 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg
                  className="w-4 h-4 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span className="text-sm text-amber-700">{searchError}</span>
              </div>
              <button
                onClick={() => {
                  setSearchError(null);
                  performSearch(query);
                }}
                className="text-xs text-amber-700 hover:text-amber-900 underline font-medium"
              >
                Retry
              </button>
            </div>
          )}

          {/* Location results */}
          {locationResults.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-neutral-500 bg-neutral-50/80 flex items-center">
                <svg
                  className="w-4 h-4 mr-2 text-primary-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                </svg>
                LOCATIONS
              </div>
              {locationResults.map((result, index) => {
                const locationInRoute = waypoints.some(
                  wp =>
                    Math.abs(wp.lat - result.lat) < 0.0001 && Math.abs(wp.lng - result.lng) < 0.0001
                );

                return (
                  <div
                    key={result.id}
                    className={cn(
                      'w-full px-4 py-3 flex items-center justify-between hover:bg-neutral-50 transition-all duration-150',
                      selectedIndex === index && 'bg-primary-50'
                    )}
                  >
                    <div
                      className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleResultSelect(result)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && handleResultSelect(result)}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-4 h-4 text-primary-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-neutral-900">{result.name}</div>
                        <div
                          className="text-xs text-neutral-500 truncate"
                          title={result.description}
                        >
                          {result.subtitle || result.description || 'Go to this location'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleResultSelect(result);
                        }}
                        onMouseDown={e => e.stopPropagation()}
                        className="px-2 py-1 text-xs text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 rounded transition-colors"
                        title="View on map without adding to route"
                      >
                        Go
                      </button>
                      {locationInRoute ? (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded font-medium">
                          In Route
                        </span>
                      ) : (
                        <button
                          onClick={e => handleAddLocationToRoute(result, e)}
                          className="px-2.5 py-1 text-xs bg-primary-600 text-white rounded font-medium hover:bg-primary-700 transition-colors"
                          title="Add this location to your route"
                        >
                          + Add
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Campsite results */}
          {campsiteResults.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-neutral-500 bg-neutral-50/80 flex items-center">
                <svg
                  className="w-4 h-4 mr-2 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                CAMPSITES ({campsiteResults.length})
              </div>
              {campsiteResults.map((result, index) => {
                const resultIndex = locationResults.length + index;
                const inRoute = result.campsite && isCampsiteInRoute(result.campsite);

                return (
                  <div
                    key={result.id}
                    onMouseEnter={() => onCampsiteHover?.(result.id)}
                    onMouseLeave={() => onCampsiteHover?.(null)}
                    className={cn(
                      'w-full px-4 py-3 flex items-center justify-between hover:bg-neutral-50 transition-all duration-150',
                      selectedIndex === resultIndex && 'bg-green-50'
                    )}
                    role="option"
                    aria-selected={selectedIndex === resultIndex}
                    tabIndex={-1}
                  >
                    <div
                      className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleResultSelect(result)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && handleResultSelect(result)}
                    >
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                          result.vehicleCompatible ? 'bg-green-100' : 'bg-red-100'
                        )}
                      >
                        <svg
                          className={cn(
                            'w-4 h-4',
                            result.vehicleCompatible ? 'text-green-600' : 'text-red-600'
                          )}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-neutral-900 truncate">
                          {result.name}
                        </div>
                        <div className="text-xs text-neutral-500 flex items-center space-x-2">
                          <span className="truncate">{result.description}</span>
                          {result.distance !== undefined && (
                            <span className="flex-shrink-0">
                              •{' '}
                              {result.distance < 1
                                ? `${Math.round(result.distance * 1000)}m`
                                : `${result.distance.toFixed(1)}km`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                      {result.vehicleCompatible ? (
                        <span className="text-xs text-green-600 font-medium">✓</span>
                      ) : (
                        <span className="text-xs text-red-600 font-medium">⚠</span>
                      )}
                      {inRoute ? (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded font-medium">
                          In Route
                        </span>
                      ) : (
                        <button
                          onClick={e => handleAddToRoute(result, e)}
                          className="px-2.5 py-1 text-xs bg-primary-600 text-white rounded font-medium hover:bg-primary-700 transition-colors"
                          title="Add this location to your route"
                        >
                          + Add
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* No results */}
          {results.length === 0 && query.trim().length >= 2 && !isSearching && (
            <div className="px-4 py-6 text-center">
              <svg
                className="w-12 h-12 mx-auto text-neutral-300 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-neutral-500">No results found for &quot;{query}&quot;</p>
              <p className="text-xs text-neutral-400 mt-1">Try a city name, region, or country</p>
              <div className="flex flex-wrap justify-center gap-2 mt-3">
                {POPULAR_DESTINATIONS.map(dest => (
                  <button
                    key={dest.name}
                    onClick={() => handlePopularDestinationClick(dest)}
                    className="px-3 py-1 text-xs bg-neutral-100 text-neutral-600 rounded-full hover:bg-primary-50 hover:text-primary-700 transition-colors"
                  >
                    {dest.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search history */}
          {query.trim().length < 2 && searchHistory.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-neutral-500 bg-neutral-50/80 flex items-center">
                <svg
                  className="w-4 h-4 mr-2 text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                RECENT SEARCHES
              </div>
              {searchHistory.slice(0, 5).map(historyItem => (
                <button
                  key={historyItem}
                  onClick={() => setQuery(historyItem)}
                  className="w-full px-4 py-3 text-left flex items-center space-x-3 hover:bg-neutral-50 transition-colors"
                >
                  <svg
                    className="w-4 h-4 text-neutral-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm text-neutral-700">{historyItem}</span>
                </button>
              ))}
              {/* Use my location at bottom of history */}
              <button
                onClick={handleUseMyLocation}
                disabled={isLocating}
                className="w-full px-4 py-3 text-left flex items-center space-x-3 hover:bg-neutral-50 transition-colors border-t border-neutral-100"
              >
                {isLocating ? (
                  <div className="w-4 h-4 animate-spin border-2 border-primary-500 border-t-transparent rounded-full" />
                ) : (
                  <svg
                    className="w-4 h-4 text-primary-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"
                    />
                  </svg>
                )}
                <span className="text-sm text-primary-600 font-medium">
                  {isLocating ? 'Getting location...' : 'Use my current location'}
                </span>
              </button>
            </div>
          )}

          {/* Guidance state: shown when no query and no history */}
          {query.trim().length < 2 &&
            searchHistory.length === 0 &&
            results.length === 0 &&
            !isSearching && (
              <div className="px-4 py-4">
                <p className="text-sm text-neutral-500 mb-3">
                  Search for a city, region, or campsite...
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {POPULAR_DESTINATIONS.map(dest => (
                    <button
                      key={dest.name}
                      onClick={() => handlePopularDestinationClick(dest)}
                      className="px-3 py-1 text-xs bg-neutral-100 text-neutral-600 rounded-full hover:bg-primary-50 hover:text-primary-700 transition-colors"
                    >
                      {dest.name}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleUseMyLocation}
                  disabled={isLocating}
                  className="w-full px-3 py-2.5 text-left flex items-center space-x-3 hover:bg-neutral-50 rounded-lg transition-colors"
                >
                  {isLocating ? (
                    <div className="w-4 h-4 animate-spin border-2 border-primary-500 border-t-transparent rounded-full" />
                  ) : (
                    <svg
                      className="w-4 h-4 text-primary-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"
                      />
                    </svg>
                  )}
                  <span className="text-sm text-primary-600 font-medium">
                    {isLocating ? 'Getting location...' : 'Use my current location'}
                  </span>
                </button>
                {locationError && <p className="text-xs text-red-500 mt-2 px-1">{locationError}</p>}
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default UnifiedSearch;
