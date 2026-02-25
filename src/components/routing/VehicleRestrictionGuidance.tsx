// Vehicle Restriction Guidance Component
// Phase 3.3: Comprehensive guidance for vehicle restriction issues

import React from 'react';
import { useRouteStore, useVehicleStore } from '../../store';
import { type RouteRestrictions } from '../../services/RoutingService';
import { cn } from '../../utils/cn';

interface VehicleRestrictionGuidanceProps {
  restrictions: RouteRestrictions;
  className?: string;
}

const VehicleRestrictionGuidance: React.FC<VehicleRestrictionGuidanceProps> = ({
  restrictions,
  className,
}) => {
  const { waypoints } = useRouteStore();
  const { profile } = useVehicleStore();

  if (!restrictions || restrictions.violatedDimensions.length === 0) return null;

  // EU standard limits for reference
  const euLimits = {
    height: 4.0,
    width: 2.55,
    weight: 40,
    length: 18.75,
  };

  const getRestrictionSeverity = () => {
    if (restrictions.cannotAccommodate) return 'critical';
    if (restrictions.violatedDimensions.length >= 2) return 'high';
    return 'medium';
  };

  const getRestrictionAdvice = () => {
    const advice = [];

    if (restrictions.cannotAccommodate) {
      advice.push({
        type: 'critical',
        title: 'Vehicle Cannot Use European Roads',
        description:
          'Your vehicle dimensions exceed EU road limits. Consider reviewing vehicle specifications.',
        actions: [
          'Double-check vehicle measurements',
          'Consider a smaller vehicle for European travel',
          'Contact authorities for special transport permits',
        ],
      });
    } else {
      advice.push({
        type: 'warning',
        title: 'Limited Route Options',
        description: 'Your vehicle may face restrictions on some European roads.',
        actions: [
          'Plan routes using major highways when possible',
          'Avoid city centers and narrow rural roads',
          'Check local restrictions before travel',
          'Consider overnight parking at designated motorhome areas',
        ],
      });
    }

    return advice;
  };

  const getSuggestedDimensions = () => {
    const suggestions = [];

    if (restrictions.violatedDimensions.includes('height')) {
      suggestions.push(`Height: Reduce to ${euLimits.height}m or less`);
    }
    if (restrictions.violatedDimensions.includes('width')) {
      suggestions.push(`Width: Reduce to ${euLimits.width}m or less`);
    }
    if (restrictions.violatedDimensions.includes('weight')) {
      suggestions.push(`Weight: Reduce to ${euLimits.weight}t or less`);
    }
    if (restrictions.violatedDimensions.includes('length')) {
      suggestions.push(`Length: Reduce to ${euLimits.length}m or less`);
    }

    return suggestions;
  };

  const severity = getRestrictionSeverity();
  const advice = getRestrictionAdvice();
  const suggestions = getSuggestedDimensions();

  return (
    <div
      className={cn(
        'p-4 rounded-lg border',
        severity === 'critical' && 'bg-red-50 border-red-200',
        severity === 'high' && 'bg-amber-50 border-amber-200',
        severity === 'medium' && 'bg-yellow-50 border-yellow-200',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start space-x-3 mb-4">
        <div
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
            severity === 'critical' && 'bg-red-100',
            severity === 'high' && 'bg-amber-100',
            severity === 'medium' && 'bg-yellow-100'
          )}
        >
          {severity === 'critical' ? (
            <svg
              className="w-5 h-5 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          )}
        </div>

        <div className="flex-1">
          <h3
            className={cn(
              'text-lg font-semibold',
              severity === 'critical' && 'text-red-900',
              severity === 'high' && 'text-amber-900',
              severity === 'medium' && 'text-yellow-900'
            )}
          >
            Vehicle Restriction Issues
          </h3>
          <p
            className={cn(
              'text-sm mt-1',
              severity === 'critical' && 'text-red-700',
              severity === 'high' && 'text-amber-700',
              severity === 'medium' && 'text-yellow-700'
            )}
          >
            {waypoints.length} waypoints • {restrictions.violatedDimensions.length} dimension
            {restrictions.violatedDimensions.length > 1 ? 's' : ''} exceed EU limits
          </p>
        </div>
      </div>

      {/* Current Vehicle Dimensions */}
      {profile && (
        <div className="mb-4 p-3 bg-white rounded border">
          <h4 className="font-medium text-neutral-900 mb-2">Current Vehicle Dimensions</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div
              className={cn(
                'flex justify-between',
                restrictions.violatedDimensions.includes('height') && 'text-red-600 font-medium'
              )}
            >
              <span>Height:</span>
              <span>
                {profile.height}m {restrictions.violatedDimensions.includes('height') && '⚠️'}
              </span>
            </div>
            <div
              className={cn(
                'flex justify-between',
                restrictions.violatedDimensions.includes('width') && 'text-red-600 font-medium'
              )}
            >
              <span>Width:</span>
              <span>
                {profile.width}m {restrictions.violatedDimensions.includes('width') && '⚠️'}
              </span>
            </div>
            <div
              className={cn(
                'flex justify-between',
                restrictions.violatedDimensions.includes('weight') && 'text-red-600 font-medium'
              )}
            >
              <span>Weight:</span>
              <span>
                {profile.weight}t {restrictions.violatedDimensions.includes('weight') && '⚠️'}
              </span>
            </div>
            <div
              className={cn(
                'flex justify-between',
                restrictions.violatedDimensions.includes('length') && 'text-red-600 font-medium'
              )}
            >
              <span>Length:</span>
              <span>
                {profile.length}m {restrictions.violatedDimensions.includes('length') && '⚠️'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Advice Sections */}
      {advice.map((adviceItem, index) => (
        <div key={index} className="mb-4">
          <h4
            className={cn(
              'font-medium mb-2',
              adviceItem.type === 'critical' && 'text-red-900',
              adviceItem.type === 'warning' && 'text-amber-900'
            )}
          >
            {adviceItem.title}
          </h4>
          <p
            className={cn(
              'text-sm mb-3',
              adviceItem.type === 'critical' && 'text-red-700',
              adviceItem.type === 'warning' && 'text-amber-700'
            )}
          >
            {adviceItem.description}
          </p>
          <ul className="space-y-1">
            {adviceItem.actions.map((action, actionIndex) => (
              <li
                key={actionIndex}
                className={cn(
                  'text-sm flex items-start',
                  adviceItem.type === 'critical' && 'text-red-700',
                  adviceItem.type === 'warning' && 'text-amber-700'
                )}
              >
                <span className="mr-2">•</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {/* Suggested Corrections */}
      {suggestions.length > 0 && (
        <div className="mt-4 p-3 bg-primary-50 border border-primary-200 rounded">
          <h4 className="font-medium text-primary-900 mb-2">💡 Suggested Dimension Adjustments</h4>
          <ul className="space-y-1">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="text-sm text-primary-700 flex items-start">
                <span className="mr-2">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* EU Road Limits Reference */}
      <div className="mt-4 p-3 bg-neutral-50 border border-neutral-200 rounded">
        <h4 className="font-medium text-neutral-900 mb-2">📋 EU Standard Road Limits</h4>
        <div className="grid grid-cols-2 gap-3 text-sm text-neutral-700">
          <div className="flex justify-between">
            <span>Max Height:</span>
            <span>{euLimits.height}m</span>
          </div>
          <div className="flex justify-between">
            <span>Max Width:</span>
            <span>{euLimits.width}m</span>
          </div>
          <div className="flex justify-between">
            <span>Max Weight:</span>
            <span>{euLimits.weight}t</span>
          </div>
          <div className="flex justify-between">
            <span>Max Length:</span>
            <span>{euLimits.length}m</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleRestrictionGuidance;
