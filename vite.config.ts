import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Zero-cost scalability configuration
  build: {
    // Generate static files for hosting
    outDir: 'dist',

    // Asset optimization
    assetsDir: 'assets',

    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },

  // Development server configuration
  server: {
    port: 3000,
    open: true
  },

  // Environment variable prefix
  envPrefix: 'VITE_'
})
