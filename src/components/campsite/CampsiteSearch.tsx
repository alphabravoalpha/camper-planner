// Campsite Search Component
// Phase 4.2: Search functionality for campsites by name and location

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useMap } from 'react-leaflet';
import { campsiteService } from '../../services/CampsiteService';
import type { Campsite, CampsiteRequest, CampsiteType } from '../../services/CampsiteService';
import { useVehicleStore, useUIStore } from '../../store';
import { FeatureFlags } from '../../config';
import { cn } from '../../utils/cn';

export interface CampsiteSearchProps {
  className?: string;
  onSearchChange?: (query: string) => void;
  onCampsiteSelect?: (campsite: Campsite) => void;
  visibleTypes: CampsiteType[];
  maxResults?: number;
  placeholder?: string;
}

interface SearchResult extends Campsite {
  distance?: number; // Distance from map center in km
  relevance?: number; // Search relevance score
}

const CampsiteSearch: React.FC<CampsiteSearchProps> = ({
  className,
  onSearchChange,
  onCampsiteSelect,
  visibleTypes,
  maxResults = 50,
  placeholder = "Search campsites by name or location..."
}) => {
  const map = useMap();
  const { profile } = useVehicleStore();
  const { addNotification } = useUIStore();

  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

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

  // Perform campsite search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!map || !FeatureFlags.CAMPSITE_DISPLAY || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    try {
      const mapCenter = map.getCenter();
      const bounds = map.getBounds();

      // Expand search area for better results
      const expandedBounds = bounds.pad(2.0); // Expand by 200%

      const request: CampsiteRequest = {
        bounds: {
          north: expandedBounds.getNorth(),
          south: expandedBounds.getSouth(),
          east: expandedBounds.getEast(),
          west: expandedBounds.getWest()
        },
        types: visibleTypes,
        maxResults: maxResults * 2, // Get more results for better filtering
        includeDetails: true,
        vehicleProfile: profile || undefined
      };

      const response = await campsiteService.searchCampsites(request);

      if (response.status === 'success') {
        // Filter and score results
        const filteredResults = response.campsites
          .map(campsite => {
            const distance = calculateDistance(
              mapCenter.lat, mapCenter.lng,
              campsite.location.lat, campsite.location.lng
            );
            const relevance = calculateRelevance(campsite, searchQuery);

            return {
              ...campsite,
              distance,
              relevance
            } as SearchResult;
          })
          .filter(result => result.relevance > 0) // Only include relevant results
          .sort((a, b) => {
            // Sort by relevance first, then by distance
            if (b.relevance !== a.relevance) {
              return b.relevance - a.relevance;
            }
            return (a.distance || 0) - (b.distance || 0);
          })
          .slice(0, maxResults);

        setSearchResults(filteredResults);
      } else {
        throw new Error(response.error || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      addNotification({
        type: 'error',
        message: 'Search failed. Please try again.'
      });
      setSearchResults([]);
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
        onSearchChange?.('');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch, onSearchChange]);

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

    // Pan map to campsite
    map.setView([campsite.location.lat, campsite.location.lng], Math.max(map.getZoom(), 14));

    // Notify parent
    onCampsiteSelect?.(campsite);

    addNotification({
      type: 'success',
      message: `Found ${campsite.name || campsite.type}`
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

  return (
    <div className={cn('relative', className)}>
      {/* Search input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowResults(query.trim().length >= 2)}
          onBlur={() => setTimeout(() => setShowResults(false), 150)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600"
          >
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      {showResults && (searchResults.length > 0 || searchHistory.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {/* Search results */}
          {searchResults.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                Search Results ({searchResults.length})
              </div>
              {searchResults.map((campsite, index) => (
                <button
                  key={campsite.id}
                  onClick={() => handleCampsiteSelect(campsite)}
                  className={cn(
                    'w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 border-b border-gray-50 last:border-b-0',
                    index === selectedIndex && 'bg-green-50'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {campsite.name || `${campsite.type.replace('_', ' ')} #${campsite.id}`}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {campsite.address || `${campsite.type.replace('_', ' ')}`}
                      </div>
                      {campsite.distance !== undefined && (
                        <div className="text-xs text-gray-400">
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

          {/* Search history */}
          {query.trim().length < 2 && searchHistory.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                Recent Searches
              </div>
              {searchHistory.slice(0, 5).map((historyItem, index) => (
                <button
                  key={historyItem}
                  onClick={() => setQuery(historyItem)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 border-b border-gray-50 last:border-b-0"
                >
                  <div className="flex items-center">
                    <svg className="h-3 w-3 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-gray-700">{historyItem}</span>
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

export default CampsiteSearch;