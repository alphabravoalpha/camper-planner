// Loading Spinner Component
// Phase 6.3: Professional loading states for all operations

import React from 'react';
import { cn } from '../../utils/cn';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'white' | 'gray';
  className?: string;
  label?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className,
  label,
  fullScreen = false
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const variantClasses = {
    primary: 'border-neutral-300 border-t-primary-600',
    white: 'border-neutral-400 border-t-white',
    gray: 'border-neutral-200 border-t-neutral-600'
  };

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  const spinner = (
    <div className={cn(
      'animate-spin rounded-full border-2',
      sizeClasses[size],
      variantClasses[variant],
      className
    )} />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        <div className="flex flex-col items-center space-y-4">
          <div className={cn(
            'animate-spin rounded-full border-2',
            'w-12 h-12',
            variantClasses[variant]
          )} />
          {label && (
            <div className="text-center">
              <p className="text-lg font-medium text-neutral-900">{label}</p>
              <p className="text-sm text-neutral-600">Please wait...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (label) {
    return (
      <div className="flex items-center space-x-3">
        {spinner}
        <span className={cn('text-neutral-600', textSizeClasses[size])}>
          {label}
        </span>
      </div>
    );
  }

  return spinner;
};

// Loading skeleton components
export const LoadingSkeleton: React.FC<{
  className?: string;
  lines?: number;
  variant?: 'text' | 'card' | 'avatar' | 'button';
}> = ({ className, lines = 3, variant = 'text' }) => {
  const __skeletonLine = (
    <div className="animate-pulse bg-neutral-200 rounded h-4 w-full" />
  );

  if (variant === 'card') {
    return (
      <div className={cn('animate-pulse space-y-4 p-6 bg-white border border-neutral-200 rounded-lg', className)}>
        <div className="h-4 bg-neutral-200 rounded w-3/4" />
        <div className="space-y-2">
          <div className="h-4 bg-neutral-200 rounded" />
          <div className="h-4 bg-neutral-200 rounded w-5/6" />
        </div>
        <div className="h-8 bg-neutral-200 rounded w-24" />
      </div>
    );
  }

  if (variant === 'avatar') {
    return (
      <div className="animate-pulse flex items-center space-x-4">
        <div className="rounded-full bg-neutral-200 h-12 w-12" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-neutral-200 rounded w-3/4" />
          <div className="h-4 bg-neutral-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (variant === 'button') {
    return (
      <div className={cn('animate-pulse bg-neutral-200 rounded h-10 w-24', className)} />
    );
  }

  return (
    <div className={cn('animate-pulse space-y-2', className)}>
      {Array.from({ length: lines }, (_, index) => (
        <div key={index} className="h-4 bg-neutral-200 rounded w-full" />
      ))}
    </div>
  );
};

// Loading overlay for specific components
export const LoadingOverlay: React.FC<{
  children: React.ReactNode;
  loading: boolean;
  label?: string;
  className?: string;
}> = ({ children, loading, label, className }) => {
  return (
    <div className={cn('relative', className)}>
      {children}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <LoadingSpinner size="lg" label={label} />
        </div>
      )}
    </div>
  );
};

// Inline loading indicator
export const InlineLoading: React.FC<{
  text?: string;
  size?: 'sm' | 'md';
}> = ({ text = 'Loading...', size = 'sm' }) => {
  return (
    <div className="flex items-center justify-center py-4">
      <LoadingSpinner size={size} label={text} />
    </div>
  );
};

export default LoadingSpinner;