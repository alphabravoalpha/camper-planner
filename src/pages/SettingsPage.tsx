// Settings Page
// User preferences, data management, and application settings

import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Settings, ArrowLeft, Trash2, Download, Database, Shield } from 'lucide-react';
import { useVehicleStore, useRouteStore, useTripStore, useUIStore } from '../store';

const SettingsPage: React.FC = () => {
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const { addNotification } = useUIStore();
  const { profile, clearProfile } = useVehicleStore();
  const { waypoints, clearRoute } = useRouteStore();
  const savedTrips = useTripStore((state) => state.savedTrips);

  // Calculate local storage usage
  const getStorageSize = useCallback(() => {
    let total = 0;
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        total += (localStorage[key].length + key.length) * 2; // UTF-16
      }
    }
    return (total / 1024).toFixed(1);
  }, []);

  // Export all data as JSON
  const handleExportAllData = useCallback(() => {
    const allData: Record<string, unknown> = {};
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        try {
          allData[key] = JSON.parse(localStorage[key]);
        } catch {
          allData[key] = localStorage[key];
        }
      }
    }

    const blob = new Blob([JSON.stringify(allData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `camper-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addNotification({ type: 'success', message: 'All data exported successfully' });
  }, [addNotification]);

  // Clear all data
  const handleClearAllData = useCallback(() => {
    try {
      if (clearProfile) clearProfile();
      if (clearRoute) clearRoute();
      localStorage.clear();
      setShowConfirmClear(false);
      addNotification({ type: 'success', message: 'All data cleared. Reload to reset the app.' });
    } catch {
      addNotification({ type: 'error', message: 'Failed to clear data. Try clearing browser data manually.' });
    }
  }, [clearProfile, clearRoute, addNotification]);

  return (
    <div className="min-h-screen bg-neutral-50 animate-fade-in">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-700 to-primary-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">Settings</h1>
              <p className="text-primary-200 text-sm mt-1">Manage your data, preferences, and privacy</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Data Summary */}
          <div className="bg-white rounded-xl shadow-soft p-6">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-display font-semibold text-neutral-900">Your Data</h2>
            </div>
            <p className="text-sm text-neutral-500 mb-4">
              All your data is stored locally in your browser. Nothing is sent to any server.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-neutral-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-primary-600">{profile ? '✓' : '—'}</div>
                <div className="text-xs text-neutral-500 mt-0.5">Vehicle Profile</div>
              </div>
              <div className="bg-neutral-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-primary-600">{waypoints?.length || 0}</div>
                <div className="text-xs text-neutral-500 mt-0.5">Waypoints</div>
              </div>
              <div className="bg-neutral-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-primary-600">{savedTrips?.length || 0}</div>
                <div className="text-xs text-neutral-500 mt-0.5">Saved Trips</div>
              </div>
              <div className="bg-neutral-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-primary-600">{getStorageSize()}</div>
                <div className="text-xs text-neutral-500 mt-0.5">KB Used</div>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-white rounded-xl shadow-soft p-6">
            <h2 className="text-lg font-display font-semibold text-neutral-900 mb-4">Data Management</h2>
            <div className="space-y-3">
              <button
                onClick={handleExportAllData}
                className="w-full flex items-center gap-3 p-3 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                <Download className="w-5 h-5 text-primary-600" />
                <div className="text-left">
                  <div>Export all data</div>
                  <div className="text-xs text-neutral-400 font-normal">Download a backup of all your trips, vehicle profile, and settings</div>
                </div>
              </button>

              {!showConfirmClear ? (
                <button
                  onClick={() => setShowConfirmClear(true)}
                  className="w-full flex items-center gap-3 p-3 border border-red-200 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-5 h-5 text-red-500" />
                  <div className="text-left">
                    <div>Clear all data</div>
                    <div className="text-xs text-red-400 font-normal">Remove all saved trips, vehicle profile, and preferences</div>
                  </div>
                </button>
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 font-medium mb-3">
                    Are you sure? This will permanently delete all your data. Export a backup first if needed.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleClearAllData}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                      Yes, clear everything
                    </button>
                    <button
                      onClick={() => setShowConfirmClear(false)}
                      className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Privacy Info */}
          <div className="bg-white rounded-xl shadow-soft p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-display font-semibold text-neutral-900">Privacy</h2>
            </div>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 mt-1.5" />
                All data stored locally in your browser — never sent to any server
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 mt-1.5" />
                No user accounts, no tracking cookies, no analytics
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 mt-1.5" />
                Export or delete your data at any time
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 mt-1.5" />
                Affiliate links are clearly labelled and optional
              </li>
            </ul>
            <div className="mt-4 flex gap-3">
              <Link to="/privacy" className="text-sm text-primary-600 underline hover:text-primary-800">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-sm text-primary-600 underline hover:text-primary-800">
                Terms of Use
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
