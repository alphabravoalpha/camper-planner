import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // GitHub Pages deployment configuration
  base: '/camper-planner/',

  // Path resolution
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

  // Zero-cost scalability configuration
  build: {
    // Generate static files for hosting
    outDir: 'dist',

    // Asset optimization
    assetsDir: 'assets',
    sourcemap: false, // Disable in production for smaller builds

    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // Simplified chunking to avoid circular dependency issues
        manualChunks: {
          // Keep React together to avoid circular deps
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Leaflet and React-Leaflet together
          'map-vendor': ['leaflet', 'react-leaflet'],
          // State management
          'state-vendor': ['zustand'],
        },
      },
    },

    // Build performance
    target: 'es2020', // Better browser compatibility than esnext
    minify: 'esbuild',

    // Chunk size warnings
    chunkSizeWarningLimit: 1000, // Warn if chunks exceed 1MB

    // GitHub Pages compatibility
    assetsInlineLimit: 4096, // Inline assets smaller than 4KB

    // CSS code splitting
    cssCodeSplit: true,
  },

  // Development server configuration
  server: {
    port: 3000,
    open: true,
    host: true, // Allow external connections for mobile testing
    cors: true,

    // API Proxy configuration for development CORS handling
    proxy: {
      '/api/ors': {
        target: 'https://api.openrouteservice.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ors/, ''),
        secure: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('OpenRouteService proxy error', err);
          });
          proxy.on('proxyReq', (_proxyReq, req, _res) => {
            console.log('OpenRouteService proxy request:', req.method, req.url);
          });
        },
      },
      '/api/osrm': {
        target: 'https://router.project-osrm.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/osrm/, ''),
        secure: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('OSRM proxy error', err);
          });
        },
      },
      '/api/overpass': {
        target: 'https://overpass-api.de/api/interpreter',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/overpass/, ''),
        secure: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Overpass proxy error', err);
          });
          proxy.on('proxyReq', (_proxyReq, req, _res) => {
            console.log('Overpass proxy request:', req.method, req.url);
          });
        },
      },
      '/api/geocode': {
        target: 'https://nominatim.openstreetmap.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/geocode/, '/search'),
        secure: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Nominatim proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Nominatim proxy request:', req.method, req.url);
            // Add required User-Agent header for Nominatim
            proxyReq.setHeader('User-Agent', 'EuropeanCamperPlanner/1.0 (https://github.com/user/camper-planner)');
          });
        },
      },
    },

    // Hot module replacement
    hmr: {
      overlay: true,
    },
  },

  // Preview server configuration
  preview: {
    port: 4173,
    host: true,
  },

  // Environment variable prefix
  envPrefix: 'VITE_',

  // Strip console.log and console.debug from production builds
  // Preserves console.warn and console.error for legitimate error visibility
  esbuild: {
    drop: ['debugger'],
    pure: ['console.log', 'console.debug'],
  },

  // CSS configuration
  css: {
    devSourcemap: true,
    modules: {
      localsConvention: 'camelCase',
    },
  },


  // Optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'leaflet',
      'react-leaflet',
      'zustand',
      'react-i18next',
      'i18next'
    ],
  },

  // Test configuration (use vitest.config.ts instead)
  // test: {
  //   globals: true,
  //   environment: 'jsdom',
  //   setupFiles: './src/test/setup.ts',
  //   css: true,
  //   exclude: [
  //     'node_modules/**',
  //     'dist/**',
  //     'tests/e2e/**',
  //     '**/*.spec.ts',
  //   ],
  //   coverage: {
  //     provider: 'v8',
  //     reporter: ['text', 'json', 'html'],
  //     exclude: [
  //       'node_modules/',
  //       'src/test/',
  //       '**/*.test.{ts,tsx}',
  //       '**/*.spec.{ts,tsx}',
  //     ],
  //   },
  // },
})
