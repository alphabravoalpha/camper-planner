// Privacy-Compliant Analytics and Monitoring
// Phase 6.4: GDPR-compliant analytics for production monitoring

import { useState, useEffect, useCallback } from 'react';

// Analytics event types
export interface AnalyticsEvent {
  name: string;
  category: 'user_action' | 'performance' | 'error' | 'feature_usage';
  properties?: Record<string, any>;
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
  context?: Record<string, any>;
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
    this.isEnabled = this.hasConsent && process.env.NODE_ENV === 'production';
  }

  // Consent management
  setConsent(hasConsent: boolean): void {
    this.hasConsent = hasConsent;
    this.isEnabled = hasConsent && process.env.NODE_ENV === 'production';

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
    window.addEventListener('error', (event) => {
      this.trackError({
        message: event.message,
        stack: event.error?.stack,
        url: event.filename,
        userAgent: this.session.userAgent,
        timestamp: Date.now(),
        sessionId: this.session.id,
        version: process.env.VITE_APP_VERSION || 'unknown',
        severity: 'medium'
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        message: `Unhandled promise rejection: ${event.reason}`,
        url: window.location.href,
        userAgent: this.session.userAgent,
        timestamp: Date.now(),
        sessionId: this.session.id,
        version: process.env.VITE_APP_VERSION || 'unknown',
        severity: 'high'
      });
    });
  }

  private setupPerformanceMonitoring(): void {
    // Monitor Core Web Vitals
    if ('PerformanceObserver' in window) {
      try {
        // First Contentful Paint
        const fcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((entry) => {
            this.trackPerformance('first_contentful_paint', entry.startTime);
          });
        });
        fcpObserver.observe({ entryTypes: ['paint'] });

        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.trackPerformance('largest_contentful_paint', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay
        const fidObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((entry: any) => {
            const fid = entry.processingStart - entry.startTime;
            this.trackPerformance('first_input_delay', fid);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.trackPerformance('cumulative_layout_shift', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

      } catch (error) {
        console.warn('Performance monitoring setup failed:', error);
      }
    }
  }

  // Track user events
  track(eventName: string, category: AnalyticsEvent['category'], properties?: Record<string, any>): void {
    if (!this.isEnabled) return;

    this.session.lastActivity = Date.now();
    this.session.events++;

    const event: AnalyticsEvent = {
      name: eventName,
      category,
      properties: this.sanitizeProperties(properties),
      timestamp: Date.now(),
      sessionId: this.session.id,
      version: process.env.VITE_APP_VERSION || 'unknown',
    };

    this.events.push(event);
    this.persistEvents();

    // Send to analytics service if configured
    this.sendToAnalyticsService([event]);
  }

  // Track errors
  trackError(error: ErrorEvent): void {
    if (!this.isEnabled) return;

    this.errors.push(error);
    this.persistErrors();

    // Send critical errors immediately
    if (error.severity === 'critical') {
      this.sendErrorsToService([error]);
    }

    console.error('Analytics tracked error:', error);
  }

  // Track performance metrics
  trackPerformance(metric: string, value: number, context?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const perfEvent: PerformanceEvent = {
      metric,
      value,
      context: this.sanitizeProperties(context),
      timestamp: Date.now(),
      sessionId: this.session.id,
      version: process.env.VITE_APP_VERSION || 'unknown',
    };

    this.performance.push(perfEvent);
    this.persistPerformance();
  }

  // Page view tracking
  trackPageView(path: string): void {
    this.session.pageViews++;
    this.track('page_view', 'user_action', {
      path: this.sanitizePath(path),
      referrer: this.sanitizePath(document.referrer)
    });
  }

  // Feature usage tracking
  trackFeatureUsage(feature: string, action: string, properties?: Record<string, any>): void {
    this.track(`feature_${feature}_${action}`, 'feature_usage', properties);
  }

  private sanitizeProperties(properties?: Record<string, any>): Record<string, any> | undefined {
    if (!properties) return undefined;

    const sanitized: Record<string, any> = {};

    Object.entries(properties).forEach(([key, value]) => {
      // Remove potentially sensitive data
      if (key.toLowerCase().includes('password') ||
          key.toLowerCase().includes('token') ||
          key.toLowerCase().includes('secret') ||
          key.toLowerCase().includes('key')) {
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
    } catch (error) {
      console.warn('Failed to persist analytics events:', error);
    }
  }

  private persistErrors(): void {
    try {
      // Keep only last 50 errors
      const recentErrors = this.errors.slice(-50);
      localStorage.setItem('analytics-errors', JSON.stringify(recentErrors));
    } catch (error) {
      console.warn('Failed to persist analytics errors:', error);
    }
  }

  private persistPerformance(): void {
    try {
      // Keep only last 100 performance metrics
      const recentPerf = this.performance.slice(-100);
      localStorage.setItem('analytics-performance', JSON.stringify(recentPerf));
    } catch (error) {
      console.warn('Failed to persist performance data:', error);
    }
  }

  private sendToAnalyticsService(events: AnalyticsEvent[]): void {
    // In a real implementation, send to your analytics service
    // This is a placeholder for the actual implementation

    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics events:', events);
    }

    // Example: Send to a privacy-compliant analytics service
    // fetch('/api/analytics', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ events })
    // }).catch(console.error);
  }

  private sendErrorsToService(errors: ErrorEvent[]): void {
    // Send errors to monitoring service
    if (process.env.NODE_ENV === 'development') {
      console.log('Error events:', errors);
    }

    // Example: Send to error monitoring service
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ errors })
    // }).catch(console.error);
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

  const track = useCallback((eventName: string, category: AnalyticsEvent['category'], properties?: Record<string, any>) => {
    analytics.track(eventName, category, properties);
  }, [analytics]);

  const trackFeature = useCallback((feature: string, action: string, properties?: Record<string, any>) => {
    analytics.trackFeatureUsage(feature, action, properties);
  }, [analytics]);

  const trackError = useCallback((error: ErrorEvent) => {
    analytics.trackError(error);
  }, [analytics]);

  const updateConsent = useCallback((consent: boolean) => {
    analytics.setConsent(consent);
    setHasConsent(consent);
  }, [analytics]);

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

// Performance tracking utilities
export const performanceTracking = {
  // Track component render time
  trackComponentRender: (componentName: string, renderTime: number) => {
    const analytics = PrivacyAnalytics.getInstance();
    analytics.trackPerformance('component_render', renderTime, { component: componentName });
  },

  // Track async operation duration
  trackAsyncOperation: (operationName: string, duration: number, success: boolean) => {
    const analytics = PrivacyAnalytics.getInstance();
    analytics.trackPerformance('async_operation', duration, {
      operation: operationName,
      success
    });
  },

  // Track user interaction latency
  trackInteractionLatency: (interaction: string, latency: number) => {
    const analytics = PrivacyAnalytics.getInstance();
    analytics.trackPerformance('interaction_latency', latency, { interaction });
  },
};

// Error boundary integration
export const withAnalyticsErrorBoundary = (error: Error, errorInfo: any) => {
  const analytics = PrivacyAnalytics.getInstance();

  analytics.trackError({
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: Date.now(),
    sessionId: analytics.getAnalyticsData().session.id,
    version: process.env.VITE_APP_VERSION || 'unknown',
    severity: 'high'
  });
};

export default PrivacyAnalytics;