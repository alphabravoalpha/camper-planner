// Help Page
// User documentation and getting started guide

import React from 'react';
import { useTranslation } from 'react-i18next';

const HelpPage: React.FC = () => {
  const { t: _t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Help & Getting Started
        </h1>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              🚀 Quick Start Guide
            </h2>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">
                  Phase 1 Complete - Foundation Ready!
                </h3>
                <p className="text-blue-800 text-sm">
                  The application foundation is now set up with all core infrastructure.
                  Interactive mapping and trip planning features will be added in subsequent phases.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              📋 What's Currently Available
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Core Infrastructure
                </h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• React + TypeScript foundation</li>
                  <li>• Tailwind CSS styling system</li>
                  <li>• State management (Zustand)</li>
                  <li>• Internationalization framework</li>
                  <li>• Local storage utilities</li>
                </ul>
              </div>

              <div className="border border-yellow-200 rounded-lg p-4">
                <h3 className="font-medium text-yellow-900 mb-2 flex items-center">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                  Coming Next (Phase 2)
                </h3>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Interactive European map</li>
                  <li>• Click to add waypoints</li>
                  <li>• Drag to reorder route</li>
                  <li>• Mobile-responsive interface</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              🛠️ Feature Development Roadmap
            </h2>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Phase 1: Foundation ✅</h4>
                  <p className="text-sm text-gray-600">
                    React app setup, core dependencies, routing, state management
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Phase 2: Interactive Mapping</h4>
                  <p className="text-sm text-gray-600">
                    Leaflet.js integration, waypoint management, route visualization
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Phase 3: Vehicle & Routing</h4>
                  <p className="text-sm text-gray-600">
                    Vehicle profiles, camper-safe routing with OpenRouteService
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Phase 4: Campsite Integration</h4>
                  <p className="text-sm text-gray-600">
                    European campsite database, filtering, search functionality
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Phase 5: Planning Tools</h4>
                  <p className="text-sm text-gray-600">
                    Route optimization, cost estimation, trip management
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Phase 6: Export & Polish</h4>
                  <p className="text-sm text-gray-600">
                    GPX export, trip sharing, UI polish for production launch
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              💡 Tips for Developers
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Check <code className="bg-gray-200 px-1 rounded">src/config/features.ts</code> for current feature flags</li>
                <li>• Review <code className="bg-gray-200 px-1 rounded">docs/</code> folder for complete project documentation</li>
                <li>• Follow the phase-by-phase development approach in the roadmap</li>
                <li>• All V2 features are disabled by design - focus on V1 MVP</li>
                <li>• Use <code className="bg-gray-200 px-1 rounded">npm run dev</code> to start development server</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              🚗 Vehicle Compatibility
            </h2>
            <p className="text-gray-700 mb-3">
              This planner is designed for all types of European camping vehicles:
            </p>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="border rounded-lg p-3">
                <h4 className="font-medium mb-1">Motorhomes</h4>
                <p className="text-gray-600">A-Class, C-Class, integrated vehicles</p>
              </div>
              <div className="border rounded-lg p-3">
                <h4 className="font-medium mb-1">Campervans</h4>
                <p className="text-gray-600">VW, Mercedes, Ford conversions</p>
              </div>
              <div className="border rounded-lg p-3">
                <h4 className="font-medium mb-1">Caravans</h4>
                <p className="text-gray-600">Touring caravans with tow vehicles</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              🌍 Supported Countries
            </h2>
            <p className="text-gray-700 mb-3">
              Full European coverage planned including:
            </p>
            <div className="grid md:grid-cols-4 gap-2 text-sm text-gray-600">
              <div>🇩🇪 Germany</div>
              <div>🇫🇷 France</div>
              <div>🇪🇸 Spain</div>
              <div>🇮🇹 Italy</div>
              <div>🇳🇱 Netherlands</div>
              <div>🇦🇹 Austria</div>
              <div>🇨🇭 Switzerland</div>
              <div>🇧🇪 Belgium</div>
              <div>🇵🇹 Portugal</div>
              <div>🇩🇰 Denmark</div>
              <div>🇸🇪 Sweden</div>
              <div>🇳🇴 Norway</div>
              <div>🇫🇮 Finland</div>
              <div>🇵🇱 Poland</div>
              <div>🇨🇿 Czech Republic</div>
              <div className="text-gray-500">+ more...</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;