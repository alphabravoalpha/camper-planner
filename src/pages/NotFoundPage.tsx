// Not Found Page
// 404 error page with helpful navigation

import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';

const NotFoundPage: React.FC = () => {
  const { } = useTranslation();

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          {/* 404 Illustration */}
          <div className="mx-auto w-48 h-48 mb-6">
            <img src="/images/404-lost.png" alt="Lost campervan at a crossroads" className="w-full h-full object-contain" />
          </div>

          {/* Error Message */}
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">404</h1>
          <h2 className="text-xl font-semibold text-neutral-700 mb-4">
            Page Not Found
          </h2>
          <p className="text-neutral-500 mb-8">
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
          <div className="mt-8 text-sm text-neutral-500">
            <p>
              Having trouble? Check our{' '}
              <Link to="/help" className="text-primary-600 hover:text-primary-500 underline">
                help documentation
              </Link>{' '}
              or go back to the{' '}
              <Link to="/" className="text-primary-600 hover:text-primary-500 underline">
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