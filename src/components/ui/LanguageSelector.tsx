// Language Selector Component
// Dropdown selector for language switching

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FeatureFlags } from '@/config';
import { cn } from '@/utils/cn';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const supportedLanguages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
];

interface LanguageSelectorProps {
  variant?: 'button' | 'dropdown';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'dropdown',
  size = 'md',
  className
}) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = supportedLanguages.find(lang => lang.code === i18n.language) || supportedLanguages[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLanguageChange = (languageCode: string) => {
    if (FeatureFlags.MULTI_LANGUAGE_COMPLETE) {
      i18n.changeLanguage(languageCode);
    }
    setIsOpen(false);
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-3',
  };

  // Simple button variant (when translations are not ready)
  if (variant === 'button' || !FeatureFlags.MULTI_LANGUAGE_COMPLETE) {
    return (
      <button
        type="button"
        className={cn(
          'flex items-center space-x-1 rounded-md font-medium transition-colors',
          FeatureFlags.MULTI_LANGUAGE_COMPLETE
            ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            : 'text-gray-400 cursor-not-allowed',
          sizeClasses[size],
          className
        )}
        disabled={!FeatureFlags.MULTI_LANGUAGE_COMPLETE}
        title={FeatureFlags.MULTI_LANGUAGE_COMPLETE ? 'Select language' : 'Language selection coming soon'}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
          />
        </svg>
        <span>{currentLanguage.code.toUpperCase()}</span>
      </button>
    );
  }

  // Full dropdown variant (when translations are ready)
  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center space-x-2 rounded-md font-medium transition-colors',
          'text-gray-700 hover:text-gray-900 hover:bg-gray-100',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
          sizeClasses[size]
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="text-base">{currentLanguage.flag}</span>
        <span>{currentLanguage.code.toUpperCase()}</span>
        <svg
          className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1" role="menu">
            {supportedLanguages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={cn(
                  'flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors',
                  language.code === currentLanguage.code && 'bg-blue-50 text-blue-700'
                )}
                role="menuitem"
              >
                <span className="text-base mr-3">{language.flag}</span>
                <div className="flex-1">
                  <div className="font-medium">{language.nativeName}</div>
                  <div className="text-xs text-gray-500">{language.name}</div>
                </div>
                {language.code === currentLanguage.code && (
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-4 py-2">
            <p className="text-xs text-gray-500 text-center">
              Missing your language?{' '}
              <a href="/help" className="text-blue-600 hover:text-blue-500">
                Let us know
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;