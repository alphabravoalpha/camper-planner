// Vehicle Profile Sidebar Component
// Phase 3.1: Sidebar implementation for vehicle configuration

import React, { useState } from 'react';
import { useVehicleStore } from '../../store';
import { FeatureFlags } from '../../config';
import { cn } from '../../utils/cn';
import VehicleProfilePanel from './VehicleProfilePanel';
import Tooltip from '../ui/Tooltip';

interface VehicleProfileSidebarProps {
  className?: string;
}

const VehicleProfileSidebar: React.FC<VehicleProfileSidebarProps> = ({ className }) => {
  const { profile } = useVehicleStore();
  const [isOpen, setIsOpen] = useState(false);

  // Feature flag check
  if (!FeatureFlags.VEHICLE_PROFILES) {
    return null;
  }

  // Get vehicle summary for display
  const getVehicleSummary = () => {
    if (!profile) return null;

    return {
      type: profile.name || getVehicleType(profile),
      dimensions: `${profile.height}×${profile.width}×${profile.length}m`,
      weight: `${profile.weight}t`
    };
  };

  // Determine vehicle type based on dimensions
  const getVehicleType = (vehicleProfile: typeof profile) => {
    if (!vehicleProfile) return 'Unknown';

    const { length, height, weight } = vehicleProfile;

    if (length <= 6 && height <= 2.5 && weight <= 3.5) {
      return 'Compact Camper';
    } else if (length <= 8 && height <= 3.2 && weight <= 7.5) {
      return 'Medium Motorhome';
    } else if (length > 10) {
      return 'Car + Caravan';
    } else {
      return 'Large Motorhome';
    }
  };

  const summary = getVehicleSummary();

  return (
    <>
      {/* Toggle Button */}
      <div className={cn('fixed top-4 left-4 z-40', className)}>
        <Tooltip
          content={profile ? 'Edit vehicle profile' : 'Set up your vehicle profile'}
          position="right"
          size="sm"
        >
          <button
            onClick={() => setIsOpen(true)}
            className={cn(
              'bg-white rounded-lg shadow-md border border-gray-200 p-3 transition-all duration-200',
              'hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500',
              profile ? 'text-green-700 border-green-200 bg-green-50' : 'text-blue-700 border-blue-200 bg-blue-50'
            )}
            aria-label="Vehicle profile"
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">🚐</span>
              <div className="text-left">
                {profile ? (
                  <>
                    <div className="text-xs font-medium">{summary?.type}</div>
                    <div className="text-xs text-gray-600">{summary?.dimensions}</div>
                  </>
                ) : (
                  <div className="text-xs font-medium">Setup Vehicle</div>
                )}
              </div>
            </div>
          </button>
        </Tooltip>
      </div>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Background overlay */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Sidebar */}
          <div className="absolute left-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform">
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Vehicle Configuration</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <VehicleProfilePanel
                  onClose={() => setIsOpen(false)}
                  compact={true}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VehicleProfileSidebar;