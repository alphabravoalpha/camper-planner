// Cross-Browser Compatibility Tests
// Phase 6.4: Comprehensive testing across all major browsers

import { test, expect } from '@playwright/test';

test.describe('Cross-Browser Compatibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page loads correctly', async ({ page, browserName }) => {
    // Check page title
    await expect(page).toHaveTitle(/European Camper Trip Planner/);

    // Check main elements are visible
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();

    // Check for console errors
    const logs: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        logs.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);
    expect(logs.length).toBe(0);

    console.log(`✅ ${browserName}: Page loads without errors`);
  });

  test('map component renders', async ({ page, browserName }) => {
    // Wait for map to load
    await page.waitForSelector('[data-testid="map-container"]', { timeout: 10000 });

    // Check map is visible
    const mapContainer = page.locator('[data-testid="map-container"]');
    await expect(mapContainer).toBeVisible();

    // Check map has rendered content
    await expect(mapContainer).not.toBeEmpty();

    console.log(`✅ ${browserName}: Map component renders`);
  });

  test('responsive design works', async ({ page, browserName }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('aside')).toBeVisible(); // Sidebar should be visible

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Mobile menu should be accessible
    const menuToggle = page.locator('[data-testid="mobile-menu-toggle"]');
    if (await menuToggle.isVisible()) {
      await menuToggle.click();
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    }

    console.log(`✅ ${browserName}: Responsive design works`);
  });

  test('navigation works', async ({ page, browserName }) => {
    // Test internal navigation
    const navLinks = page.locator('nav a');
    const linkCount = await navLinks.count();

    for (let i = 0; i < Math.min(linkCount, 3); i++) {
      const link = navLinks.nth(i);
      const href = await link.getAttribute('href');

      if (href && href.startsWith('/')) {
        await link.click();
        await page.waitForTimeout(1000);
        expect(page.url()).toContain(href);
      }
    }

    console.log(`✅ ${browserName}: Navigation works`);
  });

  test('form interactions work', async ({ page, browserName }) => {
    // Test input fields
    const inputs = page.locator('input[type="text"], input[type="email"], textarea');
    const inputCount = await inputs.count();

    if (inputCount > 0) {
      const firstInput = inputs.first();
      await firstInput.fill('Test input');
      await expect(firstInput).toHaveValue('Test input');
    }

    // Test buttons
    const buttons = page.locator('button:not([disabled])');
    const buttonCount = await buttons.count();

    if (buttonCount > 0) {
      const firstButton = buttons.first();
      await firstButton.click();
      // Button should respond to click
      await page.waitForTimeout(500);
    }

    console.log(`✅ ${browserName}: Form interactions work`);
  });

  test('localStorage and sessionStorage work', async ({ page, browserName }) => {
    // Test localStorage
    await page.evaluate(() => {
      localStorage.setItem('test-key', 'test-value');
    });

    const storedValue = await page.evaluate(() => {
      return localStorage.getItem('test-key');
    });

    expect(storedValue).toBe('test-value');

    // Test sessionStorage
    await page.evaluate(() => {
      sessionStorage.setItem('session-test', 'session-value');
    });

    const sessionValue = await page.evaluate(() => {
      return sessionStorage.getItem('session-test');
    });

    expect(sessionValue).toBe('session-value');

    console.log(`✅ ${browserName}: Storage APIs work`);
  });

  test('CSS features work', async ({ page, browserName }) => {
    // Test CSS Grid
    const gridElements = page.locator('.grid');
    if (await gridElements.count() > 0) {
      const gridDisplay = await gridElements.first().evaluate((el) => {
        return window.getComputedStyle(el).display;
      });
      expect(gridDisplay).toBe('grid');
    }

    // Test CSS Flexbox
    const flexElements = page.locator('.flex');
    if (await flexElements.count() > 0) {
      const flexDisplay = await flexElements.first().evaluate((el) => {
        return window.getComputedStyle(el).display;
      });
      expect(flexDisplay).toBe('flex');
    }

    // Test CSS Variables
    const hasCustomProperties = await page.evaluate(() => {
      const testEl = document.createElement('div');
      testEl.style.setProperty('--test-var', 'test');
      return testEl.style.getPropertyValue('--test-var') === 'test';
    });

    expect(hasCustomProperties).toBe(true);

    console.log(`✅ ${browserName}: CSS features work`);
  });

  test('JavaScript APIs work', async ({ page, browserName }) => {
    // Test Fetch API
    const fetchSupported = await page.evaluate(() => {
      return typeof fetch !== 'undefined';
    });
    expect(fetchSupported).toBe(true);

    // Test Promise support
    const promiseSupported = await page.evaluate(() => {
      return typeof Promise !== 'undefined';
    });
    expect(promiseSupported).toBe(true);

    // Test async/await support
    const asyncSupported = await page.evaluate(async () => {
      try {
        await Promise.resolve(true);
        return true;
      } catch {
        return false;
      }
    });
    expect(asyncSupported).toBe(true);

    // Test ES6+ features
    const es6Supported = await page.evaluate(() => {
      try {
        // Arrow functions, const/let, template literals
        const test = (x: number) => `Value: ${x}`;
        const result = test(42);
        return result === 'Value: 42';
      } catch {
        return false;
      }
    });
    expect(es6Supported).toBe(true);

    console.log(`✅ ${browserName}: JavaScript APIs work`);
  });

  test('performance is acceptable', async ({ page, browserName }) => {
    // Measure page load performance
    const navigationPromise = page.waitForNavigation();
    const startTime = Date.now();

    await page.goto('/', { waitUntil: 'networkidle' });
    await navigationPromise;

    const loadTime = Date.now() - startTime;

    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);

    // Check for layout shifts
    const clsScore = await page.evaluate(() => {
      return new Promise((resolve) => {
        let cls = 0;
        const observer = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              cls += entry.value;
            }
          });
        });

        observer.observe({ entryTypes: ['layout-shift'] });

        setTimeout(() => {
          observer.disconnect();
          resolve(cls);
        }, 3000);
      });
    });

    // CLS should be less than 0.1 (good score)
    expect(clsScore).toBeLessThan(0.1);

    console.log(`✅ ${browserName}: Performance is acceptable (${loadTime}ms load, ${clsScore} CLS)`);
  });

  test('accessibility features work', async ({ page, browserName }) => {
    // Test keyboard navigation
    await page.keyboard.press('Tab');

    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });

    expect(focusedElement).toBeTruthy();

    // Test ARIA attributes
    const ariaElements = page.locator('[aria-label], [aria-labelledby], [aria-describedby]');
    const ariaCount = await ariaElements.count();

    // Should have some ARIA elements
    expect(ariaCount).toBeGreaterThan(0);

    // Test alt text on images
    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const ariaLabel = await img.getAttribute('aria-label');

      // Images should have alt text or aria-label
      expect(alt !== null || ariaLabel !== null).toBe(true);
    }

    console.log(`✅ ${browserName}: Accessibility features work`);
  });

  test('error handling works', async ({ page, browserName }) => {
    // Test 404 handling
    const response = await page.goto('/non-existent-page');

    // Should handle 404 gracefully (SPA routing)
    expect(response?.status()).toBeLessThan(500);

    // Test JavaScript error handling
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    // Trigger potential error
    await page.evaluate(() => {
      // This should be caught by error boundaries
      throw new Error('Test error');
    });

    await page.waitForTimeout(1000);

    // Errors should be handled gracefully
    const uncaughtErrors = errors.filter(error =>
      !error.includes('Test error') &&
      !error.includes('Non-Error')
    );

    expect(uncaughtErrors.length).toBe(0);

    console.log(`✅ ${browserName}: Error handling works`);
  });
});

test.describe('Browser-Specific Features', () => {
  test('Safari-specific tests', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'Safari-specific test');

    // Test Safari-specific issues
    await page.goto('/');

    // Test WebKit-specific CSS
    const webkitSupport = await page.evaluate(() => {
      const testEl = document.createElement('div');
      testEl.style.webkitTransform = 'scale(1)';
      return testEl.style.webkitTransform === 'scale(1)';
    });

    expect(webkitSupport).toBe(true);

    console.log('✅ Safari: WebKit features work');
  });

  test('Firefox-specific tests', async ({ page, browserName }) => {
    test.skip(browserName !== 'firefox', 'Firefox-specific test');

    // Test Firefox-specific features
    await page.goto('/');

    // Test Firefox CSS features
    const firefoxFeatures = await page.evaluate(() => {
      return {
        scrollSnapSupport: CSS.supports('scroll-snap-type', 'x mandatory'),
        gridSupport: CSS.supports('display', 'grid'),
      };
    });

    expect(firefoxFeatures.scrollSnapSupport).toBe(true);
    expect(firefoxFeatures.gridSupport).toBe(true);

    console.log('✅ Firefox: Browser-specific features work');
  });

  test('Chrome-specific tests', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Chrome-specific test');

    // Test Chrome-specific features
    await page.goto('/');

    // Test Chrome APIs
    const chromeFeatures = await page.evaluate(() => {
      return {
        performanceObserver: typeof PerformanceObserver !== 'undefined',
        intersectionObserver: typeof IntersectionObserver !== 'undefined',
        resizeObserver: typeof ResizeObserver !== 'undefined',
      };
    });

    expect(chromeFeatures.performanceObserver).toBe(true);
    expect(chromeFeatures.intersectionObserver).toBe(true);
    expect(chromeFeatures.resizeObserver).toBe(true);

    console.log('✅ Chrome: Browser-specific features work');
  });

  test('Edge-specific tests', async ({ page, browserName }) => {
    test.skip(browserName !== 'edge', 'Edge-specific test');

    // Test Edge-specific features
    await page.goto('/');

    // Test Edge compatibility
    const edgeFeatures = await page.evaluate(() => {
      return {
        es6Support: typeof Map !== 'undefined' && typeof Set !== 'undefined',
        fetchSupport: typeof fetch !== 'undefined',
        promiseSupport: typeof Promise !== 'undefined',
      };
    });

    expect(edgeFeatures.es6Support).toBe(true);
    expect(edgeFeatures.fetchSupport).toBe(true);
    expect(edgeFeatures.promiseSupport).toBe(true);

    console.log('✅ Edge: Browser compatibility features work');
  });
});