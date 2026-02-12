// Waypoint Sidebar Component
// Shows list of waypoints with management options

import React from 'react';
import { Flag } from 'lucide-react';
import { useRouteStore, useMapStore } from '../../store';
import { type Waypoint } from '../../types';
import { cn } from '../../utils/cn';

interface WaypointListItemProps {
  waypoint: Waypoint;
  index: number;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  isSelected: boolean;
}

const WaypointListItem: React.FC<WaypointListItemProps> = ({
  waypoint,
  index,
  onDelete,
  onSelect,
  isSelected
}) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'start':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'end':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-primary-600 bg-primary-50 border-primary-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'start':
        return <Flag className="w-4 h-4" />;
      case 'end':
        return <Flag className="w-4 h-4" />;
      default:
        return (index + 1).toString();
    }
  };

  return (
    <div
      className={cn(
        'p-3 border rounded-lg cursor-pointer transition-all',
        isSelected ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 hover:border-neutral-300'
      )}
      onClick={() => onSelect(waypoint.id)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className={cn(
              'w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold',
              getTypeColor(waypoint.type)
            )}
          >
            {getTypeIcon(waypoint.type)}
          </div>
          <div className="flex-1">
            <div className="font-medium text-neutral-900 text-sm">
              {waypoint.name}
            </div>
            <div className="text-xs text-neutral-500 font-mono">
              {waypoint.lat.toFixed(4)}, {waypoint.lng.toFixed(4)}
            </div>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(waypoint.id);
          }}
          className="text-red-400 hover:text-red-600 p-1 rounded transition-colors"
          title="Delete waypoint"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const WaypointSidebar: React.FC = () => {
  const { waypoints, removeWaypoint, clearRoute } = useRouteStore();
  const { selectedWaypoint, setSelectedWaypoint } = useMapStore();

  if (waypoints.length === 0) {
    return (
      <div className="p-4 text-center text-neutral-500">
        <div className="mb-2">
          <svg className="w-12 h-12 mx-auto text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <p className="text-sm">No waypoints added yet</p>
        <p className="text-xs text-neutral-400 mt-1">Click on the map to add waypoints</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-neutral-900">
          Waypoints ({waypoints.length})
        </h3>
        <button
          onClick={clearRoute}
          className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50 transition-colors"
        >
          Clear All
        </button>
      </div>

      <div className="space-y-2">
        {waypoints.map((waypoint, index) => (
          <WaypointListItem
            key={waypoint.id}
            waypoint={waypoint}
            index={index}
            onDelete={removeWaypoint}
            onSelect={setSelectedWaypoint}
            isSelected={selectedWaypoint === waypoint.id}
          />
        ))}
      </div>

      {waypoints.length >= 2 && (
        <div className="mt-4 p-3 bg-primary-50 rounded-lg">
          <div className="flex items-center text-primary-800 text-sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Ready for routing (Phase 3)
          </div>
        </div>
      )}
    </div>
  );
};

export default WaypointSidebar;