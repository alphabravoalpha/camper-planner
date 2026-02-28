import React from 'react';
import { Wand2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';

interface EmptyStateCardProps {
  onOpenWizard: () => void;
  children?: React.ReactNode;
}

/**
 * EmptyStateCard — shown at the top of the map when there are 0 waypoints
 * and the onboarding tour has completed or been skipped.
 * Wraps around the search bar (passed as children) and provides Trip Wizard
 * link and helpful hints below.
 */
export const EmptyStateCard: React.FC<EmptyStateCardProps> = ({ onOpenWizard, children }) => {
  const { t } = useTranslation();
  return (
    <div className="absolute top-2 md:top-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-[calc(100%-1.5rem)] md:max-w-md px-2 md:px-4 pointer-events-none animate-in fade-in duration-300">
      <div
        className={cn(
          'pointer-events-auto',
          'bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg ring-1 ring-black/5',
          'p-3 sm:p-4',
          'flex flex-col items-center gap-2.5 sm:gap-3'
        )}
      >
        {/* Title */}
        <h2 className="text-sm sm:text-base font-semibold text-neutral-900 text-center">
          {t('emptyState.title', 'Start planning your trip')}
        </h2>

        {/* Search bar slot — the real UnifiedSearch component renders here */}
        {children && <div className="w-full">{children}</div>}

        {/* Divider with "or" */}
        <div className="flex items-center gap-2 w-full">
          <div className="flex-1 h-px bg-neutral-200" />
          <span className="text-xs text-neutral-400">or</span>
          <div className="flex-1 h-px bg-neutral-200" />
        </div>

        {/* Trip Wizard link */}
        <button
          type="button"
          onClick={onOpenWizard}
          className="flex items-center justify-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium cursor-pointer transition-colors"
        >
          <Wand2 className="w-3.5 h-3.5" />
          {t('emptyState.tripWizard', 'Use the Trip Wizard')}
        </button>

        {/* Right-click / long-press hint */}
        <p className="text-xs text-neutral-400 text-center hidden sm:block">
          {t('emptyState.hint.rightClick', 'Right-click the map to add points directly')}
        </p>
        <p className="text-xs text-neutral-400 text-center sm:hidden">
          {t('emptyState.hint.longPress', 'Long-press on mobile to add points')}
        </p>
      </div>
    </div>
  );
};

export default EmptyStateCard;
