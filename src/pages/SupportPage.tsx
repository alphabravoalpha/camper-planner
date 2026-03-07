// Support / Donate Page
// Ko-fi donation integration and project support information

import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, Coffee, ChevronLeft, ExternalLink, Globe, Shield, Zap, Wrench } from 'lucide-react';
import SEOHead from '../components/seo/SEOHead';

const KOFI_URL = 'https://ko-fi.com/camperplanning';

const SUPPORT_REASONS = [
  {
    icon: Globe,
    titleKey: 'support.reasons.free.title',
    descKey: 'support.reasons.free.description',
  },
  {
    icon: Zap,
    titleKey: 'support.reasons.features.title',
    descKey: 'support.reasons.features.description',
  },
  {
    icon: Shield,
    titleKey: 'support.reasons.privacy.title',
    descKey: 'support.reasons.privacy.description',
  },
  {
    icon: Wrench,
    titleKey: 'support.reasons.maintenance.title',
    descKey: 'support.reasons.maintenance.description',
  },
];

const SupportPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-neutral-50 animate-fade-in">
      <SEOHead
        title="Support Us — European Camper Trip Planner"
        description="Support the development of European Camper Trip Planner. Help keep this free tool running for the campervan community."
        url="https://camperplanning.com/support"
      />
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <img
          src="/images/hero-support.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay"
          loading="lazy"
        />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-primary-200 hover:text-white text-sm mb-4 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {t('support.backToPlanner')}
          </Link>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/15 rounded-lg mb-5 backdrop-blur-sm">
              <Heart className="w-8 h-8" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold mb-3">
              {t('support.title')}
            </h1>
            <p className="text-primary-100 text-lg max-w-2xl mx-auto leading-relaxed">
              {t('support.description')}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Ko-fi Embedded Donation Card */}
        <div className="bg-white rounded-xl shadow-soft p-6 sm:p-8 -mt-8 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-50 text-accent-700 rounded-full text-sm font-medium mb-4">
              <Coffee className="w-4 h-4" />
              {t('support.kofiTitle')}
            </div>
            <h2 className="text-2xl font-display font-bold text-neutral-900 mb-2">
              {t('support.kofiSubtitle')}
            </h2>
            <p className="text-neutral-600 mb-6 max-w-lg mx-auto">{t('support.kofiDescription')}</p>
            <div className="flex justify-center">
              <iframe
                id="kofiframe"
                src="https://ko-fi.com/camperplanning/?hidefeed=true&widget=true&embed=true&preview=true"
                className="border-0 w-full max-w-[480px] rounded-lg"
                style={{ height: '712px' }}
                title="Support on Ko-fi"
              />
            </div>
            <p className="text-neutral-400 text-xs mt-3">
              {t('support.kofiDisclaimer')}{' '}
              <a
                href={KOFI_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-500 underline hover:text-neutral-700 transition-colors"
              >
                {t('support.openKofi')}
                <ExternalLink className="w-3 h-3 inline ml-1" />
              </a>
            </p>
          </div>
        </div>

        {/* Why Support */}
        <div>
          <h2 className="text-2xl font-display font-bold text-neutral-900 mb-6 text-center">
            {t('support.fundingTitle')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {SUPPORT_REASONS.map(reason => {
              const Icon = reason.icon;
              return (
                <div
                  key={reason.titleKey}
                  className="bg-white rounded-xl shadow-soft p-6 hover:shadow-medium hover:-translate-y-1 transition-all duration-200"
                >
                  <div className="w-11 h-11 bg-accent-50 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-accent-600" />
                  </div>
                  <h3 className="text-base font-display font-semibold text-neutral-900 mb-1.5">
                    {t(reason.titleKey)}
                  </h3>
                  <p className="text-sm text-neutral-500 leading-relaxed">{t(reason.descKey)}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Other Ways to Help */}
        <div className="bg-white rounded-xl shadow-soft p-6 sm:p-8">
          <h2 className="text-xl font-display font-bold text-neutral-900 mb-4">
            {t('support.otherWaysTitle')}
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-display font-semibold text-neutral-900 text-sm">
                  {t('support.spreadWord.title')}
                </h3>
                <p className="text-neutral-500 text-sm mt-0.5">
                  {t('support.spreadWord.description')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-display font-semibold text-neutral-900 text-sm">
                  {t('support.reportBugs.title')}
                </h3>
                <p className="text-neutral-500 text-sm mt-0.5">
                  {t('support.reportBugs.description')}{' '}
                  <Link to="/feedback" className="text-primary-600 underline">
                    {t('support.sendFeedback')}
                  </Link>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-display font-semibold text-neutral-900 text-sm">
                  {t('support.bookLinks.title')}
                </h3>
                <p className="text-neutral-500 text-sm mt-0.5">
                  {t('support.bookLinks.description')}{' '}
                  <Link to="/affiliate-disclosure" className="text-primary-600 underline">
                    {t('support.learnMore')}
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Thank You */}
        <div className="text-center bg-gradient-to-br from-accent-50 to-accent-100 rounded-xl p-8">
          <Heart className="w-10 h-10 text-accent-500 mx-auto mb-3" />
          <h2 className="text-2xl font-display font-bold text-accent-900 mb-2">
            {t('support.thankYou.title')}
          </h2>
          <p className="text-accent-700 max-w-md mx-auto">{t('support.thankYou.description')}</p>
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent-600 text-white rounded-lg font-display font-semibold hover:bg-accent-700 transition-all duration-200 shadow-sm hover:shadow-medium active:scale-[0.97]"
            >
              {t('support.startPlanningTrip')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
