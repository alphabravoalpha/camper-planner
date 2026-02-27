import React from 'react';
import { MapPin, Search, Wand2 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface EmptyStateCardProps {
  onOpenWizard: () => void;
  onSearchFocus: () => void;
}

/**
 * EmptyStateCard — shown centered on the map when there are 0 waypoints
 * and the onboarding tour has completed or been skipped.
 * Compact card that directs users to the top search bar or Trip Wizard.
 * No duplicate search input — just a clear CTA.
 */
export const EmptyStateCard: React.FC<EmptyStateCardProps> = ({ onOpenWizard, onSearchFocus }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
      <div
        className={cn(
          'pointer-events-auto',
          'bg-white rounded-xl shadow-lg',
          'p-5 sm:p-8 max-w-sm sm:max-w-md w-full mx-4',
          'flex flex-col items-center gap-3 sm:gap-4'
        )}
      >
        {/* Map icon — smaller on mobile */}
        <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-blue-50">
          <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
        </div>

        {/* Headline */}
        <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 text-center">
          Where are you starting from?
        </h2>

        {/* Subtext — hidden on very small screens to save space */}
        <p className="text-sm text-neutral-500 text-center hidden sm:block">
          Search for an address, city, or campsite to begin planning your trip
        </p>

        {/* Primary CTA — focuses the real search bar */}
        <button
          type="button"
          onClick={onSearchFocus}
          className={cn(
            'flex items-center justify-center gap-2 w-full',
            'px-4 py-3 rounded-lg',
            'bg-primary-600 hover:bg-primary-700 text-white',
            'text-sm font-medium transition-colors'
          )}
        >
          <Search className="w-4 h-4" />
          Search for a location
        </button>

        {/* Trip Wizard link */}
        <button
          type="button"
          onClick={onOpenWizard}
          className="flex items-center justify-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 cursor-pointer"
        >
          <Wand2 className="w-3.5 h-3.5" />
          Use the Trip Wizard instead
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
