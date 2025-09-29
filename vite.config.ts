/// <reference types="vitest" />
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
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'map-vendor': ['leaflet', 'react-leaflet'],
          'state-vendor': ['zustand'],
          'i18n-vendor': ['react-i18next', 'i18next'],
        },
      }
    },

    // Build performance
    target: 'esnext',
    minify: 'esbuild',

    // GitHub Pages compatibility
    assetsInlineLimit: 0, // Don't inline assets as base64
  },

  // Development server configuration
  server: {
    port: 3000,
    open: true,
    host: true, // Allow external connections for mobile testing
    cors: true,

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
})
