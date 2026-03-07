// Feedback Page
// Embedded Google Form for user suggestions, bug reports, and feature requests

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  MessageSquare,
  ChevronLeft,
  Lightbulb,
  Bug,
  Star,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import SEOHead from '../components/seo/SEOHead';

// Replace this with your actual Google Form embed URL
// To get the embed URL: Open your Google Form → click "Send" → click the embed icon (<>) → copy the src URL
const GOOGLE_FORM_EMBED_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSfSdsNTLk6LhzYoWsPoRNyWvlp8EsyZb-b1NzOpgKIIO1SDhg/viewform?embedded=true';
const GOOGLE_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSfSdsNTLk6LhzYoWsPoRNyWvlp8EsyZb-b1NzOpgKIIO1SDhg/viewform';

const FEEDBACK_TYPES = [
  {
    icon: Lightbulb,
    titleKey: 'feedbackPage.types.features.title',
    descKey: 'feedbackPage.types.features.description',
  },
  {
    icon: Bug,
    titleKey: 'feedbackPage.types.bugs.title',
    descKey: 'feedbackPage.types.bugs.description',
  },
  {
    icon: Star,
    titleKey: 'feedbackPage.types.general.title',
    descKey: 'feedbackPage.types.general.description',
  },
];

const FeedbackPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-neutral-50 animate-fade-in">
      <SEOHead
        title="Share Feedback — European Camper Trip Planner"
        description="Share your feedback, report bugs, or suggest features for European Camper Trip Planner."
        url="https://camperplanning.com/feedback"
      />
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <img
          src="/images/hero-feedback.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay"
          loading="lazy"
        />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1 text-primary-200 hover:text-white text-sm mb-4 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {t('feedbackPage.backToPlanner')}
          </button>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/15 rounded-xl mb-5 backdrop-blur-sm">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold mb-3">
              {t('feedbackPage.title')}
            </h1>
            <p className="text-primary-100 text-lg max-w-2xl mx-auto leading-relaxed">
              {t('feedbackPage.description')}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* What we're looking for */}
        <div className="bg-white rounded-xl shadow-soft p-6 sm:p-8 -mt-8 relative z-10">
          <h2 className="text-xl font-display font-bold text-neutral-900 mb-5 text-center">
            {t('feedbackPage.whatYouCanShare')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {FEEDBACK_TYPES.map(type => {
              const Icon = type.icon;
              return (
                <div key={type.titleKey} className="text-center">
                  <div className="w-11 h-11 bg-primary-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <h3 className="text-sm font-display font-semibold text-neutral-900 mb-1">
                    {t(type.titleKey)}
                  </h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">{t(type.descKey)}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Embedded Google Form */}
        <div className="bg-white rounded-xl shadow-soft overflow-hidden">
          <div className="p-6 pb-0">
            <h2 className="text-2xl font-display font-bold text-neutral-900 mb-1">
              {t('feedbackPage.formTitle')}
            </h2>
            <p className="text-neutral-500 text-sm mb-4">
              {t('feedbackPage.formInstructions')}{' '}
              <a
                href={GOOGLE_FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 underline hover:text-primary-700 inline-flex items-center gap-1"
              >
                {t('feedbackPage.openInNewTab')}
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
          <div className="relative">
            {!iframeLoaded && !iframeError && (
              <div className="absolute inset-0 flex items-center justify-center bg-neutral-50 z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent mx-auto mb-3"></div>
                  <p className="text-sm text-neutral-500">{t('feedbackPage.loading')}</p>
                </div>
              </div>
            )}
            {iframeError && (
              <div className="p-8 text-center">
                <p className="text-neutral-700 font-medium mb-2">{t('feedbackPage.loadError')}</p>
                <p className="text-sm text-neutral-500 mb-4">{t('feedbackPage.loadErrorDesc')}</p>
                <a
                  href={GOOGLE_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg font-display font-semibold hover:bg-primary-700 transition-all duration-200"
                >
                  {t('feedbackPage.openButton')}
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
            <iframe
              src={GOOGLE_FORM_EMBED_URL}
              width="100%"
              height="800"
              className={`border-0 transition-opacity duration-300 ${iframeLoaded ? 'opacity-100' : 'opacity-0'} ${iframeError ? 'hidden' : ''}`}
              title={t('feedbackPage.formTitle')}
              onLoad={() => setIframeLoaded(true)}
              onError={() => setIframeError(true)}
            >
              {t('feedbackPage.loading')}
            </iframe>
          </div>
        </div>

        {/* What happens next */}
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6 sm:p-8">
          <h2 className="text-xl font-display font-bold text-primary-900 mb-4 text-center">
            {t('feedbackPage.whatHappensNext')}
          </h2>
          <div className="space-y-3 max-w-lg mx-auto">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 bg-primary-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  {i}
                </div>
                <p className="text-sm text-primary-800 pt-1">{t(`feedbackPage.step${i}`)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-white rounded-xl shadow-soft p-8">
          <h2 className="text-2xl font-display font-bold text-neutral-900 mb-3">
            {t('feedbackPage.ctaTitle')}
          </h2>
          <p className="text-neutral-500 mb-6">{t('feedbackPage.ctaText')}</p>
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-display font-semibold hover:bg-primary-700 transition-all duration-200 shadow-sm hover:shadow-medium active:scale-[0.97]"
          >
            {t('common.backToPlanner')}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
