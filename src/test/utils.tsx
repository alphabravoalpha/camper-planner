// Test Utilities
// Helper functions for testing React components

import React from 'react';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';

// Create a custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Add custom options here if needed
  initialRoute?: string;
}

const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        {children}
      </I18nextProvider>
    </BrowserRouter>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: CustomRenderOptions
) => {
  return render(ui, { wrapper: AllTheProviders, ...options });
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Test helper functions
export const createMockComponent = (name: string) => {
  const MockComponent = () => <div data-testid={`mock-${name.toLowerCase()}`}>{name}</div>;
  MockComponent.displayName = `Mock${name}`;
  return MockComponent;
};

export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));