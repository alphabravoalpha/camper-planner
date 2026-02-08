// Vehicle Profile Sidebar Component
// Phase 3.1: Sidebar implementation for vehicle configuration

import React, { useState, useEffect } from 'react';
import { useVehicleStore } from '../../store';
import { FeatureFlags } from '../../config';
import { cn } from '../../utils/cn';
import VehicleProfilePanel from './VehicleProfilePanel';
import Tooltip from '../ui/Tooltip';
import { VEHICLE_DATABASE, MOTORHOME_PRESETS } from '../../data/vehicleDatabase';

interface VehicleProfileSidebarProps {
  className?: string;
}

const VehicleProfileSidebar: React.FC<VehicleProfileSidebarProps> = ({ className }) => {
  const { profile, setProfile } = useVehicleStore();
  const [isOpen, setIsOpen] = useState(false);

  // Backfill name for profiles saved before the name field existed
  useEffect(() => {
    if (profile && !profile.name) {
      for (const make of VEHICLE_DATABASE) {
        for (const model of make.models) {
          for (const variant of model.variants) {
            if (
              variant.height === profile.height &&
              variant.width === profile.width &&
              variant.length === profile.length &&
              variant.weight === profile.weight
            ) {
              setProfile({ ...profile, name: `${make.name} ${model.name} ${variant.name}` });
              return;
            }
          }
        }
      }
      for (const preset of MOTORHOME_PRESETS) {
        if (
          preset.height === profile.height &&
          preset.width === profile.width &&
          preset.length === profile.length &&
          preset.weight === profile.weight
        ) {
          setProfile({ ...profile, name: preset.name });
          return;
        }
      }
    }
  }, [profile, setProfile]);

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
      <div className={cn('fixed top-[72px] left-[64px] z-30', className)}>
        <Tooltip
          content={profile ? 'Edit vehicle profile' : 'Set up your vehicle profile'}
          position="right"
          size="sm"
        >
          <button
            onClick={() => setIsOpen(true)}
            className={cn(
              'bg-white rounded-xl shadow-soft p-3 transition-all duration-200',
              'hover:shadow-medium hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500',
              profile ? 'text-green-700 ring-1 ring-green-200 bg-green-50' : 'text-primary-700 ring-1 ring-primary-200 bg-primary-50'
            )}
            aria-label="Vehicle profile"
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">🚐</span>
              <div className="text-left">
                {profile ? (
                  <>
                    <div className="text-xs font-medium">{summary?.type}</div>
                    <div className="text-xs text-neutral-600">{summary?.dimensions}</div>
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
              <div className="flex items-center justify-between p-4 border-b border-neutral-200">
                <h2 className="text-lg font-semibold text-neutral-900">Vehicle Configuration</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-neutral-400 hover:text-neutral-600 p-1 rounded transition-colors"
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