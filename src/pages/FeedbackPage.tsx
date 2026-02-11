// Feedback Page
// Embedded Google Form for user suggestions, bug reports, and feature requests

import React from 'react';
import { useNavigate } from 'react-router-dom';
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

  return (
    <div className="min-h-screen bg-neutral-50 animate-fade-in">
      {/* Hero */}
      <div className="bg-gradient-to-br from-teal-500 to-teal-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-teal-200 hover:text-white text-sm mb-4 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to planner
          </button>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/15 rounded-2xl mb-5 backdrop-blur-sm">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              Share Your Feedback
            </h1>
            <p className="text-teal-100 text-lg max-w-2xl mx-auto leading-relaxed">
              Your suggestions help shape the future of European Camper Trip Planner.
              Every piece of feedback is read and considered.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

        {/* What we're looking for */}
        <div className="bg-white rounded-2xl shadow-soft p-6 sm:p-8 -mt-8 relative z-10">
          <h2 className="text-xl font-bold text-neutral-900 mb-5 text-center">
            What you can share
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {FEEDBACK_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <div key={type.title} className="text-center">
                  <div className="w-11 h-11 bg-teal-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-5 h-5 text-teal-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-1">
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
        <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
          <div className="p-6 pb-0">
            <h2 className="text-2xl font-bold text-neutral-900 mb-1">
              Feedback Form
            </h2>
            <p className="text-neutral-500 text-sm mb-4">
              Fill in the form below, or{' '}
              <a
                href={GOOGLE_FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-600 underline hover:text-teal-700 inline-flex items-center gap-1"
              >
                open it in a new tab
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
          <iframe
            src={GOOGLE_FORM_EMBED_URL}
            width="100%"
            height="800"
            className="border-0"
            title="Feedback Form"
          >
            Loading feedback form...
          </iframe>
        </div>

        {/* What happens next */}
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl font-bold text-teal-900 mb-4 text-center">
            What happens next?
          </h2>
          <div className="space-y-3 max-w-lg mx-auto">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-teal-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                1
              </div>
              <p className="text-sm text-teal-800 pt-1">
                Your feedback is collected and reviewed regularly.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-teal-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                2
              </div>
              <p className="text-sm text-teal-800 pt-1">
                Popular requests and critical bugs are prioritised for development.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-teal-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                3
              </div>
              <p className="text-sm text-teal-800 pt-1">
                Updates ship as soon as they're ready — no waiting for release cycles.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-white rounded-2xl shadow-soft p-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-3">Thanks for helping us improve</h2>
          <p className="text-neutral-500 mb-6">
            Your input directly shapes the tools that thousands of camper travellers rely on.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-all duration-200 shadow-sm hover:shadow-medium active:scale-[0.97]"
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
