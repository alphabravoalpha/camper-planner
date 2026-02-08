// Main Trip Planner Page
// Phase 1: Basic page structure, Phase 2: Map integration

import React from 'react';
import MapContainer from '../components/map/MapContainer';
import TripWizard from '../components/wizard/TripWizard';
import { useTripWizardStore, useRouteStore } from '../store';
import { useOnboarding } from '../hooks/useOnboarding';
import { Route as RouteIcon } from 'lucide-react';

const PlannerPage: React.FC = () => {
  const { openWizard, wizardOpen } = useTripWizardStore();
  const { waypoints } = useRouteStore();
  const { showOnboarding } = useOnboarding();
  const hasWaypoints = waypoints.length > 0;

  return (
    <div className="h-full flex flex-col">
      {/* Map Area - Full height */}
      <div className="flex-1 relative">
        <MapContainer />

        {/* "Plan a Trip" floating button — always visible, prominent when no waypoints */}
        {!wizardOpen && !showOnboarding && (
          <button
            onClick={openWizard}
            className={`absolute z-[1000] flex items-center gap-2 shadow-lg transition-all font-semibold ${
              hasWaypoints
                ? 'bottom-4 right-4 px-4 py-2.5 bg-white text-accent-600 rounded-xl hover:bg-accent-50 text-sm shadow-medium ring-1 ring-black/5'
                : 'bottom-6 left-1/2 -translate-x-1/2 px-6 py-3.5 bg-accent-500 text-white rounded-2xl hover:bg-accent-600 text-base shadow-float active:scale-[0.97]'
            }`}
          >
            <RouteIcon className={hasWaypoints ? 'w-4 h-4' : 'w-5 h-5'} />
            {hasWaypoints ? 'Plan a Trip' : 'Plan a Trip'}
          </button>
        )}
      </div>

      {/* Trip Planning Wizard Modal */}
      <TripWizard />
    </div>
  );
};

export default PlannerPage;