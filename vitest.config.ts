import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],

  test: {
    // Test environment
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: [
        'src/services/**/*.ts',
        'src/components/**/*.{ts,tsx}',
        'src/utils/**/*.ts',
        'src/store/**/*.ts',
      ],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        'src/types/**',
        'src/config/**',
        'src/templates.bak/**',
        '**/*.d.ts',
      ],
      all: true,
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70,
    },

    // Test file patterns
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: [
      'node_modules',
      'dist',
      '.git',
      'src/templates.bak',
    ],

    // Performance
    isolate: true,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },

    // Reporting
    css: true,
    reporters: ['verbose'],

    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,
  },

  // Path resolution (match vite.config.ts)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/store': path.resolve(__dirname, './src/store'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/config': path.resolve(__dirname, './src/config'),
      '@/assets': path.resolve(__dirname, './src/assets'),
    },
  },
});
