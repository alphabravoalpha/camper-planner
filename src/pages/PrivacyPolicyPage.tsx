// Privacy Policy Page
// GDPR-compliant privacy policy for a local-storage, no-tracking app

import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ChevronLeft } from 'lucide-react';
import SEOHead from '../components/seo/SEOHead';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-50 animate-fade-in">
      <SEOHead
        title="Privacy Policy — European Camper Trip Planner"
        description="Privacy policy for European Camper Trip Planner. No tracking, no cookies, your data stays on your device."
        url="https://camperplanning.com/privacy"
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
            <Shield className="w-8 h-8" />
            <h1 className="text-3xl sm:text-4xl font-display font-bold">Privacy Policy</h1>
          </div>
          <p className="text-primary-100 text-sm">Last updated: February 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-xl shadow-soft p-6 sm:p-8 space-y-8">
          {/* Intro */}
          <section>
            <p className="text-neutral-700 leading-relaxed">
              European Camper Trip Planner (&quot;we&quot;, &quot;us&quot;, or &quot;the app&quot;)
              is committed to protecting your privacy. This policy explains what data the app
              collects, how it is used, and your rights. We designed this application with privacy
              as a core principle.
            </p>
          </section>

          {/* TL;DR */}
          <section className="bg-green-50 border border-green-200 rounded-lg p-5">
            <h2 className="text-lg font-display font-semibold text-green-900 mb-2">
              The short version
            </h2>
            <ul className="text-green-800 text-sm space-y-1 list-disc list-inside">
              <li>We do not collect, store, or sell your personal data</li>
              <li>All your trip data is stored locally in your browser</li>
              <li>No user accounts, no tracking cookies</li>
              <li>Anonymous analytics only with your consent (data stays on your device)</li>
              <li>We do not share your information with third parties</li>
              <li>You can export or delete your data at any time</li>
            </ul>
          </section>

          {/* Sections */}
          <section>
            <h2 className="text-xl font-display font-semibold text-neutral-900 mb-3">
              1. Data We Collect
            </h2>
            <p className="text-neutral-700 leading-relaxed mb-3">
              We collect <strong>no personal data</strong>. The app runs entirely in your browser.
            </p>
            <h3 className="text-base font-medium text-neutral-800 mb-2">
              Data stored locally on your device:
            </h3>
            <ul className="text-neutral-600 text-sm space-y-1 list-disc list-inside ml-2">
              <li>Trip plans (waypoints, routes, itineraries)</li>
              <li>Vehicle profile settings (dimensions, fuel type)</li>
              <li>App preferences (language, map settings)</li>
              <li>Onboarding progress</li>
              <li>Anonymous usage analytics (with your consent only)</li>
            </ul>
            <p className="text-neutral-600 text-sm mt-3">
              This data is stored in your browser&apos;s localStorage and IndexedDB. It never leaves
              your device unless you explicitly export it.
            </p>
            <p className="text-neutral-600 text-sm mt-2">
              With your consent, we collect anonymous usage data stored locally on your device. This
              data never leaves your browser and can be viewed, exported, or deleted at any time
              from the{' '}
              <Link to="/settings" className="text-primary-600 underline">
                Settings page
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-neutral-900 mb-3">
              2. Third-Party Services
            </h2>
            <p className="text-neutral-700 leading-relaxed mb-3">
              The app uses the following external services to provide functionality. These services
              may receive limited, non-personal technical data (such as search coordinates) as part
              of normal operation:
            </p>
            <ul className="text-neutral-600 text-sm space-y-2 ml-2">
              <li>
                <strong>OpenStreetMap / Leaflet</strong> &mdash; map tile rendering. Subject to the{' '}
                <a
                  href="https://wiki.osmfoundation.org/wiki/Privacy_Policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 underline"
                >
                  OSM Foundation Privacy Policy
                </a>
                .
              </li>
              <li>
                <strong>OpenRouteService</strong> &mdash; route calculation with vehicle
                restrictions.
              </li>
              <li>
                <strong>Overpass API</strong> &mdash; campsite data from OpenStreetMap.
              </li>
              <li>
                <strong>Nominatim</strong> &mdash; location search / geocoding.
              </li>
              <li>
                <strong>Cloudflare Web Analytics</strong> &mdash; we use Cloudflare Web Analytics to
                understand how visitors use our site. This service does not use cookies, does not
                track individuals, and does not collect personal data. It provides aggregate
                statistics only (page views, referrers, countries).
              </li>
            </ul>
            <p className="text-neutral-600 text-sm mt-3">
              We do not send personal information to any of these services. Only technical data
              necessary for the service (e.g. coordinates for route calculation) is transmitted.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-neutral-900 mb-3">
              3. Affiliate Links
            </h2>
            <p className="text-neutral-700 leading-relaxed mb-3">
              The app may display links to third-party booking platforms (such as Booking.com,
              Eurocampings, and camping.info) and product retailers (such as Amazon). These links
              contain affiliate tracking parameters so that we may earn a small commission if you
              make a booking or purchase.
            </p>
            <p className="text-neutral-600 text-sm">
              Clicking an affiliate link will take you to the third party&apos;s website, which is
              governed by their own privacy policy. We do not track your clicks, browsing, or
              purchases. See our{' '}
              <Link to="/affiliate-disclosure" className="text-primary-600 underline">
                Affiliate Disclosure
              </Link>{' '}
              for more details.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-neutral-900 mb-3">4. Cookies</h2>
            <p className="text-neutral-700 leading-relaxed">
              We do not use cookies. The app uses browser localStorage and IndexedDB for local data
              storage. These are not cookies and are not transmitted to any server. Our analytics
              provider (Cloudflare Web Analytics) also does not use cookies. Third-party map tile
              providers may set their own cookies according to their privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-neutral-900 mb-3">
              5. Your Rights (GDPR)
            </h2>
            <p className="text-neutral-700 leading-relaxed mb-3">
              Since we do not collect or store any personal data on our servers, most GDPR data
              subject requests do not apply. However, you have full control over your locally stored
              data:
            </p>
            <ul className="text-neutral-600 text-sm space-y-1 list-disc list-inside ml-2">
              <li>
                <strong>Access:</strong> All your data is visible in the app at all times
              </li>
              <li>
                <strong>Export:</strong> You can export your trips as GPX, JSON, KML, or CSV
              </li>
              <li>
                <strong>Deletion:</strong> Clear your browser data or use the app&apos;s data
                management tools
              </li>
              <li>
                <strong>Portability:</strong> Export your data in standard formats at any time
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-neutral-900 mb-3">
              6. Children&apos;s Privacy
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              The app does not knowingly collect any data from children or any other users. No
              registration or personal information is required to use the app.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-neutral-900 mb-3">
              7. Changes to This Policy
            </h2>
            <p className="text-neutral-700 leading-relaxed">
              We may update this privacy policy from time to time. Any changes will be reflected on
              this page with an updated &quot;last updated&quot; date. Since we do not collect email
              addresses, we cannot notify you directly of changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-neutral-900 mb-3">8. Contact</h2>
            <p className="text-neutral-700 leading-relaxed">
              If you have questions about this privacy policy, you can open an issue on our{' '}
              <a
                href="https://github.com/AlphaBravoAlpha/camper-planner"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 underline"
              >
                GitHub repository
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
