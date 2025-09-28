// Responsive Test Suite Component
// Phase 6.3: Comprehensive mobile responsiveness testing

import React, { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { useResponsive, commonDevices, testingUtils } from '../../utils/responsive';

interface ResponsiveTestSuiteProps {
  className?: string;
}

// Device Preview Component
const DevicePreview: React.FC<{
  device: keyof typeof commonDevices;
  isActive: boolean;
  onClick: () => void;
}> = ({ device, isActive, onClick }) => {
  const specs = commonDevices[device];

  return (
    <button
      onClick={onClick}
      className={cn(
        'p-3 border rounded-lg text-left transition-colors',
        isActive
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      )}
    >
      <div className="font-medium text-sm text-gray-900">{device}</div>
      <div className="text-xs text-gray-600">
        {specs.width} × {specs.height} (×{specs.pixelRatio})
      </div>
    </button>
  );
};

// Responsive Issues Detector
const ResponsiveIssuesDetector: React.FC = () => {
  const [issues, setIssues] = useState<string[]>([]);
  const responsive = useResponsive();

  useEffect(() => {
    const detectIssues = () => {
      const foundIssues: string[] = [];

      // Check for horizontal scrolling
      if (document.body.scrollWidth > window.innerWidth) {
        foundIssues.push('Horizontal scroll detected - content may be too wide');
      }

      // Check for elements outside viewport
      const elements = document.querySelectorAll('*');
      elements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.right > window.innerWidth + 10) { // 10px tolerance
          foundIssues.push(`Element extends beyond viewport: ${element.tagName.toLowerCase()}`);
        }
      });

      // Check for touch target sizes on mobile
      if (responsive.isMobile) {
        const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
        interactiveElements.forEach((element) => {
          const rect = element.getBoundingClientRect();
          if (rect.width < 44 || rect.height < 44) {
            foundIssues.push(`Touch target too small: ${element.tagName.toLowerCase()} (${Math.round(rect.width)}×${Math.round(rect.height)})`);
          }
        });
      }

      // Check for text readability
      const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
      textElements.forEach((element) => {
        const computedStyle = window.getComputedStyle(element);
        const fontSize = parseFloat(computedStyle.fontSize);

        if (responsive.isMobile && fontSize < 14) {
          foundIssues.push(`Text may be too small on mobile: ${fontSize}px`);
        }
      });

      setIssues(foundIssues);
    };

    // Debounce the detection
    const timeoutId = setTimeout(detectIssues, 500);
    return () => clearTimeout(timeoutId);
  }, [responsive.windowSize, responsive.isMobile]);

  if (issues.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <span className="text-green-500">✅</span>
          <span className="font-medium text-green-900">No responsive issues detected</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-start space-x-2">
        <span className="text-yellow-500 mt-0.5">⚠️</span>
        <div>
          <div className="font-medium text-yellow-900 mb-2">Responsive Issues Detected</div>
          <ul className="text-sm text-yellow-800 space-y-1">
            {issues.slice(0, 10).map((issue, index) => (
              <li key={index}>• {issue}</li>
            ))}
            {issues.length > 10 && (
              <li className="text-yellow-600">• ... and {issues.length - 10} more issues</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

// Viewport Information Display
const ViewportInfo: React.FC = () => {
  const responsive = useResponsive();

  const info = [
    { label: 'Screen Size', value: `${responsive.windowSize.width} × ${responsive.windowSize.height}` },
    { label: 'Breakpoint', value: responsive.currentBreakpoint },
    { label: 'Device Category', value: responsive.deviceCategory },
    { label: 'Orientation', value: responsive.orientation },
    { label: 'Pixel Ratio', value: `${window.devicePixelRatio || 1}x` },
  ];

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 className="font-medium text-blue-900 mb-3">Current Viewport</h4>
      <div className="grid grid-cols-2 gap-3 text-sm">
        {info.map((item) => (
          <div key={item.label}>
            <span className="text-blue-700 font-medium">{item.label}:</span>
            <span className="ml-2 text-blue-800">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Performance Metrics Display
const PerformanceMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<{
    layoutShifts: number;
    renderTime: number;
    scrollPerformance: number;
  }>({
    layoutShifts: 0,
    renderTime: 0,
    scrollPerformance: 0,
  });

  useEffect(() => {
    // Measure initial render time
    const startTime = performance.now();

    requestAnimationFrame(() => {
      const endTime = performance.now();
      setMetrics(prev => ({
        ...prev,
        renderTime: endTime - startTime,
      }));
    });

    // Measure layout shifts (simplified)
    let layoutShiftCount = 0;
    const observer = new ResizeObserver(() => {
      layoutShiftCount++;
      setMetrics(prev => ({
        ...prev,
        layoutShifts: layoutShiftCount,
      }));
    });

    // Observe key elements
    const elementsToObserve = document.querySelectorAll('main, header, aside, footer');
    elementsToObserve.forEach(el => observer.observe(el));

    // Measure scroll performance
    let scrollStartTime = 0;
    let scrollEndTime = 0;

    const handleScrollStart = () => {
      scrollStartTime = performance.now();
    };

    const handleScrollEnd = () => {
      scrollEndTime = performance.now();
      const scrollDuration = scrollEndTime - scrollStartTime;
      setMetrics(prev => ({
        ...prev,
        scrollPerformance: scrollDuration,
      }));
    };

    window.addEventListener('scroll', handleScrollStart);
    window.addEventListener('scrollend', handleScrollEnd);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScrollStart);
      window.removeEventListener('scrollend', handleScrollEnd);
    };
  }, []);

  const getPerformanceColor = (value: number, thresholds: { good: number; ok: number }) => {
    if (value <= thresholds.good) return 'text-green-600';
    if (value <= thresholds.ok) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h4 className="font-medium text-gray-900 mb-3">Performance Metrics</h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Render Time:</span>
          <span className={getPerformanceColor(metrics.renderTime, { good: 16, ok: 33 })}>
            {metrics.renderTime.toFixed(2)}ms
          </span>
        </div>
        <div className="flex justify-between">
          <span>Layout Shifts:</span>
          <span className={getPerformanceColor(metrics.layoutShifts, { good: 0, ok: 2 })}>
            {metrics.layoutShifts}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Scroll Performance:</span>
          <span className={getPerformanceColor(metrics.scrollPerformance, { good: 16, ok: 33 })}>
            {metrics.scrollPerformance.toFixed(2)}ms
          </span>
        </div>
      </div>
    </div>
  );
};

// Component Stress Test
const ComponentStressTest: React.FC = () => {
  const [testResults, setTestResults] = useState<{
    manyElements: boolean;
    longLists: boolean;
    deepNesting: boolean;
  }>({
    manyElements: false,
    longLists: false,
    deepNesting: false,
  });

  const runStressTests = () => {
    // Test many elements
    const startTime = performance.now();
    const container = document.createElement('div');
    for (let i = 0; i < 1000; i++) {
      const element = document.createElement('div');
      element.textContent = `Item ${i}`;
      container.appendChild(element);
    }
    document.body.appendChild(container);
    const manyElementsTime = performance.now() - startTime;
    document.body.removeChild(container);

    // Test long lists (virtual scrolling behavior)
    const longListsTest = document.querySelectorAll('[data-testid="long-list"]').length > 0;

    // Test deep nesting
    const maxDepth = Math.max(...Array.from(document.querySelectorAll('*')).map(el => {
      let depth = 0;
      let parent = el.parentElement;
      while (parent) {
        depth++;
        parent = parent.parentElement;
      }
      return depth;
    }));

    setTestResults({
      manyElements: manyElementsTime < 100, // Good if under 100ms
      longLists: longListsTest,
      deepNesting: maxDepth < 20, // Good if under 20 levels
    });
  };

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-medium text-purple-900">Stress Test</h4>
        <button
          onClick={runStressTests}
          className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
        >
          Run Tests
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Many Elements:</span>
          <span className={testResults.manyElements ? 'text-green-600' : 'text-red-600'}>
            {testResults.manyElements ? '✅ Pass' : '❌ Fail'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Long Lists:</span>
          <span className={testResults.longLists ? 'text-green-600' : 'text-yellow-600'}>
            {testResults.longLists ? '✅ Optimized' : '⚠️ Not tested'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Deep Nesting:</span>
          <span className={testResults.deepNesting ? 'text-green-600' : 'text-red-600'}>
            {testResults.deepNesting ? '✅ Good' : '❌ Too deep'}
          </span>
        </div>
      </div>
    </div>
  );
};

// Main Responsive Test Suite Component
const ResponsiveTestSuite: React.FC<ResponsiveTestSuiteProps> = ({ className }) => {
  const [activeDevice, setActiveDevice] = useState<keyof typeof commonDevices | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const responsive = useResponsive();

  // Log viewport information for debugging
  useEffect(() => {
    testingUtils.logViewportInfo();
  }, [responsive.windowSize]);

  return (
    <div className={cn('bg-white border border-gray-200 rounded-lg p-6', className)}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Responsive Test Suite</h3>
          <p className="text-sm text-gray-600">
            Test and validate responsive behavior across different devices
          </p>
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced
        </button>
      </div>

      <div className="space-y-6">
        {/* Current Viewport Info */}
        <ViewportInfo />

        {/* Issues Detection */}
        <ResponsiveIssuesDetector />

        {/* Device Presets */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Device Presets</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.keys(commonDevices).map((device) => (
              <DevicePreview
                key={device}
                device={device as keyof typeof commonDevices}
                isActive={activeDevice === device}
                onClick={() => setActiveDevice(device as keyof typeof commonDevices)}
              />
            ))}
          </div>
          {activeDevice && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="text-sm text-blue-800">
                <strong>Note:</strong> Device presets are for reference only.
                Use browser dev tools to actually simulate device viewports.
              </div>
            </div>
          )}
        </div>

        {/* Advanced Testing */}
        {showAdvanced && (
          <div className="space-y-4">
            <PerformanceMetrics />
            <ComponentStressTest />

            {/* Responsive Guidelines */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Responsive Guidelines</h4>
              <div className="text-sm text-gray-700 space-y-2">
                <div>• Touch targets should be at least 44×44px on mobile</div>
                <div>• Text should be at least 14px on mobile devices</div>
                <div>• Avoid horizontal scrolling at any breakpoint</div>
                <div>• Test with real devices when possible</div>
                <div>• Consider landscape and portrait orientations</div>
                <div>• Ensure content is accessible at 200% zoom</div>
              </div>
            </div>

            {/* Testing Checklist */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-3">Testing Checklist</h4>
              <div className="text-sm text-green-800 space-y-1">
                <div>✅ Mobile (320px - 767px): Portrait and landscape</div>
                <div>✅ Tablet (768px - 1023px): Portrait and landscape</div>
                <div>✅ Desktop (1024px+): Various screen sizes</div>
                <div>✅ Touch interactions work properly</div>
                <div>✅ Text remains readable at all sizes</div>
                <div>✅ Images scale appropriately</div>
                <div>✅ Navigation adapts to screen size</div>
                <div>✅ Forms are usable on mobile</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponsiveTestSuite;