// Vehicle Profile Sidebar Component
// Phase 3.1: Sidebar implementation for vehicle configuration

import React, { useEffect } from 'react';
import { useVehicleStore, useUIStore } from '../../store';
import { FeatureFlags } from '../../config';
import VehicleProfilePanel from './VehicleProfilePanel';
import { VEHICLE_DATABASE, MOTORHOME_PRESETS } from '../../data/vehicleDatabase';

interface VehicleProfileSidebarProps {
  className?: string;
}

const VehicleProfileSidebar: React.FC<VehicleProfileSidebarProps> = () => {
  const { profile, setProfile } = useVehicleStore();
  const { vehicleSidebarOpen, closeVehicleSidebar } = useUIStore();

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

  return (
    <>
      {/* Sidebar Overlay — opened via useUIStore.openVehicleSidebar() from Header badge */}
      {vehicleSidebarOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Background overlay */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={closeVehicleSidebar}
          />

          {/* Sidebar */}
          <div className="absolute left-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform">
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-neutral-200">
                <h2 className="text-lg font-semibold text-neutral-900">Vehicle Configuration</h2>
                <button
                  onClick={closeVehicleSidebar}
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
                  onClose={closeVehicleSidebar}
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
