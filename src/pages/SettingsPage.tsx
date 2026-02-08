// Settings Page
// User preferences and application settings

import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, ArrowLeft } from 'lucide-react';

const SettingsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-50 animate-fade-in">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Settings className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-3">
            Settings
          </h1>
          <p className="text-neutral-500 mb-8 leading-relaxed max-w-md mx-auto">
            Settings are coming in a future update. For now, your preferences
            are saved automatically in your browser.
          </p>
          <div className="bg-white rounded-2xl shadow-soft p-6 mb-6 text-left max-w-md mx-auto">
            <h3 className="font-semibold text-neutral-900 mb-3">
              Currently saved locally:
            </h3>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" />
                Vehicle profile &amp; dimensions
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" />
                Saved trips &amp; routes
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" />
                Map preferences &amp; waypoints
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" />
                Search history
              </li>
            </ul>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all duration-200 shadow-sm hover:shadow-medium active:scale-[0.97]"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Planner
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
