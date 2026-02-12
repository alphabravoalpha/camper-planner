// Trip Planning Wizard
// Step-by-step modal for creating a complete multi-day trip itinerary

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  X, MapPin, Calendar, Car, Ship, Route, ChevronRight, ChevronLeft,
  Loader2, AlertTriangle, Check, ExternalLink, ArrowLeftRight,
  Sun, Snowflake, Leaf, CloudRain, Clock, Tent, Star, Wifi,
  Zap, Droplets, ShowerHead, Scale, Rocket, TrainFront, Lightbulb,
} from 'lucide-react';
import { useTripWizardStore, useVehicleStore, useRouteStore } from '../../store';
import { TripWizardService, DRIVING_STYLE_LIMITS, type DrivingStyle, type CampsiteOption } from '../../services/TripWizardService';
import { campsiteService } from '../../services/CampsiteService';
import { CHANNEL_CROSSINGS, type ChannelCrossing, needsChannelCrossing } from '../../data/channelCrossings';
import { type Waypoint } from '../../types';

// ============================================
// Wizard Step Components
// ============================================

const STEPS = [
  { id: 'start-end', label: 'Route', icon: MapPin },
  { id: 'dates', label: 'Dates', icon: Calendar },
  { id: 'driving', label: 'Driving', icon: Car },
  { id: 'crossing', label: 'Crossing', icon: Ship },
  { id: 'itinerary', label: 'Itinerary', icon: Route },
];

// ============================================
// Main Wizard Component
// ============================================

const TripWizard: React.FC = () => {
  const wizard = useTripWizardStore();
  const { profile: vehicleProfile } = useVehicleStore();
  const routeStore = useRouteStore();

  // Determine if crossing step is needed
  const needsCrossing = wizard.start && wizard.end
    ? needsChannelCrossing(wizard.start.lat, wizard.start.lng, wizard.end.lat, wizard.end.lng)
    : false;

  // Build visible steps (skip crossing if not needed)
  const visibleSteps = STEPS.filter(step =>
    step.id !== 'crossing' || needsCrossing
  );

  const currentStepId = visibleSteps[wizard.wizardStep]?.id || 'start-end';
  const isLastStep = wizard.wizardStep === visibleSteps.length - 1;
  const isFirstStep = wizard.wizardStep === 0;

  // Can proceed to next step?
  const canProceed = (() => {
    switch (currentStepId) {
      case 'start-end': return !!(wizard.start && wizard.end);
      case 'dates': return !!wizard.startDate;
      case 'driving': return true; // always has a default
      case 'crossing': return needsCrossing ? !!wizard.crossing : true;
      case 'itinerary': return !!wizard.itinerary;
      default: return false;
    }
  })();

  // Handle generating itinerary when reaching the last step
  const handleNext = useCallback(async () => {
    if (isLastStep) return;

    const nextStepIndex = wizard.wizardStep + 1;
    const nextStepId = visibleSteps[nextStepIndex]?.id;

    // If moving to itinerary step, generate the itinerary
    if (nextStepId === 'itinerary' && wizard.start && wizard.end && wizard.startDate) {
      wizard.setStep(nextStepIndex);
      wizard.setIsGenerating(true);
      wizard.setGenerationError(null);

      try {
        const itinerary = await TripWizardService.generateItinerary({
          start: wizard.start,
          end: wizard.end,
          startDate: wizard.startDate,
          endDate: wizard.endDate || undefined,
          drivingStyle: wizard.drivingStyle,
          crossing: wizard.crossing || undefined,
          restDayFrequency: wizard.restDayFrequency,
          vehicleProfile: vehicleProfile || undefined,
        });
        wizard.setItinerary(itinerary);
      } catch (error: any) {
        wizard.setGenerationError(error.message || 'Failed to generate itinerary');
      } finally {
        wizard.setIsGenerating(false);
      }
    } else {
      wizard.setStep(nextStepIndex);
    }
  }, [wizard, visibleSteps, isLastStep, vehicleProfile]);

  // Handle creating the trip (adding waypoints to the route)
  const handleCreateTrip = useCallback(() => {
    if (!wizard.itinerary) return;

    // Clear existing route
    routeStore.clearRoute();

    // Add waypoints from itinerary
    const waypoints: Waypoint[] = [];

    wizard.itinerary.days.forEach((day, index) => {
      // Add start of first day
      if (index === 0) {
        waypoints.push({
          id: `trip-${Date.now()}-start`,
          lat: day.start.lat,
          lng: day.start.lng,
          type: 'start',
          name: day.start.name,
        });
      }

      // Add overnight campsite (if selected and not last day)
      if (day.selectedOvernight && index < wizard.itinerary!.days.length - 1) {
        waypoints.push({
          id: `trip-${Date.now()}-camp-${index}`,
          lat: day.selectedOvernight.campsite.lat,
          lng: day.selectedOvernight.campsite.lng,
          type: 'campsite',
          name: day.selectedOvernight.campsite.name,
        });
      }

      // Add end of last day
      if (index === wizard.itinerary!.days.length - 1) {
        waypoints.push({
          id: `trip-${Date.now()}-end`,
          lat: day.end.lat,
          lng: day.end.lng,
          type: 'end',
          name: day.end.name,
        });
      }
    });

    // Add all waypoints to the route store
    waypoints.forEach(wp => routeStore.addWaypoint(wp));

    // Close wizard
    wizard.closeWizard();
    wizard.resetWizard();
  }, [wizard, routeStore]);

  if (!wizard.wizardOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h2 className="text-xl font-display font-bold text-neutral-900">Plan Your Trip</h2>
          <button
            onClick={() => { wizard.closeWizard(); wizard.resetWizard(); }}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-all duration-200"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            {visibleSteps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === wizard.wizardStep;
              const isCompleted = index < wizard.wizardStep;

              return (
                <React.Fragment key={step.id}>
                  {index > 0 && (
                    <div className={`flex-1 h-0.5 ${isCompleted ? 'bg-primary-500' : 'bg-neutral-200'}`} />
                  )}
                  <button
                    onClick={() => index < wizard.wizardStep && wizard.setStep(index)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-200'
                        : isCompleted
                        ? 'bg-primary-50 text-primary-600 hover:bg-primary-100 cursor-pointer'
                        : 'text-neutral-400'
                    }`}
                    disabled={index > wizard.wizardStep}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">{step.label}</span>
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {currentStepId === 'start-end' && <StepStartEnd />}
          {currentStepId === 'dates' && <StepDates />}
          {currentStepId === 'driving' && <StepDrivingStyle />}
          {currentStepId === 'crossing' && <StepCrossing />}
          {currentStepId === 'itinerary' && <StepItinerary onCreateTrip={handleCreateTrip} />}
        </div>

        {/* Footer */}
        {currentStepId !== 'itinerary' && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100">
            <button
              onClick={() => wizard.prevStep()}
              disabled={isFirstStep}
              className="flex items-center gap-2 px-4 py-2 text-neutral-600 hover:text-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className="flex items-center gap-2 px-6 py-2.5 bg-accent-500 text-white rounded-lg hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-display font-semibold shadow-sm hover:shadow-medium active:scale-[0.97]"
            >
              {visibleSteps[wizard.wizardStep + 1]?.id === 'itinerary' ? 'Generate Itinerary' : 'Next'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// Step 1: Start & End
// ============================================

const StepStartEnd: React.FC = () => {
  const { start, end, setStart, setEnd } = useTripWizardStore();
  const [startQuery, setStartQuery] = useState(start?.name || '');
  const [endQuery, setEndQuery] = useState(end?.name || '');
  const [startResults, setStartResults] = useState<any[]>([]);
  const [endResults, setEndResults] = useState<any[]>([]);
  const [searchingStart, setSearchingStart] = useState(false);
  const [searchingEnd, setSearchingEnd] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const startDebounceRef = useRef<ReturnType<typeof setTimeout>>();
  const endDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  const searchLocation = useCallback(async (query: string): Promise<any[]> => {
    if (query.length < 2) return [];
    try {
      setSearchError(null);
      const results = await campsiteService.geocodeLocationMultiple(query, 5);
      if (results.length === 0) return [];
      // Map to format expected by result rendering
      return results.map((r, i) => ({
        place_id: i,
        display_name: r.display_name,
        lat: String(r.lat),
        lon: String(r.lng),
      }));
    } catch {
      setSearchError('Search temporarily unavailable. Please try again.');
      return [];
    }
  }, []);

  const handleStartSearch = useCallback((query: string) => {
    setStartQuery(query);
    if (startDebounceRef.current) clearTimeout(startDebounceRef.current);
    if (query.length >= 2) {
      startDebounceRef.current = setTimeout(async () => {
        setSearchingStart(true);
        const results = await searchLocation(query);
        setStartResults(results);
        setSearchingStart(false);
      }, 500);
    } else {
      setStartResults([]);
    }
  }, [searchLocation]);

  const handleEndSearch = useCallback((query: string) => {
    setEndQuery(query);
    if (endDebounceRef.current) clearTimeout(endDebounceRef.current);
    if (query.length >= 2) {
      endDebounceRef.current = setTimeout(async () => {
        setSearchingEnd(true);
        const results = await searchLocation(query);
        setEndResults(results);
        setSearchingEnd(false);
      }, 500);
    } else {
      setEndResults([]);
    }
  }, [searchLocation]);

  const handleSwap = useCallback(() => {
    const temp = start;
    setStart(end);
    setEnd(temp);
    setStartQuery(end?.name || '');
    setEndQuery(start?.name || '');
  }, [start, end, setStart, setEnd]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-display font-semibold text-neutral-900 mb-1">Where are you going?</h3>
        <p className="text-sm text-neutral-500">Enter your start and end locations for the trip.</p>
      </div>

      <div className="space-y-4">
        {/* Start Location */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            <MapPin className="w-4 h-4 inline mr-1 text-green-600" />
            Starting from
          </label>
          <div className="relative">
            <input
              type="text"
              value={startQuery}
              onChange={(e) => handleStartSearch(e.target.value)}
              placeholder="e.g. Edinburgh, Scotland"
              className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500 text-base"
            />
            {searchingStart && (
              <Loader2 className="absolute right-3 top-3.5 w-5 h-5 text-neutral-400 animate-spin" />
            )}
            {start && (
              <Check className="absolute right-3 top-3.5 w-5 h-5 text-green-500" />
            )}
          </div>
          {startResults.length > 0 && !start && (
            <div className="mt-1 bg-white rounded-lg shadow-medium ring-1 ring-black/5 overflow-hidden">
              {startResults.map((result: any) => (
                <button
                  key={result.place_id}
                  onClick={() => {
                    setStart({
                      name: result.display_name.split(',').slice(0, 2).join(',').trim(),
                      lat: parseFloat(result.lat),
                      lng: parseFloat(result.lon),
                    });
                    setStartQuery(result.display_name.split(',').slice(0, 2).join(',').trim());
                    setStartResults([]);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-primary-50 border-b border-neutral-100 last:border-b-0 text-sm"
                >
                  {result.display_name}
                </button>
              ))}
            </div>
          )}
          {start && (
            <button
              onClick={() => { setStart(null); setStartQuery(''); }}
              className="text-xs text-primary-600 hover:text-primary-700 mt-1"
            >
              Change
            </button>
          )}
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSwap}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
            title="Swap start and end"
          >
            <ArrowLeftRight className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        {/* End Location */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            <MapPin className="w-4 h-4 inline mr-1 text-red-500" />
            Going to
          </label>
          <div className="relative">
            <input
              type="text"
              value={endQuery}
              onChange={(e) => handleEndSearch(e.target.value)}
              placeholder="e.g. Elba, Italy"
              className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500 text-base"
            />
            {searchingEnd && (
              <Loader2 className="absolute right-3 top-3.5 w-5 h-5 text-neutral-400 animate-spin" />
            )}
            {end && (
              <Check className="absolute right-3 top-3.5 w-5 h-5 text-green-500" />
            )}
          </div>
          {endResults.length > 0 && !end && (
            <div className="mt-1 bg-white rounded-lg shadow-medium ring-1 ring-black/5 overflow-hidden">
              {endResults.map((result: any) => (
                <button
                  key={result.place_id}
                  onClick={() => {
                    setEnd({
                      name: result.display_name.split(',').slice(0, 2).join(',').trim(),
                      lat: parseFloat(result.lat),
                      lng: parseFloat(result.lon),
                    });
                    setEndQuery(result.display_name.split(',').slice(0, 2).join(',').trim());
                    setEndResults([]);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-primary-50 border-b border-neutral-100 last:border-b-0 text-sm"
                >
                  {result.display_name}
                </button>
              ))}
            </div>
          )}
          {end && (
            <button
              onClick={() => { setEnd(null); setEndQuery(''); }}
              className="text-xs text-primary-600 hover:text-primary-700 mt-1"
            >
              Change
            </button>
          )}
        </div>

        {/* Search error feedback */}
        {searchError && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{searchError}</span>
          </div>
        )}
      </div>

      {/* Summary */}
      {start && end && (
        <div className="bg-primary-50 rounded-xl p-4 text-sm text-primary-800">
          <strong>{start.name}</strong> → <strong>{end.name}</strong>
          <br />
          <span className="text-primary-600">
            Approx. {Math.round(
              6371 * 2 * Math.atan2(
                Math.sqrt(
                  Math.sin(((end.lat - start.lat) * Math.PI / 180) / 2) ** 2 +
                  Math.cos(start.lat * Math.PI / 180) * Math.cos(end.lat * Math.PI / 180) *
                  Math.sin(((end.lng - start.lng) * Math.PI / 180) / 2) ** 2
                ),
                Math.sqrt(1 -
                  Math.sin(((end.lat - start.lat) * Math.PI / 180) / 2) ** 2 -
                  Math.cos(start.lat * Math.PI / 180) * Math.cos(end.lat * Math.PI / 180) *
                  Math.sin(((end.lng - start.lng) * Math.PI / 180) / 2) ** 2
                )
              )
            )} km as the crow flies
          </span>
        </div>
      )}
    </div>
  );
};

// ============================================
// Step 2: Dates
// ============================================

const StepDates: React.FC = () => {
  const { startDate, endDate, setStartDate, setEndDate } = useTripWizardStore();

  const getSeason = (date: Date): { name: string; icon: React.ReactNode; tip: string } => {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return { name: 'Spring', icon: <Leaf className="w-5 h-5 text-green-500" />, tip: 'Great time for southern Europe. Some mountain passes may still be closed.' };
    if (month >= 5 && month <= 7) return { name: 'Summer', icon: <Sun className="w-5 h-5 text-yellow-500" />, tip: 'Peak season — book campsites early! Great weather but busy roads.' };
    if (month >= 8 && month <= 10) return { name: 'Autumn', icon: <CloudRain className="w-5 h-5 text-orange-500" />, tip: 'Beautiful colours, fewer crowds. Watch for early darkness and rain.' };
    return { name: 'Winter', icon: <Snowflake className="w-5 h-5 text-blue-400" />, tip: 'Many campsites closed. Mountain passes may require snow chains.' };
  };

  const season = startDate ? getSeason(startDate) : null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-display font-semibold text-neutral-900 mb-1">When are you going?</h3>
        <p className="text-sm text-neutral-500">Set your departure date. End date is optional.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1">Departure Date</label>
          <input
            type="date"
            value={startDate ? startDate.toISOString().split('T')[0] : ''}
            onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value + 'T00:00:00') : null)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500 text-base"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1">Return Date <span className="text-neutral-400">(optional)</span></label>
          <input
            type="date"
            value={endDate ? endDate.toISOString().split('T')[0] : ''}
            onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value + 'T00:00:00') : null)}
            min={startDate ? startDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500 text-base"
          />
        </div>
      </div>

      {season && (
        <div className="flex items-start gap-3 bg-amber-50 rounded-lg p-4">
          {season.icon}
          <div>
            <p className="font-medium text-amber-900">{season.name} Trip</p>
            <p className="text-sm text-amber-700 mt-0.5">{season.tip}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// Step 3: Driving Style
// ============================================

const StepDrivingStyle: React.FC = () => {
  const { drivingStyle, setDrivingStyle, restDayFrequency, setRestDayFrequency } = useTripWizardStore();
  const { profile } = useVehicleStore();

  const styles: { id: DrivingStyle; icon: React.FC<{ className?: string }>; title: string }[] = [
    { id: 'relaxed', icon: Sun, title: 'Relaxed' },
    { id: 'moderate', icon: Scale, title: 'Moderate' },
    { id: 'intensive', icon: Rocket, title: 'Intensive' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-display font-semibold text-neutral-900 mb-1">How do you like to drive?</h3>
        <p className="text-sm text-neutral-500">Choose your daily driving preference. This determines how the trip is broken into daily stages.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {styles.map(style => {
          const limits = DRIVING_STYLE_LIMITS[style.id];
          const isSelected = drivingStyle === style.id;

          return (
            <button
              key={style.id}
              onClick={() => setDrivingStyle(style.id)}
              className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                isSelected
                  ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                  : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              <div className="mb-2"><style.icon className="w-6 h-6" /></div>
              <h4 className="font-display font-semibold text-neutral-900">{style.title}</h4>
              <p className="text-xs text-neutral-500 mt-1">{limits.shortDescription}</p>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">{limits.description}</p>
            </button>
          );
        })}
      </div>

      {/* Rest days */}
      <div>
        <label className="block text-sm font-semibold text-neutral-700 mb-2">Rest Days</label>
        <div className="flex gap-2">
          {[
            { value: 0, label: 'No rest days' },
            { value: 3, label: 'Every 3 days' },
            { value: 5, label: 'Every 5 days' },
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setRestDayFrequency(option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                restDayFrequency === option.value
                  ? 'bg-primary-100 text-primary-700 border-2 border-primary-300'
                  : 'bg-neutral-100 text-neutral-600 border-2 border-transparent hover:bg-neutral-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {profile && (
        <div className="bg-neutral-50 rounded-xl p-3 text-sm text-neutral-600">
          <Car className="w-4 h-4 inline mr-1" />
          Your vehicle: <strong>{profile.name || profile.type || 'Custom'}</strong>
          {profile.type === 'motorhome' && drivingStyle === 'intensive' && (
            <span className="text-amber-600 ml-2">
              — Intensive may be tiring in a motorhome. Moderate is recommended.
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// Step 4: Channel Crossing
// ============================================

const StepCrossing: React.FC = () => {
  const { start, end, crossing, setCrossing } = useTripWizardStore();

  // Group crossings by region
  const crossingsByRegion = {
    short: CHANNEL_CROSSINGS.filter(c => c.region === 'short'),
    western: CHANNEL_CROSSINGS.filter(c => c.region === 'western'),
    northern: CHANNEL_CROSSINGS.filter(c => c.region === 'northern'),
  };

  // Get recommended order based on start/end locations
  const recommended = start && end
    ? TripWizardService.getRecommendedCrossings(start.lat, start.lng, end.lat, end.lng)
    : [];
  const topRecommendedId = recommended[0]?.id;

  const regionLabels: Record<string, { title: string; desc: string }> = {
    short: { title: 'Short Crossings', desc: 'Dover & Folkestone — quickest to cross' },
    western: { title: 'Western Crossings', desc: 'Portsmouth, Plymouth & Poole — arrive further south/west' },
    northern: { title: 'Northern Crossings', desc: 'Harwich, Hull & Newcastle — best for northern routes' },
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-display font-semibold text-neutral-900 mb-1">Getting to Europe</h3>
        <p className="text-sm text-neutral-500">Choose how you want to cross the Channel. We'll route via the terminals.</p>
      </div>

      {Object.entries(crossingsByRegion).map(([region, crossings]) => (
        <div key={region}>
          <h4 className="font-display font-semibold text-neutral-800 mb-1">{regionLabels[region].title}</h4>
          <p className="text-xs text-neutral-500 mb-2">{regionLabels[region].desc}</p>
          <div className="space-y-2">
            {crossings.map(c => {
              const isSelected = crossing?.id === c.id;
              const isRecommended = c.id === topRecommendedId;

              return (
                <button
                  key={c.id}
                  onClick={() => setCrossing(isSelected ? null : c)}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {c.type === 'tunnel' ? (
                        <Car className="w-4 h-4 text-neutral-500" />
                      ) : (
                        <Ship className="w-4 h-4 text-primary-500" />
                      )}
                      <span className="font-medium text-neutral-900">{c.name}</span>
                      {isRecommended && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          Recommended
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-primary-500" />}
                  </div>

                  <div className="flex items-center gap-4 mt-1.5 text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {c.duration < 60 ? `${c.duration} min` : `${Math.floor(c.duration / 60)}h ${c.duration % 60 > 0 ? `${c.duration % 60}m` : ''}`}
                    </span>
                    <span>{c.operators.join(', ')}</span>
                    <span>£{c.estimatedCost.low}–£{c.estimatedCost.high}</span>
                    {c.overnightCrossing && (
                      <span className="text-purple-600">Overnight</span>
                    )}
                  </div>

                  {isSelected && c.notes && (
                    <p className="text-xs text-neutral-500 mt-2">{c.notes}</p>
                  )}

                  {isSelected && (
                    <div className="flex gap-2 mt-2">
                      {c.bookingUrls.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 bg-primary-50 px-2 py-1 rounded-lg"
                        >
                          Book with {c.operators[i] || c.operators[0]}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================
// Step 5: Generated Itinerary
// ============================================

interface StepItineraryProps {
  onCreateTrip: () => void;
}

const StepItinerary: React.FC<StepItineraryProps> = ({ onCreateTrip }) => {
  const { itinerary, isGenerating, generationError } = useTripWizardStore();

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
        <h3 className="text-lg font-display font-semibold text-neutral-900">Generating your trip plan...</h3>
        <p className="text-sm text-neutral-500 mt-1">Calculating route, finding campsites, and building your itinerary.</p>
      </div>
    );
  }

  if (generationError) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="w-10 h-10 text-red-500 mb-4" />
        <h3 className="text-lg font-display font-semibold text-neutral-900">Failed to generate itinerary</h3>
        <p className="text-sm text-red-600 mt-1">{generationError}</p>
        <button
          onClick={() => useTripWizardStore.getState().prevStep()}
          className="mt-4 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200"
        >
          Go back and try again
        </button>
      </div>
    );
  }

  if (!itinerary) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-display font-bold text-neutral-900">Your Trip Itinerary</h3>
          <p className="text-sm text-neutral-500">
            {itinerary.totalDays} days · {itinerary.totalDistance} km · {itinerary.totalDrivingTime} hours driving
          </p>
        </div>
      </div>

      {/* Warnings */}
      {itinerary.warnings.length > 0 && (
        <div className="bg-amber-50 rounded-lg p-3 space-y-1">
          {itinerary.warnings.map((warning, i) => (
            <p key={i} className="text-sm text-amber-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {warning}
            </p>
          ))}
        </div>
      )}

      {/* Day-by-day cards */}
      <div className="space-y-3">
        {itinerary.days.map(day => (
          <DayCard key={day.dayNumber} day={day} />
        ))}
      </div>

      {/* Create Trip Button */}
      <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-neutral-100 -mx-6 px-6">
        <button
          onClick={onCreateTrip}
          className="w-full py-3 bg-accent-500 text-white rounded-lg hover:bg-accent-600 font-display font-semibold text-base transition-all duration-200 shadow-sm hover:shadow-medium active:scale-[0.98]"
        >
          ✓ Looks Good — Create This Trip
        </button>
      </div>
    </div>
  );
};

// ============================================
// Day Card Component
// ============================================

const DayCard: React.FC<{ day: any }> = ({ day }) => {
  const [expanded, setExpanded] = useState(false);
  const { selectCampsite } = useTripWizardStore();

  const isDriving = day.type === 'driving' || day.type === 'crossing';
  const isRest = day.type === 'rest';

  const dateStr = day.date instanceof Date
    ? day.date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    : '';

  return (
    <div className={`rounded-xl overflow-hidden shadow-soft ${
      day.type === 'crossing' ? 'ring-1 ring-blue-200 bg-blue-50/50' :
      isRest ? 'ring-1 ring-green-200 bg-green-50/50' :
      'ring-1 ring-neutral-200/50'
    }`}>
      {/* Day Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              day.type === 'crossing' ? 'bg-blue-200 text-blue-800' :
              isRest ? 'bg-green-200 text-green-800' :
              'bg-neutral-200 text-neutral-800'
            }`}>
              {day.dayNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-neutral-900">
                  {isRest ? `Rest Day — ${day.start.name}` : `${day.start.name} → ${day.end.name}`}
                </span>
                {day.type === 'crossing' && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    <Ship className="w-3 h-3 inline mr-0.5" />
                    Crossing
                  </span>
                )}
              </div>
              <div className="text-xs text-neutral-500 mt-0.5">
                {dateStr}
                {isDriving && ` · ${day.distance} km · ${day.drivingTime} hrs driving`}
              </div>
            </div>
          </div>
          <ChevronRight className={`w-5 h-5 text-neutral-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>

        {/* Selected campsite preview */}
        {day.selectedOvernight && !expanded && (
          <div className="flex items-center gap-2 mt-2 ml-11 text-xs text-neutral-500">
            <Tent className="w-3.5 h-3.5 text-green-600" />
            <span>Staying at <strong>{day.selectedOvernight.campsite.name}</strong></span>
            <span className="text-green-600">({day.selectedOvernight.suitabilityScore}/100)</span>
          </div>
        )}
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Day Notes */}
          {day.notes.length > 0 && (
            <div className="text-xs text-neutral-500 space-y-0.5 ml-11">
              {day.notes.map((note: string, i: number) => (
                <p key={i} className="flex items-start gap-1"><Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0" /> {note}</p>
              ))}
            </div>
          )}

          {/* Crossing info */}
          {day.crossing && (
            <div className="ml-11 bg-blue-50 rounded-lg p-3 text-sm">
              <p className="font-medium text-blue-900 flex items-center gap-1">
                {day.crossing.type === 'tunnel' ? <TrainFront className="w-4 h-4" /> : <Ship className="w-4 h-4" />} {day.crossing.name}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                {day.crossing.operators.join(', ')} · {day.crossing.duration < 60
                  ? `${day.crossing.duration} min`
                  : `${Math.floor(day.crossing.duration / 60)}h ${day.crossing.duration % 60 > 0 ? `${day.crossing.duration % 60}m` : ''}`
                } crossing · £{day.crossing.estimatedCost.low}–£{day.crossing.estimatedCost.high}
              </p>
              <div className="flex gap-2 mt-2">
                {day.crossing.bookingUrls.map((url: string, i: number) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 bg-white px-2 py-1 rounded border border-blue-200"
                  >
                    Book {day.crossing.operators[i] || 'Now'}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Campsite Options */}
          {day.overnightOptions.length > 0 && (
            <div className="ml-11">
              <p className="text-xs font-medium text-neutral-700 mb-2">
                <Tent className="w-3.5 h-3.5 inline mr-1" />
                Overnight Options ({day.overnightOptions.length})
              </p>
              <div className="space-y-2">
                {day.overnightOptions.map((option: CampsiteOption, i: number) => {
                  const isSelected = day.selectedOvernight?.campsite.id === option.campsite.id;
                  return (
                    <button
                      key={option.campsite.id}
                      onClick={() => selectCampsite(day.dayNumber, option)}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 ${
                        isSelected
                          ? 'border-green-500 bg-green-50 shadow-sm'
                          : 'border-neutral-200 hover:border-neutral-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-sm text-neutral-900">
                            {i === 0 && '⭐ '}{option.campsite.name}
                          </span>
                          <span className="text-xs text-neutral-500 ml-2">
                            {option.distanceFromRoute} km from route
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`text-xs font-bold ${
                            option.suitabilityScore >= 80 ? 'text-green-600' :
                            option.suitabilityScore >= 60 ? 'text-yellow-600' :
                            'text-neutral-500'
                          }`}>
                            {option.suitabilityScore}/100
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-green-600" />}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {option.amenitySummary.slice(0, 5).map(amenity => (
                          <span key={amenity} className="text-xs bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded">
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TripWizard;
