// Analytics Consent Banner
// GDPR-compliant consent UI for local analytics

import React from 'react';
import { useConsentBanner } from '../../utils/analytics';
import { FeatureFlags } from '../../config';

const ConsentBanner: React.FC = () => {
  const { showBanner, acceptConsent, rejectConsent } = useConsentBanner();

  if (!showBanner || !FeatureFlags.ANALYTICS) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 pointer-events-none">
      <div className="max-w-lg mx-auto bg-white shadow-lg rounded-lg border border-neutral-200 p-4 pointer-events-auto animate-fade-in">
        <p className="text-sm text-neutral-700 mb-3">
          We use local analytics to improve this tool. No data leaves your browser.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={acceptConsent}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            Accept
          </button>
          <button
            onClick={rejectConsent}
            className="px-4 py-2 border border-neutral-300 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsentBanner;
