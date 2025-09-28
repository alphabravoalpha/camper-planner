// Campsite Controls Component
// Phase 4.2: Enhanced filtering, display controls, and search for campsite data

import React, { useState } from 'react';
import { FeatureFlags } from '../../config';
import { CampsiteType, Campsite } from '../../services/CampsiteService';
import { cn } from '../../utils/cn';
import CampsiteSearch from './CampsiteSearch';

interface CampsiteControlsProps {
  className?: string;
  visibleTypes: CampsiteType[];
  onTypesChange: (types: CampsiteType[]) => void;
  maxResults: number;
  onMaxResultsChange: (max: number) => void;
  vehicleCompatibleOnly: boolean;
  onVehicleCompatibleChange: (compatible: boolean) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onCampsiteSelect?: (campsite: Campsite) => void;
  isVisible?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  campsiteCount?: number;
}

const CAMPSITE_TYPES: { type: CampsiteType; label: string; icon: string; description: string }[] = [
  {
    type: 'campsite',
    label: 'Campsites',
    icon: '⛺',
    description: 'Traditional camping with tents/caravans'
  },
  {
    type: 'caravan_site',
    label: 'Caravan Sites',
    icon: '🚐',
    description: 'Sites specifically for caravans/motorhomes'
  },
  {
    type: 'aire',
    label: 'Aires de Service',
    icon: '🅿️',
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
  searchQuery = '',
  onSearchChange,
  onCampsiteSelect,
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
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onVisibilityChange?.(!isVisible)}
            className={cn(
              'flex items-center space-x-2 px-2 py-1 rounded text-sm font-medium transition-colors',
              isVisible
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            <div className="text-base">🏕️</div>
            <span>Campsites</span>
            {isVisible && campsiteCount > 0 && (
              <span className="bg-green-200 text-green-800 px-1.5 py-0.5 rounded-full text-xs font-medium">
                {campsiteCount}
              </span>
            )}
          </button>
          <span className="text-xs text-gray-500">
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
                'p-1.5 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors',
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
            className="p-1.5 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
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

      {/* Search bar */}
      {isVisible && (
        <div className="p-3 border-b border-gray-200">
          <CampsiteSearch
            visibleTypes={visibleTypes}
            onSearchChange={onSearchChange}
            onCampsiteSelect={onCampsiteSelect}
            maxResults={50}
            placeholder="Search campsites..."
          />
        </div>
      )}

      {/* Compact view */}
      {!isExpanded && (
        <div className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {CAMPSITE_TYPES.map(({ type, icon }) => (
                <button
                  key={type}
                  onClick={() => handleTypeToggle(type)}
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all',
                    visibleTypes.includes(type)
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 bg-gray-50 text-gray-400 hover:border-gray-400'
                  )}
                  title={CAMPSITE_TYPES.find(ct => ct.type === type)?.label}
                >
                  <span className="text-sm">{icon}</span>
                </button>
              ))}
            </div>

            <div className="text-xs text-gray-500">
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
              <label className="text-xs font-medium text-gray-700">Campsite Types</label>
              <button
                onClick={toggleAll}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                {visibleTypes.length === CAMPSITE_TYPES.length ? 'None' : 'All'}
              </button>
            </div>

            <div className="space-y-2">
              {CAMPSITE_TYPES.map(({ type, label, icon, description }) => (
                <label key={type} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleTypes.includes(type)}
                    onChange={() => handleTypeToggle(type)}
                    className="mt-1 h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{icon}</span>
                      <span className="text-sm font-medium text-gray-900">{label}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{description}</p>
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
                className="mt-1 h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Vehicle Compatible Only</div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Show only campsites that can accommodate your vehicle dimensions
                </p>
              </div>
            </label>
          </div>

          {/* Max results */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
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
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <select
                value={maxResults}
                onChange={(e) => onMaxResultsChange(parseInt(e.target.value))}
                className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
              >
                {MAX_RESULTS_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>25</span>
              <span>500</span>
            </div>
          </div>

          {/* Help text */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs">
            <div className="flex items-start space-x-2">
              <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-blue-800">
                <div className="font-medium mb-1">Campsite Display Tips:</div>
                <ul className="space-y-0.5 text-blue-700">
                  <li>• Green markers: Vehicle compatible</li>
                  <li>• Red markers: Check size restrictions</li>
                  <li>• Click markers for details</li>
                  <li>• Data auto-loads around your route</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampsiteControls;