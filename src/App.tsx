// Main App Component
// Router setup and global providers

import React, { Suspense } from 'react';
import { createBrowserRouter, RouterProvider, useLocation, Outlet } from 'react-router-dom';
import {
  ErrorBoundary,
  Header,
  Footer,
  LoadingSpinner,
  MainLayout,
  Sidebar,
} from './components/layout';
import OfflineNotice from './components/ui/OfflineNotice';
import ConsentBanner from './components/ui/ConsentBanner';
import { useUIStore } from './store';
import { useOnboarding } from './hooks/useOnboarding';
import OnboardingFlow from './components/onboarding/OnboardingFlow';
import './i18n'; // Initialize i18next

// Lazy load pages for better performance
const PlannerPage = React.lazy(() => import('./pages/PlannerPage'));
const AboutPage = React.lazy(() => import('./pages/AboutPage'));
const HelpPage = React.lazy(() => import('./pages/HelpPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));
const SupportPage = React.lazy(() => import('./pages/SupportPage'));
const PrivacyPolicyPage = React.lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsPage = React.lazy(() => import('./pages/TermsPage'));
const AffiliateDisclosurePage = React.lazy(() => import('./pages/AffiliateDisclosurePage'));
const FeedbackPage = React.lazy(() => import('./pages/FeedbackPage'));
const BlogListPage = React.lazy(() => import('./pages/BlogListPage'));
const BlogPostPage = React.lazy(() => import('./pages/BlogPostPage'));

// Debug pages - only loaded in development
const MapTestPage = import.meta.env.DEV ? React.lazy(() => import('./pages/MapTestPage')) : null;
const PlannerPageDebug = import.meta.env.DEV
  ? React.lazy(() => import('./pages/PlannerPageDebug'))
  : null;

// Root Layout Component (now uses Outlet)
const RootLayout: React.FC = () => {
  const location = useLocation();
  const { isLoading, error, sidebarOpen } = useUIStore();
  const { showOnboarding, completeOnboarding, skipOnboarding } = useOnboarding();

  // Determine if current page should have sidebar
  // Note: The sidebar is disabled for the planner page since MapContainer has its own
  // compact toolbar with slide-out panels for all features (trip manager, planning tools,
  // cost calculator, route optimizer, etc.). This provides a cleaner, more map-focused UX.
  const shouldShowSidebar = false; // Disabled: sidebar functionality moved to MapContainer toolbar

  // Hide footer on planner page (full-screen map)
  const shouldShowFooter = location.pathname !== '/';

  return (
    <ErrorBoundary>
      <div
        className={
          shouldShowFooter
            ? 'min-h-screen flex flex-col bg-neutral-50'
            : 'h-screen flex flex-col bg-neutral-50'
        }
      >
        {/* Offline Notice */}
        <OfflineNotice />

        {/* Analytics Consent Banner — hidden during onboarding to avoid z-index conflicts */}
        {!showOnboarding && <ConsentBanner />}

        {/* Onboarding Flow - Show for first-time users */}
        {showOnboarding && location.pathname === '/' && (
          <OnboardingFlow onComplete={completeOnboarding} onSkip={skipOnboarding} />
        )}

        {/* Header */}
        <Header />

        {/* Global Loading Indicator */}
        {isLoading && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-white shadow-lg rounded-lg p-3 flex items-center space-x-2">
              <LoadingSpinner size="sm" />
              <span className="text-sm text-neutral-600">Loading...</span>
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
        <MainLayout sidebar={shouldShowSidebar ? <Sidebar /> : undefined} sidebarOpen={sidebarOpen}>
          <Suspense
            fallback={
              <div className="h-full flex items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </MainLayout>

        {/* Footer - hidden on planner page (full-screen map) */}
        {shouldShowFooter && <Footer />}
      </div>
    </ErrorBoundary>
  );
};

// Router configuration with future flags
const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <RootLayout />,
      children: [
        {
          index: true,
          element: <PlannerPage />,
        },
        {
          path: 'about',
          element: <AboutPage />,
        },
        {
          path: 'help',
          element: <HelpPage />,
        },
        {
          path: 'settings',
          element: <SettingsPage />,
        },
        {
          path: 'support',
          element: <SupportPage />,
        },
        {
          path: 'privacy',
          element: <PrivacyPolicyPage />,
        },
        {
          path: 'terms',
          element: <TermsPage />,
        },
        {
          path: 'affiliate-disclosure',
          element: <AffiliateDisclosurePage />,
        },
        {
          path: 'feedback',
          element: <FeedbackPage />,
        },
        {
          path: 'guides',
          element: <BlogListPage />,
        },
        {
          path: 'guides/:slug',
          element: <BlogPostPage />,
        },
        // Debug routes - only available in development
        ...(import.meta.env.DEV && MapTestPage
          ? [
              {
                path: 'test-map',
                element: <MapTestPage />,
              },
            ]
          : []),
        ...(import.meta.env.DEV && PlannerPageDebug
          ? [
              {
                path: 'debug',
                element: <PlannerPageDebug />,
              },
            ]
          : []),
        {
          path: '*',
          element: <NotFoundPage />,
        },
      ],
    },
  ],
  {
    // Custom domain: no basename needed (was "/camper-planner" for GitHub Pages subdirectory)
    basename: '/',
  }
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
