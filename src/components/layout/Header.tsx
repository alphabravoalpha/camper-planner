// Header Component
// App header with navigation and branding

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Route } from 'lucide-react';
import { FeatureFlags } from '../../config';
import { cn } from '../../utils/cn';
import { useUIStore, useVehicleStore, useTripWizardStore } from '../../store';
import { LanguageSelector } from '../ui';

const Header: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toggleSidebar, openVehicleSidebar } = useUIStore();
  const { profile } = useVehicleStore();
  const { openWizard } = useTripWizardStore();

  // Vehicle summary for badge
  const vehicleSummary = profile ? {
    name: profile.name || 'Custom Vehicle',
    dims: `${profile.height}×${profile.width}×${profile.length}m`,
  } : null;

  const navigationItems = [
    { path: '/', label: t('nav.planner'), key: 'planner' },
    { path: '/about', label: t('nav.about'), key: 'about' },
    { path: '/help', label: t('nav.help'), key: 'help' },
  ];

  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <header className="bg-white/80 backdrop-blur-md shadow-soft sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-6">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              {/* Sidebar toggle for planner page */}
              {location.pathname === '/' && (
                <button
                  onClick={toggleSidebar}
                  className="lg:hidden p-2 rounded-xl text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100"
                  aria-label="Toggle sidebar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}

              <Link to="/" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center shadow-sm">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg lg:text-xl font-bold text-neutral-900">
                    European Camper Planner
                  </h1>
                  <p className="text-xs text-primary-600 font-medium tracking-wide uppercase hidden lg:block">Free trip planning for Europe</p>
                </div>
                <div className="sm:hidden">
                  <h1 className="text-lg font-bold text-neutral-900">Camper Planner</h1>
                </div>
              </Link>

              {/* Vehicle Badge — compact pill right next to logo */}
              {location.pathname === '/' && (
                <button
                  onClick={openVehicleSidebar}
                  className={cn(
                    'hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                    'hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500',
                    vehicleSummary
                      ? 'bg-green-50 text-green-700 ring-1 ring-green-200 hover:bg-green-100'
                      : 'bg-primary-50 text-primary-700 ring-1 ring-primary-200 hover:bg-primary-100'
                  )}
                  title={vehicleSummary ? 'Edit vehicle profile' : 'Set up your vehicle profile'}
                >
                  <span>🚐</span>
                  <span className="max-w-[160px] truncate">
                    {vehicleSummary ? vehicleSummary.name : 'Setup Vehicle'}
                  </span>
                  {vehicleSummary && (
                    <span className="text-green-600/70 hidden lg:inline">{vehicleSummary.dims}</span>
                  )}
                </button>
              )}
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigationItems.map((item) => (
                <Link
                  key={item.key}
                  to={item.path}
                  className={cn(
                    'px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                    isActivePath(item.path)
                      ? 'text-primary-700 bg-primary-50'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center space-x-2 lg:space-x-4 ml-auto">
              {/* Plan a Trip button — only show on planner page */}
              {location.pathname === '/' && (
                <button
                  onClick={() => { openWizard(); setIsMobileMenuOpen(false); }}
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-accent-500 text-white rounded-xl hover:bg-accent-600 text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-medium active:scale-[0.97]"
                >
                  <Route className="w-4 h-4" />
                  Plan a Trip
                </button>
              )}

              {/* Language Selector */}
              {FeatureFlags.MULTI_LANGUAGE_FRAMEWORK && (
                <LanguageSelector
                  variant={FeatureFlags.MULTI_LANGUAGE_COMPLETE ? 'dropdown' : 'button'}
                  size="sm"
                />
              )}

              {/* Mobile menu button */}
              <button
                type="button"
                onClick={toggleMobileMenu}
                className="md:hidden p-2 rounded-xl text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100"
                aria-label="Toggle menu"
              >
                <svg
                  className={cn('w-6 h-6 transition-transform', isMobileMenuOpen && 'rotate-90')}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden bg-white/95 backdrop-blur-sm">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navigationItems.map((item) => (
                  <Link
                    key={item.key}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      'block px-3 py-2 rounded-xl text-base font-medium transition-all duration-200',
                      isActivePath(item.path)
                        ? 'text-primary-700 bg-primary-50'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
                {location.pathname === '/' && (
                  <button
                    onClick={() => { openWizard(); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-base font-semibold text-accent-700 bg-accent-50 hover:bg-accent-100 transition-all duration-200"
                  >
                    <Route className="w-4 h-4" />
                    Plan a Trip
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/25 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

export default Header;