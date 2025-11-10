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
})
