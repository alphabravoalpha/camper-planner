// About Page
// Project information and vision

import React from 'react';
import { useTranslation } from 'react-i18next';

const AboutPage: React.FC = () => {
  const { t: _t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          About European Camper Trip Planner
        </h1>

        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Our Mission
            </h2>
            <p className="leading-relaxed">
              We're building the first comprehensive, free camper trip planning platform
              specifically designed for European travel. While North America has tools like
              RV LIFE Trip Wizard, Europe's 15+ million camper travelers have been left
              without a dedicated solution.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Why Free?
            </h2>
            <p className="leading-relaxed">
              Current trip planning requires $65-150+/year in subscriptions plus hours
              of manual research across multiple fragmented tools. We believe comprehensive
              trip planning should be accessible to everyone, regardless of budget.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Key Features
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Camper-safe routing respecting vehicle dimensions and weight limits</li>
              <li>Comprehensive European campsite database (aires, campsites, parking)</li>
              <li>Route optimization for fuel efficiency</li>
              <li>GPX export for GPS devices</li>
              <li>No user accounts required - your data stays private</li>
              <li>Multi-language support for all European travelers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Development Progress
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span>Phase 1: Foundation & Core Infrastructure ✓</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                  <span>Phase 2: Interactive Mapping (Next)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-300 rounded-full mr-3"></div>
                  <span>Phase 3: Vehicle Profiles & Routing</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-300 rounded-full mr-3"></div>
                  <span>Phase 4: Campsite Integration</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-300 rounded-full mr-3"></div>
                  <span>Phase 5: Planning Tools</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-300 rounded-full mr-3"></div>
                  <span>Phase 6: Export & Polish</span>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Technology
            </h2>
            <p className="leading-relaxed mb-3">
              Built with modern web technologies for zero-cost scalability:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>React 18 + TypeScript for robust frontend development</li>
              <li>Leaflet.js for lightweight, fast mapping</li>
              <li>OpenStreetMap for free, comprehensive map data</li>
              <li>OpenRouteService for vehicle-safe routing</li>
              <li>Local storage for privacy-first data management</li>
              <li>Static site deployment for free hosting</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Open Source
            </h2>
            <p className="leading-relaxed">
              This project is open source and built in the open. We believe in
              transparency and community-driven development. The code is available
              on GitHub for anyone to review, contribute to, or learn from.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;