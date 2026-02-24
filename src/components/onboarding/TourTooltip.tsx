// Tour Tooltip Component
// Positioned card that shows step content, progress, and navigation

import React from 'react';
import { cn } from '../../utils/cn';
import {
  MapPin,
  Truck,
  Tent,
  Calculator,
  Briefcase,
  CheckCircle,
  Search,
  Navigation,
  Wrench,
  ArrowRight,
  X,
} from 'lucide-react';
import type { SpotlightStep } from './tourSteps';

// =============================================================================
// Icon Map
// =============================================================================

const ICON_MAP: Record<SpotlightStep['iconKey'], React.FC<{ className?: string }>> = {
  Truck,
  MapPin,
  Tent,
  Calculator,
  Briefcase,
  CheckCircle,
  Search,
  Navigation,
  Wrench,
};

// =============================================================================
// Progress Dots
// =============================================================================

const ProgressDots: React.FC<{ current: number; total: number }> = ({ current, total }) => (
  <div className="flex items-center justify-center space-x-1.5 mb-4">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className={cn(
          'h-1.5 rounded-full transition-all duration-300',
          i === current
            ? 'w-5 bg-primary-600'
            : i < current
              ? 'w-1.5 bg-primary-400'
              : 'w-1.5 bg-neutral-300'
        )}
      />
    ))}
  </div>
);

// =============================================================================
// Tour Tooltip
// =============================================================================

interface TourTooltipProps {
  step: SpotlightStep;
  currentIndex: number;
  totalSteps: number;
  tooltipStyle: React.CSSProperties;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
}

const TourTooltip: React.FC<TourTooltipProps> = ({
  step,
  currentIndex,
  totalSteps,
  tooltipStyle,
  onNext,
  onBack,
  onSkip,
  isFirstStep,
  isLastStep,
  containerRef,
}) => {
  const Icon = ICON_MAP[step.iconKey];
  const isWelcome = step.variant === 'welcome';

  return (
    <div
      ref={containerRef}
      className={cn(
        'fixed bg-white rounded-lg shadow-xl border border-neutral-200 p-5 max-w-[calc(100vw-2rem)] animate-fade-in',
        isWelcome ? 'w-96' : 'w-80'
      )}
      style={{
        ...tooltipStyle,
        zIndex: 9999,
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`tour-step-${step.id}`}
      aria-describedby={`tour-desc-${step.id}`}
    >
      {/* Close button */}
      <button
        onClick={onSkip}
        className="absolute top-3 right-3 text-neutral-400 hover:text-neutral-600 transition-colors"
        aria-label="Close tour"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress */}
      <ProgressDots current={currentIndex} total={totalSteps} />

      {/* Welcome variant: logo + feature list */}
      {isWelcome ? (
        <>
          {/* Logo */}
          <div className="flex justify-center mb-3">
            <img src="/images/onboarding-welcome.png" alt="European Camper Planner" className="w-14 h-14 rounded-lg object-cover" />
          </div>

          {/* Headline */}
          <h2
            id={`tour-step-${step.id}`}
            className="text-lg font-display font-bold text-neutral-900 leading-tight text-center mb-2"
          >
            {step.headline}
          </h2>

          {/* Subtitle */}
          <p
            id={`tour-desc-${step.id}`}
            className="text-sm text-neutral-600 leading-relaxed text-center mb-4"
          >
            {step.body}
          </p>

          {/* Feature list */}
          {step.features && (
            <ul className="space-y-2 mb-4">
              {step.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-neutral-600">
                  <CheckCircle className="w-3.5 h-3.5 text-success-500 flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <>
          {/* Icon + Headline */}
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 flex-shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div className="pt-1">
              <h2
                id={`tour-step-${step.id}`}
                className="text-base font-display font-bold text-neutral-900 leading-tight"
              >
                {step.headline}
              </h2>
            </div>
          </div>

          {/* Body */}
          <p
            id={`tour-desc-${step.id}`}
            className="text-sm text-neutral-600 leading-relaxed mb-3"
          >
            {step.body}
          </p>

          {/* Tools list (optional — used by toolkit step) */}
          {step.tools && step.tools.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {step.tools.map((tool, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                  <span className="flex-shrink-0">{tool.emoji}</span>
                  <span>
                    <span className="font-medium">{tool.label}</span>
                    <span className="text-neutral-500"> — {tool.description}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* Tip (optional) */}
          {step.tip && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-2.5 text-xs text-primary-800 mb-4">
              <span className="font-medium">Tip: </span>
              {step.tip}
            </div>
          )}
        </>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
        <button
          onClick={onSkip}
          className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          Skip tour
        </button>
        <div className="flex gap-2">
          {!isFirstStep && (
            <button
              onClick={onBack}
              className="px-3 py-1.5 text-sm border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={onNext}
            className="px-4 py-1.5 text-sm bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 active:scale-[0.97] transition-all flex items-center gap-1.5"
          >
            {step.ctaText ?? (isLastStep ? 'Start Planning' : 'Next')}
            {!step.ctaText && !isLastStep && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TourTooltip;
