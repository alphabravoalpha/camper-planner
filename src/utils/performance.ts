// Performance Monitoring and Optimization
// Phase 6.4: Comprehensive performance testing and production monitoring

import { useState, useEffect, useCallback } from 'react';

// Performance metrics interface
export interface PerformanceMetrics {
  // Core Web Vitals
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte

  // Custom metrics
  renderTime: number;
  bundleSize: number;
  memoryUsage: number;
  connectionType: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

// Performance monitoring class
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: Map<string, PerformanceObserver> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  constructor() {
    this.initializeObservers();
    this.collectInitialMetrics();
  }

  private initializeObservers() {
    if (typeof window === 'undefined') return;

    try {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.lcp = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('lcp', lcpObserver);

      // First Input Delay
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry: any) => {
          this.metrics.fid = entry.processingStart - entry.startTime;
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.set('fid', fidObserver);

      // Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.metrics.cls = clsValue;
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('cls', clsObserver);

      // Long Tasks
      const longTaskObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          console.warn(`Long task detected: ${entry.duration}ms`);
        });
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.set('longtask', longTaskObserver);

    } catch (error) {
      console.warn('Performance monitoring not supported:', error);
    }
  }

  private collectInitialMetrics() {
    if (typeof window === 'undefined') return;

    // Wait for page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.collectCoreMetrics();
        this.collectCustomMetrics();
      }, 0);
    });
  }

  private collectCoreMetrics() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    if (navigation) {
      this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
    }

    // First Contentful Paint
    const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
    if (fcpEntry) {
      this.metrics.fcp = fcpEntry.startTime;
    }

    // Bundle size estimation
    const resourceEntries = performance.getEntriesByType('resource');
    const jsSize = resourceEntries
      .filter((entry: any) => entry.name.endsWith('.js'))
      .reduce((total: number, entry: any) => total + (entry.transferSize || 0), 0);

    this.metrics.bundleSize = jsSize;
  }

  private collectCustomMetrics() {
    // Memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize;
    }

    // Connection type
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.metrics.connectionType = connection.effectiveType || 'unknown';
    }

    // Device type estimation
    const width = window.innerWidth;
    if (width < 768) {
      this.metrics.deviceType = 'mobile';
    } else if (width < 1024) {
      this.metrics.deviceType = 'tablet';
    } else {
      this.metrics.deviceType = 'desktop';
    }
  }

  // Get current metrics
  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  // Measure component render time
  measureRenderTime(componentName: string, renderFn: () => void): number {
    const startTime = performance.now();
    renderFn();
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    console.log(`${componentName} render time: ${renderTime.toFixed(2)}ms`);
    return renderTime;
  }

  // Measure async operation
  async measureAsyncOperation<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const startTime = performance.now();
    const result = await operation();
    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`${operationName} duration: ${duration.toFixed(2)}ms`);
    return { result, duration };
  }

  // Report metrics to analytics
  reportMetrics() {
    const metrics = this.getMetrics();

    // Only report if we have meaningful data
    if (Object.keys(metrics).length === 0) return;

    // Store in localStorage for now (replace with analytics service)
    const existingMetrics = JSON.parse(localStorage.getItem('performanceMetrics') || '[]');
    existingMetrics.push({
      ...metrics,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    });

    // Keep only last 100 entries
    localStorage.setItem('performanceMetrics', JSON.stringify(existingMetrics.slice(-100)));
  }

  // Clean up observers
  disconnect() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
  }
}

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<Partial<PerformanceMetrics>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const monitor = PerformanceMonitor.getInstance();

    // Update metrics periodically
    const updateMetrics = () => {
      setMetrics(monitor.getMetrics());
      setIsLoading(false);
    };

    // Initial update
    updateMetrics();

    // Periodic updates
    const interval = setInterval(updateMetrics, 5000);

    // Report metrics on page unload
    const handleUnload = () => {
      monitor.reportMetrics();
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  return { metrics, isLoading };
};

// Performance testing utilities
export const performanceTesting = {
  // Test component render performance
  testComponentRender: (componentName: string, iterations: number = 100) => {
    const monitor = PerformanceMonitor.getInstance();
    const renderTimes: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const renderTime = monitor.measureRenderTime(componentName, () => {
        // Simulate component render
        const element = document.createElement('div');
        element.innerHTML = `<div>Test ${i}</div>`;
        document.body.appendChild(element);
        document.body.removeChild(element);
      });
      renderTimes.push(renderTime);
    }

    const avgRenderTime = renderTimes.reduce((sum, time) => sum + time, 0) / iterations;
    const maxRenderTime = Math.max(...renderTimes);
    const minRenderTime = Math.min(...renderTimes);

    console.log(`Performance test for ${componentName}:`, {
      iterations,
      avgRenderTime: avgRenderTime.toFixed(2),
      maxRenderTime: maxRenderTime.toFixed(2),
      minRenderTime: minRenderTime.toFixed(2),
    });

    return {
      avgRenderTime,
      maxRenderTime,
      minRenderTime,
      allTimes: renderTimes,
    };
  },

  // Test memory usage over time
  testMemoryUsage: (duration: number = 60000) => {
    const memoryUsage: number[] = [];
    const startTime = Date.now();

    const collectMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        memoryUsage.push(memory.usedJSHeapSize);
      }

      if (Date.now() - startTime < duration) {
        setTimeout(collectMemory, 1000);
      } else {
        const avgMemory = memoryUsage.reduce((sum, mem) => sum + mem, 0) / memoryUsage.length;
        const maxMemory = Math.max(...memoryUsage);
        const memoryGrowth = memoryUsage[memoryUsage.length - 1] - memoryUsage[0];

        console.log('Memory usage test:', {
          duration: duration / 1000,
          avgMemory: (avgMemory / 1024 / 1024).toFixed(2),
          maxMemory: (maxMemory / 1024 / 1024).toFixed(2),
          memoryGrowth: (memoryGrowth / 1024 / 1024).toFixed(2),
        });
      }
    };

    collectMemory();
  },

  // Test bundle size impact
  analyzeBundleSize: () => {
    const resourceEntries = performance.getEntriesByType('resource');
    const analysis = {
      totalSize: 0,
      jsSize: 0,
      cssSize: 0,
      imageSize: 0,
      fontSize: 0,
    };

    resourceEntries.forEach((entry: any) => {
      const size = entry.transferSize || 0;
      analysis.totalSize += size;

      if (entry.name.endsWith('.js')) {
        analysis.jsSize += size;
      } else if (entry.name.endsWith('.css')) {
        analysis.cssSize += size;
      } else if (entry.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
        analysis.imageSize += size;
      } else if (entry.name.match(/\.(woff|woff2|ttf|eot)$/)) {
        analysis.fontSize += size;
      }
    });

    // Convert to KB
    Object.keys(analysis).forEach((key) => {
      analysis[key as keyof typeof analysis] = Math.round(analysis[key as keyof typeof analysis] / 1024);
    });

    console.log('Bundle size analysis (KB):', analysis);
    return analysis;
  },
};

// Performance optimization utilities
export const performanceOptimization = {
  // Lazy load images
  setupLazyLoading: () => {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            if (src) {
              img.src = src;
              img.classList.remove('lazy');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      const lazyImages = document.querySelectorAll('img[data-src]');
      lazyImages.forEach((img) => imageObserver.observe(img));
    }
  },

  // Preload critical resources
  preloadResources: (resources: string[]) => {
    resources.forEach((resource) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;

      if (resource.endsWith('.js')) {
        link.as = 'script';
      } else if (resource.endsWith('.css')) {
        link.as = 'style';
      } else if (resource.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
        link.as = 'image';
      } else if (resource.match(/\.(woff|woff2)$/)) {
        link.as = 'font';
        link.crossOrigin = 'anonymous';
      }

      document.head.appendChild(link);
    });
  },

  // Debounce expensive operations
  debounce: <T extends (...args: any[]) => void>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void => {
    let timeoutId: number;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => func(...args), delay);
    };
  },

  // Throttle high-frequency events
  throttle: <T extends (...args: any[]) => void>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  // Optimize component re-renders
  shouldComponentUpdate: (prevProps: any, nextProps: any, keys: string[]): boolean => {
    return keys.some((key) => prevProps[key] !== nextProps[key]);
  },
};

// Export all utilities
export default {
  PerformanceMonitor,
  usePerformanceMonitor,
  performanceTesting,
  performanceOptimization,
};