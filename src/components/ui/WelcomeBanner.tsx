// Welcome Banner Component
// Shows helpful hints for new users

import React, { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';

interface WelcomeBannerProps {
  onStartTutorial?: () => void;
  className?: string;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({
  onStartTutorial,
  className
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the banner
    const dismissed = localStorage.getItem('welcome-banner-dismissed');
    if (!dismissed) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    try {
      localStorage.setItem('welcome-banner-dismissed', 'true');
    } catch (error) {
      console.error('Error saving banner dismiss state:', error);
    }
  };

  if (isDismissed || !isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed top-20 left-1/2 transform -translate-x-1/2 z-40 max-w-2xl w-full mx-4',
        'animate-slideDown',
        className
      )}
    >
      <div className="bg-gradient-to-r from-primary-50 to-primary-50 border border-primary-200 rounded-lg shadow-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 text-2xl">
            👋
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-primary-900 mb-1">
              Welcome to European Camper Trip Planner!
            </h3>
            <p className="text-sm text-primary-800 mb-3">
              Get started by clicking on the map to add waypoints, or take a quick tutorial to learn all the features.
            </p>
            <div className="flex flex-wrap gap-2">
              {onStartTutorial && (
                <button
                  onClick={onStartTutorial}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Start Tutorial
                </button>
              )}
              <button
                onClick={handleDismiss}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-primary-700 bg-white border border-primary-300 rounded-md hover:bg-primary-50 transition-colors"
              >
                Got it, thanks!
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-primary-400 hover:text-primary-600 transition-colors"
            aria-label="Dismiss banner"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// Add CSS animation to index.css or tailwind.config.js
// @keyframes slideDown {
//   from {
//     transform: translate(-50%, -20px);
//     opacity: 0;
//   }
//   to {
//     transform: translate(-50%, 0);
//     opacity: 1;
//   }
// }
