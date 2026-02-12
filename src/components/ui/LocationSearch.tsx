// LocationSearch Component
// Compact geocoding search input with dropdown results
// Designed for use inside Leaflet popups (handles event propagation)

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { campsiteService, type GeocodeResult } from '../../services/CampsiteService';
import { AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';

interface LocationSearchProps {
  /** Called when user selects a location from results */
  onLocationSelect: (result: GeocodeResult) => void;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
}

const LocationSearch: React.FC<LocationSearchProps> = ({
  onLocationSelect,
  placeholder = 'Search for a location...',
  className
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const currentSearchRef = useRef<string>('');

  // Debounced geocoding search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      setError(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      const searchQuery = query.trim();
      currentSearchRef.current = searchQuery;
      setIsSearching(true);
      setError(null);

      try {
        const geocodeResults = await campsiteService.geocodeLocationMultiple(searchQuery, 5);

        // Only update if this is still the current search
        if (currentSearchRef.current === searchQuery) {
          setResults(geocodeResults);
          setShowResults(true);
          setSelectedIndex(-1);
        }
      } catch (err) {
        if (currentSearchRef.current === searchQuery) {
          setError('Search failed. Try again.');
          setResults([]);
        }
      } finally {
        if (currentSearchRef.current === searchQuery) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Handle result selection
  const handleSelect = useCallback((result: GeocodeResult) => {
    onLocationSelect(result);
    setQuery('');
    setResults([]);
    setShowResults(false);
    setSelectedIndex(-1);
  }, [onLocationSelect]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation();

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
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowResults(false);
        setSelectedIndex(-1);
        break;
    }
  }, [showResults, results, selectedIndex, handleSelect]);

  // Truncate display name for compact dropdown
  const getDisplayName = (result: GeocodeResult): { primary: string; secondary: string } => {
    const primary = result.name || result.display_name.split(',')[0].trim();
    const parts = result.display_name.split(',');
    const secondary = parts.length > 1
      ? parts.slice(1, 3).join(',').trim()
      : '';
    return { primary, secondary };
  };

  return (
    <div
      className={cn('relative', className)}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Search input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onFocus={(e) => {
            e.stopPropagation();
            if (results.length > 0) setShowResults(true);
          }}
          onKeyDown={handleKeyDown}
          className="w-full px-2 py-1 pl-7 text-sm border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder={placeholder}
        />
        {/* Search icon / spinner */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2">
          {isSearching ? (
            <svg className="w-3.5 h-3.5 text-primary-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
        {/* Clear button */}
        {query && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setQuery('');
              setResults([]);
              setShowResults(false);
              inputRef.current?.focus();
            }}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-neutral-400 hover:text-neutral-600"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {showResults && (
        <div
          className="absolute left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 max-h-[150px] overflow-y-auto"
          onMouseDown={(e) => e.preventDefault()} // Prevent popup close on click
        >
          {results.length > 0 ? (
            results.map((result, idx) => {
              const { primary, secondary } = getDisplayName(result);
              return (
                <button
                  key={`${result.lat}-${result.lng}-${idx}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleSelect(result);
                  }}
                  className={cn(
                    'w-full text-left px-2.5 py-2 text-xs hover:bg-primary-50 transition-colors flex items-start gap-1.5',
                    idx === selectedIndex && 'bg-primary-50',
                    idx < results.length - 1 && 'border-b border-neutral-100'
                  )}
                >
                  <span className="text-neutral-400 mt-0.5 flex-shrink-0">📍</span>
                  <div className="min-w-0">
                    <div className="font-medium text-neutral-900 truncate">{primary}</div>
                    {secondary && (
                      <div className="text-neutral-500 truncate">{secondary}</div>
                    )}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="px-3 py-2 text-xs text-neutral-500 text-center">
              No locations found
            </div>
          )}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setError(null);
              setQuery(query); // Re-trigger search
            }}
            className="text-primary-600 hover:text-primary-700 underline ml-1"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
