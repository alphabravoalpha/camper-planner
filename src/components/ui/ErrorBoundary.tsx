// Error Boundary and Error Handling Components
// Phase 6.3: Enhanced error messages and user guidance

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<{ error?: Error; reset: () => void }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}

// Main Error Boundary Component
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo);

    // Log error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys } = this.props;
    const { hasError } = this.state;

    // Check if resetKeys have changed
    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys?.some((key, index) => key !== prevProps.resetKeys?.[index])) {
        this.resetErrorBoundary();
      }
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId);
    }

    this.resetTimeoutId = window.setTimeout(() => {
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
      });
    }, 0);
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback: Fallback } = this.props;

    if (hasError) {
      if (Fallback) {
        return <Fallback error={error} reset={this.resetErrorBoundary} />;
      }

      return <DefaultErrorFallback error={error} reset={this.resetErrorBoundary} />;
    }

    return children;
  }
}

// Default error fallback component
const DefaultErrorFallback: React.FC<{
  error?: Error;
  reset: () => void;
}> = ({ error, reset }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white border border-red-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-shrink-0">
              <span className="text-2xl">❌</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Something went wrong</h3>
              <p className="text-sm text-gray-600">An unexpected error occurred</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-800 font-mono">{error.message}</p>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={reset}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Error Alert Component
export const ErrorAlert: React.FC<{
  title?: string;
  message: string;
  details?: string;
  onDismiss?: () => void;
  onRetry?: () => void;
  className?: string;
}> = ({ title = 'Error', message, details, onDismiss, onRetry, className }) => {
  return (
    <div className={cn('bg-red-50 border border-red-200 rounded-lg p-4', className)}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <span className="text-lg">⚠️</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-red-800">{title}</h4>
          <p className="text-sm text-red-700 mt-1">{message}</p>
          {details && (
            <details className="mt-2">
              <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800">
                Show details
              </summary>
              <p className="text-xs text-red-600 mt-1 font-mono bg-red-100 p-2 rounded">
                {details}
              </p>
            </details>
          )}
        </div>
        <div className="flex-shrink-0 flex space-x-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200 transition-colors"
            >
              Retry
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Warning Alert Component
export const WarningAlert: React.FC<{
  title?: string;
  message: string;
  onDismiss?: () => void;
  className?: string;
}> = ({ title = 'Warning', message, onDismiss, className }) => {
  return (
    <div className={cn('bg-yellow-50 border border-yellow-200 rounded-lg p-4', className)}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <span className="text-lg">⚠️</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-yellow-800">{title}</h4>
          <p className="text-sm text-yellow-700 mt-1">{message}</p>
        </div>
        {onDismiss && (
          <div className="flex-shrink-0">
            <button
              onClick={onDismiss}
              className="text-yellow-400 hover:text-yellow-600 transition-colors"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Success Alert Component
export const SuccessAlert: React.FC<{
  title?: string;
  message: string;
  onDismiss?: () => void;
  className?: string;
}> = ({ title = 'Success', message, onDismiss, className }) => {
  return (
    <div className={cn('bg-green-50 border border-green-200 rounded-lg p-4', className)}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <span className="text-lg">✅</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-green-800">{title}</h4>
          <p className="text-sm text-green-700 mt-1">{message}</p>
        </div>
        {onDismiss && (
          <div className="flex-shrink-0">
            <button
              onClick={onDismiss}
              className="text-green-400 hover:text-green-600 transition-colors"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Info Alert Component
export const InfoAlert: React.FC<{
  title?: string;
  message: string;
  onDismiss?: () => void;
  className?: string;
}> = ({ title = 'Info', message, onDismiss, className }) => {
  return (
    <div className={cn('bg-blue-50 border border-blue-200 rounded-lg p-4', className)}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <span className="text-lg">ℹ️</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-blue-800">{title}</h4>
          <p className="text-sm text-blue-700 mt-1">{message}</p>
        </div>
        {onDismiss && (
          <div className="flex-shrink-0">
            <button
              onClick={onDismiss}
              className="text-blue-400 hover:text-blue-600 transition-colors"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Empty State Component
export const EmptyState: React.FC<{
  icon?: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}> = ({ icon = '📭', title, description, action, className }) => {
  return (
    <div className={cn('text-center py-12', className)}>
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-sm mx-auto">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

// Form field error component
export const FieldError: React.FC<{
  error?: string;
  className?: string;
}> = ({ error, className }) => {
  if (!error) return null;

  return (
    <p className={cn('text-sm text-red-600 mt-1', className)}>
      {error}
    </p>
  );
};

// Help text component
export const HelpText: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <p className={cn('text-sm text-gray-500 mt-1', className)}>
      {children}
    </p>
  );
};