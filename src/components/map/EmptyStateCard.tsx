import React from 'react';
import { MapPin, Search } from 'lucide-react';
import { cn } from '../../utils/cn';

interface EmptyStateCardProps {
  onOpenWizard: () => void;
  onSearchFocus: () => void;
}

/**
 * EmptyStateCard — shown centered on the map when there are 0 waypoints
 * and the onboarding tour has completed or been skipped.
 * Directs users to search for a starting location or use the Trip Wizard.
 */
export const EmptyStateCard: React.FC<EmptyStateCardProps> = ({ onOpenWizard, onSearchFocus }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
      <div
        className={cn(
          'pointer-events-auto',
          'bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4',
          'flex flex-col items-center gap-5'
        )}
      >
        {/* Map icon in light blue circle */}
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-50">
          <MapPin className="w-8 h-8 text-blue-500" />
        </div>

        {/* Headline */}
        <h2 className="text-xl font-semibold text-neutral-900 text-center">
          Where are you starting from?
        </h2>

        {/* Subtext */}
        <p className="text-sm text-neutral-500 text-center">
          Search for an address, city, or campsite to begin planning your trip
        </p>

        {/* Fake search input — clicking it focuses the real search bar */}
        <button
          type="button"
          onClick={onSearchFocus}
          className={cn(
            'flex items-center gap-2 px-4 py-3',
            'bg-neutral-50 border border-neutral-200 rounded-lg',
            'cursor-pointer hover:border-neutral-300 transition-colors w-full',
            'text-left'
          )}
        >
          <Search className="w-4 h-4 text-neutral-400 flex-shrink-0" />
          <span className="text-sm text-neutral-400">Search locations...</span>
        </button>

        {/* "or" divider */}
        <div className="flex items-center gap-3 w-full text-xs text-neutral-400">
          <div className="flex-1 border-t border-neutral-200" />
          <span>or</span>
          <div className="flex-1 border-t border-neutral-200" />
        </div>

        {/* Trip Wizard link */}
        <button
          type="button"
          onClick={onOpenWizard}
          className="text-sm text-primary-600 hover:text-primary-700 cursor-pointer text-center"
        >
          Use the Trip Wizard for a guided setup
        </button>

        {/* Right-click / long-press hint */}
        <p className="text-xs text-neutral-400 text-center hidden sm:block">
          Right-click the map to add a point directly
        </p>
        <p className="text-xs text-neutral-400 text-center sm:hidden">
          Long press the map to add a point directly
        </p>
      </div>
    </div>
  );
};

export default EmptyStateCard;
