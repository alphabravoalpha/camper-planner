// Affiliate Disclosure Page
// FTC/ASA-compliant affiliate link disclosure

import React from 'react';
import { Link } from 'react-router-dom';
import { HandCoins, ChevronLeft } from 'lucide-react';

const AffiliateDisclosurePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-50 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <Link to="/" className="inline-flex items-center gap-1 text-primary-200 hover:text-white text-sm mb-4 transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Back to planner
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <HandCoins className="w-8 h-8" />
            <h1 className="text-3xl sm:text-4xl font-display font-bold">Affiliate Disclosure</h1>
          </div>
          <p className="text-primary-100 text-sm">Last updated: February 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-xl shadow-soft p-6 sm:p-8 space-y-8">

          {/* Summary */}
          <section className="bg-primary-50 border border-primary-200 rounded-lg p-5">
            <h2 className="text-lg font-display font-semibold text-primary-900 mb-2">In plain English</h2>
            <p className="text-primary-800 text-sm leading-relaxed">
              European Camper Trip Planner is free to use. To help cover development costs, some
              links in the app go to campsite booking websites. If you book through one of these
              links, we may earn a small commission at no extra cost to you. This does not
              influence which campsites we show or how they are ranked.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-neutral-900 mb-3">What are affiliate links?</h2>
            <p className="text-neutral-700 leading-relaxed">
              Affiliate links are special URLs that contain a tracking code. When you click one
              and make a purchase or booking on the partner website, the partner pays us a small
              referral commission. The price you pay is exactly the same whether you use our link
              or go directly to the website.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-neutral-900 mb-3">Our affiliate partners</h2>
            <p className="text-neutral-700 leading-relaxed mb-4">
              We may earn commissions from the following booking platforms when you book through
              links in the app:
            </p>
            <div className="space-y-3">
              <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <h3 className="font-semibold text-neutral-900 text-sm">Booking.com</h3>
                <p className="text-neutral-600 text-sm mt-1">
                  One of the world&apos;s largest accommodation booking platforms, including camping
                  and outdoor accommodation.
                </p>
              </div>
              <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <h3 className="font-semibold text-neutral-900 text-sm">Pitchup</h3>
                <p className="text-neutral-600 text-sm mt-1">
                  A specialist camping and glamping booking platform focused on outdoor
                  accommodation across Europe.
                </p>
              </div>
              <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <h3 className="font-semibold text-neutral-900 text-sm">ACSI</h3>
                <p className="text-neutral-600 text-sm mt-1">
                  European camping card and booking platform with quality-inspected campsites
                  and discount rates.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-neutral-900 mb-3">How we use affiliate revenue</h2>
            <p className="text-neutral-700 leading-relaxed">
              Any affiliate revenue helps fund the ongoing development of the app, including
              server costs, API access, new features, and maintenance. This app is and will
              always remain free for users.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-neutral-900 mb-3">Our commitment to you</h2>
            <ul className="text-neutral-600 text-sm space-y-2 list-disc list-inside ml-2">
              <li>Affiliate relationships do not influence which campsites are displayed</li>
              <li>Campsite data comes from OpenStreetMap, not from affiliate partners</li>
              <li>Affiliate links are clearly labelled in the app</li>
              <li>You are never required to use affiliate links</li>
              <li>The official campsite website is always shown as the primary link</li>
              <li>We will never compromise your privacy for affiliate revenue</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-neutral-900 mb-3">Compliance</h2>
            <p className="text-neutral-700 leading-relaxed">
              This disclosure is provided in compliance with the UK Advertising Standards Authority
              (ASA) guidelines and the US Federal Trade Commission (FTC) guidelines on endorsements
              and affiliate marketing. We believe in full transparency about how the app generates
              revenue.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-neutral-900 mb-3">Questions?</h2>
            <p className="text-neutral-700 leading-relaxed">
              If you have questions about our affiliate relationships, please open an issue on our{' '}
              <a
                href="https://github.com/AlphaBravoAlpha/camper-planner"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 underline"
              >
                GitHub repository
              </a>
              {' '}or visit the{' '}
              <Link to="/support" className="text-primary-600 underline">
                Support page
              </Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AffiliateDisclosurePage;
