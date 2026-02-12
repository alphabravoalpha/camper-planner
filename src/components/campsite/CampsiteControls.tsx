// Campsite Controls Component
// Phase 4.2: Enhanced filtering, display controls, and search for campsite data

import React, { useState } from 'react';
import { Tent, Truck, ParkingCircle } from 'lucide-react';
import { FeatureFlags } from '../../config';
import { type CampsiteType, type Campsite } from '../../services/CampsiteService';
import { cn } from '../../utils/cn';

interface CampsiteControlsProps {
  className?: string;
  visibleTypes: CampsiteType[];
  onTypesChange: (types: CampsiteType[]) => void;
  maxResults: number;
  onMaxResultsChange: (max: number) => void;
  vehicleCompatibleOnly: boolean;
  onVehicleCompatibleChange: (compatible: boolean) => void;
  isVisible?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  campsiteCount?: number;
}

const CAMPSITE_TYPES: { type: CampsiteType; label: string; icon: React.FC<{ className?: string }>; description: string }[] = [
  {
    type: 'campsite',
    label: 'Campsites',
    icon: Tent,
    description: 'Traditional camping with tents/caravans'
  },
  {
    type: 'caravan_site',
    label: 'Caravan Sites',
    icon: Truck,
    description: 'Sites specifically for caravans/motorhomes'
  },
  {
    type: 'aire',
    label: 'Aires de Service',
    icon: ParkingCircle,
    description: 'Motorhome service areas with facilities'
  }
];

const MAX_RESULTS_OPTIONS = [25, 50, 100, 200, 500];

const CampsiteControls: React.FC<CampsiteControlsProps> = ({
  className,
  visibleTypes,
  onTypesChange,
  maxResults,
  onMaxResultsChange,
  vehicleCompatibleOnly,
  onVehicleCompatibleChange,
  isVisible = true,
  onVisibilityChange,
  onRefresh,
  isLoading = false,
  campsiteCount = 0
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleTypeToggle = (type: CampsiteType) => {
    if (visibleTypes.includes(type)) {
      onTypesChange(visibleTypes.filter(t => t !== type));
    } else {
      onTypesChange([...visibleTypes, type]);
    }
  };

  const toggleAll = () => {
    if (visibleTypes.length === CAMPSITE_TYPES.length) {
      onTypesChange([]);
    } else {
      onTypesChange(CAMPSITE_TYPES.map(ct => ct.type));
    }
  };

  // Don't render if feature disabled
  if (!FeatureFlags.CAMPSITE_DISPLAY) return null;

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-neutral-200', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-neutral-200">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onVisibilityChange?.(!isVisible)}
            className={cn(
              'flex items-center space-x-2 px-2 py-1 rounded text-sm font-medium transition-colors',
              isVisible
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            )}
          >
            <Tent className="w-4 h-4" />
            <span>Campsites</span>
            {isVisible && campsiteCount > 0 && (
              <span className="bg-green-200 text-green-800 px-1.5 py-0.5 rounded-full text-xs font-medium">
                {campsiteCount}
              </span>
            )}
          </button>
          <span className="text-xs text-neutral-500">
            ({visibleTypes.length}/{CAMPSITE_TYPES.length} types)
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Refresh button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className={cn(
                'p-1.5 rounded text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors',
                isLoading && 'cursor-not-allowed opacity-50'
              )}
              title="Refresh campsite data"
            >
              <svg
                className={cn('w-4 h-4', isLoading && 'animate-spin')}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          )}

          {/* Expand/collapse button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <svg
              className={cn('w-4 h-4 transform transition-transform', isExpanded && 'rotate-180')}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search bar removed - using unified search at top of map instead */}

      {/* Compact view */}
      {!isExpanded && (
        <div className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {CAMPSITE_TYPES.map(({ type, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => handleTypeToggle(type)}
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all',
                    visibleTypes.includes(type)
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-neutral-300 bg-neutral-50 text-neutral-400 hover:border-neutral-400'
                  )}
                  title={CAMPSITE_TYPES.find(ct => ct.type === type)?.label}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>

            <div className="text-xs text-neutral-500">
              Max: {maxResults} • {vehicleCompatibleOnly ? 'Compatible only' : 'All sites'}
            </div>
          </div>
        </div>
      )}

      {/* Expanded view */}
      {isExpanded && (
        <div className="p-3 space-y-4">
          {/* Campsite type filters */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-neutral-700">Campsite Types</label>
              <button
                onClick={toggleAll}
                className="text-xs text-primary-600 hover:text-primary-800 font-medium"
              >
                {visibleTypes.length === CAMPSITE_TYPES.length ? 'None' : 'All'}
              </button>
            </div>

            <div className="space-y-2">
              {CAMPSITE_TYPES.map(({ type, label, icon: Icon, description }) => (
                <label key={type} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleTypes.includes(type)}
                    onChange={() => handleTypeToggle(type)}
                    className="mt-1 h-4 w-4 text-green-600 rounded border-neutral-300 focus:ring-green-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium text-neutral-900">{label}</span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Vehicle compatibility filter */}
          <div>
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={vehicleCompatibleOnly}
                onChange={(e) => onVehicleCompatibleChange(e.target.checked)}
                className="mt-1 h-4 w-4 text-green-600 rounded border-neutral-300 focus:ring-green-500"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-neutral-900">Vehicle Compatible Only</div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Show only campsites that can accommodate your vehicle dimensions
                </p>
              </div>
            </label>
          </div>

          {/* Max results */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-2">
              Maximum Results: {maxResults}
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min={25}
                max={500}
                step={25}
                value={maxResults}
                onChange={(e) => onMaxResultsChange(parseInt(e.target.value))}
                className="flex-1 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <select
                value={maxResults}
                onChange={(e) => onMaxResultsChange(parseInt(e.target.value))}
                className="text-xs border border-neutral-300 rounded px-2 py-1 bg-white"
              >
                {MAX_RESULTS_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-between text-xs text-neutral-500 mt-1">
              <span>25</span>
              <span>500</span>
            </div>
          </div>

          {/* Map Legend */}
          <div className="p-3 bg-neutral-50 border border-neutral-200 rounded">
            <div className="text-xs font-medium text-neutral-700 mb-2">Map Legend</div>
            <div className="space-y-2">
              {/* Campsite type legend */}
              <div className="flex items-center space-x-2">
                <div className="w-5 h-6 flex-shrink-0">
                  <svg viewBox="0 0 20 28" className="w-full h-full">
                    <path d="M10 0C4.5 0 0 4.5 0 10c0 7.5 10 18 10 18s10-10.5 10-18C20 4.5 15.5 0 10 0z" fill="#27ae60" stroke="#1a8a4b" strokeWidth="1.5"/>
                  </svg>
                </div>
                <span className="text-xs text-neutral-700">Campsite (tent/caravan)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-5 h-6 flex-shrink-0">
                  <svg viewBox="0 0 20 28" className="w-full h-full">
                    <path d="M10 0C4.5 0 0 4.5 0 10c0 7.5 10 18 10 18s10-10.5 10-18C20 4.5 15.5 0 10 0z" fill="#2794a8" stroke="#1e7a8d" strokeWidth="1.5"/>
                  </svg>
                </div>
                <span className="text-xs text-neutral-700">Caravan/Motorhome site</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-5 h-6 flex-shrink-0">
                  <svg viewBox="0 0 20 28" className="w-full h-full">
                    <path d="M10 0C4.5 0 0 4.5 0 10c0 7.5 10 18 10 18s10-10.5 10-18C20 4.5 15.5 0 10 0z" fill="#7c5cbf" stroke="#6b47b0" strokeWidth="1.5"/>
                  </svg>
                </div>
                <span className="text-xs text-neutral-700">Aire de Service</span>
              </div>

              {/* Status indicators */}
              <div className="pt-2 mt-2 border-t border-neutral-200">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-6 flex-shrink-0">
                    <svg viewBox="0 0 20 28" className="w-full h-full">
                      <path d="M10 0C4.5 0 0 4.5 0 10c0 7.5 10 18 10 18s10-10.5 10-18C20 4.5 15.5 0 10 0z" fill="#e63946" stroke="#d32535" strokeWidth="1.5"/>
                    </svg>
                  </div>
                  <span className="text-xs text-neutral-700">May not fit your vehicle</span>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-green-500 text-white text-[8px] font-bold flex items-center justify-center border-2 border-white shadow">3</div>
                  </div>
                  <span className="text-xs text-neutral-700">Clustered markers (zoom in)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampsiteControls;