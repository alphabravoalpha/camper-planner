// Help Page
// Practical user guide with step-by-step instructions and FAQ

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useOnboarding } from '../hooks/useOnboarding';
import { useNavigate } from 'react-router-dom';
import {
  PlayCircle, ChevronRight, HelpCircle,
  Compass, ChevronDown, MessageSquare, Heart
} from 'lucide-react';

const STEPS = [
  {
    number: '1',
    title: 'Set up your vehicle',
    description: 'Click the vehicle badge in the header (or the vehicle button on the map) and enter your height, width, weight, and length. This ensures routes avoid low bridges, narrow roads, and weight-restricted areas.',
  },
  {
    number: '2',
    title: 'Plan your route',
    description: 'Right-click on the map to add waypoints, or use the search bar to find cities and landmarks. Drag waypoints to reorder your stops. Routes calculate automatically.',
  },
  {
    number: '3',
    title: 'Find campsites along the way',
    description: 'Click the campsite toggle (tent icon) on the map to see nearby campsites, aires, and caravan parks. Use filters to narrow by amenities like electricity, WiFi, or waste disposal.',
  },
  {
    number: '4',
    title: 'Export & go',
    description: 'Open the planning tools panel to export your route as GPX for your satnav, estimate fuel costs with the cost calculator, or save your trip for later.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'How do I add stops to my route?',
    answer: 'Right-click anywhere on the map to add a waypoint, or use the search bar at the top of the map to find a city, town, or point of interest. You can also click "Plan a Trip" to use the trip planning wizard.',
  },
  {
    question: 'How do I reorder my stops?',
    answer: 'Open the waypoint list (sidebar on desktop, or the list icon on mobile) and drag waypoints up or down to reorder them. You can also use the route optimizer in the planning tools to find the most efficient order automatically.',
  },
  {
    question: 'Why should I set up a vehicle profile?',
    answer: 'Your vehicle dimensions (height, width, weight, length) are sent to the routing engine so it can avoid roads with low bridges, weight restrictions, or narrow passages. Without a profile, you get standard car routing which may take you down unsuitable roads.',
  },
  {
    question: 'How do I export my route to a GPS device?',
    answer: 'Open the planning tools panel (the tools icon on the right side of the map), then click "Export Route". You can download as GPX (for most satnavs), KML (for Google Earth), or JSON (for backup). Transfer the GPX file to your device via USB or Bluetooth.',
  },
  {
    question: 'Is my data safe? Where is it stored?',
    answer: 'All your data — trips, vehicle profiles, preferences — is stored locally in your browser using localStorage. Nothing is sent to any server. You can export a backup from the Settings page and clear your data at any time.',
  },
  {
    question: 'How accurate are the campsite locations?',
    answer: 'Campsite data comes from OpenStreetMap, which is community-maintained. Most major campsites are listed with accurate coordinates, but smaller or newer sites may be missing or have limited details. If you find an error, you can contribute to OpenStreetMap directly.',
  },
  {
    question: 'Can I plan trips across multiple countries?',
    answer: 'Yes — the planner covers 40+ European countries. Add waypoints across borders and the routing engine handles the rest, including ferry crossings where available.',
  },
  {
    question: 'Does it work offline?',
    answer: 'The app loads in your browser and retains your saved data offline. However, map tiles, routing calculations, and campsite searches require an internet connection. Your saved trips and vehicle profile are always available offline.',
  },
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
  const { resetOnboarding } = useOnboarding();
  const navigate = useNavigate();

  const handleShowTutorial = () => {
    resetOnboarding();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-neutral-50 animate-fade-in">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-700 to-primary-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
              <HelpCircle className="w-4 h-4" />
              Help & Getting Started
            </div>
            <h1 className="text-4xl sm:text-5xl font-display font-bold mb-4 tracking-tight">
              How can we help?
            </h1>
            <p className="text-lg sm:text-xl text-primary-100 max-w-2xl mx-auto leading-relaxed">
              Step-by-step guides and answers to common questions
              about planning your European camper trip.
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
                New here? Take the interactive tutorial
              </h2>
              <p className="text-accent-800 leading-relaxed">
                Our guided walkthrough shows you how to plan a trip in under 2 minutes.
                You can restart it any time.
              </p>
            </div>
            <button
              onClick={handleShowTutorial}
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent-500 text-white rounded-lg font-display font-semibold hover:bg-accent-600 transition-all duration-200 shadow-sm hover:shadow-medium active:scale-[0.97] flex-shrink-0"
            >
              Start Tutorial
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-12">
          <h2 className="text-2xl font-display font-bold text-neutral-900 mb-6 text-center">
            How it works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((step) => (
              <div
                key={step.number}
                className="bg-white rounded-xl shadow-soft p-6 hover:shadow-medium hover:-translate-y-1 transition-all duration-200 relative"
              >
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center mb-4 text-white font-display font-bold text-lg shadow-sm">
                  {step.number}
                </div>
                <h3 className="text-base font-display font-semibold text-neutral-900 mb-1.5">
                  {step.title}
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  {step.description}
                </p>
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
                Pro tips
              </h2>
              <ul className="space-y-2.5 text-neutral-600 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  Use the <strong>search bar</strong> to quickly find cities, towns, and points of interest.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  Set your <strong>vehicle profile</strong> before calculating routes — bridges and tunnels are checked against your dimensions.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  Use <strong>route optimization</strong> to find the most efficient order for multiple stops.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  Filter campsites by <strong>amenities</strong> — electricity, WiFi, showers, water, and waste disposal.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  Your data is <strong>saved locally</strong> in your browser — no account needed, nothing leaves your device.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-display font-bold text-neutral-900 mb-6 text-center">
            Frequently asked questions
          </h2>
          <div className="space-y-3 max-w-3xl mx-auto">
            {FAQ_ITEMS.map((item) => (
              <FAQItem key={item.question} question={item.question} answer={item.answer} />
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
                  Share feedback
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  Report a bug, suggest a feature, or let us know what you think.
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
                  Support the project
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  Help keep the app free by buying us a coffee on Ko-fi.
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* CTA */}
        <div className="text-center bg-white rounded-xl shadow-soft p-8">
          <h2 className="text-2xl font-display font-bold text-neutral-900 mb-3">Ready to plan your trip?</h2>
          <p className="text-neutral-500 mb-6">
            Jump in and start adding waypoints — no sign-up, no fees, just open road ahead.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-display font-semibold hover:bg-primary-700 transition-all duration-200 shadow-sm hover:shadow-medium active:scale-[0.97]"
            >
              Open the Planner
              <ChevronRight className="w-5 h-5" />
            </Link>
            <button
              onClick={handleShowTutorial}
              className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-100 text-neutral-700 rounded-lg font-display font-semibold hover:bg-neutral-200 transition-all duration-200"
            >
              <PlayCircle className="w-5 h-5" />
              Watch Tutorial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
