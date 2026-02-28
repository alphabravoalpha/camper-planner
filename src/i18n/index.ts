// Internationalization Setup
// React-i18next configuration for multi-language support

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import locale files
import en from './locales/en';
import de from './locales/de';
import fr from './locales/fr';
import es from './locales/es';
import it from './locales/it';

// Translation resources
const resources = {
  en,
  de,
  fr,
  es,
  it,
};

// Initialize i18next with browser language detection
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'de', 'fr', 'es', 'it'],

    // Browser language detection options
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'camper-planner-language',
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // Namespace configuration
    defaultNS: 'translation',

    // Development settings
    debug: import.meta.env.DEV,

    // React specific options
    react: {
      useSuspense: false,
    },

    // Load missing keys in development
    saveMissing: import.meta.env.DEV,
    missingKeyHandler: (_lng, _ns, key) => {
      if (import.meta.env.DEV) {
        console.warn(`Missing translation key: ${key}`); // eslint-disable-line no-console
      }
    },
  });

export default i18n;
