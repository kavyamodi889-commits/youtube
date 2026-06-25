// FILE: client/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: 'all',
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
      },
      // /hls → Express static server (port 5000) serving ./tmp/hls
      // FFmpeg writes HLS files there, Express serves them
      '/hls': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})