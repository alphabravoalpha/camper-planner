// Unified Search Component
// Phase 5: Google Maps-style unified search bar at top of map
// Combines location search and campsite search in one interface

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import L, { latLng } from 'leaflet';
import { campsiteService } from '../../services/CampsiteService';
import { useRouteStore, useVehicleStore, useUIStore } from '../../store';
import { FeatureFlags } from '../../config';
import { cn } from '../../utils/cn';
import { type Campsite, type CampsiteRequest, type CampsiteType } from '../../services/CampsiteService';

export interface UnifiedSearchProps {
  map: L.Map | null;
  visibleTypes: CampsiteType[];
  onCampsiteSelect?: (campsite: Campsite) => void;
  onCampsiteHover?: (campsiteId: string | null) => void;
  onLocationSelect?: (location: { lat: number; lng: number; name: string }) => void;
  className?: string;
}

interface SearchResult {
  type: 'location' | 'campsite';
  id: string;
  name: string;
  description?: string;
  lat: number;
  lng: number;
  distance?: number;
  campsite?: Campsite;
  vehicleCompatible?: boolean;
}

const UnifiedSearch: React.FC<UnifiedSearchProps> = ({
  map,
  visibleTypes,
  onCampsiteSelect,
  onCampsiteHover,
  onLocationSelect,
  className
}) => {
  const { addWaypoint, waypoints } = useRouteStore();
  const { profile } = useVehicleStore();
  const { addNotification } = useUIStore();

  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentSearchRef = useRef<string>('');

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
  const saveToHistory = useCallback((searchQuery: string) => {
    if (searchQuery.trim().length < 2) return;

    const newHistory = [
      searchQuery,
      ...searchHistory.filter(h => h !== searchQuery)
    ].slice(0, 10);

    setSearchHistory(newHistory);
    localStorage.setItem('camper-planner-unified-search-history', JSON.stringify(newHistory));
  }, [searchHistory]);

  // Calculate distance between coordinates
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Check if campsite is in route
  const isCampsiteInRoute = useCallback((campsite: Campsite): boolean => {
    return waypoints.some(wp =>
      Math.abs(wp.lat - campsite.lat) < 0.0001 &&
      Math.abs(wp.lng - campsite.lng) < 0.0001
    );
  }, [waypoints]);

  // Perform unified search
  const performSearch = useCallback(async (searchQuery: string) => {
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
      let geocodedLocations: Awaited<ReturnType<typeof campsiteService.geocodeLocationMultiple>> = [];
      try {
        geocodedLocations = await campsiteService.geocodeLocationMultiple(searchQuery, 5);
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

        // Sort locations: European locations first, then by importance
        const sortedLocations = [...geocodedLocations].sort((a, b) => {
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
            description: location.display_name, // Full name for disambiguation
            lat: location.lat,
            lng: location.lng
          });
        });

        // Use the first (best) location as reference for campsite search
        geocodedCenter = latLng(sortedLocations[0].lat, sortedLocations[0].lng);
        mapCenter = geocodedCenter;
      }

      // 2. Search for campsites
      const searchBounds = mapCenter ? {
        north: mapCenter.lat + 1,
        south: mapCenter.lat - 1,
        east: mapCenter.lng + 1.5,
        west: mapCenter.lng - 1.5
      } : {
        north: 72, south: 34, east: 45, west: -25
      };

      const request: CampsiteRequest = {
        bounds: searchBounds,
        types: visibleTypes,
        maxResults: 20,
        includeDetails: true,
        vehicleFilter: profile || undefined
      };

      const response = await campsiteService.searchCampsites(request);

      if (response.status === 'success') {
        const campsiteResults = response.campsites
          .map(campsite => {
            const distance = mapCenter ? calculateDistance(
              mapCenter.lat, mapCenter.lng,
              campsite.lat, campsite.lng
            ) : undefined;

            return {
              type: 'campsite' as const,
              id: campsite.id.toString(),
              name: campsite.name || `${campsite.type.replace('_', ' ')} #${campsite.id}`,
              description: campsite.address || campsite.type.replace('_', ' '),
              lat: campsite.lat,
              lng: campsite.lng,
              distance,
              campsite,
              vehicleCompatible: campsite.vehicleCompatible
            };
          })
          .filter(result => {
            // Filter by name match or distance
            const nameMatch = result.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (result.description?.toLowerCase().includes(searchQuery.toLowerCase()));
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
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [map, visibleTypes, profile, calculateDistance, isSearching]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        performSearch(query);
      } else {
        setResults([]);
        currentSearchRef.current = '';
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(-1);
    setShowResults(e.target.value.trim().length >= 2);
  }, []);

  // Handle result selection
  const handleResultSelect = useCallback((result: SearchResult) => {
    console.log('handleResultSelect called:', { result, hasMap: !!map });
    saveToHistory(query);
    setShowResults(false);

    if (result.type === 'location') {
      // Navigate to location
      if (map) {
        console.log('Setting map view to:', [result.lat, result.lng]);
        map.setView([result.lat, result.lng], 10, { animate: true });
      } else {
        console.warn('Map reference is null, cannot navigate');
      }
      onLocationSelect?.({ lat: result.lat, lng: result.lng, name: result.name });
      addNotification({
        type: 'success',
        message: `Navigated to ${result.name}`
      });
    } else if (result.campsite) {
      // Select campsite
      if (map) {
        map.setView([result.lat, result.lng], Math.max(map.getZoom(), 14), { animate: true });
      }
      onCampsiteSelect?.(result.campsite);
    }
  }, [map, query, saveToHistory, onLocationSelect, onCampsiteSelect, addNotification]);

  // Add location to route as waypoint
  const handleAddLocationToRoute = useCallback((result: SearchResult, e: React.MouseEvent) => {
    e.stopPropagation();

    // Check if location is already in route
    const alreadyInRoute = waypoints.some(wp =>
      Math.abs(wp.lat - result.lat) < 0.0001 &&
      Math.abs(wp.lng - result.lng) < 0.0001
    );

    if (alreadyInRoute) {
      addNotification({
        type: 'warning',
        message: `${result.name} is already in your route`
      });
      return;
    }

    const waypoint = {
      id: `location-${Date.now()}`,
      lat: result.lat,
      lng: result.lng,
      type: 'waypoint' as const,
      name: result.name,
      notes: result.description || ''
    };

    addWaypoint(waypoint);
    addNotification({
      type: 'success',
      message: `Added "${result.name}" to your route`
    });

    // Navigate to the location as well
    if (map) {
      map.setView([result.lat, result.lng], 10);
    }
    setShowResults(false);
  }, [addWaypoint, addNotification, waypoints, map]);

  // Add campsite to route
  const handleAddToRoute = useCallback((result: SearchResult, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!result.campsite) return;

    if (isCampsiteInRoute(result.campsite)) {
      addNotification({
        type: 'warning',
        message: `${result.name} is already in your route`
      });
      return;
    }

    const waypoint = {
      id: `campsite-${result.id}-${Date.now()}`,
      lat: result.lat,
      lng: result.lng,
      type: 'campsite' as const,
      name: result.name,
      notes: result.description || ''
    };

    addWaypoint(waypoint);
    addNotification({
      type: 'success',
      message: `Added "${result.name}" to your route`
    });
    setShowResults(false);
  }, [addWaypoint, addNotification, isCampsiteInRoute]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        // Don't select while search is still in progress - wait for results
        if (isSearching) {
          return;
        }
        // If no item selected with arrow keys, select the first result
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleResultSelect(results[selectedIndex]);
        } else if (results.length > 0) {
          // Auto-select first result when pressing Enter without arrow navigation
          handleResultSelect(results[0]);
        }
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [showResults, results, selectedIndex, handleResultSelect, isSearching]);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    setSelectedIndex(-1);
  }, []);

  if (!FeatureFlags.CAMPSITE_DISPLAY) return null;

  // Group results by type
  const locationResults = results.filter(r => r.type === 'location');
  const campsiteResults = results.filter(r => r.type === 'campsite');

  return (
    <div className={cn('relative', className)}>
      {/* Search input */}
      <div className="relative">
        <div className="flex items-center bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <div className="pl-4 pr-2 py-3">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowResults(query.trim().length >= 2 || searchHistory.length > 0)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            placeholder="Search for a location or campsite..."
            className="flex-1 py-3 pr-4 text-sm bg-transparent border-0 focus:ring-0 focus:outline-none placeholder-gray-500"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="px-3 py-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {isSearching && (
            <div className="px-3">
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>
      </div>

      {/* Results dropdown */}
      {showResults && (results.length > 0 || searchHistory.length > 0 || searchError) && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto"
          onMouseDown={(e) => e.preventDefault()}
        >
          {/* Search error message */}
          {searchError && (
            <div className="px-4 py-3 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
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
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100 flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                LOCATIONS
              </div>
              {locationResults.map((result, index) => {
                const locationInRoute = waypoints.some(wp =>
                  Math.abs(wp.lat - result.lat) < 0.0001 &&
                  Math.abs(wp.lng - result.lng) < 0.0001
                );

                return (
                  <div
                    key={result.id}
                    className={cn(
                      'w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-50',
                      selectedIndex === index && 'bg-blue-50'
                    )}
                  >
                    <div
                      className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleResultSelect(result)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleResultSelect(result)}
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">{result.name}</div>
                        <div className="text-xs text-gray-500 truncate" title={result.description}>
                          {result.description || 'Go to this location'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleResultSelect(result);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded font-medium transition-colors"
                      >
                        Go
                      </button>
                      {locationInRoute ? (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded font-medium">
                          In Route
                        </span>
                      ) : (
                        <button
                          onClick={(e) => handleAddLocationToRoute(result, e)}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded font-medium hover:bg-blue-200 transition-colors"
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
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100 flex items-center">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
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
                      'w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-50',
                      selectedIndex === resultIndex && 'bg-green-50'
                    )}
                  >
                    <div
                      className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleResultSelect(result)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleResultSelect(result)}
                    >
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                        result.vehicleCompatible ? 'bg-green-100' : 'bg-red-100'
                      )}>
                        <svg className={cn(
                          'w-4 h-4',
                          result.vehicleCompatible ? 'text-green-600' : 'text-red-600'
                        )} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{result.name}</div>
                        <div className="text-xs text-gray-500 flex items-center space-x-2">
                          <span className="truncate">{result.description}</span>
                          {result.distance !== undefined && (
                            <span className="flex-shrink-0">
                              • {result.distance < 1 ? `${Math.round(result.distance * 1000)}m` : `${result.distance.toFixed(1)}km`}
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
                          onClick={(e) => handleAddToRoute(result, e)}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded font-medium hover:bg-blue-200 transition-colors"
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
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-gray-500">No results found for "{query}"</p>
              <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
            </div>
          )}

          {/* Search history */}
          {query.trim().length < 2 && searchHistory.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100 flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                RECENT SEARCHES
              </div>
              {searchHistory.slice(0, 5).map((historyItem) => (
                <button
                  key={historyItem}
                  onClick={() => setQuery(historyItem)}
                  className="w-full px-4 py-3 text-left flex items-center space-x-3 hover:bg-gray-50 transition-colors border-b border-gray-50"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-gray-700">{historyItem}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UnifiedSearch;
