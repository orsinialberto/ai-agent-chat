import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        // Enable websocket proxying if needed in the future
        ws: true,
        // Proxy will reuse connections automatically for better performance
        // This avoids WSL networking issues by going through Vite dev server
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split node_modules into separate chunks
          if (id.includes('node_modules')) {
            // Leaflet maps (large library, check before react-leaflet)
            if (id.includes('leaflet') || id.includes('react-leaflet')) {
              return 'leaflet-vendor'
            }
            // Charts library
            if (id.includes('recharts')) {
              return 'recharts-vendor'
            }
            // Markdown processing
            if (id.includes('react-markdown') || id.includes('remark') || id.includes('rehype')) {
              return 'markdown-vendor'
            }
            // Syntax highlighter
            if (id.includes('react-syntax-highlighter')) {
              return 'syntax-vendor'
            }
            // React ecosystem (React, React DOM, React Router, React Query)
            // Check these after more specific libraries to avoid false matches
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router') || id.includes('react-query')) {
              return 'react-vendor'
            }
            // All other vendor code
            return 'vendor'
          }
          // Return undefined for app code (will be automatically chunked)
          return undefined
        },
      },
    },
    // Increase chunk size warning limit slightly since we're now splitting chunks properly
    chunkSizeWarningLimit: 600,
  },
})
