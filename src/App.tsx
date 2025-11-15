// Main App Component
// Router setup and global providers

import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ErrorBoundary, Header, LoadingSpinner, MainLayout, Sidebar } from './components/layout';
import { useUIStore } from './store';
import './i18n'; // Initialize i18next

// Lazy load pages for better performance
const PlannerPage = React.lazy(() => import('./pages/PlannerPage'));
const AboutPage = React.lazy(() => import('./pages/AboutPage'));
const HelpPage = React.lazy(() => import('./pages/HelpPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));

// App Content Component (inside Router context)
const AppContent: React.FC = () => {
  const location = useLocation();
  const { isLoading, error, sidebarOpen } = useUIStore();

  // Determine if current page should have sidebar
  const shouldShowSidebar = location.pathname === '/';

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <Header />

        {/* Global Loading Indicator */}
        {isLoading && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-white shadow-lg rounded-lg p-3 flex items-center space-x-2">
              <LoadingSpinner size="sm" />
              <span className="text-sm text-gray-600">Loading...</span>
            </div>
          </div>
        )}

        {/* Global Error Display */}
        {error && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    className="text-red-400 hover:text-red-600"
                    onClick={() => useUIStore.getState().setError(null)}
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Layout */}
        <MainLayout
          sidebar={shouldShowSidebar ? <Sidebar /> : undefined}
          sidebarOpen={sidebarOpen}
        >
          <Suspense
            fallback={
              <div className="h-full flex items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<PlannerPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </MainLayout>
      </div>
    </ErrorBoundary>
  );
};

function App() {
  // Use basename for GitHub Pages deployment
  const basename = import.meta.env.PROD ? '/camper-planner' : '/';

  return (
    <Router basename={basename}>
      <AppContent />
    </Router>
  );
}

export default App;