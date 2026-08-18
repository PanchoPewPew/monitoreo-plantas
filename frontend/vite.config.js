import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// VITE_PROXY_TARGET: permite cambiar el target del proxy según el entorno
//   - Local (sin Docker): http://127.0.0.1:8888
//   - Docker dev:         http://backend:8000  (nombre del servicio en docker-compose.dev.yml)
const proxyTarget = process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:8888'

export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: ['sprint1-production-3874.up.railway.app'],
  },
  server: {
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
      },
      '/backend-status': {
        target: proxyTarget,
        changeOrigin: true,
        rewrite: () => '/',
      },
    },
  },
})
