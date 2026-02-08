// Help Page
// User documentation, getting started guide, and feature overview

import React from 'react';
import { Link } from 'react-router-dom';
import { useOnboarding } from '../hooks/useOnboarding';
import { useNavigate } from 'react-router-dom';
import {
  PlayCircle, MapPin, Route, Tent, Truck, Download,
  Calculator, Search, ChevronRight, HelpCircle,
  Compass, Fuel
} from 'lucide-react';

const FEATURES = [
  {
    icon: MapPin,
    title: 'Add Waypoints',
    description: 'Click anywhere on the map to add stops. Drag to reorder your route.',
  },
  {
    icon: Route,
    title: 'Calculate Routes',
    description: 'Get camper-safe directions that respect your vehicle dimensions.',
  },
  {
    icon: Tent,
    title: 'Find Campsites',
    description: 'Search thousands of campsites, aires, and caravan parks across Europe.',
  },
  {
    icon: Truck,
    title: 'Vehicle Profile',
    description: 'Set your height, width, weight, and length for safe routing.',
  },
  {
    icon: Download,
    title: 'Export Routes',
    description: 'Download your route as GPX, KML, or JSON for your GPS device.',
  },
  {
    icon: Calculator,
    title: 'Cost Calculator',
    description: 'Estimate fuel costs, campsite fees, and total trip budget.',
  },
];

const VEHICLES = [
  {
    title: 'Motorhomes',
    description: 'A-Class, C-Class, and integrated motorhomes of all sizes.',
    emoji: '🏠',
  },
  {
    title: 'Campervans',
    description: 'VW California, Mercedes Marco Polo, Ford Nugget, and custom conversions.',
    emoji: '🚐',
  },
  {
    title: 'Caravans',
    description: 'Touring caravans with tow vehicles — we calculate combined dimensions.',
    emoji: '🏕️',
  },
];

const STEPS = [
  {
    number: '1',
    title: 'Set up your vehicle',
    description: 'Click the vehicle button and enter your dimensions, or pick from our database of popular models.',
  },
  {
    number: '2',
    title: 'Plan your route',
    description: 'Click the map to add waypoints, or use the search bar to find places. Drag waypoints to reorder.',
  },
  {
    number: '3',
    title: 'Find campsites',
    description: 'Toggle the campsite layer to discover sites along your route. Filter by amenities, type, or distance.',
  },
  {
    number: '4',
    title: 'Export & go',
    description: 'Export your route to GPX for your satnav, calculate costs, and hit the road.',
  },
];

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
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
              How can we help?
            </h1>
            <p className="text-lg sm:text-xl text-primary-100 max-w-2xl mx-auto leading-relaxed">
              Everything you need to plan your perfect European camper trip,
              from first click to the open road.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Tutorial CTA Card */}
        <div className="bg-gradient-to-br from-accent-50 to-accent-100 rounded-2xl shadow-soft p-8 mb-12 -mt-8 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-14 h-14 bg-accent-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <PlayCircle className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-accent-900 mb-1">
                New here? Take the interactive tutorial
              </h2>
              <p className="text-accent-800 leading-relaxed">
                Our guided walkthrough shows you how to plan a trip in under 2 minutes.
                You can restart it any time.
              </p>
            </div>
            <button
              onClick={handleShowTutorial}
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent-500 text-white rounded-xl font-semibold hover:bg-accent-600 transition-all duration-200 shadow-sm hover:shadow-medium active:scale-[0.97] flex-shrink-0"
            >
              Start Tutorial
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6 text-center">
            How it works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((step) => (
              <div
                key={step.number}
                className="bg-white rounded-2xl shadow-soft p-6 hover:shadow-medium hover:-translate-y-1 transition-all duration-200 relative"
              >
                <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center mb-4 text-white font-bold text-lg shadow-sm">
                  {step.number}
                </div>
                <h3 className="text-base font-semibold text-neutral-900 mb-1.5">
                  {step.title}
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6 text-center">
            What you can do
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-white rounded-2xl shadow-soft p-6 hover:shadow-medium hover:-translate-y-1 transition-all duration-200"
                >
                  <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <h3 className="text-base font-semibold text-neutral-900 mb-1.5">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-neutral-500 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vehicle Compatibility */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6 text-center">
            Built for every camping vehicle
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {VEHICLES.map((vehicle) => (
              <div
                key={vehicle.title}
                className="bg-white rounded-2xl shadow-soft p-6 hover:shadow-medium hover:-translate-y-0.5 transition-all duration-200 text-center"
              >
                <div className="text-3xl mb-3">{vehicle.emoji}</div>
                <h3 className="text-base font-semibold text-neutral-900 mb-1.5">
                  {vehicle.title}
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  {vehicle.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Tips Section */}
        <div className="bg-white rounded-2xl shadow-soft p-8 mb-12">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Compass className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900 mb-3">
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

        {/* Countries Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6 text-center">
            Covering all of Europe
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              'France', 'Spain', 'Italy', 'Germany',
              'Portugal', 'Norway', 'Sweden', 'Croatia',
              'Greece', 'Netherlands', 'Switzerland', 'Austria',
              'Denmark', 'Finland', 'Poland', 'UK',
            ].map((country) => (
              <div
                key={country}
                className="bg-white rounded-xl shadow-soft px-4 py-3 text-center text-sm font-medium text-neutral-700 hover:shadow-medium hover:-translate-y-0.5 transition-all duration-200"
              >
                {country}
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-neutral-400 mt-3">
            ...and many more including Ireland, Czech Republic, Hungary, Romania, Belgium, and beyond.
          </p>
        </div>

        {/* CTA */}
        <div className="text-center bg-white rounded-2xl shadow-soft p-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-3">Ready to plan your trip?</h2>
          <p className="text-neutral-500 mb-6">
            Jump in and start adding waypoints — no sign-up, no fees, just open road ahead.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all duration-200 shadow-sm hover:shadow-medium active:scale-[0.97]"
            >
              Open the Planner
              <ChevronRight className="w-5 h-5" />
            </Link>
            <button
              onClick={handleShowTutorial}
              className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-100 text-neutral-700 rounded-xl font-semibold hover:bg-neutral-200 transition-all duration-200"
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
