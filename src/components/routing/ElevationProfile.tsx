// Elevation Profile Component
// Phase 3.4: Display elevation profile along the route

import React, { useMemo } from 'react';
import { type RouteData } from '../../services/RoutingService';
import { cn } from '../../utils/cn';

interface ElevationProfileProps {
  route: RouteData;
  className?: string;
}

interface ElevationPoint {
  distance: number; // meters from start
  elevation: number; // meters above sea level
  index: number; // coordinate index
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const ElevationProfile: React.FC<ElevationProfileProps> = ({ route, className }) => {
  // Extract elevation data from route geometry
  const elevationData = useMemo(() => {
    if (!route.geometry?.coordinates) return null;

    const coordinates = route.geometry.coordinates;
    const elevationPoints: ElevationPoint[] = [];
    let cumulativeDistance = 0;

    coordinates.forEach((coord, index) => {
      // @ts-expect-error - Coordinate array access is safe - coordinates are guaranteed to have at least lat/lng from geometry
      const [lng, lat, elevation] = coord;

      if (elevation !== undefined) {
        // Calculate distance from previous point
        if (index > 0) {
          const prevCoord = coordinates[index - 1];
          const distance = calculateDistance(prevCoord[1], prevCoord[0], lat, lng);
          cumulativeDistance += distance;
        }

        elevationPoints.push({
          distance: cumulativeDistance,
          elevation,
          index,
        });
      }
    });

    return elevationPoints.length > 0 ? elevationPoints : null;
  }, [route.geometry]);

  // Calculate elevation statistics - must be called before early return
  const stats = useMemo(() => {
    if (!elevationData) return null;

    const elevations = elevationData.map(p => p.elevation);
    const minElevation = Math.min(...elevations);
    const maxElevation = Math.max(...elevations);
    const totalDistance = elevationData[elevationData.length - 1].distance;

    // Calculate elevation gain/loss
    let totalGain = 0;
    let totalLoss = 0;

    for (let i = 1; i < elevationData.length; i++) {
      const diff = elevationData[i].elevation - elevationData[i - 1].elevation;
      if (diff > 0) totalGain += diff;
      else totalLoss += Math.abs(diff);
    }

    return {
      minElevation: Math.round(minElevation),
      maxElevation: Math.round(maxElevation),
      totalGain: Math.round(totalGain),
      totalLoss: Math.round(totalLoss),
      totalDistance: Math.round((totalDistance / 1000) * 10) / 10, // km
    };
  }, [elevationData]);

  if (!elevationData || !stats) {
    return (
      <div className={cn('bg-white rounded-lg border border-neutral-200 p-6', className)}>
        <div className="text-center text-neutral-500">
          <svg
            className="w-12 h-12 mx-auto mb-3 text-neutral-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
          <h3 className="text-lg font-medium text-neutral-900 mb-1">No Elevation Data</h3>
          <p>Elevation profile not available for this route</p>
          <p className="text-sm mt-1">Enable elevation in route options to see the profile</p>
        </div>
      </div>
    );
  }

  // SVG dimensions
  const SVG_WIDTH = 600;
  const SVG_HEIGHT = 200;
  const MARGIN = { top: 20, right: 20, bottom: 40, left: 60 };
  const CHART_WIDTH = SVG_WIDTH - MARGIN.left - MARGIN.right;
  const CHART_HEIGHT = SVG_HEIGHT - MARGIN.top - MARGIN.bottom;

  // Scale functions
  const xScale = (distance: number) => (distance / stats.totalDistance / 1000) * CHART_WIDTH;

  const yScale = (elevation: number) =>
    CHART_HEIGHT -
    ((elevation - stats.minElevation) / (stats.maxElevation - stats.minElevation)) * CHART_HEIGHT;

  // Generate SVG path
  const pathData = elevationData
    .map((point, index) => {
      const x = xScale(point.distance);
      const y = yScale(point.elevation);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Generate area path (for gradient fill)
  const areaData =
    pathData +
    ` L ${xScale(elevationData[elevationData.length - 1].distance)} ${CHART_HEIGHT} L 0 ${CHART_HEIGHT} Z`;

  return (
    <div className={cn('bg-white rounded-lg border border-neutral-200', className)}>
      <div className="p-4 border-b border-neutral-200">
        <h3 className="text-lg font-semibold text-neutral-900">Elevation Profile</h3>
        <p className="text-sm text-neutral-600 mt-1">{stats.totalDistance} km route</p>
      </div>

      <div className="p-4">
        {/* Elevation Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-900">{stats.maxElevation}m</div>
            <div className="text-sm text-blue-700">Highest</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-900">{stats.minElevation}m</div>
            <div className="text-sm text-green-700">Lowest</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-lg font-bold text-orange-900">+{stats.totalGain}m</div>
            <div className="text-sm text-orange-700">Total Gain</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-lg font-bold text-red-900">-{stats.totalLoss}m</div>
            <div className="text-sm text-red-700">Total Loss</div>
          </div>
        </div>

        {/* Elevation Chart */}
        <div className="bg-neutral-50 rounded-lg p-4 overflow-x-auto">
          <svg
            width={SVG_WIDTH}
            height={SVG_HEIGHT}
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            className="w-full h-auto min-w-96"
          >
            {/* Gradient definition */}
            <defs>
              <linearGradient id="elevationGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2794a8" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#2794a8" stopOpacity={0.1} />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            <g stroke="#e2e5e9" strokeWidth="1">
              {/* Horizontal grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                const y = MARGIN.top + ratio * CHART_HEIGHT;
                const elevation =
                  stats.maxElevation - ratio * (stats.maxElevation - stats.minElevation);
                return (
                  <g key={ratio}>
                    <line x1={MARGIN.left} y1={y} x2={MARGIN.left + CHART_WIDTH} y2={y} />
                    <text
                      x={MARGIN.left - 10}
                      y={y + 4}
                      textAnchor="end"
                      fontSize="12"
                      fill="#6b7785"
                    >
                      {Math.round(elevation)}m
                    </text>
                  </g>
                );
              })}

              {/* Vertical grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                const x = MARGIN.left + ratio * CHART_WIDTH;
                const distance = ratio * stats.totalDistance;
                return (
                  <g key={ratio}>
                    <line x1={x} y1={MARGIN.top} x2={x} y2={MARGIN.top + CHART_HEIGHT} />
                    <text
                      x={x}
                      y={MARGIN.top + CHART_HEIGHT + 20}
                      textAnchor="middle"
                      fontSize="12"
                      fill="#6b7785"
                    >
                      {distance.toFixed(1)}km
                    </text>
                  </g>
                );
              })}
            </g>

            {/* Area fill */}
            <path
              d={areaData}
              fill="url(#elevationGradient)"
              transform={`translate(${MARGIN.left}, ${MARGIN.top})`}
            />

            {/* Elevation line */}
            <path
              d={pathData}
              fill="none"
              stroke="#2794a8"
              strokeWidth="2"
              transform={`translate(${MARGIN.left}, ${MARGIN.top})`}
            />

            {/* Axis labels */}
            <text
              x={MARGIN.left + CHART_WIDTH / 2}
              y={SVG_HEIGHT - 10}
              textAnchor="middle"
              fontSize="14"
              fill="#374151"
              fontWeight="500"
            >
              Distance (km)
            </text>
            <text
              x={20}
              y={MARGIN.top + CHART_HEIGHT / 2}
              textAnchor="middle"
              fontSize="14"
              fill="#374151"
              fontWeight="500"
              transform={`rotate(-90, 20, ${MARGIN.top + CHART_HEIGHT / 2})`}
            >
              Elevation (m)
            </text>
          </svg>
        </div>

        {/* Elevation Insights */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">⛰️ Elevation Insights</h4>
          <div className="text-sm text-yellow-800 space-y-1">
            {stats.totalGain > 500 && (
              <div>• Significant climbing ahead - expect reduced fuel efficiency</div>
            )}
            {stats.totalLoss > 500 && (
              <div>• Long descents - use engine braking and check brakes beforehand</div>
            )}
            {stats.maxElevation - stats.minElevation > 1000 && (
              <div>• Large elevation changes - check weather conditions at altitude</div>
            )}
            {stats.maxElevation > 1500 && (
              <div>• High altitude sections - consider altitude effects on engine performance</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElevationProfile;
