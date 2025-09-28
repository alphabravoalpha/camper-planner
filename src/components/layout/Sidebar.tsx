// Sidebar Component
// Responsive sidebar for the planner page

import React from 'react';
import { useTranslation } from 'react-i18next';
import { FeatureFlags } from '@/config';
import { useUIStore } from '@/store';
import { cn } from '@/utils/cn';

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
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
  ];

  return (
    <>
      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black bg-opacity-25"
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
      <aside className="hidden lg:flex lg:flex-col lg:w-80 lg:fixed lg:inset-y-0 lg:pt-16 bg-white border-r border-gray-200 z-30">
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
                  'p-1 rounded',
                  FeatureFlags[section.featureFlag] ? 'text-blue-600' : 'text-gray-400'
                )}>
                  {section.icon}
                </div>
                <h3 className="text-sm font-medium text-gray-900">
                  {section.title}
                </h3>
              </div>

              {FeatureFlags[section.featureFlag] ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    Feature controls will appear here
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-500">
                    {section.description}
                  </p>
                </div>
              )}
            </div>
          ))}

          {/* Phase Information */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                Current Phase: 1.4
              </h4>
              <p className="text-xs text-blue-700">
                Layout Components - Building responsive UI foundation
              </p>
              <div className="mt-2 text-xs text-blue-600">
                Next: Phase 1.5 - Basic Map Component
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;