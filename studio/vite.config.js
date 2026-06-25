// FILE: studio/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
  },
  server: {
    port: 5174,
    proxy: {
      // Video upload — needs a long timeout (500 MB files take time)
      '/api/videos/upload': {
        target:       'http://localhost:5000',
        changeOrigin: true,
        timeout:      10 * 60 * 1000,   // 10 minutes
        proxyTimeout: 10 * 60 * 1000,
      },

      // All other API calls — standard timeout
      '/api': {
        target:       'http://localhost:5000',
        changeOrigin: true,
        timeout:      60 * 1000,        // 1 minute
        proxyTimeout: 60 * 1000,
      },

      '/socket.io': {
        target:       'http://localhost:5000',
        ws:           true,
        changeOrigin: true,
      },

      '/hls': {
        target:       'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})