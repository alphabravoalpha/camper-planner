// Internationalization Setup
// React-i18next configuration for multi-language support

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { FeatureFlags } from '../config';

// Translation resources
const resources = {
  en: {
    translation: {
      // App Navigation
      nav: {
        planner: 'Trip Planner',
        about: 'About',
        help: 'Help',
        settings: 'Settings',
      },

      // Map Interface
      map: {
        title: 'European Camper Trip Planner',
        addWaypoint: 'Click map to add waypoint',
        removeWaypoint: 'Remove waypoint',
        clearRoute: 'Clear route',
        optimizeRoute: 'Optimize route',
      },

      // Vehicle Profile
      vehicle: {
        title: 'Vehicle Profile',
        height: 'Height (m)',
        width: 'Width (m)',
        weight: 'Weight (t)',
        length: 'Length (m)',
        save: 'Save Profile',
        clear: 'Clear Profile',
      },

      // Route Planning
      route: {
        title: 'Route Planning',
        distance: 'Total Distance',
        duration: 'Estimated Time',
        waypoints: 'Waypoints',
        export: 'Export Route',
        save: 'Save Trip',
      },

      // Campsites
      campsites: {
        title: 'Campsites',
        campsite: 'Campsite',
        aire: 'Aire',
        parking: 'Parking',
        filter: 'Filter',
        showAll: 'Show All',
      },

      // Common Actions
      actions: {
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        close: 'Close',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
      },

      // Error Messages
      errors: {
        routeCalculation: 'Failed to calculate route',
        vehicleValidation: 'Invalid vehicle dimensions',
        networkError: 'Network connection error',
        apiKeyMissing: 'API key not configured',
      },

      // Success Messages
      success: {
        tripSaved: 'Trip saved successfully',
        routeOptimized: 'Route optimized',
        profileSaved: 'Vehicle profile saved',
      },
    },
  },
};

// Initialize i18next
i18n.use(initReactI18next).init({
  resources,
  lng: 'en', // Default language
  fallbackLng: 'en',

  // Feature flag: Only English in V1
  supportedLngs: FeatureFlags.MULTI_LANGUAGE_COMPLETE ? ['en', 'de', 'fr', 'es', 'it'] : ['en'],

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
