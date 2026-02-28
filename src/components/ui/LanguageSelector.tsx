// Language Selector Component
// Dropdown selector for language switching

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

const supportedLanguages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'fr', name: 'French', nativeName: 'Fran\u00e7ais' },
  { code: 'es', name: 'Spanish', nativeName: 'Espa\u00f1ol' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
];

interface LanguageSelectorProps {
  variant?: 'button' | 'dropdown';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'dropdown',
  size = 'md',
  className,
}) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage =
    supportedLanguages.find(lang => lang.code === i18n.language) || supportedLanguages[0];

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
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-3',
  };

  // Simple button variant
  if (variant === 'button') {
    return (
      <button
        type="button"
        className={cn(
          'flex items-center gap-1.5 rounded-md font-medium transition-colors',
          'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100',
          sizeClasses[size],
          className
        )}
        onClick={() => setIsOpen(!isOpen)}
        title="Select language"
      >
        <Globe className="w-4 h-4" />
        <span>{currentLanguage.code.toUpperCase()}</span>
      </button>
    );
  }

  // Full dropdown variant
  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1.5 rounded-md font-medium transition-colors',
          'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
          sizeClasses[size]
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Select language"
      >
        <Globe className="w-4 h-4" />
        <span>{currentLanguage.code.toUpperCase()}</span>
        <svg
          className={cn('w-3 h-3 transition-transform', isOpen && 'rotate-180')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1" role="menu">
            {supportedLanguages.map(language => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={cn(
                  'flex items-center w-full px-3 py-2 text-sm text-left hover:bg-neutral-50 transition-colors',
                  language.code === currentLanguage.code && 'bg-primary-50 text-primary-700'
                )}
                role="menuitem"
              >
                <div className="flex-1">
                  <div className="font-medium">{language.nativeName}</div>
                  {language.nativeName !== language.name && (
                    <div className="text-xs text-neutral-500">{language.name}</div>
                  )}
                </div>
                {language.code === currentLanguage.code && (
                  <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
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
          <div className="border-t border-neutral-100 px-3 py-2">
            <p className="text-xs text-neutral-500 text-center">
              Missing your language?{' '}
              <a href="/help" className="text-primary-600 hover:text-primary-500">
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
