// Main Trip Planner Page
// Phase 1: Basic page structure, Phase 2: Map integration

import React from 'react';
import { useTranslation } from 'react-i18next';
import { FeatureFlags } from '../config';
import MapContainer from '../components/map/MapContainer';

const PlannerPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="h-full flex flex-col">
      {/* Map Area - Full height */}
      <div className="flex-1 relative">
        <MapContainer />
      </div>
    </div>
  );
};

export default PlannerPage;