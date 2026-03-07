// Help Page
// Practical user guide with step-by-step instructions and FAQ

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOnboarding } from '../hooks/useOnboarding';
import { useNavigate } from 'react-router-dom';
import {
  PlayCircle,
  ChevronRight,
  HelpCircle,
  Compass,
  ChevronDown,
  MessageSquare,
  Heart,
} from 'lucide-react';
import SEOHead from '../components/seo/SEOHead';

const STEP_KEYS = [
  { number: '1', titleKey: 'help.step1Title', descKey: 'help.step1Desc' },
  { number: '2', titleKey: 'help.step2Title', descKey: 'help.step2Desc' },
  { number: '3', titleKey: 'help.step3Title', descKey: 'help.step3Desc' },
  { number: '4', titleKey: 'help.step4Title', descKey: 'help.step4Desc' },
];

const FAQ_KEYS = [
  { qKey: 'help.faq1Q', aKey: 'help.faq1A' },
  { qKey: 'help.faq2Q', aKey: 'help.faq2A' },
  { qKey: 'help.faq3Q', aKey: 'help.faq3A' },
  { qKey: 'help.faq4Q', aKey: 'help.faq4A' },
  { qKey: 'help.faq5Q', aKey: 'help.faq5A' },
  { qKey: 'help.faq6Q', aKey: 'help.faq6A' },
  { qKey: 'help.faq7Q', aKey: 'help.faq7A' },
  { qKey: 'help.faq8Q', aKey: 'help.faq8A' },
];

const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-neutral-50 transition-colors"
      >
        <span className="text-sm font-display font-semibold text-neutral-900">{question}</span>
        <ChevronDown
          className={`w-4 h-4 text-neutral-400 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-4 pb-4 text-sm text-neutral-600 leading-relaxed animate-fade-in">
          {answer}
        </div>
      )}
    </div>
  );
};

const HelpPage: React.FC = () => {
  const { t } = useTranslation();
  const { resetOnboarding } = useOnboarding();
  const navigate = useNavigate();

  const handleShowTutorial = () => {
    resetOnboarding();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-neutral-50 animate-fade-in">
      <SEOHead
        title="Help & FAQ — European Camper Trip Planner"
        description="Get help with route planning, campsite search, vehicle setup, and GPX export. Frequently asked questions about European Camper Trip Planner."
        url="https://camperplanning.com/help"
      />
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-700 to-primary-900 text-white">
        <img
          src="/images/hero-help.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay"
          loading="lazy"
        />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
              <HelpCircle className="w-4 h-4" />
              {t('help.hero.badge')}
            </div>
            <h1 className="text-4xl sm:text-5xl font-display font-bold mb-4 tracking-tight">
              {t('help.hero.title')}
            </h1>
            <p className="text-lg sm:text-xl text-primary-100 max-w-2xl mx-auto leading-relaxed">
              {t('help.hero.subtitle')}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Tutorial CTA Card */}
        <div className="bg-gradient-to-br from-accent-50 to-accent-100 rounded-xl shadow-soft p-8 mb-12 -mt-8 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-14 h-14 bg-accent-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <PlayCircle className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-display font-bold text-accent-900 mb-1">
                {t('help.tutorialTitle')}
              </h2>
              <p className="text-accent-800 leading-relaxed">{t('help.tutorialDesc')}</p>
            </div>
            <button
              onClick={handleShowTutorial}
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent-500 text-white rounded-lg font-display font-semibold hover:bg-accent-600 transition-all duration-200 shadow-sm hover:shadow-medium active:scale-[0.97] flex-shrink-0"
            >
              {t('help.startTutorial')}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-12">
          <h2 className="text-2xl font-display font-bold text-neutral-900 mb-6 text-center">
            {t('help.howItWorks')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEP_KEYS.map(step => (
              <div
                key={step.number}
                className="bg-white rounded-xl shadow-soft p-6 hover:shadow-medium hover:-translate-y-1 transition-all duration-200 relative"
              >
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center mb-4 text-white font-display font-bold text-lg shadow-sm">
                  {step.number}
                </div>
                <h3 className="text-base font-display font-semibold text-neutral-900 mb-1.5">
                  {t(step.titleKey)}
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{t(step.descKey)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pro Tips */}
        <div className="bg-white rounded-xl shadow-soft p-8 mb-12">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Compass className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-neutral-900 mb-3">
                {t('help.proTips')}
              </h2>
              <ul className="space-y-2.5 text-neutral-600 leading-relaxed">
                {[1, 2, 3, 4, 5].map(i => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                    <span>
                      <strong>{t(`help.proTip${i}Label`)}</strong> {t(`help.proTip${i}Text`)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-display font-bold text-neutral-900 mb-6 text-center">
            {t('help.faqTitle')}
          </h2>
          <div className="space-y-3 max-w-3xl mx-auto">
            {FAQ_KEYS.map(item => (
              <FAQItem key={item.qKey} question={t(item.qKey)} answer={t(item.aKey)} />
            ))}
          </div>
        </div>

        {/* Help Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-12">
          <Link
            to="/feedback"
            className="bg-white rounded-xl shadow-soft p-6 hover:shadow-medium hover:-translate-y-1 transition-all duration-200 group"
          >
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="text-base font-display font-semibold text-neutral-900 mb-1 group-hover:text-primary-700 transition-colors">
                  {t('help.shareFeedbackTitle')}
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  {t('help.shareFeedbackDesc')}
                </p>
              </div>
            </div>
          </Link>
          <Link
            to="/support"
            className="bg-white rounded-xl shadow-soft p-6 hover:shadow-medium hover:-translate-y-1 transition-all duration-200 group"
          >
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 bg-accent-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Heart className="w-5 h-5 text-accent-600" />
              </div>
              <div>
                <h3 className="text-base font-display font-semibold text-neutral-900 mb-1 group-hover:text-accent-700 transition-colors">
                  {t('help.supportProjectTitle')}
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  {t('help.supportProjectDesc')}
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* CTA */}
        <div className="text-center bg-white rounded-xl shadow-soft p-8">
          <h2 className="text-2xl font-display font-bold text-neutral-900 mb-3">
            {t('help.ctaTitle')}
          </h2>
          <p className="text-neutral-500 mb-6">{t('help.ctaText')}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-display font-semibold hover:bg-primary-700 transition-all duration-200 shadow-sm hover:shadow-medium active:scale-[0.97]"
            >
              {t('common.openPlanner')}
              <ChevronRight className="w-5 h-5" />
            </Link>
            <button
              onClick={handleShowTutorial}
              className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-100 text-neutral-700 rounded-lg font-display font-semibold hover:bg-neutral-200 transition-all duration-200"
            >
              <PlayCircle className="w-5 h-5" />
              {t('help.watchTutorial')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
