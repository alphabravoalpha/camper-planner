// Not Found Page
// 404 error page with helpful navigation

import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';

const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          {/* 404 Illustration */}
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 20a7.962 7.962 0 01-5-1.709m10-11.582A7.962 7.962 0 0012 4a7.962 7.962 0 00-5 1.709m0 11.582V16.29"
              />
            </svg>
          </div>

          {/* Error Message */}
          <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-500 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>

          {/* Navigation Options */}
          <div className="space-y-4">
            <Link to="/" className="block">
              <Button variant="primary" className="w-full">
                Go to Trip Planner
              </Button>
            </Link>

            <div className="flex space-x-3">
              <Link to="/about" className="flex-1">
                <Button variant="outline" className="w-full">
                  About
                </Button>
              </Link>
              <Link to="/help" className="flex-1">
                <Button variant="outline" className="w-full">
                  Help
                </Button>
              </Link>
            </div>
          </div>

          {/* Additional Help */}
          <div className="mt-8 text-sm text-gray-500">
            <p>
              Having trouble? Check our{' '}
              <Link to="/help" className="text-blue-600 hover:text-blue-500 underline">
                help documentation
              </Link>{' '}
              or go back to the{' '}
              <Link to="/" className="text-blue-600 hover:text-blue-500 underline">
                trip planner
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;