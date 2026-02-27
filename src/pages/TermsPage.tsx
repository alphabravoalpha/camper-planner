// Terms of Use Page
// Terms of service for a free, open-source trip planning tool

import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ChevronLeft } from 'lucide-react';
import SEOHead from '../components/seo/SEOHead';

const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-50 animate-fade-in">
      <SEOHead
        title="Terms of Use — European Camper Trip Planner"
        description="Terms of use for European Camper Trip Planner. Governed by the laws of England and Wales."
        url="https://camperplanning.com/terms"
      />
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-primary-200 hover:text-white text-sm mb-4 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to planner
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <FileText className="w-8 h-8" />
            <h1 className="text-3xl sm:text-4xl font-display font-bold">Terms of Use</h1>
          </div>
          <p className="text-primary-100 text-sm">Last updated: February 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-xl shadow-soft p-6 sm:p-8 space-y-8">
          <section>
            <p className="text-neutral-700 leading-relaxed">
              By using European Camper Trip Planner (&quot;the app&quot;), you agree to these terms.
              The app is provided free of charge as an open-source project.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-neutral-900 mb-3">
              1. Use of the App
            </h2>
            <p className="text-neutral-700 leading-relaxed mb-3">
              The app is free to use for personal, non-commercial trip planning purposes. You may
              use it to plan routes, discover campsites, calculate costs, and export trip data.
            </p>
            <p className="text-neutral-600 text-sm">
              You agree not to misuse the app or attempt to interfere with its operation, including
              but not limited to: overloading third-party APIs, scraping data, or using automated
              tools to excessively access the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-neutral-900 mb-3">
              2. Route and Campsite Data
            </h2>
            <p className="text-neutral-700 leading-relaxed mb-3">
              Routes, campsite information, and other data displayed in the app are sourced from
              third-party services (OpenStreetMap, OpenRouteService, Overpass API). While we strive
              for accuracy:
            </p>
            <ul className="text-neutral-600 text-sm space-y-1 list-disc list-inside ml-2">
              <li>Route data may not reflect current road conditions, closures, or restrictions</li>
              <li>
                Vehicle restriction data (bridge heights, weight limits) may be incomplete or
                outdated
              </li>
              <li>
                Campsite information (amenities, opening hours, availability) may not be current
              </li>
              <li>Cost estimates are approximations and may not reflect actual prices</li>
            </ul>
            <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 text-sm font-medium">
                Always verify critical information (bridge heights, road restrictions, campsite
                availability) independently before your trip. This app is a planning aid, not a
                substitute for up-to-date navigation or booking systems.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-neutral-900 mb-3">
              3. Your Data
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              All trip data is stored locally in your browser. You own your data entirely. We do not
              have access to it, cannot recover it, and are not responsible for data loss. We
              recommend regularly exporting your trips as a backup. See our{' '}
              <Link to="/privacy" className="text-primary-600 underline">
                Privacy Policy
              </Link>{' '}
              for full details.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-neutral-900 mb-3">
              4. Affiliate Links
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              The app may display links to third-party booking platforms. These are affiliate links,
              meaning we may earn a small commission from bookings made through them at no
              additional cost to you. Clicking these links takes you to external websites governed
              by their own terms and privacy policies. We are not responsible for the content,
              availability, or practices of these third-party sites. See our{' '}
              <Link to="/affiliate-disclosure" className="text-primary-600 underline">
                Affiliate Disclosure
              </Link>{' '}
              for more information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-neutral-900 mb-3">
              5. Disclaimer of Warranties
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              The app is provided &quot;as is&quot; and &quot;as available&quot; without warranties
              of any kind, either express or implied. We do not guarantee that the app will be
              uninterrupted, error-free, or that data will be accurate or complete.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-neutral-900 mb-3">
              6. Limitation of Liability
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              To the fullest extent permitted by law, we shall not be liable for any indirect,
              incidental, special, or consequential damages arising from the use of the app. This
              includes, but is not limited to, damages resulting from reliance on route information,
              campsite data, or cost estimates provided by the app.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-neutral-900 mb-3">
              7. Third-Party Services
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              The app relies on third-party APIs and services. Their availability is outside our
              control. We are not responsible for downtime, rate limiting, or changes to these
              services that may affect app functionality.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-neutral-900 mb-3">
              8. Changes to These Terms
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              We may update these terms from time to time. Continued use of the app after changes
              constitutes acceptance of the updated terms. The &quot;last updated&quot; date at the
              top of this page indicates when the terms were last modified.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-neutral-900 mb-3">
              9. Governing Law
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              These terms are governed by the laws of England and Wales. Any disputes arising from
              the use of the app shall be subject to the exclusive jurisdiction of the courts of
              England and Wales.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-neutral-900 mb-3">
              10. Contact
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              For questions about these terms, please{' '}
              <Link to="/feedback" className="text-primary-600 underline">
                send us feedback
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
