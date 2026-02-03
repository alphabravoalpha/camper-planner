// Settings Page
// User preferences and application settings

import React from 'react';
import { useTranslation } from 'react-i18next';
import { FeatureFlags } from '@/config';

const SettingsPage: React.FC = () => {
  const { } = useTranslation();

  if (!FeatureFlags.USER_PROFILES) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-500 mb-2">
            Settings Disabled
          </h3>
          <p className="text-sm text-gray-400">
            Enable USER_PROFILES feature flag
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <h1 className="text-2xl font-bold text-gray-900">
          Settings
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Configure your trip planning preferences
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">
              Settings implementation goes here...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;