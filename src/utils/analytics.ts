// Privacy-Compliant Analytics and Monitoring
// Phase 6.4: GDPR-compliant analytics for production monitoring

import { useState, useEffect, useCallback } from 'react';

// Analytics event types
export interface AnalyticsEvent {
  name: string;
  category: 'user_action' | 'performance' | 'error' | 'feature_usage';
  properties?: Record<string, unknown>;
  timestamp: number;
  sessionId: string;
  version: string;
}

// Error event interface
export interface ErrorEvent {
  message: string;
  stack?: string;
  componentStack?: string;
  url: string;
  userAgent: string;
  timestamp: number;
  sessionId: string;
  version: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Performance event interface
export interface PerformanceEvent {
  metric: string;
  value: number;
  context?: Record<string, unknown>;
  timestamp: number;
  sessionId: string;
  version: string;
}

// User session interface
export interface UserSession {
  id: string;
  startTime: number;
  lastActivity: number;
  pageViews: number;
  events: number;
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
}

// Typed PerformanceObserver entry interfaces
interface PerformanceEventTimingEntry extends PerformanceEntry {
  processingStart: number;
}

interface LayoutShiftEntry extends PerformanceEntry {
  hadRecentInput: boolean;
  value: number;
}

// Privacy-first analytics manager
export class PrivacyAnalytics {
  private static instance: PrivacyAnalytics;
  private session: UserSession;
  private events: AnalyticsEvent[] = [];
  private errors: ErrorEvent[] = [];
  private performance: PerformanceEvent[] = [];
  private isEnabled: boolean = false;
  private hasConsent: boolean = false;

  static getInstance(): PrivacyAnalytics {
    if (!PrivacyAnalytics.instance) {
      PrivacyAnalytics.instance = new PrivacyAnalytics();
    }
    return PrivacyAnalytics.instance;
  }

  constructor() {
    this.session = this.createSession();
    this.checkConsent();
    this.loadStoredData();
    this.setupErrorHandling();
    this.setupPerformanceMonitoring();
  }

  private createSession(): UserSession {
    const sessionId = this.generateSessionId();

    return {
      id: sessionId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      pageViews: 1,
      events: 0,
      userAgent: this.getAnonymizedUserAgent(),
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language.split('-')[0], // Only language, not region
    };
  }

  private generateSessionId(): string {
    // Generate a random session ID (not tied to user identity)
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getAnonymizedUserAgent(): string {
    const ua = navigator.userAgent;

    // Extract only browser and OS info, remove potentially identifying details
    const browserMatch = ua.match(/(Chrome|Firefox|Safari|Edge)\/[\d.]+/);
    const osMatch = ua.match(/(Windows|Mac|Linux|iOS|Android)/);

    const browser = browserMatch ? browserMatch[0] : 'Unknown';
    const os = osMatch ? osMatch[0] : 'Unknown';

    return `${browser} on ${os}`;
  }

  private checkConsent(): void {
    // Check for stored consent preference
    const consent = localStorage.getItem('analytics-consent');
    this.hasConsent = consent === 'true';
    this.isEnabled = this.hasConsent;
  }

  private loadStoredData(): void {
    try {
      const storedEvents = localStorage.getItem('analytics-events');
      if (storedEvents) this.events = JSON.parse(storedEvents);
      const storedErrors = localStorage.getItem('analytics-errors');
      if (storedErrors) this.errors = JSON.parse(storedErrors);
      const storedPerf = localStorage.getItem('analytics-performance');
      if (storedPerf) this.performance = JSON.parse(storedPerf);
    } catch {
      // Silently ignore corrupt stored data
    }
  }

  // Consent management
  setConsent(hasConsent: boolean): void {
    this.hasConsent = hasConsent;
    this.isEnabled = hasConsent;

    localStorage.setItem('analytics-consent', hasConsent.toString());

    if (!hasConsent) {
      this.clearStoredData();
    }

    this.track('consent_updated', 'user_action', { hasConsent });
  }

  getConsent(): boolean {
    return this.hasConsent;
  }

  private clearStoredData(): void {
    this.events = [];
    this.errors = [];
    this.performance = [];
    localStorage.removeItem('analytics-events');
    localStorage.removeItem('analytics-errors');
    localStorage.removeItem('analytics-performance');
  }

  private setupErrorHandling(): void {
    window.addEventListener('error', event => {
      this.trackError({
        message: event.message,
        stack: event.error?.stack,
        url: event.filename,
        userAgent: this.session.userAgent,
        timestamp: Date.now(),
        sessionId: this.session.id,
        version: import.meta.env.VITE_APP_VERSION || 'unknown',
        severity: 'medium',
      });
    });

    window.addEventListener('unhandledrejection', event => {
      this.trackError({
        message: `Unhandled promise rejection: ${event.reason}`,
        url: window.location.href,
        userAgent: this.session.userAgent,
        timestamp: Date.now(),
        sessionId: this.session.id,
        version: import.meta.env.VITE_APP_VERSION || 'unknown',
        severity: 'high',
      });
    });
  }

  private setupPerformanceMonitoring(): void {
    // Monitor Core Web Vitals
    if ('PerformanceObserver' in window) {
      try {
        // First Contentful Paint
        const fcpObserver = new PerformanceObserver(entryList => {
          const entries = entryList.getEntries();
          entries.forEach(entry => {
            this.trackPerformance('first_contentful_paint', entry.startTime);
          });
        });
        fcpObserver.observe({ entryTypes: ['paint'] });

        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver(entryList => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.trackPerformance('largest_contentful_paint', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay
        const fidObserver = new PerformanceObserver(entryList => {
          const entries = entryList.getEntries();
          entries.forEach(entry => {
            const fidEntry = entry as PerformanceEventTimingEntry;
            const fid = fidEntry.processingStart - fidEntry.startTime;
            this.trackPerformance('first_input_delay', fid);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift
        let clsValue = 0;
        const clsObserver = new PerformanceObserver(entryList => {
          const entries = entryList.getEntries();
          entries.forEach(entry => {
            const clsEntry = entry as LayoutShiftEntry;
            if (!clsEntry.hadRecentInput) {
              clsValue += clsEntry.value;
            }
          });
          this.trackPerformance('cumulative_layout_shift', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.error('Performance monitoring setup failed:', error);
      }
    }
  }

  // Track user events
  track(
    eventName: string,
    category: AnalyticsEvent['category'],
    properties?: Record<string, unknown>
  ): void {
    if (!this.isEnabled) return;

    this.session.lastActivity = Date.now();
    this.session.events++;

    const event: AnalyticsEvent = {
      name: eventName,
      category,
      properties: this.sanitizeProperties(properties),
      timestamp: Date.now(),
      sessionId: this.session.id,
      version: import.meta.env.VITE_APP_VERSION || 'unknown',
    };

    this.events.push(event);
    this.persistEvents();
  }

  // Track errors
  trackError(error: ErrorEvent): void {
    if (!this.isEnabled) return;

    this.errors.push(error);
    this.persistErrors();
  }

  // Track performance metrics
  trackPerformance(metric: string, value: number, context?: Record<string, unknown>): void {
    if (!this.isEnabled) return;

    const perfEvent: PerformanceEvent = {
      metric,
      value,
      context: this.sanitizeProperties(context),
      timestamp: Date.now(),
      sessionId: this.session.id,
      version: import.meta.env.VITE_APP_VERSION || 'unknown',
    };

    this.performance.push(perfEvent);
    this.persistPerformance();
  }

  // Page view tracking
  trackPageView(path: string): void {
    this.session.pageViews++;
    this.track('page_view', 'user_action', {
      path: this.sanitizePath(path),
      referrer: this.sanitizePath(document.referrer),
    });
  }

  // Feature usage tracking
  trackFeatureUsage(feature: string, action: string, properties?: Record<string, unknown>): void {
    this.track(`feature_${feature}_${action}`, 'feature_usage', properties);
  }

  private sanitizeProperties(
    properties?: Record<string, unknown>
  ): Record<string, unknown> | undefined {
    if (!properties) return undefined;

    const sanitized: Record<string, unknown> = {};

    Object.entries(properties).forEach(([key, value]) => {
      // Remove potentially sensitive data
      if (
        key.toLowerCase().includes('password') ||
        key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('secret') ||
        key.toLowerCase().includes('key')
      ) {
        return;
      }

      // Limit string length to prevent data bloat
      if (typeof value === 'string' && value.length > 100) {
        sanitized[key] = value.substring(0, 100) + '...';
      } else {
        sanitized[key] = value;
      }
    });

    return sanitized;
  }

  private sanitizePath(path: string): string {
    if (!path) return '';

    // Remove query parameters that might contain sensitive data
    const url = new URL(path, window.location.origin);
    return url.pathname;
  }

  private persistEvents(): void {
    try {
      // Keep only last 100 events to prevent storage bloat
      const recentEvents = this.events.slice(-100);
      localStorage.setItem('analytics-events', JSON.stringify(recentEvents));
    } catch {
      // Storage full or unavailable — silently ignore
    }
  }

  private persistErrors(): void {
    try {
      // Keep only last 50 errors
      const recentErrors = this.errors.slice(-50);
      localStorage.setItem('analytics-errors', JSON.stringify(recentErrors));
    } catch {
      // Storage full or unavailable — silently ignore
    }
  }

  private persistPerformance(): void {
    try {
      // Keep only last 100 performance metrics
      const recentPerf = this.performance.slice(-100);
      localStorage.setItem('analytics-performance', JSON.stringify(recentPerf));
    } catch {
      // Storage full or unavailable — silently ignore
    }
  }

  // Get analytics data for debugging/export
  getAnalyticsData(): {
    session: UserSession;
    events: AnalyticsEvent[];
    errors: ErrorEvent[];
    performance: PerformanceEvent[];
  } {
    return {
      session: this.session,
      events: this.events,
      errors: this.errors,
      performance: this.performance,
    };
  }

  // Export analytics data
  exportData(): string {
    const data = this.getAnalyticsData();
    return JSON.stringify(data, null, 2);
  }

  // Clear all analytics data
  clearData(): void {
    this.clearStoredData();
    this.session = this.createSession();
  }
}

// React hook for analytics
export const useAnalytics = () => {
  const [analytics] = useState(() => PrivacyAnalytics.getInstance());
  const [hasConsent, setHasConsent] = useState(analytics.getConsent());

  const track = useCallback(
    (
      eventName: string,
      category: AnalyticsEvent['category'],
      properties?: Record<string, unknown>
    ) => {
      analytics.track(eventName, category, properties);
    },
    [analytics]
  );

  const trackFeature = useCallback(
    (feature: string, action: string, properties?: Record<string, unknown>) => {
      analytics.trackFeatureUsage(feature, action, properties);
    },
    [analytics]
  );

  const trackError = useCallback(
    (error: ErrorEvent) => {
      analytics.trackError(error);
    },
    [analytics]
  );

  const updateConsent = useCallback(
    (consent: boolean) => {
      analytics.setConsent(consent);
      setHasConsent(consent);
    },
    [analytics]
  );

  // Track page views automatically
  useEffect(() => {
    analytics.trackPageView(window.location.pathname);
  }, [analytics]);

  return {
    track,
    trackFeature,
    trackError,
    hasConsent,
    updateConsent,
    analytics,
  };
};

// Consent banner component hook
export const useConsentBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const { hasConsent, updateConsent } = useAnalytics();

  useEffect(() => {
    // Show banner if no consent decision has been made
    const consentDecision = localStorage.getItem('analytics-consent');
    setShowBanner(consentDecision === null);
  }, []);

  const acceptConsent = useCallback(() => {
    updateConsent(true);
    setShowBanner(false);
  }, [updateConsent]);

  const rejectConsent = useCallback(() => {
    updateConsent(false);
    setShowBanner(false);
  }, [updateConsent]);

  return {
    showBanner,
    acceptConsent,
    rejectConsent,
    hasConsent,
  };
};

// Error boundary integration
export const withAnalyticsErrorBoundary = (
  error: Error,
  errorInfo: { componentStack?: string }
) => {
  const analytics = PrivacyAnalytics.getInstance();

  analytics.trackError({
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: Date.now(),
    sessionId: analytics.getAnalyticsData().session.id,
    version: import.meta.env.VITE_APP_VERSION || 'unknown',
    severity: 'high',
  });
};

export default PrivacyAnalytics;
