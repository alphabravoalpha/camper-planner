// Skeleton Loader Component
// Phase 6 Week 2: Loading states for better perceived performance

import React from 'react';
import { cn } from '../../utils/cn';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}) => {
  const baseClass = cn(
    'bg-neutral-200',
    animation === 'pulse' && 'animate-pulse',
    animation === 'wave' && 'animate-shimmer',
    variant === 'text' && 'h-4 rounded',
    variant === 'circular' && 'rounded-full',
    variant === 'rectangular' && 'rounded',
    className
  );

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return <div className={baseClass} style={style} />;
};

// Campsite Card Skeleton
export const CampsiteCardSkeleton: React.FC = () => (
  <div className="rounded-xl shadow-soft p-4 space-y-3 bg-white">
    <div className="flex items-start space-x-3">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="70%" height={16} />
        <Skeleton variant="text" width="50%" height={14} />
      </div>
    </div>
    <div className="space-y-2">
      <Skeleton variant="text" width="100%" height={12} />
      <Skeleton variant="text" width="80%" height={12} />
    </div>
    <div className="flex space-x-2">
      <Skeleton variant="rectangular" width={60} height={24} className="rounded-full" />
      <Skeleton variant="rectangular" width={60} height={24} className="rounded-full" />
      <Skeleton variant="rectangular" width={60} height={24} className="rounded-full" />
    </div>
  </div>
);

// Route Info Skeleton
export const RouteInfoSkeleton: React.FC = () => (
  <div className="p-4 space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton variant="text" width={120} height={20} />
      <Skeleton variant="circular" width={32} height={32} />
    </div>
    <div className="space-y-3">
      <div className="flex items-center space-x-3">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" height={16} />
          <Skeleton variant="text" width="40%" height={14} />
        </div>
      </div>
      <Skeleton variant="rectangular" width="100%" height={80} />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton variant="rectangular" height={60} />
        <Skeleton variant="rectangular" height={60} />
      </div>
    </div>
  </div>
);

// Waypoint List Skeleton
export const WaypointListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-2">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center space-x-3 p-3 rounded-xl shadow-soft bg-white">
        <Skeleton variant="circular" width={36} height={36} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="70%" height={14} />
          <Skeleton variant="text" width="50%" height={12} />
        </div>
        <Skeleton variant="circular" width={24} height={24} />
      </div>
    ))}
  </div>
);

// Map Loading Skeleton
export const MapLoadingSkeleton: React.FC = () => (
  <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="relative w-24 h-24 mx-auto">
        <Skeleton variant="circular" width={96} height={96} animation="wave" />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="w-12 h-12 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 01.553-.894L9 2l6 3 6-3v15l-6 3-6-3z"
            />
          </svg>
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton variant="text" width={200} height={16} className="mx-auto" />
        <Skeleton variant="text" width={160} height={14} className="mx-auto" />
      </div>
    </div>
  </div>
);

// Panel Loading Skeleton
export const PanelSkeleton: React.FC<{ lines?: number }> = ({ lines = 5 }) => (
  <div className="p-4 space-y-3">
    <Skeleton variant="text" width="60%" height={20} />
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} variant="text" width={`${100 - i * 10}%`} height={14} />
    ))}
  </div>
);

export default Skeleton;
