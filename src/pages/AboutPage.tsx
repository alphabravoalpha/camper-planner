// About Page
// Professional landing page with mission, features, and value proposition

import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  Route,
  Tent,
  Download,
  Globe,
  Truck,
  MapPin,
  Fuel,
  ChevronRight,
  Heart,
  ExternalLink,
} from 'lucide-react';
import SEOHead from '../components/seo/SEOHead';

const FEATURES = [
  {
    icon: Route,
    titleKey: 'about.features.routing.title',
    descKey: 'about.features.routing.description',
  },
  {
    icon: Tent,
    titleKey: 'about.features.database.title',
    descKey: 'about.features.database.description',
  },
  {
    icon: Truck,
    titleKey: 'about.features.profiles.title',
    descKey: 'about.features.profiles.description',
  },
  {
    icon: Download,
    titleKey: 'about.features.export.title',
    descKey: 'about.features.export.description',
  },
  {
    icon: Shield,
    titleKey: 'about.features.privacy.title',
    descKey: 'about.features.privacy.description',
  },
  {
    icon: Globe,
    titleKey: 'about.features.globe.title',
    descKey: 'about.features.globe.description',
  },
];

const COUNTRIES = [
  'France',
  'Spain',
  'Italy',
  'Germany',
  'Portugal',
  'Norway',
  'Sweden',
  'Croatia',
  'Greece',
  'Netherlands',
  'Switzerland',
  'Austria',
];

const AboutPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-neutral-50 animate-fade-in">
      <SEOHead
        title="About — European Camper Trip Planner"
        description="Learn about European Camper Trip Planner, the free privacy-first tool for planning campervan and motorhome trips across Europe."
        url="https://camperplanning.com/about"
      />
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <img
          src="/images/hero-about.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay"
          loading="lazy"
        />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
              <MapPin className="w-4 h-4" />
              {t('about.hero.badge')}
            </div>
            <h1 className="text-4xl sm:text-5xl font-display font-bold mb-4 tracking-tight">
              {t('about.hero.title')}
            </h1>
            <p className="text-lg sm:text-xl text-primary-100 max-w-2xl mx-auto leading-relaxed">
              {t('about.hero.subtitle')}
            </p>
            <div className="mt-8">
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-accent-500 text-white rounded-lg font-display font-semibold hover:bg-accent-600 transition-all duration-200 shadow-lg hover:shadow-xl active:scale-[0.97]"
              >
                {t('about.startPlanning')}
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Mission Card */}
        <div className="bg-white rounded-xl shadow-soft p-8 mb-12 -mt-8 relative z-10">
          <h2 className="text-2xl font-display font-bold text-neutral-900 mb-3">
            {t('about.missionTitle')}
          </h2>
          <p className="text-neutral-600 leading-relaxed text-lg">{t('about.missionText')}</p>
        </div>

        {/* Features Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-display font-bold text-neutral-900 mb-6 text-center">
            {t('about.featuresTitle')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(feature => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.titleKey}
                  className="bg-white rounded-xl shadow-soft p-6 hover:shadow-medium hover:-translate-y-1 transition-all duration-200"
                >
                  <div className="w-11 h-11 bg-primary-50 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <h3 className="text-base font-display font-semibold text-neutral-900 mb-1.5">
                    {t(feature.titleKey)}
                  </h3>
                  <p className="text-sm text-neutral-500 leading-relaxed">{t(feature.descKey)}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Why Free Card */}
        <div className="bg-gradient-to-br from-accent-50 to-accent-100 rounded-xl p-8 mb-12">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-accent-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Fuel className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-accent-900 mb-2">
                {t('about.whyFreeTitle')}
              </h2>
              <p className="text-accent-800 leading-relaxed">{t('about.whyFreeText')}</p>
            </div>
          </div>
        </div>

        {/* Countries Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-display font-bold text-neutral-900 mb-6 text-center">
            {t('about.countriesTitle')}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {COUNTRIES.map(country => (
              <div
                key={country}
                className="bg-white rounded-lg shadow-soft px-4 py-3 text-center text-sm font-medium text-neutral-700 hover:shadow-medium hover:-translate-y-0.5 transition-all duration-200"
              >
                {country}
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-neutral-400 mt-3">{t('about.countriesFooter')}</p>
        </div>

        {/* Support Card */}
        <div className="bg-white rounded-xl shadow-soft p-8 mb-12">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Heart className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-neutral-900 mb-2">
                {t('about.supportTitle')}
              </h2>
              <p className="text-neutral-600 leading-relaxed mb-4">{t('about.supportText')}</p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/support"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF5E5B] text-white rounded-lg font-display font-semibold hover:bg-[#e54e4b] transition-all duration-200 text-sm"
                >
                  <Heart className="w-4 h-4" />
                  {t('about.supportButton')}
                </Link>
                <a
                  href="https://ko-fi.com/camperplanning"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-neutral-300 text-neutral-700 rounded-lg font-medium hover:bg-neutral-50 transition-all duration-200 text-sm"
                >
                  {t('common.buyACoffee')}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-white rounded-xl shadow-soft p-8">
          <h2 className="text-2xl font-display font-bold text-neutral-900 mb-3">
            {t('about.ctaTitle')}
          </h2>
          <p className="text-neutral-500 mb-6">{t('about.ctaText')}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-display font-semibold hover:bg-primary-700 transition-all duration-200 shadow-sm hover:shadow-medium active:scale-[0.97]"
          >
            {t('about.openPlanner')}
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
