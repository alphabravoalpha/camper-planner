// Feedback Page
// Embedded Google Form for user suggestions, bug reports, and feature requests

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MessageSquare, ChevronLeft, Lightbulb, Bug, Star, ExternalLink, ChevronRight
} from 'lucide-react';

// Replace this with your actual Google Form embed URL
// To get the embed URL: Open your Google Form → click "Send" → click the embed icon (<>) → copy the src URL
const GOOGLE_FORM_EMBED_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfSdsNTLk6LhzYoWsPoRNyWvlp8EsyZb-b1NzOpgKIIO1SDhg/viewform?embedded=true';
const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfSdsNTLk6LhzYoWsPoRNyWvlp8EsyZb-b1NzOpgKIIO1SDhg/viewform';

const FEEDBACK_TYPES = [
  {
    icon: Lightbulb,
    title: 'Feature requests',
    description: 'Suggest new features or improvements to existing tools.',
  },
  {
    icon: Bug,
    title: 'Bug reports',
    description: 'Let us know if something isn\'t working as expected.',
  },
  {
    icon: Star,
    title: 'General feedback',
    description: 'Share your experience, ideas, or anything else on your mind.',
  },
];

const FeedbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <img src="/images/hero-feedback.jpg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay" loading="lazy" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1 text-primary-200 hover:text-white text-sm mb-4 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to planner
          </button>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/15 rounded-xl mb-5 backdrop-blur-sm">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold mb-3">
              Share Your Feedback
            </h1>
            <p className="text-primary-100 text-lg max-w-2xl mx-auto leading-relaxed">
              Your suggestions help shape the future of European Camper Trip Planner.
              Every piece of feedback is read and considered.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

        {/* What we're looking for */}
        <div className="bg-white rounded-xl shadow-soft p-6 sm:p-8 -mt-8 relative z-10">
          <h2 className="text-xl font-display font-bold text-neutral-900 mb-5 text-center">
            What you can share
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {FEEDBACK_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <div key={type.title} className="text-center">
                  <div className="w-11 h-11 bg-primary-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <h3 className="text-sm font-display font-semibold text-neutral-900 mb-1">
                    {type.title}
                  </h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    {type.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Embedded Google Form */}
        <div className="bg-white rounded-xl shadow-soft overflow-hidden">
          <div className="p-6 pb-0">
            <h2 className="text-2xl font-display font-bold text-neutral-900 mb-1">
              Feedback Form
            </h2>
            <p className="text-neutral-500 text-sm mb-4">
              Fill in the form below, or{' '}
              <a
                href={GOOGLE_FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 underline hover:text-primary-700 inline-flex items-center gap-1"
              >
                open it in a new tab
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
          <div className="relative">
            {!iframeLoaded && !iframeError && (
              <div className="absolute inset-0 flex items-center justify-center bg-neutral-50 z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent mx-auto mb-3"></div>
                  <p className="text-sm text-neutral-500">Loading feedback form...</p>
                </div>
              </div>
            )}
            {iframeError && (
              <div className="p-8 text-center">
                <p className="text-neutral-700 font-medium mb-2">Unable to load the feedback form</p>
                <p className="text-sm text-neutral-500 mb-4">
                  Your browser may be blocking embedded content. You can still submit feedback directly.
                </p>
                <a
                  href={GOOGLE_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg font-display font-semibold hover:bg-primary-700 transition-all duration-200"
                >
                  Open feedback form
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
            <iframe
              src={GOOGLE_FORM_EMBED_URL}
              width="100%"
              height="800"
              className={`border-0 transition-opacity duration-300 ${iframeLoaded ? 'opacity-100' : 'opacity-0'} ${iframeError ? 'hidden' : ''}`}
              title="Feedback Form"
              onLoad={() => setIframeLoaded(true)}
              onError={() => setIframeError(true)}
            >
              Loading feedback form...
            </iframe>
          </div>
        </div>

        {/* What happens next */}
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6 sm:p-8">
          <h2 className="text-xl font-display font-bold text-primary-900 mb-4 text-center">
            What happens next?
          </h2>
          <div className="space-y-3 max-w-lg mx-auto">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-primary-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                1
              </div>
              <p className="text-sm text-primary-800 pt-1">
                Your feedback is collected and reviewed regularly.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-primary-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                2
              </div>
              <p className="text-sm text-primary-800 pt-1">
                Popular requests and critical bugs are prioritised for development.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-primary-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                3
              </div>
              <p className="text-sm text-primary-800 pt-1">
                Updates ship as soon as they're ready — no waiting for release cycles.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-white rounded-xl shadow-soft p-8">
          <h2 className="text-2xl font-display font-bold text-neutral-900 mb-3">Thanks for helping us improve</h2>
          <p className="text-neutral-500 mb-6">
            Your input directly shapes the tools that thousands of camper travellers rely on.
          </p>
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-display font-semibold hover:bg-primary-700 transition-all duration-200 shadow-sm hover:shadow-medium active:scale-[0.97]"
          >
            Back to Planner
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
