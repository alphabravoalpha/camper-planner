// Sidebar Component
// Responsive sidebar for the planner page

import React from 'react';
import { useTranslation } from 'react-i18next';
import { FeatureFlags } from '@/config';
import { useUIStore } from '@/store';
import { cn } from '@/utils/cn';
import RouteOptimization from '@/components/planning/RouteOptimization';
import TripCostCalculator from '@/components/planning/TripCostCalculator';
import TripManager from '@/components/planning/TripManager';
import PlanningTools from '@/components/planning/PlanningTools';

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className: _className }) => {
  const { t } = useTranslation();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  const sidebarSections = [
    {
      key: 'route',
      title: t('route.title'),
      description: 'Phase 2+: Waypoint management controls',
      featureFlag: 'BASIC_ROUTING' as keyof typeof FeatureFlags,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
    },
    {
      key: 'vehicle',
      title: t('vehicle.title'),
      description: 'Phase 3+: Vehicle dimension inputs',
      featureFlag: 'VEHICLE_PROFILES' as keyof typeof FeatureFlags,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
        </svg>
      ),
    },
    {
      key: 'campsites',
      title: t('campsites.title'),
      description: 'Phase 4+: Campsite filtering and search',
      featureFlag: 'CAMPSITE_DISPLAY' as keyof typeof FeatureFlags,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      key: 'optimization',
      title: 'Route Optimization',
      description: 'Phase 5+: Multi-stop route optimization',
      featureFlag: 'ROUTE_OPTIMIZATION' as keyof typeof FeatureFlags,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      key: 'costs',
      title: 'Trip Cost Calculator',
      description: 'Phase 5+: Fuel cost estimation and trip budgeting',
      featureFlag: 'COST_CALCULATION' as keyof typeof FeatureFlags,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      key: 'trips',
      title: 'Trip Manager',
      description: 'Phase 5+: Save and manage multiple trips locally',
      featureFlag: 'TRIP_MANAGEMENT' as keyof typeof FeatureFlags,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      key: 'planning',
      title: 'Planning Tools',
      description: 'Phase 5+: Duration estimation and itinerary planning',
      featureFlag: 'PLANNING_TOOLS' as keyof typeof FeatureFlags,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black/25 backdrop-blur-sm"
            onClick={toggleSidebar}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white pt-16">
            <div className="absolute top-20 right-0 -mr-12 pt-2">
              <button
                type="button"
                onClick={toggleSidebar}
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <span className="sr-only">Close sidebar</span>
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <SidebarContent sections={sidebarSections} />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-80 lg:fixed lg:inset-y-0 lg:pt-16 bg-white shadow-soft z-30">
        <SidebarContent sections={sidebarSections} />
      </aside>
    </>
  );
};

interface SidebarContentProps {
  sections: Array<{
    key: string;
    title: string;
    description: string;
    featureFlag: keyof typeof FeatureFlags;
    icon: React.ReactNode;
  }>;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ sections }) => {
  return (
    <div className="flex-1 h-0 overflow-y-auto">
      <div className="p-4">
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.key} className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className={cn(
                  'p-1.5 rounded-lg',
                  FeatureFlags[section.featureFlag] ? 'text-primary-600 bg-primary-50' : 'text-neutral-400'
                )}>
                  {section.icon}
                </div>
                <h3 className="text-sm font-semibold text-neutral-900">
                  {section.title}
                </h3>
              </div>

              {FeatureFlags[section.featureFlag] ? (
                section.key === 'optimization' ? (
                  <RouteOptimization />
                ) : section.key === 'costs' ? (
                  <TripCostCalculator />
                ) : section.key === 'trips' ? (
                  <TripManager />
                ) : section.key === 'planning' ? (
                  <PlanningTools />
                ) : (
                  <div className="bg-primary-50 rounded-xl p-3">
                    <p className="text-sm text-primary-700">
                      Feature controls will appear here
                    </p>
                  </div>
                )
              ) : (
                <div className="bg-neutral-50 rounded-xl p-3">
                  <p className="text-xs text-neutral-500">
                    {section.description}
                  </p>
                </div>
              )}
            </div>
          ))}

        </div>
      </div>
    </div>
  );
};

export default Sidebar;