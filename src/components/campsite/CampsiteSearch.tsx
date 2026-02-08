// Campsite Search Component
// Phase 4.2: Search functionality for campsites by name and location

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import * as L from 'leaflet';
import { campsiteService } from '../../services/CampsiteService';
import { useVehicleStore, useUIStore } from '../../store';
import { FeatureFlags } from '../../config';
import { cn } from '../../utils/cn';
import { type Campsite, type CampsiteRequest, type CampsiteType } from '../../services/CampsiteService';

export interface CampsiteSearchProps {
  className?: string;
  onSearchChange?: (query: string) => void;
  onCampsiteSelect?: (campsite: Campsite) => void;
  onCampsiteHover?: (campsiteId: string | null) => void;
  visibleTypes: CampsiteType[];
  maxResults?: number;
  placeholder?: string;
  mapInstance?: any; // Optional map instance for auto-zoom functionality
}

interface SearchResult extends Campsite {
  distance?: number; // Distance from map center in km
  relevance?: number; // Search relevance score
}

// Try to get map from context, return null if not available
function useMapSafe(): L.Map | null {
  try {
    return useMap();
  } catch {
    return null;
  }
}

const CampsiteSearchInner: React.FC<CampsiteSearchProps> = ({
  className,
  onSearchChange,
  onCampsiteSelect,
  onCampsiteHover,
  visibleTypes,
  maxResults = 50,
  placeholder = "Search by location (e.g. Barcelona, Tuscany) or campsite name...",
  mapInstance
}) => {
  // Use map context if available (when component is inside MapContainer) or use prop
  const mapFromContext = useMapSafe();
  const map = mapFromContext || mapInstance || null;

  const { profile } = useVehicleStore();
  const { addNotification } = useUIStore();

  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentSearchRef = useRef<string>('');
  const lastGeocodedQuery = useRef<string>('');
  const lastGeocodedResult = useRef<{ lat: number; lng: number } | null>(null);

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('camper-planner-search-history');
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch {
        // Ignore invalid saved data
      }
    }
  }, []);

  // Save search to history
  const saveToHistory = useCallback((searchQuery: string) => {
    if (searchQuery.trim().length < 2) return;

    const newHistory = [
      searchQuery,
      ...searchHistory.filter(h => h !== searchQuery)
    ].slice(0, 10); // Keep only last 10 searches

    setSearchHistory(newHistory);
    localStorage.setItem('camper-planner-search-history', JSON.stringify(newHistory));
  }, [searchHistory]);

  // Calculate distance between two coordinates
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Calculate search relevance score
  const calculateRelevance = useCallback((campsite: Campsite, searchQuery: string): number => {
    const query = searchQuery.toLowerCase();
    let score = 0;

    // Name match (highest priority)
    if (campsite.name) {
      const name = campsite.name.toLowerCase();
      if (name === query) score += 100;
      else if (name.startsWith(query)) score += 80;
      else if (name.includes(query)) score += 60;
    }

    // Address match
    if (campsite.address) {
      const address = campsite.address.toLowerCase();
      if (address.includes(query)) score += 40;
    }

    // Type match
    if (campsite.type.toLowerCase().includes(query)) score += 30;

    // Amenity match
    if (campsite.amenities) {
      Object.keys(campsite.amenities).forEach(amenity => {
        if (amenity.toLowerCase().includes(query)) score += 20;
      });
    }

    // Vehicle compatibility bonus
    if (campsite.vehicleCompatible) score += 10;

    return score;
  }, []);

  // Perform campsite search (enhanced with location-based search)
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!FeatureFlags.CAMPSITE_DISPLAY || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    // Prevent duplicate searches if already searching
    if (isSearching && currentSearchRef.current === searchQuery.trim()) {
      return;
    }

    currentSearchRef.current = searchQuery.trim();
    setIsSearching(true);

    let mapCenter: { lat: number; lng: number } | null = null;
    let searchBounds: any = null;
    let searchRequest: CampsiteRequest;

    // Check if query looks like a location name (not a specific campsite name)
    const isLocationQuery = !searchQuery.toLowerCase().includes('camp') &&
                             !searchQuery.toLowerCase().includes('camping') &&
                             !searchQuery.toLowerCase().includes('aire') &&
                             !searchQuery.toLowerCase().includes('park') &&
                             !searchQuery.toLowerCase().includes('site') &&
                             searchQuery.trim().length >= 3;

    try {
      if (isLocationQuery) {
        // For location queries, first geocode the location to get coordinates
        // Only geocode if we haven't already geocoded this exact query
        if (lastGeocodedQuery.current !== searchQuery.trim()) {
          console.log('🗺️ Geocoding location:', searchQuery);
          try {
            const geocodedLocation = await campsiteService.geocodeLocation(searchQuery);
            if (geocodedLocation) {
              mapCenter = {
                lat: geocodedLocation.lat,
                lng: geocodedLocation.lng
              };
              lastGeocodedQuery.current = searchQuery.trim();
              lastGeocodedResult.current = mapCenter;
              console.log('✅ Geocoding successful:', mapCenter);
            } else {
              console.warn('❌ Geocoding returned no results for:', searchQuery);
            }
          } catch (error) {
            console.warn('❌ Geocoding failed:', error);
          }
        } else {
          console.log('⏭️ Skipping geocoding - already geocoded:', searchQuery);
          // Use the previously geocoded result
          mapCenter = lastGeocodedResult.current;
          console.log('📍 Using cached geocoding result:', mapCenter);
        }

        // Location-based search using geocoding
        searchRequest = {
          bounds: { north: 0, south: 0, east: 0, west: 0 }, // Will be ignored for location queries
          types: visibleTypes,
          maxResults: maxResults,
          includeDetails: true,
          vehicleFilter: profile || undefined,
          locationQuery: searchQuery
        };

        // Auto-zoom map to the searched location if we have a geocoded result
        if (map && mapCenter) {
          try {
            console.log('🔍 Auto-zooming map to:', mapCenter);
            console.log('📍 Map object:', map);
            map.setView([mapCenter.lat, mapCenter.lng], 10); // Zoom level 10 for city view
            console.log('✅ Map setView completed');
          } catch (error) {
            console.error('❌ Failed to pan map to searched location:', error);
          }
        } else {
          console.warn('❌ Auto-zoom skipped - map or mapCenter missing:', { map: !!map, mapCenter });
        }
      } else {
        // Traditional campsite name search within bounds
        // Use map context if available for location-based search
        if (map) {
          mapCenter = map.getCenter();
          const bounds = map.getBounds();
          // Expand search area for better results
          const expandedBounds = bounds.pad(2.0); // Expand by 200%
          searchBounds = {
            north: expandedBounds.getNorth(),
            south: expandedBounds.getSouth(),
            east: expandedBounds.getEast(),
            west: expandedBounds.getWest()
          };
        } else {
          // Fallback: use a large European search area when map context is not available
          searchBounds = {
            north: 72.0,   // Northern Europe
            south: 34.0,   // Southern Europe
            east: 45.0,    // Eastern Europe
            west: -25.0    // Western Europe
          };
          // Use center of Europe as fallback reference point
          mapCenter = { lat: 54.5260, lng: 15.2551 };
        }

        searchRequest = {
          bounds: searchBounds,
          types: visibleTypes,
          maxResults: maxResults * 2, // Get more results for better filtering
          includeDetails: true,
          vehicleFilter: profile || undefined
        };
      }

      const response = await campsiteService.searchCampsites(searchRequest);

      if (response.status === 'success') {
        // For location-based searches, use the geocoded location as reference point
        if (isLocationQuery && response.metadata.geocoded_location) {
          mapCenter = {
            lat: response.metadata.geocoded_location.lat,
            lng: response.metadata.geocoded_location.lng
          };

          // Auto-zoom map to the searched location
          if (map && mapCenter) {
            try {
              map.setView([mapCenter.lat, mapCenter.lng], 10); // Zoom level 10 for city view
            } catch (error) {
              console.warn('Failed to pan map to searched location:', error);
            }
          }
        }

        // Filter and score results
        const filteredResults = response.campsites
          .map(campsite => {
            const distance = mapCenter ? calculateDistance(
              mapCenter.lat, mapCenter.lng,
              campsite.lat, campsite.lng
            ) : undefined;

            // For location queries, relevance is primarily based on distance
            // For campsite name queries, use text relevance
            const relevance = isLocationQuery
              ? (distance ? Math.max(0, 100 - distance) : 50) // Distance-based relevance
              : calculateRelevance(campsite, searchQuery);     // Text-based relevance

            return {
              ...campsite,
              distance,
              relevance
            } as SearchResult;
          })
          .filter(result => {
            if (isLocationQuery) {
              // For location queries, include all results within reasonable distance
              return (result.distance ?? 0) <= 100; // Within 100km
            } else {
              // For campsite name queries, require text relevance
              return (result.relevance ?? 0) > 0;
            }
          })
          .sort((a, b) => {
            // Sort by relevance first, then by distance
            if ((b.relevance ?? 0) !== (a.relevance ?? 0)) {
              return (b.relevance ?? 0) - (a.relevance ?? 0);
            }
            // Only sort by distance if both distances are available
            if (a.distance !== undefined && b.distance !== undefined) {
              return a.distance - b.distance;
            }
            return 0;
          })
          .slice(0, maxResults);

        setSearchResults(filteredResults);

        // Show results dropdown even if no campsites found for location searches
        if (isLocationQuery) {
          setShowResults(true);
        }
      } else {
        // Search failed - but for location queries, still show the dropdown with appropriate message
        if (isLocationQuery) {
          setSearchResults([]);
          setShowResults(true);
        } else {
          throw new Error(response.error || 'Search failed');
        }
      }
    } catch (error) {
      console.error('Search error:', error);

      // For location queries, still show the dropdown even if search fails
      if (isLocationQuery) {
        setSearchResults([]);
        setShowResults(true);
        // Don't show error notification for location queries if geocoding worked
        if (!mapCenter) {
          addNotification({
            type: 'error',
            message: 'Location not found. Please try a different search term.'
          });
        }
      } else {
        addNotification({
          type: 'error',
          message: 'Search failed. Please try again.'
        });
        setSearchResults([]);
      }
    } finally {
      setIsSearching(false);
    }
  }, [map, visibleTypes, maxResults, profile, calculateDistance, calculateRelevance, addNotification]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        performSearch(query);
        onSearchChange?.(query);
      } else {
        setSearchResults([]);
        currentSearchRef.current = ''; // Clear search reference when query is empty
        lastGeocodedQuery.current = ''; // Clear geocoding cache when query is empty
        lastGeocodedResult.current = null; // Clear geocoded result when query is empty
        onSearchChange?.('');
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      // Clear the current search when query changes to allow new searches
      if (query.trim() !== currentSearchRef.current) {
        currentSearchRef.current = '';
      }
    };
  }, [query]); // Remove performSearch and onSearchChange from dependencies to prevent infinite loops

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    setShowResults(value.trim().length >= 2);
  }, []);

  // Handle campsite selection
  const handleCampsiteSelect = useCallback((campsite: SearchResult) => {
    setQuery(campsite.name || campsite.type);
    setShowResults(false);
    saveToHistory(query);

    // Pan map to campsite (only if map is available)
    if (map) {
      try {
        map.setView([campsite.lat, campsite.lng], Math.max(map.getZoom(), 14));
      } catch (error) {
        console.warn('Failed to pan map to campsite:', error);
      }
    }

    // Notify parent
    onCampsiteSelect?.(campsite);

    const message = map
      ? `Found ${campsite.name || campsite.type}`
      : `Found ${campsite.name || campsite.type} - Add to map to view location`;

    addNotification({
      type: 'success',
      message
    });
  }, [map, query, saveToHistory, onCampsiteSelect, addNotification]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showResults || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleCampsiteSelect(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        break;
    }
  }, [showResults, searchResults, selectedIndex, handleCampsiteSelect]);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setSearchResults([]);
    setShowResults(false);
    setSelectedIndex(-1);
    onSearchChange?.('');
  }, [onSearchChange]);

  // Don't render if feature disabled
  if (!FeatureFlags.CAMPSITE_DISPLAY) return null;

  // Detect search type for UX indicators
  const isLocationQuery = query.trim().length >= 3 &&
    !query.toLowerCase().includes('camp') &&
    !query.toLowerCase().includes('camping') &&
    !query.toLowerCase().includes('aire') &&
    !query.toLowerCase().includes('park') &&
    !query.toLowerCase().includes('site');

  return (
    <div className={cn('relative', className)}>
      {/* Search mode indicator */}
      {!map && (
        <div className="mb-2 p-2 bg-primary-50 border border-primary-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs text-primary-700">
              Searching across Europe - results may not be location-specific
            </span>
          </div>
        </div>
      )}

      {/* Search type indicator */}
      {query.trim().length >= 2 && (
        <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            {isLocationQuery ? (
              <>
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-xs text-green-700">
                  🗺️ Location search: Finding campsites near "{query}"
                </span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="text-xs text-green-700">
                  🏕️ Campsite search: Looking for campsites matching "{query}"
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowResults(query.trim().length >= 2)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-neutral-600"
          >
            <svg className="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {isSearching && (
          <div className="absolute inset-y-0 right-8 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-600 border-t-transparent"></div>
          </div>
        )}
      </div>

      {/* Search results dropdown */}
      {showResults && (searchResults.length > 0 || searchHistory.length > 0 || (isLocationQuery && query.trim().length >= 3)) && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
          onMouseDown={(e) => e.preventDefault()} // Prevent blur when clicking in dropdown
        >
          {/* Search results */}
          {searchResults.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-medium text-neutral-500 border-b border-neutral-100">
                Search Results ({searchResults.length})
              </div>
              {searchResults.map((campsite, index) => (
                <button
                  key={campsite.id}
                  onClick={() => handleCampsiteSelect(campsite)}
                  onMouseEnter={() => onCampsiteHover?.(campsite.id.toString())}
                  onMouseLeave={() => onCampsiteHover?.(null)}
                  className={cn(
                    'w-full px-3 py-2 text-left hover:bg-neutral-50 focus:bg-neutral-50 border-b border-neutral-50 last:border-b-0 transition-colors',
                    index === selectedIndex && 'bg-green-50'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-neutral-900 truncate">
                        {campsite.name || `${campsite.type.replace('_', ' ')} #${campsite.id}`}
                      </div>
                      <div className="text-xs text-neutral-500 truncate">
                        {campsite.address || `${campsite.type.replace('_', ' ')}`}
                      </div>
                      {campsite.distance !== undefined && (
                        <div className="text-xs text-neutral-400">
                          {campsite.distance < 1
                            ? `${Math.round(campsite.distance * 1000)}m away`
                            : `${campsite.distance.toFixed(1)}km away`
                          }
                        </div>
                      )}
                    </div>
                    <div className="ml-2 flex items-center">
                      <span className={cn(
                        'px-2 py-1 text-xs rounded-full',
                        campsite.vehicleCompatible
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      )}>
                        {campsite.vehicleCompatible ? '✓' : '⚠'}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No results message for location searches */}
          {isLocationQuery && searchResults.length === 0 && !isSearching && query.trim().length >= 3 && (
            <div className="px-3 py-4 text-center">
              <div className="text-sm text-neutral-500 mb-2">
                <svg className="w-8 h-8 mx-auto mb-2 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                No campsites found near "{query}"
              </div>
              <div className="text-xs text-neutral-400">
                {map?.getCenter() && map.getCenter().lat !== 54.5260 ? (
                  <span>Campsite data may be temporarily unavailable. The map has been zoomed to your searched location.</span>
                ) : (
                  <span>Try a different location or zoom out on the map to search a larger area</span>
                )}
              </div>
            </div>
          )}

          {/* Search history */}
          {query.trim().length < 2 && searchHistory.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-medium text-neutral-500 border-b border-neutral-100">
                Recent Searches
              </div>
              {searchHistory.slice(0, 5).map((historyItem, _index) => (
                <button
                  key={historyItem}
                  onClick={() => setQuery(historyItem)}
                  className="w-full px-3 py-2 text-left hover:bg-neutral-50 focus:bg-neutral-50 border-b border-neutral-50 last:border-b-0"
                >
                  <div className="flex items-center">
                    <svg className="h-3 w-3 text-neutral-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-neutral-700">{historyItem}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Wrapper component that handles both with and without map context
const CampsiteSearch: React.FC<CampsiteSearchProps> = (props) => {
  return <CampsiteSearchInner {...props} />;
};

export default CampsiteSearch;