// Main Layout Component
// Responsive layout system for the entire application

import React from 'react';
import { cn } from '@/utils/cn';

interface MainLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  sidebarOpen?: boolean;
  className?: string;
  fullHeight?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  sidebar,
  sidebarOpen = false,
  className,
  fullHeight = true,
}) => {
  return (
    <div className={cn('flex flex-1', fullHeight ? 'h-full' : 'min-h-screen', className)}>
      {/* Sidebar */}
      {sidebar && (
        <>
          {/* Desktop Sidebar */}
          <aside
            className={cn(
              'hidden lg:flex lg:flex-col lg:w-80 lg:fixed lg:inset-y-0 lg:pt-16',
              'bg-white border-r border-neutral-200',
              'z-30'
            )}
          >
            <div className="flex-1 overflow-y-auto">{sidebar}</div>
          </aside>

          {/* Mobile Sidebar */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-40 lg:hidden">
              {/* Overlay */}
              <div className="fixed inset-0 bg-black bg-opacity-25" />

              {/* Sidebar Panel */}
              <aside className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
                <div className="absolute top-0 right-0 -mr-12 pt-2">
                  <button
                    type="button"
                    className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  >
                    <span className="sr-only">Close sidebar</span>
                    <svg
                      className="h-6 w-6 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">{sidebar}</div>
              </aside>
            </div>
          )}
        </>
      )}

      {/* Main Content */}
      <main
        className={cn(
          'flex-1 flex flex-col min-w-0 overflow-x-hidden',
          sidebar && 'lg:pl-80' // Offset for fixed sidebar
        )}
      >
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
