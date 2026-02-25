// Minimal Test Version of PlannerPage
// This is for debugging the Leaflet context issue

import React from 'react';
import { useTranslation } from 'react-i18next';

const PlannerPageMinimal: React.FC = () => {
  useTranslation();

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 relative bg-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">🧪 Minimal Test Page</h1>
          <p className="text-neutral-600">
            This page has no MapContainer or React-Leaflet components.
            <br />
            If the Leaflet context error still occurs, the issue is elsewhere.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlannerPageMinimal;
